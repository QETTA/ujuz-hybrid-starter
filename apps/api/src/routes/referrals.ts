import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { trackReferralEvent, ReferralEventTypeSchema } from '../services/referralService.js';

const router = Router();

const TrackReferralSchema = z.object({
  code: z.string().min(4),
  event_type: ReferralEventTypeSchema,
  user_id: z.string().optional(),
  device_id: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

// public endpoint (rate-limited)
router.post(
  '/track',
  createRateLimiter({
    // tighter than default: 60 req/min per IP+route
    windowMs: 60_000,
    max: 60,
  }),
  async (req, res) => {
    const body = TrackReferralSchema.parse(req.body);

    const result = await trackReferralEvent({
      code: body.code,
      type: body.event_type,
      user_id: body.user_id,
      device_id: body.device_id,
      amount: body.amount,
      currency: body.currency,
      meta: body.meta,
    });

    res.json({ ok: true, data: result });
  },
);

export default router;
