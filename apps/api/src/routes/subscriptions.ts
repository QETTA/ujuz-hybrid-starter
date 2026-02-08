import { Router } from 'express';
import { z } from 'zod';
import { getPlans, getUserSubscription, createSubscription, cancelSubscription } from '../services/subscriptionService.js';
import { trackReferralEvent } from '../services/referralService.js';
import { AppError } from '@ujuz/shared';

/** Extract device-id from request header (used as pseudo user-id in MVP) */
function getUserId(req: import('express').Request): string {
  const id = req.header('x-device-id');
  if (!id) throw new AppError('missing x-device-id', 401, 'missing_device_id');
  return id;
}

const router = Router();

// Get available plans
router.get('/plans', async (_req, res) => {
  const plans = getPlans();
  res.json({ ok: true, data: plans });
});

// Get user's current subscription
router.get('/me', async (req, res) => {
  const userId = getUserId(req);
  const subscription = await getUserSubscription(userId);

  res.json({ ok: true, data: { subscription } });
});

// Create/update subscription
const CreateSubscriptionSchema = z.object({
  plan_tier: z.string(),
  billing_cycle: z.enum(['monthly', 'yearly']).default('monthly'),
  // Optional referral tracking (UJUz Hybrid)
  referral_code: z.string().min(4).optional(),
  device_id: z.string().optional(), // optional when client cannot pass x-device-id
});

router.post('/subscribe', async (req, res) => {
  const userId = getUserId(req);
  const body = CreateSubscriptionSchema.parse(req.body);

  const subscription = await createSubscription(userId, body.plan_tier, body.billing_cycle);

  // best-effort referral event (do not fail subscription if referral tracking fails)
  const referralCode = body.referral_code ?? req.header('x-referral-code') ?? undefined;
  const deviceId = body.device_id ?? req.header('x-device-id') ?? undefined;
  if (referralCode) {
    try {
      const amount =
        body.billing_cycle === 'yearly'
          ? subscription.plan?.price_yearly
          : subscription.plan?.price_monthly;

      await trackReferralEvent({
        code: referralCode,
        type: 'SUBSCRIBE',
        user_id: userId,
        device_id: deviceId,
        amount: typeof amount === 'number' ? amount : undefined,
        meta: { plan_tier: body.plan_tier, billing_cycle: body.billing_cycle },
      });
    } catch {
      // swallow
    }
  }

  res.json({ ok: true, data: { subscription } });
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  const userId = getUserId(req);
  await cancelSubscription(userId);

  res.json({ ok: true });
});

export default router;
