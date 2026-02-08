import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@ujuz/config', () => ({
  env: {
    RATE_LIMIT_WINDOW_MS: 60_000,
    RATE_LIMIT_MAX: 100,
  },
}));

import { createRateLimiter } from '../rateLimit.js';

let ipCounter = 0;
function uniqueIp(): string {
  return `10.0.0.${++ipCounter}`;
}

function mockReq(ip: string, method = 'GET', path = '/test'): Partial<Request> {
  return {
    ip,
    method,
    path,
    baseUrl: '',
    header: vi.fn(),
  };
}

function mockRes(): Partial<Response> & {
  _status: number | null;
  _json: unknown;
  _headers: Record<string, string>;
} {
  const res: any = {
    _status: null,
    _json: null,
    _headers: {} as Record<string, string>,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._json = body;
      return res;
    },
    setHeader(name: string, value: string) {
      res._headers[name] = value;
      return res;
    },
  };
  return res;
}

describe('createRateLimiter', () => {
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first request through', () => {
    const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });
    const ip = uniqueIp();
    const req = mockReq(ip);
    const res = mockRes();

    limiter(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res._status).toBeNull();
  });

  it('returns 429 when max exceeded', () => {
    const max = 3;
    const limiter = createRateLimiter({ max, windowMs: 60_000 });
    const ip = uniqueIp();

    // Send max requests (should all pass)
    for (let i = 0; i < max; i++) {
      const req = mockReq(ip);
      const res = mockRes();
      limiter(req as Request, res as unknown as Response, next);
    }

    vi.clearAllMocks();

    // Next request should be rate limited
    const req = mockReq(ip);
    const res = mockRes();
    limiter(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(429);
    expect(res._json).toEqual({ ok: false, error: 'rate_limited' });
    expect(res._headers['Retry-After']).toBeDefined();
  });

  it('resets count after window expires', () => {
    const windowMs = 10_000;
    const max = 2;
    const limiter = createRateLimiter({ max, windowMs });
    const ip = uniqueIp();

    // Exhaust the limit
    for (let i = 0; i < max; i++) {
      limiter(mockReq(ip) as Request, mockRes() as unknown as Response, next);
    }

    // Advance past window
    vi.advanceTimersByTime(windowMs + 1);
    vi.clearAllMocks();

    // Should be allowed again
    const req = mockReq(ip);
    const res = mockRes();
    limiter(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res._status).toBeNull();
  });

  it('applies custom windowMs and max', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 5_000 });
    const ip = uniqueIp();

    // First request passes
    limiter(mockReq(ip) as Request, mockRes() as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    // Second request blocked
    const res = mockRes();
    limiter(mockReq(ip) as Request, res as unknown as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(429);
  });

  it('applies custom keyGenerator', () => {
    const limiter = createRateLimiter({
      max: 1,
      windowMs: 60_000,
      keyGenerator: (req) => `custom:${req.path}`,
    });

    // Two different IPs but same path → same key → blocked
    const ip1 = uniqueIp();
    const ip2 = uniqueIp();

    limiter(mockReq(ip1, 'GET', '/shared') as Request, mockRes() as unknown as Response, next);
    vi.clearAllMocks();

    const res = mockRes();
    limiter(mockReq(ip2, 'GET', '/shared') as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(429);
  });

  it('counts independently per IP', () => {
    const max = 2;
    const limiter = createRateLimiter({ max, windowMs: 60_000 });
    const ipA = uniqueIp();
    const ipB = uniqueIp();

    // Exhaust limit for ipA
    for (let i = 0; i < max; i++) {
      limiter(mockReq(ipA) as Request, mockRes() as unknown as Response, next);
    }

    vi.clearAllMocks();

    // ipB should still be allowed
    const res = mockRes();
    limiter(mockReq(ipB) as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res._status).toBeNull();
  });

  it('sets Retry-After header on 429 response', () => {
    const windowMs = 30_000;
    const limiter = createRateLimiter({ max: 1, windowMs });
    const ip = uniqueIp();

    limiter(mockReq(ip) as Request, mockRes() as unknown as Response, next);

    vi.clearAllMocks();

    const res = mockRes();
    limiter(mockReq(ip) as Request, res as unknown as Response, next);

    expect(res._status).toBe(429);
    const retryAfter = parseInt(res._headers['Retry-After'], 10);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(windowMs / 1000);
  });

  it('429 response format matches { ok: false, error: "rate_limited" }', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    const ip = uniqueIp();

    limiter(mockReq(ip) as Request, mockRes() as unknown as Response, next);
    vi.clearAllMocks();

    const res = mockRes();
    limiter(mockReq(ip) as Request, res as unknown as Response, next);

    expect(res._json).toEqual({ ok: false, error: 'rate_limited' });
  });
});
