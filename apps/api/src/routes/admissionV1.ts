/**
 * UJUz - Admission Score V1.5.2 Routes
 * 초고정밀 입학 가능성 예측 API (강남/서초/위례/성남/분당)
 */

import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { calculateAdmissionScoreV1, formatBotResponse } from '../services/admissionEngineV1.js';
import { admissionScoreQuerySchema } from '../validators/admissionV1.validator.js';

const router = Router();
const rateLimit = createRateLimiter();

/**
 * GET /v1/admission-score
 * Query params: facility_id, child_age_band, waiting_position?, priority_type?
 *
 * Returns:
 * {
 *   ok: true,
 *   data: {
 *     probability: 0.62,
 *     admission_score: 67,
 *     confidence: 0.74,
 *     estimated_months_median: 5,
 *     estimated_months_80th: 7,
 *     evidence: [...],
 *     engine_version: 'v1.5.2',
 *     calculated_at: '2026-02-07T...'
 *   }
 * }
 */
router.get('/admission-score', rateLimit, async (req, res, next) => {
  try {
    const query = admissionScoreQuerySchema.parse(req.query);

    const result = await calculateAdmissionScoreV1({
      facility_id: query.facility_id,
      child_age_band: query.child_age_band,
      waiting_position: query.waiting_position,
      priority_type: query.priority_type,
    });

    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/admission-score/bot-format
 * Query params: facility_id, child_age_band, waiting_position?, priority_type?
 *
 * Returns: { ok: true, message: "6개월 내 입학 확률 62%..." }
 */
router.get('/admission-score/bot-format', rateLimit, async (req, res, next) => {
  try {
    const query = admissionScoreQuerySchema.parse(req.query);

    const result = await calculateAdmissionScoreV1({
      facility_id: query.facility_id,
      child_age_band: query.child_age_band,
      waiting_position: query.waiting_position,
      priority_type: query.priority_type,
    });

    const message = formatBotResponse(result);
    res.json({ ok: true, data: { message } });
  } catch (error) {
    next(error);
  }
});

export default router;
