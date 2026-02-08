import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Create a hoisted mock environment that can be modified per test
const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'development',
  CORS_ORIGIN: undefined as string | undefined,
}));

const mockLogger = vi.hoisted(() => ({
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

// Mock the config module with the hoisted env
vi.mock('@ujuz/config', () => ({
  env: mockEnv,
  logger: mockLogger,
}));

describe('CORS Middleware', () => {
  let corsMiddleware: any;

  function mockReq(origin?: string, method = 'GET'): Partial<Request> {
    const headers: any = {};
    if (origin) headers.origin = origin;

    return {
      method,
      headers,
      header: ((name: string) => {
        return headers[name.toLowerCase()];
      }) as any,
      get: ((name: string) => {
        return headers[name.toLowerCase()];
      }) as any,
    };
  }

  function mockRes(): Partial<Response> & {
    _headers: Record<string, string>;
    _statusCode: number;
    _vary: string[];
  } {
    const res: any = {
      _headers: {} as Record<string, string>,
      _statusCode: 200,
      _vary: [] as string[],
      statusCode: 200,
      setHeader(name: string, value: string) {
        res._headers[name.toLowerCase()] = value;
        return res;
      },
      getHeader(name: string) {
        return res._headers[name.toLowerCase()];
      },
      removeHeader(name: string) {
        delete res._headers[name.toLowerCase()];
        return res;
      },
      vary(field: string) {
        res._vary.push(field);
        return res;
      },
      end() {
        return res;
      },
    };
    return res;
  }

  async function runCorsMiddleware(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      corsMiddleware(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async function reloadCorsMiddleware() {
    vi.resetModules();
    const module = await import('../cors.js');
    corsMiddleware = module.corsMiddleware;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger.warn.mockClear();
  });

  describe('Development mode with no CORS_ORIGIN', () => {
    beforeEach(async () => {
      mockEnv.NODE_ENV = 'development';
      mockEnv.CORS_ORIGIN = undefined;
      await reloadCorsMiddleware();
    });

    it('blocks cross-origin requests when CORS_ORIGIN is not set', async () => {
      const req = mockReq('https://example.com');
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      // When allowedOrigins is empty, origin: false blocks all cross-origin requests
      expect(res._headers['access-control-allow-origin']).toBeUndefined();
    });

    it('allows requests without origin header', async () => {
      const req = mockReq();
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);
      // When there's no origin header, CORS allows it (same-origin)
      // No exception means test passes
    });
  });

  describe('Production mode with no CORS_ORIGIN', () => {
    beforeEach(async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.CORS_ORIGIN = undefined;
      await reloadCorsMiddleware();
    });

    it('rejects cross-origin requests', async () => {
      const req = mockReq('https://malicious-site.com');
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      // CORS should NOT set Access-Control-Allow-Origin header when origin is false
      expect(res._headers['access-control-allow-origin']).toBeUndefined();
    });

    it('does not set credentials header for blocked origins', async () => {
      const req = mockReq('https://some-origin.com');
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      // When origin is blocked (origin: false), no CORS headers are set
      expect(res._headers['access-control-allow-origin']).toBeUndefined();
      expect(res._headers['access-control-allow-credentials']).toBeUndefined();
    });
  });

  describe('With specific CORS_ORIGIN allowlist', () => {
    beforeEach(async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.CORS_ORIGIN = 'https://ujuz.kr, https://api.ujuz.kr , https://admin.ujuz.kr';
      await reloadCorsMiddleware();
    });

    it('allows whitelisted origin https://ujuz.kr', async () => {
      const req = mockReq('https://ujuz.kr');
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      expect(res._headers['access-control-allow-origin']).toBe('https://ujuz.kr');
      expect(res._headers['access-control-allow-credentials']).toBe('true');
    });

    it('allows whitelisted origin https://api.ujuz.kr (with trimming)', async () => {
      const req = mockReq('https://api.ujuz.kr');
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      expect(res._headers['access-control-allow-origin']).toBe('https://api.ujuz.kr');
      expect(res._headers['access-control-allow-credentials']).toBe('true');
    });

    it('rejects non-whitelisted origin', async () => {
      const req = mockReq('https://evil.com');
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      // Should not set the origin header for non-whitelisted origins
      expect(res._headers['access-control-allow-origin']).toBeUndefined();
    });

    it('handles case-sensitive origin matching', async () => {
      const req = mockReq('https://UJUZ.KR'); // uppercase
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      // Origins are case-sensitive, should not match
      expect(res._headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Credentials header', () => {
    beforeEach(async () => {
      mockEnv.NODE_ENV = 'development';
      mockEnv.CORS_ORIGIN = 'https://ujuz.kr';
      await reloadCorsMiddleware();
    });

    it('sets Access-Control-Allow-Credentials for allowed origins', async () => {
      const req = mockReq('https://ujuz.kr');
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      expect(res._headers['access-control-allow-credentials']).toBe('true');
      expect(res._headers['access-control-allow-origin']).toBe('https://ujuz.kr');
    });
  });

  describe('Empty CORS_ORIGIN string handling', () => {
    beforeEach(async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.CORS_ORIGIN = '   ,  ,   '; // only whitespace and commas
      await reloadCorsMiddleware();
    });

    it('treats empty/whitespace-only CORS_ORIGIN as no allowlist in production', async () => {
      const req = mockReq('https://example.com');
      const res = mockRes();

      await runCorsMiddleware(req as Request, res as Response);

      // After trimming and filtering, allowedOrigins is empty -> production mode blocks
      expect(res._headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
