/**
 * UJUz - Admission Score V1.5.2 Routes
 * 초고정밀 입학 가능성 예측 API (강남/서초/위례/성남/분당)
 */

import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { calculateAdmissionScoreV1, formatBotResponse } from '../services/admissionEngineV1.js';
import { admissionScoreQuerySchema } from '../validators/admissionV1.validator.js';
import { AppError } from '@ujuz/shared';
import { logger } from '@ujuz/config';

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
router.get('/admission-score', rateLimit, async (req, res) => {
  try {
    // Zod 검증
    const parsed = admissionScoreQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: 'validation_failed',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
      });
      return;
    }

    const { facility_id, child_age_band, waiting_position, priority_type } = parsed.data;

    const result = await calculateAdmissionScoreV1({
      facility_id,
      child_age_band,
      waiting_position,
      priority_type,
    });

    res.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        ok: false,
        error: error.code ?? 'app_error',
        message: error.message,
      });
      return;
    }

    logger.error({ error }, 'Admission score V1.5.2 calculation failed');
    res.status(500).json({ ok: false, error: 'calculation_failed' });
  }
});

/**
 * GET /v1/admission-score/bot-format
 * Query params: facility_id, child_age_band, waiting_position?, priority_type?
 *
 * Returns: { ok: true, message: "6개월 내 입학 확률 62%..." }
 */
router.get('/admission-score/bot-format', rateLimit, async (req, res) => {
  try {
    const parsed = admissionScoreQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: 'validation_failed',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
      });
      return;
    }

    const { facility_id, child_age_band, waiting_position, priority_type } = parsed.data;

    const result = await calculateAdmissionScoreV1({
      facility_id,
      child_age_band,
      waiting_position,
      priority_type,
    });

    const message = formatBotResponse(result);
    res.json({ ok: true, message });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        ok: false,
        error: error.code ?? 'app_error',
        message: error.message,
      });
      return;
    }

    logger.error({ error }, 'Admission score V1.5.2 bot format failed');
    res.status(500).json({ ok: false, error: 'calculation_failed' });
  }
});

export default router;
