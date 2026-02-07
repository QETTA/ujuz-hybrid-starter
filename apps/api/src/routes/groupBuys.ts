/**
 * UJUz - GroupBuy Routes
 * 공동구매 API
 */

import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  listGroupBuys,
  getGroupBuyById,
  joinGroupBuy,
  leaveGroupBuy,
  getUserJoinedGroupBuys,
} from '../services/groupBuyService.js';

const router = Router();
const rateLimit = createRateLimiter();

// ── Zod Schemas ──────────────────────────────────────────
const ListGroupBuysQuery = z.object({
  item_type: z.string().optional(),
  status: z.string().optional(),
  sort_by: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// GET /group-buys
router.get('/', rateLimit, async (req, res, next) => {
  try {
    const query = ListGroupBuysQuery.parse(req.query);

    const result = await listGroupBuys({
      item_type: query.item_type,
      status: query.status,
      sort_by: query.sort_by,
      limit: query.limit,
      offset: query.offset,
    });

    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /group-buys/joined
router.get('/joined', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const result = await getUserJoinedGroupBuys(userId);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /group-buys/:id
router.get('/:id', rateLimit, async (req, res, next) => {
  try {
    const groupBuy = await getGroupBuyById(String(req.params.id));
    if (!groupBuy) {
      res.status(404).json({ ok: false, error: 'not_found' });
      return;
    }
    res.json({ ok: true, data: groupBuy });
  } catch (error) {
    next(error);
  }
});

// POST /group-buys/:id/join
router.post('/:id/join', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const result = await joinGroupBuy(String(req.params.id), userId);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// DELETE /group-buys/:id/leave
router.delete('/:id/leave', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    await leaveGroupBuy(String(req.params.id), userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
