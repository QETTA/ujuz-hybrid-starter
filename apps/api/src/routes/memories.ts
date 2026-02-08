/**
 * UJUz - User Memory Routes
 * 사용자 메모리 저장/조회/관리 API
 */

import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  saveMemory,
  getMemory,
  listMemories,
  updateMemory,
  deleteMemory,
  searchMemories,
} from '../services/userMemoryService.js';

const router = Router();
const rateLimit = createRateLimiter();

// ── Zod Schemas ──────────────────────────────────────────
const SaveMemorySchema = z.object({
  memory_key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9가-힣_-]+$/),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string().max(30)).max(10).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const ListMemoriesQuery = z.object({
  tag: z.string().max(30).optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const UpdateMemorySchema = z.object({
  content: z.string().min(1).max(5000),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

// POST / - Save memory (upsert)
router.post('/', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const body = SaveMemorySchema.parse(req.body);

    const memory = await saveMemory(
      userId,
      body.memory_key,
      body.content,
      body.tags,
      body.metadata,
    );

    res.status(201).json({ ok: true, data: memory });
  } catch (error) {
    next(error);
  }
});

// GET / - List or search memories
router.get('/', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const query = ListMemoriesQuery.parse(req.query);

    if (query.q) {
      const memories = await searchMemories(userId, query.q, query.limit);
      res.json({ ok: true, data: { memories, total: memories.length } });
    } else {
      const result = await listMemories(userId, query.tag, query.limit);
      res.json({ ok: true, data: result });
    }
  } catch (error) {
    next(error);
  }
});

// GET /:key - Get single memory
router.get('/:key', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const memory = await getMemory(userId, String(req.params.key));

    if (!memory) {
      res.status(404).json({ ok: false, error: 'not_found' });
      return;
    }

    res.json({ ok: true, data: memory });
  } catch (error) {
    next(error);
  }
});

// PUT /:key - Update memory
router.put('/:key', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const body = UpdateMemorySchema.parse(req.body);

    const memory = await updateMemory(userId, String(req.params.key), body.content, body.tags);

    if (!memory) {
      res.status(404).json({ ok: false, error: 'not_found' });
      return;
    }

    res.json({ ok: true, data: memory });
  } catch (error) {
    next(error);
  }
});

// DELETE /:key - Soft delete memory
router.delete('/:key', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const deleted = await deleteMemory(userId, String(req.params.key));

    if (!deleted) {
      res.status(404).json({ ok: false, error: 'not_found' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
