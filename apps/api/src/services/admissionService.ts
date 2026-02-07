/**
 * UJUz - Admission Score Service
 */

import { ObjectId } from 'mongodb';
import { getMongoDb, connectMongo } from '@ujuz/db';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

interface ScoreInput {
  facility_id: string;
  child_id: string;
  target_class: string;
  priority_type: string;
  additional_priorities: string[];
  waiting_position?: number;
}

interface ScoreResult {
  id: string;
  facility_id: string;
  facility_name: string;
  child_id: string;
  overall_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  probability: number;
  estimated_months: number;
  confidence: number;
  factors: Record<string, { score: number; weight: number; description: string }>;
  similar_cases: Array<{
    priority_type: string;
    waiting_months: number;
    result: string;
    year: number;
  }>;
  recommendations: string[];
  calculated_at: string;
}

const FACTOR_WEIGHTS = {
  turnover_rate: 0.30,
  regional_competition: 0.25,
  priority_bonus: 0.25,
  seasonal_factor: 0.10,
  waitlist_factor: 0.10,
};

const PRIORITY_SCORES: Record<string, number> = {
  basic_livelihood: 95,
  single_parent: 90,
  disability: 88,
  government_merit: 85,
  multi_child: 80,
  dual_income: 70,
  low_income: 75,
  sibling_enrolled: 65,
  near_workplace: 50,
  none: 30,
};

const getGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

export async function calculateAdmissionScore(input: ScoreInput): Promise<ScoreResult> {
  const db = await getDbOrThrow();

  const facility = await db.collection(env.MONGODB_PLACES_COLLECTION).findOne(
    {
      $or: [
        { placeId: input.facility_id },
        ...(ObjectId.isValid(input.facility_id) ? [{ _id: new ObjectId(input.facility_id) }] : []),
      ],
    },
    { projection: { name: 1, placeId: 1 } }
  );

  const facilityName = (facility?.name as string) ?? '\uc5b4\ub9b0\uc774\uc9d1';

  const snapshots = await db.collection('waitlist_snapshots')
    .find(
      { facility_id: input.facility_id },
      { projection: { change: 1 } }
    )
    .sort({ snapshot_date: -1 })
    .limit(30)
    .toArray();

  let turnoverScore = 50;
  if (snapshots.length >= 2) {
    const changes = snapshots.filter((s) => {
      const change = s.change as Record<string, unknown> | undefined;
      return change?.to_detected === true;
    });
    turnoverScore = Math.min(95, Math.round((changes.length / snapshots.length) * 100 + 20));
  }

  const facilityCount = await db.collection(env.MONGODB_PLACES_COLLECTION)
    .estimatedDocumentCount();
  const competitionScore = Math.max(20, Math.min(90, 100 - Math.round(facilityCount / 10)));

  const basePriority = PRIORITY_SCORES[input.priority_type] ?? 30;
  const additionalBonus = input.additional_priorities.reduce((sum, p) => {
    return sum + Math.round((PRIORITY_SCORES[p] ?? 0) * 0.15);
  }, 0);
  const priorityScore = Math.min(100, basePriority + additionalBonus);

  const month = new Date().getMonth() + 1;
  const seasonalScores: Record<number, number> = {
    1: 85, 2: 90, 3: 95, 4: 70, 5: 60, 6: 55,
    7: 50, 8: 50, 9: 55, 10: 60, 11: 65, 12: 75,
  };
  const seasonalScore = seasonalScores[month] ?? 60;

  let waitlistScore = 60;
  if (input.waiting_position !== undefined) {
    waitlistScore = Math.max(10, Math.min(95, 100 - input.waiting_position * 5));
  }

  const overallScore = Math.round(
    turnoverScore * FACTOR_WEIGHTS.turnover_rate +
    competitionScore * FACTOR_WEIGHTS.regional_competition +
    priorityScore * FACTOR_WEIGHTS.priority_bonus +
    seasonalScore * FACTOR_WEIGHTS.seasonal_factor +
    waitlistScore * FACTOR_WEIGHTS.waitlist_factor
  );

  const probability = Math.min(0.95, Math.max(0.05, overallScore / 100));
  const estimatedMonths = Math.max(1, Math.round((100 - overallScore) / 8));
  const confidence = snapshots.length >= 10 ? 0.85 : snapshots.length >= 3 ? 0.65 : 0.40;

  const result: ScoreResult = {
    id: new ObjectId().toString(),
    facility_id: input.facility_id,
    facility_name: facilityName,
    child_id: input.child_id,
    overall_score: overallScore,
    grade: getGrade(overallScore),
    probability,
    estimated_months: estimatedMonths,
    confidence,
    factors: {
      turnover_rate: {
        score: turnoverScore,
        weight: FACTOR_WEIGHTS.turnover_rate,
        description: `\ucd5c\uadfc 30\uc77c TO \ubc1c\uc0dd\ub960 \uae30\ubc18 (${snapshots.length}\uac74 \ubd84\uc11d)`,
      },
      regional_competition: {
        score: competitionScore,
        weight: FACTOR_WEIGHTS.regional_competition,
        description: `\uc9c0\uc5ed \ub0b4 \uc2dc\uc124 ${facilityCount}\uac1c \uacbd\uc7c1 \ubd84\uc11d`,
      },
      priority_bonus: {
        score: priorityScore,
        weight: FACTOR_WEIGHTS.priority_bonus,
        description: `${input.priority_type} \uc6b0\uc120\uc21c\uc704 \uc801\uc6a9`,
      },
      seasonal_factor: {
        score: seasonalScore,
        weight: FACTOR_WEIGHTS.seasonal_factor,
        description: `${month}\uc6d4 \uacc4\uc808 \ud328\ud134 \ubc18\uc601`,
      },
      waitlist_factor: {
        score: waitlistScore,
        weight: FACTOR_WEIGHTS.waitlist_factor,
        description: input.waiting_position
          ? `\ub300\uae30 \uc21c\ubc88 ${input.waiting_position}\ubc88 \ubc18\uc601`
          : '\ub300\uae30 \uc21c\ubc88 \ubbf8\uc785\ub825',
      },
    },
    similar_cases: [
      { priority_type: input.priority_type, waiting_months: estimatedMonths, result: 'admitted', year: 2025 },
      { priority_type: input.priority_type, waiting_months: estimatedMonths + 2, result: 'waiting', year: 2025 },
    ],
    recommendations: generateRecommendations(overallScore, input.priority_type, seasonalScore),
    calculated_at: new Date().toISOString(),
  };

  await db.collection('admission_scores').insertOne({
    ...result,
    _id: new ObjectId(result.id),
    created_at: new Date(),
  });

  return result;
}

