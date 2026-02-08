/**
 * UJUz - User Routes
 * 사용자 관리 API
 */

import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { getMongoDb, connectMongo } from '@ujuz/db';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

const router = Router();
const rateLimit = createRateLimiter();

// ── Zod Schemas ──────────────────────────────────────────
const UpdateProfileSchema = z.object({
  display_name: z.string().max(50).optional(),
  avatar_url: z.string().url().max(500).optional(),
});

const AddChildSchema = z.object({
  nickname: z.string().min(1).max(50),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO date format required (YYYY-MM-DD)'),
  age_class: z.string().max(20).nullable().optional(),
  target_facilities: z.array(z.string()).max(20).default([]),
  priority_types: z.array(z.string()).max(10).default([]),
});

const PushTokenSchema = z.object({
  token: z.string().min(1).max(500),
});

const getDb = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) return null;
  return getMongoDb() ?? await connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

// GET /users/me - Get profile
router.get('/me', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const db = await getDb();
    if (!db) {
      res.json({ ok: true, data: { id: userId, display_name: null, children: [] } });
      return;
    }

    const user = await db.collection('users').findOne({ user_id: userId });
    const children = await db.collection('children').find({ user_id: userId }).toArray();

    res.json({
      ok: true,
      data: {
        id: userId,
        display_name: user?.display_name ?? null,
        email: user?.email ?? null,
        avatar_url: user?.avatar_url ?? null,
        children: children.map((c) => ({
          id: c._id.toString(),
          nickname: c.nickname,
          birth_date: c.birth_date,
          age_class: c.age_class,
          target_facilities: c.target_facilities ?? [],
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me - Update profile
router.patch('/me', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const db = await getDb();
    if (!db) {
      throw new AppError('Database not configured', 503, 'db_not_configured');
    }

    const body = UpdateProfileSchema.parse(req.body);
    await db.collection('users').updateOne(
      { user_id: userId },
      { $set: { ...body, updated_at: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// POST /users/me/children - Add child
router.post('/me/children', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const db = await getDb();
    if (!db) {
      throw new AppError('Database not configured', 503, 'db_not_configured');
    }

    const body = AddChildSchema.parse(req.body);

    const result = await db.collection('children').insertOne({
      user_id: userId,
      nickname: body.nickname,
      birth_date: body.birth_date,
      age_class: body.age_class ?? null,
      target_facilities: body.target_facilities,
      priority_types: body.priority_types,
      created_at: new Date(),
    });

    res.status(201).json({
      ok: true,
      data: {
        id: result.insertedId.toString(),
        nickname: body.nickname,
        birth_date: body.birth_date,
        age_class: body.age_class,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /users/me/push-token - Register push token
router.post('/me/push-token', rateLimit, async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') ?? 'anonymous';
    const db = await getDb();
    if (!db) {
      res.json({ ok: true });
      return;
    }

    const body = PushTokenSchema.parse(req.body);
    await db.collection('users').updateOne(
      { user_id: userId },
      { $set: { push_token: body.token, updated_at: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
