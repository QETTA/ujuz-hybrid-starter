/**
 * UJUz - TO Alert Routes
 * TO 알림 구독 API
 */

import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  createSubscription,
  getUserSubscriptions,
  deleteSubscription,
  getAlertHistory,
} from '../services/toAlertService.js';
import { getUserId } from '../utils/getUserId.js';

const router = Router();
const rateLimit = createRateLimiter();

// ── Zod Schemas ──────────────────────────────────────────
const CreateTOSubscriptionSchema = z.object({
  facility_id: z.string().min(1),
  facility_name: z.string().min(1).max(200),
  target_classes: z.array(z.string().max(20)).max(10).default([]),
  notification_preferences: z.object({
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    email: z.boolean().default(false),
  }).default({ push: true, sms: false, email: false }),
});

// GET /alerts/to - Get user's TO subscriptions
router.get('/to', rateLimit, async (req, res, next) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const result = await getUserSubscriptions(userId);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /alerts/to - Subscribe to TO alerts
router.post('/to', rateLimit, async (req, res, next) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const body = CreateTOSubscriptionSchema.parse(req.body);

    const subscription = await createSubscription({
      user_id: userId,
      facility_id: body.facility_id,
      facility_name: body.facility_name,
      target_classes: body.target_classes,
      notification_preferences: body.notification_preferences,
    });

    res.status(201).json({ ok: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// DELETE /alerts/to/:facilityId - Unsubscribe from TO alerts
router.delete('/to/:facilityId', rateLimit, async (req, res, next) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const facilityId = z.string().min(1).max(200).parse(req.params.facilityId);
    await deleteSubscription(userId, facilityId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// GET /alerts/to/history - Get TO alert history
router.get('/to/history', rateLimit, async (req, res, next) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const result = await getAlertHistory(userId);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