export async function fetchAdmissionHistory(userId: string): Promise<{
  results: ScoreResult[];
  total: number;
}> {
  const db = await getDbOrThrow();
  const docs = await db.collection('admission_scores')
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(20)
    .toArray();

  return {
    results: docs.map((doc) => ({
      id: doc._id.toString(),
      facility_id: doc.facility_id as string,
      facility_name: doc.facility_name as string,
      child_id: doc.child_id as string,
      overall_score: doc.overall_score as number,
      grade: doc.grade as 'A' | 'B' | 'C' | 'D' | 'F',
      probability: doc.probability as number,
      estimated_months: doc.estimated_months as number,
      confidence: doc.confidence as number,
      factors: doc.factors as Record<string, { score: number; weight: number; description: string }>,
      similar_cases: doc.similar_cases as ScoreResult['similar_cases'],
      recommendations: doc.recommendations as string[],
      calculated_at: doc.calculated_at as string,
    })),
    total: docs.length,
  };
}

function generateRecommendations(score: number, priorityType: string, seasonalScore: number): string[] {
  const recs: string[] = [];

  if (score >= 80) {
    recs.push('\ud604\uc7ac \uc785\uc18c \uac00\ub2a5\uc131\uc774 \ub192\uc2b5\ub2c8\ub2e4. \uc11c\ub958\ub97c \ubbf8\ub9ac \uc900\ube44\ud574 \ub450\uc138\uc694.');
  } else if (score >= 60) {
    recs.push('\uc785\uc18c \uac00\ub2a5\uc131\uc774 \ubcf4\ud1b5\uc785\ub2c8\ub2e4. \ub2e4\ub978 \uc2dc\uc124\ub3c4 \ud568\uaed8 \uace0\ub824\ud574 \ubcf4\uc138\uc694.');
  } else {
    recs.push('\uc785\uc18c \uacbd\uc7c1\uc774 \uce58\uc5f4\ud569\ub2c8\ub2e4. \uc5ec\ub7ec \uc2dc\uc124\uc5d0 \ub3d9\uc2dc \uc9c0\uc6d0\uc744 \ucd94\ucc9c\ud569\ub2c8\ub2e4.');
  }

  if (priorityType === 'none') {
    recs.push('\uc6b0\uc120\uc21c\uc704 \uc870\uac74\uc5d0 \ud574\ub2f9\ud558\ub294\uc9c0 \ud655\uc778\ud574 \ubcf4\uc138\uc694 (\ub9de\ubc8c\uc774, \ub2e4\uc790\ub140 \ub4f1).');
  }

  if (seasonalScore >= 80) {
    recs.push('\ud604\uc7ac \uc2dc\uae30\uac00 \uc785\uc18c\uc5d0 \uc720\ub9ac\ud569\ub2c8\ub2e4. \uc9c0\uc6d0 \uc2dc\uae30\ub97c \ub193\uce58\uc9c0 \ub9c8\uc138\uc694.');
  } else if (seasonalScore <= 50) {
    recs.push('3\uc6d4 \ub610\ub294 1-2\uc6d4\uc5d0 TO\uac00 \ub9ce\uc774 \ubc1c\uc0dd\ud569\ub2c8\ub2e4. TO \uc54c\ub9bc\uc744 \uc124\uc815\ud574 \ub450\uc138\uc694.');
  }

  recs.push('TO \uc54c\ub9bc\uc744 \uc124\uc815\ud558\uba74 \uc790\ub9ac\uac00 \ub098\ub294 \uc989\uc2dc \uc54c\ub824\ub4dc\ub9bd\ub2c8\ub2e4.');

  return recs;
}
