/**
 * UJUz - Admission Score Engine V1.5.2
 * 초고정밀 입학 가능성 산출 엔진 (강남/서초/위례/성남/분당)
 *
 * 핵심 출력:
 *  - probability (0-1): 6개월 내 입학 확률
 *  - admission_score (1-99): 캘리브레이션된 점수
 *  - confidence (0-1): Posterior variance 기반 신뢰도
 *  - estimated_months_median/80th: 예상 대기기간
 *  - evidence cards: 숫자+기간+집계만, 원문 인용 절대 금지
 *
 * V1.5.2 핵심 개선:
 *  - Seat-Month 정규화: ρ (seat-month당 vacancy rate)
 *  - Gamma-Poisson conjugate prior: 베이지안 콜드스타트
 *  - Negative Binomial predictive: λ 적분한 확률 분포
 *  - 시즌성 누적 Exposure: E_H = capacity * Σ s_month
 *  - TO 중복 카운팅 방지: 24h cooldown
 *  - Age-band 정합성: capacity_eff 정확히 반영
 *  - Calibration 파이프라인: isotonic regression 매핑
 */

import { jStat } from 'jstat';
import { getMongoDb, connectMongo } from '@ujuz/db';
import { env, logger } from '@ujuz/config';
import { AppError } from '@ujuz/shared';
import { type RegionKey, regionLabel } from '@ujuz/config';
import { extractRegionFromAddress } from '@ujuz/shared';

// ─── Types ────────────────────────────────────────────────────────

export interface AdmissionScoreInput {
  facility_id: string;
  child_age_band: '0' | '1' | '2' | '3' | '4' | '5';
  waiting_position?: number;
  priority_type:
    | 'dual_income'
    | 'sibling'
    | 'single_parent'
    | 'multi_child'
    | 'disability'
    | 'low_income'
    | 'general';
}

export interface EvidenceDataPoints {
  // to_snapshot: TO 이벤트 정의
  N?: number; // vacancy 발생 수
  E_seat_months?: number; // 관측 노출 (seat-months)
  rho_observed?: number; // seat-month당 vacancy rate
  method?: 'gamma_posterior' | 'gamma_prior'; // 추정 방법
  alpha_post?: number;
  beta_post?: number;
  age_band_normalization?: 'by_class' | 'total_facility';

  // seasonal_factor: 시즌성 적용
  months_ahead?: number[]; // [2,3,4,5,6,7]
  H_eff?: number; // 가중치 합
  E_H?: number; // 예측기간 노출
  multipliers?: number[]; // 월별 multiplier

  // community_aggregate: k-익명 집계
  groups?: number; // k≥3 충족 그룹 수
  total_sources?: number; // 총 후기/언급 수
  avg_sentiment?: number; // 평균 감성
  k_threshold?: number; // 3

  // similar_cases: 유사 시설군
  sample_size?: number;
  avg_wait_months?: number;
  success_rate?: number;
  definition?: string;
}

export interface EvidenceCard {
  type: 'to_snapshot' | 'community_aggregate' | 'seasonal_factor' | 'similar_cases';
  summary: string;
  source_count: number;
  confidence: number;
  data_points: EvidenceDataPoints;
}

