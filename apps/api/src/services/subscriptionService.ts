/**
 * UJUz - Subscription Service
 * 구독 및 요금제 관리
 */

import { getMongoDb, connectMongo } from '@ujuz/db';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

const PLANS = [
  {
    id: 'free',
    tier: 'free',
    name: '\ubb34\ub8cc',
    description: '\uae30\ubcf8 \uae30\ub2a5 \uccb4\ud5d8',
    price_monthly: 0,
    price_yearly: 0,
    features: {
      admission_score_limit: 1,
      to_alert_facility_limit: 1,
      bot_query_daily_limit: 5,
      priority_support: false,
      ad_free: false,
      export_data: false,
    },
  },
  {
    id: 'basic',
    tier: 'basic',
    name: '\uae30\ubcf8',
    description: '\ud575\uc2ec \uae30\ub2a5 \ud65c\uc6a9',
    price_monthly: 4900,
    price_yearly: 49000,
    features: {
      admission_score_limit: 5,
      to_alert_facility_limit: 5,
      bot_query_daily_limit: 30,
      priority_support: false,
      ad_free: true,
      export_data: false,
    },
  },
  {
    id: 'premium',
    tier: 'premium',
    name: '\ud504\ub9ac\ubbf8\uc5c4',
    description: '\ubaa8\ub4e0 \uae30\ub2a5 \ubb34\uc81c\ud55c',
    price_monthly: 9900,
    price_yearly: 99000,
    features: {
      admission_score_limit: -1,
      to_alert_facility_limit: -1,
      bot_query_daily_limit: -1,
      priority_support: true,
      ad_free: true,
      export_data: true,
    },
  },
];

export function getPlans() {
  return { plans: PLANS };
}

export async function getUserSubscription(userId: string) {
  const db = await getDbOrThrow();
  const doc = await db.collection('user_subscriptions').findOne({
    user_id: userId,
    status: { $in: ['active', 'trial'] },
  });

  if (!doc) return null;

  return {
    id: doc._id.toString(),
    user_id: doc.user_id as string,
    plan: PLANS.find((p) => p.tier === doc.plan_tier) ?? PLANS[0],
    billing_cycle: doc.billing_cycle as string,
    status: doc.status as string,
    current_period_start: (doc.current_period_start as Date).toISOString(),
    current_period_end: (doc.current_period_end as Date).toISOString(),
    usage: {
      admission_scores_used: (doc.admission_scores_used as number) ?? 0,
      to_alerts_active: (doc.to_alerts_active as number) ?? 0,
      bot_queries_today: (doc.bot_queries_today as number) ?? 0,
      last_reset: (doc.last_reset as Date)?.toISOString() ?? new Date().toISOString(),
    },
    created_at: (doc.created_at as Date).toISOString(),
  };
}

export async function createSubscription(userId: string, planTier: string, billingCycle: string) {
  const db = await getDbOrThrow();
  const plan = PLANS.find((p) => p.tier === planTier);
  if (!plan) throw new AppError('Invalid plan', 400, 'invalid_plan');

  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Cancel existing subscription
  await db.collection('user_subscriptions').updateMany(
    { user_id: userId, status: 'active' },
    { $set: { status: 'cancelled' } }
  );

  const doc = {
    user_id: userId,
    plan_tier: planTier,
    billing_cycle: billingCycle,
    status: 'active',
    current_period_start: now,
    current_period_end: periodEnd,
    admission_scores_used: 0,
    to_alerts_active: 0,
    bot_queries_today: 0,
    last_reset: now,
    created_at: now,
  };

  const result = await db.collection('user_subscriptions').insertOne(doc);

  return {
    id: result.insertedId.toString(),
    user_id: userId,
    plan,
    billing_cycle: billingCycle,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    usage: { admission_scores_used: 0, to_alerts_active: 0, bot_queries_today: 0, last_reset: now.toISOString() },
    created_at: now.toISOString(),
  };
}

export async function cancelSubscription(userId: string) {
  const db = await getDbOrThrow();
  const result = await db.collection('user_subscriptions').updateOne(
    { user_id: userId, status: 'active' },
    { $set: { status: 'cancelled' } }
  );

  if (result.matchedCount === 0) {
    throw new AppError('No active subscription', 404, 'no_subscription');
  }
}

export async function incrementUsage(userId: string, field: 'admission_scores_used' | 'bot_queries_today' | 'to_alerts_active') {
  const db = await getDbOrThrow();
  await db.collection('user_subscriptions').updateOne(
    { user_id: userId, status: { $in: ['active', 'trial'] } },
    { $inc: { [field]: 1 } }
  );
}
