/**
 * UJUz - Waitlist Snapshot Worker V1.6.0
 * 시설 대기 현황 스냅샷 수집 + 2단계 TO 감지 로직
 *
 * 역할:
 *  1. places 컬렉션에서 정원/현원/대기 스냅샷을 waitlist_snapshots에 기록
 *  2. 2단계 TO 검증: delta < 0 → to_detected=false → 다음 스냅샷 확인 → to_detected=true
 *  3. TO 감지 시 to_alerts 생성 (중복 방지: 24h cooldown)
 *  4. 핫존 계층화: 프리미엄(5분) / 핫존(30분) / 일반(60분)
 *
 * V1.5.4: 위례 region isolation — HOT_ZONES 우선순위 매칭
 */

import { Db } from 'mongodb';
import { getMongoDb, connectMongo } from '@ujuz/db';
import { env, logger } from '@ujuz/config';
import { AppError, extractRegionFromAddress } from '@ujuz/shared';

// ─── Types ────────────────────────────────────────────────────────

interface WaitlistSnapshot {
  facility_id: string;
  snapshot_date: Date;
  current_enrolled: number;
  waitlist_total: number;
  waitlist_by_class: Record<string, number>; // { '0': 5, '1': 12, ... }
  change: {
    enrolled_delta: number; // 직전 대비 현원 변화 (음수=TO)
    to_detected?: boolean; // 2단계 검증 통과 여부 (false=후보, true=확정, undefined=변화없음)
  };
  source: 'public_api' | 'manual' | 'places_sync';
  confidence: number;
}

interface TOAlertEvent {
  facility_id: string;
  facility_name: string;
  age_class: string;
  detected_at: Date;
  estimated_slots: number;
  confidence: number;
  source: 'snapshot_diff' | 'public_api';
  prev_enrolled: number;
  curr_enrolled: number;
}

// ─── Constants ────────────────────────────────────────────────────

const SNAPSHOT_INTERVALS = {
  premium: 5 * 60 * 1000, // 5분 (유료/관심등록 시설)
  high: 30 * 60 * 1000, // 30분 (핫존: 위례/강남/서초/분당/성남/송파)
  normal: 60 * 60 * 1000, // 60분 (나머지)
};

const COOLDOWN_HOURS = 24; // TO 중복 감지 방지 (24시간)

// ─── Helpers ──────────────────────────────────────────────────────

const getDbOrThrow = async (): Promise<Db> => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

function getSnapshotInterval(facility: any): number {
  // 프리미엄 구독자가 있는 시설
  if (facility.premium_subscribers?.length > 0) {
    return SNAPSHOT_INTERVALS.premium;
  }

  // 핫존: extractRegion이 매칭되면 고빈도 수집
  const region = extractRegionFromAddress(facility.address as string);
  if (region) {
    return SNAPSHOT_INTERVALS.high;
  }

  // 일반
  return SNAPSHOT_INTERVALS.normal;
}

// ─── Snapshot Collection ──────────────────────────────────────────

/**
 * places 컬렉션의 현재 상태를 waitlist_snapshots로 기록한다.
 * 대상: 어린이집(daycare) 카테고리 중 정원 정보가 있는 시설.
 *
 * V1.5.2: waitlist_by_class, change.to_detected (1단계) 추가
 */
