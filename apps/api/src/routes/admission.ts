/**
 * UJUz - Admission Score Routes
 * 입소 점수 예측 API
 */

import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { calculateAdmissionScore, fetchAdmissionHistory } from '../services/admissionService.js';
import { getUserId } from '../utils/getUserId.js';

const router = Router();
const rateLimit = createRateLimiter();

// ── Zod Schemas ──────────────────────────────────────────
const CalculateSchema = z.object({
  facility_id: z.string().min(1),
  child_id: z.string().min(1),
  target_class: z.string().min(1),
  priority_type: z.string().min(1),
  additional_priorities: z.array(z.string()).default([]),
  waiting_position: z.number().int().min(0).optional(),
});

// POST /admission/calculate
router.post('/calculate', rateLimit, async (req, res, next) => {
  try {
    const body = CalculateSchema.parse(req.body);

    const result = await calculateAdmissionScore({
      facility_id: body.facility_id,
      child_id: body.child_id,
      target_class: body.target_class,
      priority_type: body.priority_type,
      additional_priorities: body.additional_priorities,
      waiting_position: body.waiting_position,
    });

    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /admission/history
router.get('/history', rateLimit, async (req, res, next) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const result = await fetchAdmissionHistory(userId);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
