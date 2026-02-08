/**
 * UJUz - Peer Routes
 * 피어싱크 커뮤니티 API
 */

import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  getLiveStatus,
  getActivities,
  getTrendingPlaces,
  recordActivity,
} from '../services/peerService.js';
import { getUserId } from '../utils/getUserId.js';

const router = Router();
const rateLimit = createRateLimiter();

// ── Zod Schemas ──────────────────────────────────────────
const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const RecordActivitySchema = z.object({
  activity_type: z.enum(['visit', 'review', 'question', 'info_share', 'recommendation']),
  place_id: z.string().optional(),
  place_name: z.string().max(200).optional(),
  age_group: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
});

// GET /peer/live-status
router.get('/live-status', rateLimit, async (_req, res, next) => {
  try {
    const status = await getLiveStatus();
    res.json({ ok: true, data: status });
  } catch (error) {
    next(error);
  }
});

// GET /peer/activities
router.get('/activities', rateLimit, async (req, res, next) => {
  try {
    const { limit, offset } = PaginationQuery.parse(req.query);
    const result = await getActivities(limit, offset);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /peer/trending/places
router.get('/trending/places', rateLimit, async (req, res, next) => {
  try {
    const limit = z.coerce.number().int().min(1).max(30).default(10).parse(req.query.limit);
    const result = await getTrendingPlaces(limit);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /peer/activity
router.post('/activity', rateLimit, async (req, res, next) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const body = RecordActivitySchema.parse(req.body);

    const result = await recordActivity({
      user_id: userId,
      activity_type: body.activity_type,
      place_id: body.place_id,
      place_name: body.place_name,
      age_group: body.age_group,
      description: body.description,
    });

    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
