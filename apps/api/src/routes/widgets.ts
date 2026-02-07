import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { getWidgetByKey } from '../services/partnerService.js';

const router = Router();

router.get(
  '/:widgetKey',
  createRateLimiter({ windowMs: 60_000, max: 120 }),
  async (req, res) => {
    const widgetKey = z.string().min(3).parse(req.params.widgetKey);
    const data = await getWidgetByKey(widgetKey);
    res.json({ ok: true, data });
  },
);

export default router;