export type AdmissionGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface AdmissionScoreResult {
  facility_id: string;
  facility_name: string;
  probability: number; // 0-1 (6개월 기준)
  admission_score: number; // 1-99 (calibrated)
  grade: AdmissionGrade; // A(>=80) B(>=60) C(>=40) D(>=20) F(<20)
  confidence: number; // 0-1 (posterior variance)
  estimated_months_median: number; // P >= 0.5
  estimated_months_80th: number; // P >= 0.8
  evidence: EvidenceCard[];
  region_key: string; // RegionKey used for this calculation
  engine_version: string;
  calculated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────

const ENGINE_VERSION = 'v1.7.0'; // V1.7.0: community intel prior correction; // V1.6.1: fix TO snapshot query + change-field based delta
const CALIBRATION_VERSION = 'v1'; // 주 1회 isotonic regression 업데이트 시 증가

/** Prior 강도 (pseudo exposure) */
const E0 = 3.0; // 3 seat-months

/** Gamma Prior 평균 (μ_prior) - seat-month당 vacancy rate, keyed by RegionKey */
const GAMMA_PRIOR_MEANS: Record<string, Record<string, number>> = {
  gangnam:  { '0': 0.005, '1': 0.007, '2': 0.008, '3': 0.010, '4': 0.012, '5': 0.012 },
  seocho:   { '0': 0.006, '1': 0.008, '2': 0.009, '3': 0.011, '4': 0.012, '5': 0.012 },
  bundang:  { '0': 0.007, '1': 0.008, '2': 0.010, '3': 0.012, '4': 0.013, '5': 0.013 },
  wirye:    { '0': 0.007, '1': 0.009, '2': 0.010, '3': 0.012, '4': 0.013, '5': 0.013 },
  seongnam: { '0': 0.008, '1': 0.009, '2': 0.011, '3': 0.012, '4': 0.014, '5': 0.014 },
  songpa:   { '0': 0.006, '1': 0.008, '2': 0.009, '3': 0.011, '4': 0.012, '5': 0.012 },
  default:  { '0': 0.008, '1': 0.010, '2': 0.011, '3': 0.012, '4': 0.015, '5': 0.015 },
};

/** Age-Band 정원 비중 (capacity_by_class 미제공 시 fallback) */
const AGE_BAND_CAPACITY_RATIO: Record<string, number> = {
  '0': 0.10, '1': 0.15, '2': 0.20, '3': 0.20, '4': 0.20, '5': 0.15,
};

/** 계절성 Multiplier (월별) */
const SEASONAL_MULTIPLIER: Record<number, number> = {
  1: 1.1, 2: 1.3, 3: 1.5, // 신학기 TO 피크
  4: 1.05, 5: 1.0, 6: 0.95,
  7: 0.9, 8: 1.05, 9: 1.15, // 하반기 추가 모집
  10: 1.0, 11: 1.05, 12: 1.15,
};

/** 지역 경쟁 계수 (대기순번 가중), keyed by RegionKey */
const REGION_COMPETITION: Record<string, number> = {
  gangnam: 1.4, seocho: 1.35, bundang: 1.3, wirye: 1.3, seongnam: 1.2, songpa: 1.3, default: 1.15,
};

/** 우선순위 보너스 (대기순번 차감) */
const PRIORITY_BONUS: Record<string, number> = {
  disability: 8, single_parent: 7, multi_child: 5,
  dual_income: 3, sibling: 4, low_income: 6, general: 0,
};

/** Calibration 배열 (0-100 인덱스) - Identity mapping으로 시작, keyed by RegionKey */
const IDENTITY_CAL = Array.from({ length: 101 }, (_, i) => Math.min(99, Math.max(1, i)));
const CALIBRATION_ARRAY: Record<string, number[]> = {
  gangnam: IDENTITY_CAL, seocho: IDENTITY_CAL, bundang: IDENTITY_CAL,
  wirye: IDENTITY_CAL, seongnam: IDENTITY_CAL, songpa: IDENTITY_CAL,
  default: IDENTITY_CAL,
};

const K_ANONYMITY_THRESHOLD = 3;
const MIN_CONFIDENCE_FOR_COMMUNITY = 0.6;

// ─── Helpers ──────────────────────────────────────────────────────

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// extractRegion is imported from '@ujuz/shared' (shared SSOT)

/** Map probability to letter grade */
export function probabilityToGrade(p: number): AdmissionGrade {
  if (p >= 0.8) return 'A';
  if (p >= 0.6) return 'B';
  if (p >= 0.4) return 'C';
  if (p >= 0.2) return 'D';
  return 'F';
}

/**
 * 시즌성을 반영한 유효 기간 계산 (Seat-Month 정규화)
 */
export function effectiveHorizon(H: number, currentMonth: number): number {
  if (H <= 0) return 0; // V1.5.3: 방어 코드

  let H_eff = 0;
  for (let m = 0; m < H; m++) {
    const targetMonth = ((currentMonth - 1 + m) % 12) + 1; // 1-12
    const multiplier = SEASONAL_MULTIPLIER[targetMonth] ?? 1.0;
    H_eff += 1.0 * multiplier; // 단위: 1 month * multiplier
  }

  return H_eff; // 단위: month-equivalent
}

function getCacheKey(input: AdmissionScoreInput, region: string, w_eff: number): string {
  return `${input.facility_id}|${input.child_age_band}|${w_eff}|${ENGINE_VERSION}|${CALIBRATION_VERSION}`;
}

// ─── Prebuilt Admission Blocks Reader ─────────────────────────────

interface AdmissionBlock {
  _id: string;
  facility_id: string;
  block_type: string;
  data: Record<string, unknown>;
  confidence: number;
  is_active: boolean;
  valid_until: Date;
}

async function readAdmissionBlocks(
  facilityId: string
): Promise<Map<string, AdmissionBlock> | null> {
  try {
    const db = await getDbOrThrow();
    const blocks = await db
      .collection<AdmissionBlock>(env.MONGODB_ADMISSION_BLOCKS_COLLECTION)
      .find({
        facility_id: facilityId,
        is_active: true,
        valid_until: { $gt: new Date() },
      })
      .toArray();

    if (blocks.length === 0) return null;

    const map = new Map<string, AdmissionBlock>();
    for (const block of blocks) {
      map.set(block.block_type, block);
    }
    return map;
  } catch {
    // Graceful fallback: if collection doesn't exist or query fails,
    // the engine will use its own computation path
    return null;
  }
}

// ─── Core Engine ──────────────────────────────────────────────────

export async function calculateAdmissionScoreV1(
  input: AdmissionScoreInput
): Promise<AdmissionScoreResult> {
  const db = await getDbOrThrow();
  const evidence: EvidenceCard[] = [];

  // 1. 시설 정보 조회 (projection: 필요한 필드만)
  const facility = await db.collection(env.MONGODB_PLACES_COLLECTION).findOne(
    {
      $or: [
        { placeId: input.facility_id },
        { facility_id: input.facility_id },
      ],
    },
    {
      projection: {
        name: 1, capacity: 1, capacity_by_class: 1, address: 1,
        current_enrolled: 1, premium_subscribers: 1,
      },
    }
  );

  if (!facility) {
    throw new AppError('\uc2dc\uc124\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4', 404, 'facility_not_found');
  }

  const facilityName = (facility.name as string) ?? '\uc5b4\ub9b0\uc774\uc9d1';
  const capacity =
    (facility.capacity as Record<string, number>)?.total ??
    (facility.capacity as number) ??
    0;
  const address = (facility.address as string) ?? '';
  const region: RegionKey | 'default' = extractRegionFromAddress(address) ?? 'default';

  // V1.5.3: NB CDF 파라미터 검증 (런타임 가드)
  const validateNBParams = (r: number, p: number) => {
    if (r <= 0) {
      throw new AppError('NB parameter r must be > 0', 500, 'invalid_nb_params');
    }
    if (p <= 0 || p >= 1) {
      throw new AppError('NB parameter p must be in (0,1)', 500, 'invalid_nb_params');
    }
    if (!Number.isFinite(r) || !Number.isFinite(p)) {
      throw new AppError('NB parameters must be finite', 500, 'invalid_nb_params');
    }
  };

  // Age-band별 정원 추정
  const capacityByClass = (facility.capacity_by_class as Record<string, number>) ?? {};
  const capacity_eff =
    capacityByClass[input.child_age_band] ??
    capacity * AGE_BAND_CAPACITY_RATIO[input.child_age_band];

  // 2. 대기순번 정규화
  let waitingPosition = input.waiting_position;
  if (!waitingPosition) {
    // 최신 snapshot의 waitlist_by_class에서 추출
    const latestSnapshot = await db
      .collection('waitlist_snapshots')
      .findOne({ facility_id: input.facility_id }, { sort: { snapshot_date: -1 } });

    if (latestSnapshot) {
      const waitlistByClass = latestSnapshot.waitlist_by_class as Record<string, number>;
      waitingPosition = waitlistByClass?.[input.child_age_band] ?? 0;
    }

    // fallback: 정원 기반 추정
    if (!waitingPosition) {
      waitingPosition = Math.round(capacity_eff * 2);
    }
  }

  // 3. 유효 대기순번 (w_eff ≥ 0 허용)
  const c_region = REGION_COMPETITION[region] ?? 1.15;
  const b_priority = PRIORITY_BONUS[input.priority_type] ?? 0;
  const w_eff = Math.max(0, Math.ceil(waitingPosition * c_region - b_priority));

  // 4. 캐시 조회
  const cacheKey = getCacheKey(input, region, w_eff);
  const cached = await db.collection('admission_scores_v1').findOne({
    cacheKey,
    expires_at: { $gt: new Date() },
  });

  if (cached) {
    // V1.5.3: waiting_position 불일치 방지 (±2 이내만 허용)
    const cachedOriginal = (cached.waiting_position_original as number) ?? 0;
    const inputOriginal = input.waiting_position ?? 0;

    if (Math.abs(cachedOriginal - inputOriginal) <= 2) {
      return {
        facility_id: cached.facility_id as string,
        facility_name: cached.facility_name as string,
        probability: cached.probability as number,
        admission_score: cached.admission_score as number,
        grade: (cached.grade as AdmissionGrade) ?? probabilityToGrade(cached.probability as number),
        confidence: cached.confidence as number,
        estimated_months_median: cached.estimated_months_median as number,
        estimated_months_80th: cached.estimated_months_80th as number,
        evidence: cached.evidence as EvidenceCard[],
        region_key: (cached.region_key as string) ?? (cached.region as string) ?? 'default',
        engine_version: ENGINE_VERSION,
        calculated_at: (cached.created_at as Date).toISOString(),
      };
    } else {
      logger.info(
        { cachedOriginal, inputOriginal, w_eff },
        'Cache hit but waiting_position mismatch, recalculating'
      );
    }
  }

  // 5. Prebuilt admission blocks 확인 (크롤러 파이프라인에서 미리 계산)
  const prebuiltBlocks = await readAdmissionBlocks(input.facility_id);
  const vacancyBlock = prebuiltBlocks?.get('admission_vacancy_to');

  let N: number;
  let E_seat_months: number;
  let ρ_observed: number;
  let α_post: number;
  let β_post: number;
  let ρ_post_mean: number;
  let snapshotCount: number;

  if (vacancyBlock && vacancyBlock.confidence >= 0.5) {
    // Use prebuilt block data (skip expensive snapshot aggregation)
    const vData = vacancyBlock.data as Record<string, number>;
    N = vData.N ?? 0;
    E_seat_months = vData.E_seat_months ?? 0;
    ρ_observed = vData.rho_observed ?? 0;
    α_post = vData.alpha_post ?? 0.03;
    β_post = vData.beta_post ?? 3;
    ρ_post_mean = α_post / β_post;
    snapshotCount = N > 0 ? 6 : 1; // approximate for evidence display

    logger.info({ facility_id: input.facility_id }, 'Using prebuilt admission_vacancy_to block');

    evidence.push({
      type: 'to_snapshot',
      summary: `[\ud504\ub9ac\ube4c\ud2b8] TO ${N}\uac74 / ${E_seat_months.toFixed(1)} seat-months (\u03c1=${ρ_observed.toFixed(4)})`,
      source_count: snapshotCount,
      confidence: vacancyBlock.confidence,
      data_points: {
        N, E_seat_months, rho_observed: ρ_observed,
        method: 'gamma_posterior',
        alpha_post: α_post, beta_post: β_post,
      },
    });
  } else {
    // Fallback: compute from snapshots (existing logic)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // V1.6.1: 전체 스냅샷 조회 후 change.to_detected로 TO 필터링
    const snapshots = await db
      .collection('waitlist_snapshots')
      .find({
        facility_id: input.facility_id,
        snapshot_date: { $gte: twelveMonthsAgo },
        'change': { $exists: true },
      })
      .sort({ snapshot_date: 1 }) // V1.5.3: 오름차순 (과거→최신)
      .toArray();

    snapshotCount = snapshots.length;

    // 6. TO 이벤트 집계 (V1.6.1: change 필드 기반 — 전체 타임라인에서 TO 감지)
    N = 0;
    E_seat_months = 0;
    let pendingVacancies = 0;
    let lastEventStartTime: Date | null = null;
    const EVENT_TIMEOUT_HOURS = 48;

    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];
      const prevDate = new Date(prev.snapshot_date as Date);
      const currDate = new Date(curr.snapshot_date as Date);

      // V1.6.1: change 필드에서 직접 읽기 (current_enrolled 필드명 불일치 방지)
      const change = curr.change as { enrolled_delta?: number; to_detected?: boolean | null } | undefined;
      const delta = change?.enrolled_delta ?? 0;
      const isTO = change?.to_detected === true;

      if (isTO && delta < 0) {
        if (pendingVacancies === 0) {
          lastEventStartTime = currDate;
        }
        pendingVacancies += Math.abs(delta);

        const hoursSinceEventStart = lastEventStartTime
          ? (currDate.getTime() - lastEventStartTime.getTime()) / (60 * 60 * 1000)
          : 0;

        if (hoursSinceEventStart >= EVENT_TIMEOUT_HOURS) {
          N += pendingVacancies;
          pendingVacancies = 0;
          lastEventStartTime = null;
        }
      } else if (delta >= 0 && pendingVacancies > 0) {
        N += pendingVacancies;
        pendingVacancies = 0;
        lastEventStartTime = null;
      }

      const Δt_days = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
      const Δt_months = Δt_days / 30;
      E_seat_months += capacity_eff * Δt_months;
    }

    if (pendingVacancies > 0) {
      N += pendingVacancies;
    }

    ρ_observed = E_seat_months > 0 ? N / E_seat_months : 0;

    // 7. Gamma Posterior 계산
    const μ_prior =
      GAMMA_PRIOR_MEANS[region]?.[input.child_age_band] ??
      GAMMA_PRIOR_MEANS.default[input.child_age_band];

    const α0 = μ_prior * E0;
    const β0 = E0;

    α_post = α0 + N;
    β_post = β0 + E_seat_months;
    ρ_post_mean = α_post / β_post;

    if (snapshots.length >= 2) {
      evidence.push({
        type: 'to_snapshot',
        summary: `\uad00\uce21 ${E_seat_months.toFixed(1)} seat-months, TO ${N}\uac74 \ubc1c\uc0dd (\u03c1=${ρ_observed.toFixed(4)}/seat-month, \uc815\uc6d0${Math.round(capacity_eff)} \uae30\uc900 \uc6d4${(ρ_observed * capacity_eff).toFixed(1)}\uba85)`,
        source_count: snapshots.length,
        confidence: snapshots.length >= 6 ? 0.85 : 0.55,
        data_points: {
          N,
          E_seat_months,
          rho_observed: ρ_observed,
          method: 'gamma_posterior',
          alpha_post: α_post,
          beta_post: β_post,
          age_band_normalization: capacityByClass[input.child_age_band]
            ? 'by_class'
            : 'total_facility',
        },
      });
    } else {
      evidence.push({
        type: 'to_snapshot',
        summary: `\uc2a4\ub0c5\uc0f7 \ubd80\uc871 (${snapshots.length}\uac74). Prior \uae30\ubc18 \ucd94\uc815 (\u03c1_prior=${μ_prior.toFixed(4)}, E0=${E0})`,
        source_count: 1,
        confidence: 0.3,
        data_points: {
          N: 0,
          E_seat_months: 0,
          rho_observed: 0,
          method: 'gamma_prior',
          alpha_post: α_post,
          beta_post: β_post,
        },
      });
    }
  }

  // 7.5 Community Intel -> Gamma Prior Correction (V1.7.0)
  const communitySignalBlock = prebuiltBlocks?.get('admission_community_signal');
  if (communitySignalBlock && communitySignalBlock.confidence >= 0.5) {
    const csData = communitySignalBlock.data as Record<string, unknown>;
    const intelEnriched = csData.intel_enriched as boolean | undefined;
    const intelSourceCount = (csData.intel_source_count as number) ?? 0;
    const toMentionCount = (csData.to_mention_count as number) ?? 0;

    if (intelEnriched && intelSourceCount >= 2) {
      if (toMentionCount > 0) {
        // Community TO mention = 0.3 pseudo-observation (actual snapshot = 1.0)
        α_post += toMentionCount * 0.3;
        β_post += intelSourceCount * 0.5;
        ρ_post_mean = α_post / β_post;
      }

      const avgReportedWaitMonths = csData.avg_reported_wait_months as number | undefined;
      const competitionLevel = csData.competition_level as string | undefined;

      evidence.push({
        type: 'community_aggregate',
        summary: `\ucee4\ubba4\ub2c8\ud2f0 \uc778\ud154 ${intelSourceCount}\uac74 (TO\uc5b8\uae09 ${toMentionCount}\uac74${avgReportedWaitMonths ? `, \ud3c9\uade0\ub300\uae30 ${avgReportedWaitMonths}\uac1c\uc6d4` : ''}${competitionLevel ? `, \uacbd\uc7c1 ${competitionLevel}` : ''})`,
        source_count: intelSourceCount,
        confidence: communitySignalBlock.confidence,
        data_points: {
          total_sources: intelSourceCount,
          avg_wait_months: avgReportedWaitMonths,
          groups: toMentionCount,
          avg_sentiment: (csData.avg_sentiment as number) ?? 0,
          k_threshold: (csData.k_threshold as number) ?? 3,
        },
      });
    }
  }

  // 8. H개월 내 입학 확률 (Negative Binomial Predictive)
  function admissionProbability(H: number): number {
    if (w_eff === 0) return 1.0; // 우선순위 극대

    const currentMonth = new Date().getMonth() + 1;
    const H_eff = effectiveHorizon(H, currentMonth);
    const E_H = capacity_eff * H_eff;

    const r = α_post;
    const p = β_post / (β_post + E_H);

    // V1.5.3: 파라미터 검증 (jStat 호출 전)
    validateNBParams(r, p);

    // P(Count_H ≥ w_eff) = 1 - F_NB(w_eff - 1; r, p)
    return 1 - jStat.negbin.cdf(w_eff - 1, r, p);
  }

  const P_6m = admissionProbability(6);

  // 9. 시즌성 Evidence
  const currentMonth = new Date().getMonth() + 1;
  const monthsAhead = Array.from({ length: 6 }, (_, i) => ((currentMonth - 1 + i) % 12) + 1);
  const multipliers = monthsAhead.map((m) => SEASONAL_MULTIPLIER[m] ?? 1.0);
  const H_eff_6m = effectiveHorizon(6, currentMonth);
  const E_H_6m = capacity_eff * H_eff_6m;

  evidence.push({
    type: 'seasonal_factor',
    summary: `${monthsAhead[0]}-${monthsAhead[5]}\uc6d4 \ub204\uc801 \uac15\ub3c4 ${H_eff_6m.toFixed(1)} (\ud3c9\uade0 ${(H_eff_6m / 6).toFixed(2)}/\uc6d4, ${currentMonth <= 3 ? '\uc2e0\ud559\uae30 \ud53c\ud06c' : currentMonth >= 7 && currentMonth <= 9 ? '\ud558\ubc18\uae30 \ucd94\uac00 \ubaa8\uc9d1\uae30' : '\uc77c\ubc18 \uc2dc\uae30'})`,
    source_count: 1,
    confidence: 0.95,
    data_points: {
      months_ahead: monthsAhead,
      H_eff: H_eff_6m,
      E_H: E_H_6m,
      multipliers,
    },
  });

  // 10. 커뮤니티 신호 fallback (k-익명 ≥ 3)
  // Skip if step 7.5 already added community intel evidence
  const hasCommunityIntelEvidence = evidence.some((e) => e.type === 'community_aggregate');
  if (!hasCommunityIntelEvidence) {
    const communityInsights = await db
      .collection('dataBlocks')
      .find({
        facility_id: input.facility_id,
        block_type: 'community_aggregate',
        confidence: { $gte: MIN_CONFIDENCE_FOR_COMMUNITY },
      })
      .toArray();

    const qualifiedInsights = communityInsights.filter(
      (c) => (c.source_count as number ?? 0) >= K_ANONYMITY_THRESHOLD
    );

    if (qualifiedInsights.length > 0) {
      const totalSources = qualifiedInsights.reduce(
        (sum, c) => sum + ((c.source_count as number) ?? 0),
        0
      );
      const avgSentiment =
        qualifiedInsights.reduce(
          (sum, c) => sum + (c.features?.avg_sentiment ?? 0),
          0
        ) / qualifiedInsights.length;

      evidence.push({
        type: 'community_aggregate',
        summary: `\uc775\uba85 \ud6c4\uae30 \uc2e0\ud638 ${totalSources}\uac74 \uc9d1\uacc4 (k\u2265${K_ANONYMITY_THRESHOLD} \ucda9\uc871 ${qualifiedInsights.length}\uadf8\ub8f9, \ud3c9\uade0 \uac10\uc131 ${avgSentiment > 0 ? '+' : ''}${avgSentiment.toFixed(2)})`,
        source_count: totalSources,
        confidence: Math.min(0.8, 0.5 + qualifiedInsights.length * 0.05),
        data_points: {
          groups: qualifiedInsights.length,
          total_sources: totalSources,
          avg_sentiment: avgSentiment,
          k_threshold: K_ANONYMITY_THRESHOLD,
        },
      });
    }
  }

  // 11. 점수 캘리브레이션
  const raw_score = Math.round(100 * P_6m);
  const calibrated = (CALIBRATION_ARRAY[region] ?? CALIBRATION_ARRAY.default)[raw_score];
  const final_score = clamp(calibrated, 1, 99);

  // 12. Confidence (Posterior Variance)
  const variance = α_post / (β_post ** 2);
  const mean = α_post / β_post;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const confidence = Number(sigmoid(-cv * 3 + 1).toFixed(2));

  // 13. 예상 대기기간 (Binary Search)
  function findMedianWaitMonths(): number {
    for (let H = 1; H <= 24; H++) {
      if (admissionProbability(H) >= 0.5) return H;
    }
    return 24;
  }

  function find80thPercentileMonths(): number {
    for (let H = 1; H <= 24; H++) {
      if (admissionProbability(H) >= 0.8) return H;
    }
    return 24;
  }

  const estimated_months_median = findMedianWaitMonths();
  const estimated_months_80th = find80thPercentileMonths();

  // 14. Waitlist Evidence
  evidence.push({
    type: 'similar_cases',
    summary: `\ub300\uae30 \uc21c\ubc88 ${waitingPosition}\ubc88 (\uc6b0\uc120\uc21c\uc704 \ubcf4\uc815 \ud6c4 \uc2e4\uc9c8 ${w_eff}\ubc88), \uc608\uc0c1 \uacf5\uc11d ${(ρ_post_mean * capacity_eff * 6).toFixed(0)}\uba85 (6\uac1c\uc6d4)`,
    source_count: snapshotCount || 1,
    confidence: snapshotCount >= 3 ? 0.75 : 0.4,
    data_points: {
      sample_size: snapshotCount,
      avg_wait_months: estimated_months_median,
      success_rate: P_6m,
      definition: `${regionLabel(region as RegionKey)}/${input.child_age_band}\uc138/\uc815\uc6d0${Math.round(capacity_eff)}`,
    },
  });

  const result: AdmissionScoreResult = {
    facility_id: input.facility_id,
    facility_name: facilityName,
    probability: Number(P_6m.toFixed(2)),
    admission_score: final_score,
    grade: probabilityToGrade(P_6m),
    confidence,
    estimated_months_median,
    estimated_months_80th,
    evidence,
    region_key: region,
    engine_version: ENGINE_VERSION,
    calculated_at: new Date().toISOString(),
  };

  // 15. 결과 캐시 저장 (24h TTL)
  try {
    await db.collection('admission_scores_v1').insertOne({
      cacheKey,
      ...result,
      facility_id: input.facility_id,
      child_age_band: input.child_age_band,
      priority_type: input.priority_type,
      waiting_position: waitingPosition,
      waiting_position_original: input.waiting_position ?? 0, // V1.5.3: 원본 저장
      w_eff,
      region,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      engine_version: ENGINE_VERSION,
      calibration_version: CALIBRATION_VERSION,
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to cache V1.5.2 admission score');
  }

  return result;
}

// ─── Bot Response Formatter ───────────────────────────────────────

export function formatBotResponse(result: AdmissionScoreResult): string {
  const lines: string[] = [];

  lines.push(
    `6\uac1c\uc6d4 \ub0b4 \uc785\ud559 \ud655\ub960 ${Math.round(result.probability * 100)}% (\ub4f1\uae09 ${result.grade}, \uc810\uc218 ${result.admission_score}, \uc2e0\ub8b0\ub3c4 ${Math.round(result.confidence * 100)}%)`
  );
  lines.push('');
  lines.push('\uadfc\uac70:');

  for (const ev of result.evidence) {
    lines.push(`\u2022 ${ev.summary}`);
  }

  lines.push('');
  lines.push(
    `\uc608\uc0c1 \ub300\uae30\uae30\uac04: ${result.estimated_months_median - 1}-${result.estimated_months_median + 1}\uac1c\uc6d4 (\uc911\uc559\uac12 ${result.estimated_months_median}\uac1c\uc6d4)`
  );

  return lines.join('\n');
}
