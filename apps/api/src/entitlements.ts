import { prisma } from '@ujuz/db';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';

export type PlanEntitlements = {
  tier: SubscriptionTier;
  alertLimit: number;
  aiMonthlyLimit: number;
};

export async function getUserPlan(userId: string): Promise<PlanEntitlements> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE }
  });
  const tier = sub?.tier ?? SubscriptionTier.FREE;

  const plan = await prisma.subscriptionPlan.findUnique({ where: { tier } });
  // seed가 없을 수도 있으니 안전장치
  return {
    tier,
    alertLimit: plan?.alertLimit ?? 2,
    aiMonthlyLimit: plan?.aiMonthlyLimit ?? 2
  };
}

export async function enforceAlertLimit(userId: string) {
  const plan = await getUserPlan(userId);
  if (plan.alertLimit >= 999) return plan;

  const activeCount = await prisma.alertRule.count({
    where: { userId, isActive: true }
  });

  if (activeCount >= plan.alertLimit) {
    const err = new Error('ALERT_LIMIT_REACHED');
    (err as any).code = 'ALERT_LIMIT_REACHED';
    (err as any).meta = { activeCount, limit: plan.alertLimit, tier: plan.tier };
    throw err;
  }

  return plan;
}

export function currentMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function enforceAiQuota(userId: string) {
  const plan = await getUserPlan(userId);
  if (plan.aiMonthlyLimit >= 9999) return plan;

  const month = currentMonthKey();
  const usage = await prisma.aiUsage.upsert({
    where: { userId_month: { userId, month } },
    update: {},
    create: { userId, month, count: 0 }
  });

  if (usage.count >= plan.aiMonthlyLimit) {
    const err = new Error('AI_QUOTA_REACHED');
    (err as any).code = 'AI_QUOTA_REACHED';
    (err as any).meta = { used: usage.count, limit: plan.aiMonthlyLimit, tier: plan.tier };
    throw err;
  }

  // 예약(선차감) 방식: 작업 enqueuing 전에 count +1
  await prisma.aiUsage.update({
    where: { id: usage.id },
    data: { count: usage.count + 1 }
  });

  return plan;
}
