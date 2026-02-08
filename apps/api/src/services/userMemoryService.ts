/**
 * UJUz - User Memory Service
 * Serena MCP 영감 — 사용자 개인 메모리 저장/조회/관리
 */

import { getMongoDb, connectMongo } from '@ujuz/db';
import { env, logger } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

export interface UserMemoryDoc {
  user_id: string;
  memory_key: string;
  content: string;
  tags: string[];
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const COLLECTION = 'user_memories';

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

export async function saveMemory(
  userId: string,
  key: string,
  content: string,
  tags?: string[],
  metadata?: Record<string, unknown>,
): Promise<UserMemoryDoc> {
  const db = await getDbOrThrow();
  const now = new Date();

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { user_id: userId, memory_key: key },
    {
      $set: {
        content,
        tags: tags ?? [],
        metadata: metadata ?? {},
        is_active: true,
        updated_at: now,
      },
      $setOnInsert: {
        user_id: userId,
        memory_key: key,
        created_at: now,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const doc = result;
  if (!doc) {
    throw new AppError('Failed to save memory', 500, 'memory_save_failed');
  }

  return {
    user_id: doc.user_id as string,
    memory_key: doc.memory_key as string,
    content: doc.content as string,
    tags: (doc.tags as string[]) ?? [],
    metadata: (doc.metadata as Record<string, unknown>) ?? {},
    is_active: doc.is_active as boolean,
    created_at: doc.created_at as Date,
    updated_at: doc.updated_at as Date,
  };
}

export async function getMemory(userId: string, key: string): Promise<UserMemoryDoc | null> {
  const db = await getDbOrThrow();
  const doc = await db.collection(COLLECTION).findOne({
    user_id: userId,
    memory_key: key,
    is_active: true,
  });

  if (!doc) return null;

  return {
    user_id: doc.user_id as string,
    memory_key: doc.memory_key as string,
    content: doc.content as string,
    tags: (doc.tags as string[]) ?? [],
    metadata: (doc.metadata as Record<string, unknown>) ?? {},
    is_active: doc.is_active as boolean,
    created_at: doc.created_at as Date,
    updated_at: doc.updated_at as Date,
  };
}

export async function listMemories(
  userId: string,
  tag?: string,
  limit = 20,
): Promise<{ memories: UserMemoryDoc[]; total: number }> {
  const db = await getDbOrThrow();
  const query: Record<string, unknown> = { user_id: userId, is_active: true };

  if (tag) {
    query.tags = tag;
  }

  const [docs, total] = await Promise.all([
    db.collection(COLLECTION)
      .find(query)
      .sort({ updated_at: -1 })
      .limit(limit)
      .toArray(),
    db.collection(COLLECTION).countDocuments(query),
  ]);

  return {
    memories: docs.map((doc) => ({
      user_id: doc.user_id as string,
      memory_key: doc.memory_key as string,
      content: doc.content as string,
      tags: (doc.tags as string[]) ?? [],
      metadata: (doc.metadata as Record<string, unknown>) ?? {},
      is_active: doc.is_active as boolean,
      created_at: doc.created_at as Date,
      updated_at: doc.updated_at as Date,
    })),
    total,
  };
}

export async function updateMemory(
  userId: string,
  key: string,
  content: string,
  tags?: string[],
): Promise<UserMemoryDoc | null> {
  const db = await getDbOrThrow();
  const update: Record<string, unknown> = { content, updated_at: new Date() };
  if (tags !== undefined) {
    update.tags = tags;
  }

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { user_id: userId, memory_key: key, is_active: true },
    { $set: update },
    { returnDocument: 'after' },
  );

  const doc = result;
  if (!doc) return null;

  return {
    user_id: doc.user_id as string,
    memory_key: doc.memory_key as string,
    content: doc.content as string,
    tags: (doc.tags as string[]) ?? [],
    metadata: (doc.metadata as Record<string, unknown>) ?? {},
    is_active: doc.is_active as boolean,
    created_at: doc.created_at as Date,
    updated_at: doc.updated_at as Date,
  };
}

export async function deleteMemory(userId: string, key: string): Promise<boolean> {
  const db = await getDbOrThrow();
  const result = await db.collection(COLLECTION).updateOne(
    { user_id: userId, memory_key: key, is_active: true },
    { $set: { is_active: false, updated_at: new Date() } },
  );
  return result.modifiedCount > 0;
}

export async function searchMemories(
  userId: string,
  query: string,
  limit = 20,
): Promise<UserMemoryDoc[]> {
  const db = await getDbOrThrow();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const startTime = Date.now();
  const docs = await db.collection(COLLECTION)
    .find({
      user_id: userId,
      is_active: true,
      $or: [
        { content: { $regex: escaped, $options: 'i' } },
        { memory_key: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } },
      ],
    })
    .sort({ updated_at: -1 })
    .limit(limit)
    .toArray();

  const elapsed = Date.now() - startTime;
  if (elapsed > 200) {
    logger.warn({ userId, query, elapsed, resultCount: docs.length }, 'Slow memory search detected');
  }

  return docs.map((doc) => ({
    user_id: doc.user_id as string,
    memory_key: doc.memory_key as string,
    content: doc.content as string,
    tags: (doc.tags as string[]) ?? [],
    metadata: (doc.metadata as Record<string, unknown>) ?? {},
    is_active: doc.is_active as boolean,
    created_at: doc.created_at as Date,
    updated_at: doc.updated_at as Date,
  }));
}

export async function getMemoriesForBotContext(
  userId: string,
  limit = 5,
): Promise<Array<{ key: string; snippet: string }>> {
  try {
    const db = await getDbOrThrow();
    const docs = await db.collection(COLLECTION)
      .find({ user_id: userId, is_active: true })
      .sort({ updated_at: -1 })
      .limit(limit)
      .project({ memory_key: 1, content: 1 })
      .toArray();

    return docs.map((doc) => ({
      key: doc.memory_key as string,
      snippet: (doc.content as string).slice(0, 200),
    }));
  } catch (err) {
    logger.warn({ err, userId }, 'Failed to fetch user memories for bot context');
    return [];
  }
}
