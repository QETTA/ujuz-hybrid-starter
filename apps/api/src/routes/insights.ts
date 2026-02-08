import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { insightsQuerySchema } from '../validators/insights.validator.js';
import { fetchInsights } from '../services/insightsService.js';

const router = Router();

const insightsLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyGenerator: (req) => req.header('x-device-id') ?? req.ip ?? ''
});

router.get('/', insightsLimiter, async (req, res, next) => {
  try {
    const placeIdsInput =
      (req.query.placeIds as unknown) ??
      (req.query['placeIds[]'] as unknown) ??
      (req.query.placeId as unknown);

    const query = insightsQuerySchema.parse({ placeIds: placeIdsInput });
    const data = await fetchInsights(query.placeIds as string[]);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
