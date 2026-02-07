import { Db, MongoClient } from 'mongodb';
import { logger } from '@ujuz/config';
import { env } from '@ujuz/config';
import { ensureAllIndexes } from './mongodb-indexes.js';

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<MongoClient> | null = null;

const DEFAULT_POOL_SIZE = 15;
const MIN_POOL_SIZE = 3;
const MAX_IDLE_TIME_MS = 30_000; // 30s idle before closing surplus connections

export async function connectMongo(
  uri: string,
  dbName: string,
  maxRetries = 5
): Promise<Db> {
  if (db) {
    return db;
  }

  let attempt = 0;
  // exponential backoff retry loop
  while (true) {
    if (!connecting) {
      connecting = new MongoClient(uri, {
        maxPoolSize: DEFAULT_POOL_SIZE,
        minPoolSize: MIN_POOL_SIZE,
        maxIdleTimeMS: MAX_IDLE_TIME_MS,
      }).connect();
    }

    try {
      client = await connecting;
      db = client.db(dbName);
      return db;
    } catch (error) {
      attempt += 1;
      logger.warn({ error, attempt }, 'Mongo connection attempt failed');
      // reset connecting so the next loop will create a new connection
      connecting = null;
      if (attempt > maxRetries) {
        logger.error({ error }, 'Exceeded max Mongo connection retries');
        throw error;
      }
      const delay = 1000 * Math.pow(2, attempt - 1);
      // jitter (random up to 250ms)
      const jitter = Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, delay + jitter));
    }
  }
}

export function getMongoDb(): Db | null {
  return db;
}

export async function pingMongo(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  if (!db) {
    return { ok: false, error: 'not_connected' };
  }

  try {
    const start = Date.now();
    await db.admin().ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    logger.error({ error }, 'Mongo ping failed');
    return { ok: false, error: 'ping_failed' };
  }
}

export async function ensureIndexes(): Promise<void> {
  if (!db) {
    return;
  }

  // collection name overrides (env-based custom names)
  const overrides: Record<string, string> = {
    places: env.MONGODB_PLACES_COLLECTION,
    refinedInsights: env.MONGODB_INSIGHTS_COLLECTION,
    admission_blocks: env.MONGODB_ADMISSION_BLOCKS_COLLECTION,
  };

  await ensureAllIndexes(db, overrides);
}

export async function closeMongo(): Promise<void> {
  if (!client) {
    return;
  }

  await client.close();
  client = null;
  db = null;
}
