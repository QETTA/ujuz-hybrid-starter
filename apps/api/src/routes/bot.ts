/**
 * UJUz - Bot Routes (우주봇)
 * AI 상담 API
 */

import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  processQuery,
  getConversations,
  getConversation,
  deleteConversation,
} from '../services/botService.js';

const router = Router();
const rateLimit = createRateLimiter();

// ── Zod Schemas ──────────────────────────────────────────
const BotQuerySchema = z.object({
  message: z.string().min(1).max(5000),
  conversation_id: z.string().optional(),
  context: z.object({
    facility_id: z.string().optional(),
    child_id: z.string().optional(),
    child_age_band: z.enum(['0', '1', '2', '3', '4', '5']).optional(),
    waiting_position: z.number().int().min(0).optional(),
    priority_type: z.enum([
      'dual_income', 'sibling', 'single_parent', 'multi_child',
      'disability', 'low_income', 'general',
    ]).optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }).optional(),
});

// POST /bot/query - Ask the bot
router.post('/query', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const body = BotQuerySchema.parse(req.body);

    const result = await processQuery({
      user_id: userId,
      message: body.message,
      conversation_id: body.conversation_id,
      context: body.context,
    });

    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /bot/conversations - List conversations
router.get('/conversations', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const result = await getConversations(userId);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /bot/conversations/:id - Get single conversation
router.get('/conversations/:id', rateLimit, async (req, res, next) => {
  try {
    const result = await getConversation(String(req.params.id));
    if (!result) {
      res.status(404).json({ ok: false, error: 'not_found' });
      return;
    }
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

// DELETE /bot/conversations/:id - Delete conversation
router.delete('/conversations/:id', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    await deleteConversation(String(req.params.id), userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
