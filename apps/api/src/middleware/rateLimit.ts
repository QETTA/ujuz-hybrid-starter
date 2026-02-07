// NOTE: In-memory store — works for single-instance only.
// For horizontal scaling, replace with Redis-backed store (e.g. ioredis + sliding window).
import type { NextFunction, Request, Response } from 'express';
import { env } from '@ujuz/config';

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();
const CLEANUP_THRESHOLD = 1000;

const defaultKeyGenerator = (req: Request): string => {
  const route = req.baseUrl || req.path;
  return `${req.ip}:${req.method}:${route}`;
};

export function createRateLimiter(
  options: Partial<RateLimitOptions> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const max = options.max ?? env.RATE_LIMIT_MAX;
  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      store.set(key, entry);
    }

    const current = store.get(key);
    if (current && current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({ ok: false, error: 'rate_limited' });
      return;
    }

    if (store.size > CLEANUP_THRESHOLD) {
      for (const [storeKey, value] of store.entries()) {
        if (value.resetAt <= now) {
          store.delete(storeKey);
        }
      }
    }

    next();
  };
}