export async function collectSnapshots(): Promise<{
  collected: number;
  toDetected: number;
}> {
  const db = await getDbOrThrow();
  const now = new Date();
  let collected = 0;
  let toDetected = 0;

  // Batch-load all facilities first
  const facilities = await db.collection(env.MONGODB_PLACES_COLLECTION).find(
    {
      $or: [
        { category: 'daycare' },
        { categories: { $in: ['daycare', '어린이집'] } },
      ],
      'capacity.total': { $gt: 0 },
    },
    { projection: { placeId: 1, facility_id: 1, capacity: 1, address: 1 } }
  ).toArray();

  // Build facility ID list
  const facilityIdList = facilities.map((doc) =>
    (doc.placeId as string) ?? (doc.facility_id as string) ?? doc._id.toString()
  );

  // Batch-fetch latest snapshots for all facilities (eliminates N+1)
  const latestSnapshotPipeline = [
    { $match: { facility_id: { $in: facilityIdList } } },
    { $sort: { facility_id: 1, snapshot_date: -1 } },
    { $group: { _id: '$facility_id', current_enrolled: { $first: '$current_enrolled' } } },
  ];
  const latestSnapshots = await db.collection('waitlist_snapshots')
    .aggregate(latestSnapshotPipeline).toArray();
  const prevEnrolledMap = new Map<string, number>();
  for (const snap of latestSnapshots) {
    prevEnrolledMap.set(snap._id as string, snap.current_enrolled as number);
  }

  const batch: WaitlistSnapshot[] = [];

  for (const doc of facilities) {
    const facilityId = (doc.placeId as string) ?? (doc.facility_id as string) ?? doc._id.toString();
    const cap = (doc.capacity as Record<string, number>);
    const enrolled = cap?.currentEnrollment ?? 0;

    const prevEnrolled = prevEnrolledMap.get(facilityId) ?? enrolled;
    const enrolledDelta = enrolled - prevEnrolled;

    // 1단계 TO 감지: delta < 0 → to_detected=false (후보)
    // 2단계는 다음 수집 주기에서 재확인
    // V1.5.3 FIX: 현재 감소면 후보(false), 아니면 변화 없음(undefined)
    const toDetectedFlag = enrolledDelta < 0 ? false : undefined;

    // waitlist_by_class: capacity.byClass가 있으면 정원 비율 기반 추정
    const byClass = (doc.capacity as any)?.byClass as Record<string, number> | undefined;
    const waitlistByClass: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    if (byClass) {
      for (const [age, classCap] of Object.entries(byClass)) {
        if (age in waitlistByClass && typeof classCap === 'number' && classCap > 0) {
          waitlistByClass[age] = Math.round(classCap * 0.6); // 정원의 ~60% 대기 추정
        }
      }
    }

    batch.push({
      facility_id: facilityId,
      snapshot_date: now,
      current_enrolled: enrolled,
      waitlist_total: Object.values(waitlistByClass).reduce((a, b) => a + b, 0),
      waitlist_by_class: waitlistByClass,
      change: {
        enrolled_delta: enrolledDelta,
        to_detected: toDetectedFlag,
      },
      source: 'places_sync',
      confidence: 0.7, // places 동기화 기반
    });

    if (batch.length >= 500) {
      await db.collection('waitlist_snapshots').insertMany(batch);
      collected += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await db.collection('waitlist_snapshots').insertMany(batch);
    collected += batch.length;
  }

  // 2단계 TO 검증 + to_alerts 생성
  toDetected = await detectAndConfirmTO(db, now);

  logger.info({ collected, toDetected }, 'Snapshot collection complete');
  return { collected, toDetected };
}

// ─── TO Detection (2-Stage Verification) ──────────────────────────

/**
 * 2단계 TO 검증 로직:
 * 1단계: 직전 스냅샷과 비교하여 enrolled_delta < 0 → to_detected=false (후보)
 * 2단계: 다음 스냅샷에서 재확인 or 2개 소스 일치 → to_detected=true → to_alerts 생성
 *
 * V1.5.2: 24시간 cooldown window로 중복 감지 방지
 */
async function detectAndConfirmTO(db: Db, currentTimestamp: Date): Promise<number> {
  let detected = 0;

  // 1단계 후보 (to_detected=false) 조회
  const candidates = await db
    .collection('waitlist_snapshots')
    .find({
      'change.to_detected': false,
      'change.enrolled_delta': { $lt: 0 },
    })
    .toArray();

  if (candidates.length === 0) return 0;

  // Batch pre-fetch: unique facility IDs from candidates
  const candidateFacilityIds = [...new Set(candidates.map((c) => c.facility_id as string))];

  // Batch-fetch next snapshots for all candidate facilities (eliminates N+1)
  const nextSnapshotPipeline = [
    {
      $match: {
        facility_id: { $in: candidateFacilityIds },
        'change.to_detected': { $ne: false },
      },
    },
    { $sort: { facility_id: 1, snapshot_date: 1 } },
    {
      $group: {
        _id: '$facility_id',
        snapshot_date: { $first: '$snapshot_date' },
        change: { $first: '$change' },
        source: { $first: '$source' },
      },
    },
  ];
  const nextSnapshots = await db.collection('waitlist_snapshots')
    .aggregate(nextSnapshotPipeline).toArray();
  const nextSnapshotMap = new Map<string, any>();
  for (const snap of nextSnapshots) {
    nextSnapshotMap.set(snap._id as string, snap);
  }

  // Batch-fetch recent alerts within cooldown window (eliminates N+1)
  const cooldownThreshold = new Date(currentTimestamp.getTime() - COOLDOWN_HOURS * 60 * 60 * 1000);
  const recentAlerts = await db.collection('to_alerts')
    .find({ facility_id: { $in: candidateFacilityIds }, detected_at: { $gte: cooldownThreshold } })
    .toArray();
  const recentAlertSet = new Set(recentAlerts.map((a) => a.facility_id as string));

  // Batch-fetch facility names (eliminates N+1)
  const facilityDocs = await db.collection(env.MONGODB_PLACES_COLLECTION)
    .find(
      { $or: [{ placeId: { $in: candidateFacilityIds } }, { facility_id: { $in: candidateFacilityIds } }] },
      { projection: { placeId: 1, facility_id: 1, name: 1 } }
    )
    .toArray();
  const facilityNameMap = new Map<string, string>();
  for (const f of facilityDocs) {
    const fId = (f.placeId as string) ?? (f.facility_id as string);
    if (fId) facilityNameMap.set(fId, (f.name as string) ?? '어린이집');
  }

  const updateOps: any[] = [];
  const alertDocs: TOAlertEvent[] = [];

  for (const candidate of candidates) {
    const facilityId = candidate.facility_id as string;
    const candidateDate = candidate.snapshot_date as Date;

    // 2단계 검증: use batch-fetched next snapshot
    const nextSnapshot = nextSnapshotMap.get(facilityId);
    if (!nextSnapshot || new Date(nextSnapshot.snapshot_date) <= candidateDate) continue;

    const isConfirmed =
      (nextSnapshot.change as any).enrolled_delta <= 0 ||
      (nextSnapshot.source === candidate.source && Math.abs((nextSnapshot.change as any).enrolled_delta) >= 1);

    if (!isConfirmed) continue;

    // 24시간 cooldown 확인 (batch-fetched)
    if (recentAlertSet.has(facilityId)) continue;

    // to_detected=true 업데이트 (batch)
    updateOps.push({
      updateOne: {
        filter: { _id: candidate._id },
        update: { $set: { 'change.to_detected': true } },
      },
    });

    const delta = Math.abs((candidate.change as any).enrolled_delta);
    alertDocs.push({
      facility_id: facilityId,
      facility_name: facilityNameMap.get(facilityId) ?? '어린이집',
      age_class: '전체',
      detected_at: currentTimestamp,
      estimated_slots: delta,
      confidence: delta >= 3 ? 0.9 : delta >= 2 ? 0.8 : 0.65,
      source: 'snapshot_diff',
      prev_enrolled: (candidate.current_enrolled as number) + delta,
      curr_enrolled: candidate.current_enrolled as number,
    });

    detected++;
  }

  // Execute batch writes
  if (updateOps.length > 0) {
    await db.collection('waitlist_snapshots').bulkWrite(updateOps, { ordered: false });
  }
  if (alertDocs.length > 0) {
    await db.collection('to_alerts').insertMany(alertDocs);
  }

  return detected;
}

// ─── Training Data Block Update (V1.5.2 - dataBlocks 통합) ───────

/**
 * 시설별로 최근 6개월 스냅샷을 집계하여
 * dataBlocks에 block_type='to_pattern' 블록을 upsert한다.
 */
export async function updateTrainingDataBlocks(): Promise<number> {
  const db = await getDbOrThrow();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  let updated = 0;

  // 시설별 집계
  const pipeline = [
    { $match: { snapshot_date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: '$facility_id',
        snapshots: { $sum: 1 },
        avgEnrolled: { $avg: '$current_enrolled' },
        minEnrolled: { $min: '$current_enrolled' },
        maxEnrolled: { $max: '$current_enrolled' },
        lastTimestamp: { $max: '$snapshot_date' },
      },
    },
  ];

  const aggregated = await db
    .collection('waitlist_snapshots')
    .aggregate(pipeline)
    .toArray();

  // Batch-fetch all facilities and TO counts (eliminates N+1)
  const aggFacilityIds = aggregated.map((a) => a._id as string);
  const [facilityBatch, toCountBatch] = await Promise.all([
    db.collection(env.MONGODB_PLACES_COLLECTION)
      .find(
        { $or: [{ placeId: { $in: aggFacilityIds } }, { facility_id: { $in: aggFacilityIds } }] },
        { projection: { placeId: 1, facility_id: 1, capacity: 1, address: 1 } }
      )
      .toArray(),
    db.collection('to_alerts')
      .aggregate([
        { $match: { facility_id: { $in: aggFacilityIds }, detected_at: { $gte: sixMonthsAgo } } },
        { $group: { _id: '$facility_id', count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const facilityMap = new Map<string, any>();
  for (const f of facilityBatch) {
    const fId = (f.placeId as string) ?? (f.facility_id as string);
    if (fId) facilityMap.set(fId, f);
  }
  const toCountMap = new Map<string, number>();
  for (const tc of toCountBatch) {
    toCountMap.set(tc._id as string, tc.count as number);
  }

  for (const agg of aggregated) {
    const facilityId = agg._id as string;
    const enrolledRange = (agg.maxEnrolled as number) - (agg.minEnrolled as number);
    const avgEnrolled = agg.avgEnrolled as number;

    const facility = facilityMap.get(facilityId) ?? null;
    const capacity = (facility?.capacity as Record<string, number>)?.total ?? (facility?.capacity as number) ?? 0;

    const toCount = toCountMap.get(facilityId) ?? 0;

    // 월 추정
    const avgWaitingMonths =
      capacity > 0 ? Math.round(((avgEnrolled / capacity) * 12) * 10) / 10 : 12;

    const month = new Date().getMonth() + 1;
    const season =
      month >= 3 && month <= 5
        ? 'spring'
        : month >= 6 && month <= 8
        ? 'summer'
        : month >= 9 && month <= 11
        ? 'fall'
        : 'winter';

    const admissionProbability =
      capacity > 0 ? Math.min(1, (enrolledRange + toCount) / (capacity * 0.3)) : 0.1;

    const quarter = `Q${Math.ceil(month / 3)}`;
    const year = new Date().getFullYear();
    const blockId = `to_${facilityId}_${year}${quarter}`;

    await db.collection('dataBlocks').updateOne(
      { block_id: blockId },
      {
        $set: {
          block_id: blockId,
          block_type: 'to_pattern',
          facility_id: facilityId,
          features: {
            avg_waiting_months: avgWaitingMonths,
            to_count_6m: toCount,
            season,
            region: extractRegionFromAddress(facility?.address as string) ?? '',
            enrolled_range: enrolledRange,
            avg_capacity: capacity,
            avg_enrolled: avgEnrolled,
          },
          label: {
            expected_vacancies_6m: Math.round(enrolledRange * 0.6 + toCount * 0.5),
            admission_probability: Math.round(admissionProbability * 100) / 100,
          },
          confidence: Math.min(0.95, 0.3 + (agg.snapshots as number) * 0.05),
          source_count: agg.snapshots as number,
          last_updated: new Date(),
          isActive: true,
        },
      },
      { upsert: true }
    );

    updated++;
  }

  logger.info({ updated }, 'Training data blocks updated');
  return updated;
}
