import type { Db } from 'mongodb';
import { connectMongo, getMongoDb } from '@ujuz/db';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

/**
 * Same pattern as existing services: lazily connect if needed.
 */
export async function getDbOrThrow(): Promise<Db> {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }

  const db = getMongoDb();
  if (db) return db;

  await connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
  const db2 = getMongoDb();
  if (!db2) {
    throw new AppError('MongoDB not connected', 500, 'db_not_connected');
  }
  return db2;
}
