import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { helmetMiddleware } from '../helmet.js';

describe('Helmet Middleware', () => {
  function mockReq(): Partial<Request> {
    return {
      method: 'GET',
      url: '/test',
      headers: {},
    };
  }

  function mockRes(): Partial<Response> & {
    _headers: Record<string, string | string[]>;
    _removedHeaders: string[];
  } {
    const res: any = {
      _headers: {} as Record<string, string | string[]>,
      _removedHeaders: [] as string[],
      setHeader: vi.fn((name: string, value: string | string[]) => {
        res._headers[name.toLowerCase()] = value;
        return res;
      }),
      removeHeader: vi.fn((name: string) => {
        res._removedHeaders.push(name.toLowerCase());
        delete res._headers[name.toLowerCase()];
        return res;
      }),
      getHeader: vi.fn((name: string) => {
        return res._headers[name.toLowerCase()];
      }),
      on: vi.fn(),
    };
    return res;
  }

  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next() to continue middleware chain', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets Strict-Transport-Security header with correct max-age and includeSubDomains', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const hstsHeader = res._headers['strict-transport-security'];
    expect(hstsHeader).toBeDefined();
    expect(hstsHeader).toContain('max-age=31536000');
    expect(hstsHeader).toContain('includeSubDomains');
  });

  it('does not set Content-Security-Policy (disabled for API-only server)', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const cspHeader = res._headers['content-security-policy'];
    // CSP is explicitly disabled in helmet config (contentSecurityPolicy: false)
    expect(cspHeader).toBeUndefined();
  });

  it('sets Referrer-Policy to strict-origin-when-cross-origin', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const referrerHeader = res._headers['referrer-policy'];
    expect(referrerHeader).toBeDefined();
    expect(referrerHeader).toBe('strict-origin-when-cross-origin');
  });

  it('sets X-Frame-Options to SAMEORIGIN (helmet default)', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const xFrameOptions = res._headers['x-frame-options'];
    expect(xFrameOptions).toBeDefined();
    expect(xFrameOptions).toBe('SAMEORIGIN');
  });

  it('sets X-Content-Type-Options to nosniff (helmet default)', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const xContentType = res._headers['x-content-type-options'];
    expect(xContentType).toBeDefined();
    expect(xContentType).toBe('nosniff');
  });

  it('removes X-Powered-By header (helmet default)', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    // Helmet removes X-Powered-By by default
    expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('sets multiple security headers in single middleware call', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    // Check that multiple headers are set (CSP is disabled, so we don't check for it)
    expect(Object.keys(res._headers).length).toBeGreaterThan(2);
    expect(res._headers['strict-transport-security']).toBeDefined();
    expect(res._headers['referrer-policy']).toBeDefined();
    expect(res._headers['x-frame-options']).toBeDefined();
  });

  it('HSTS max-age is exactly 31536000 seconds (1 year)', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const hstsHeader = res._headers['strict-transport-security'];
    expect(hstsHeader).toContain('max-age=31536000');
  });

  it('CSP is disabled for API-only server', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const cspHeader = res._headers['content-security-policy'];
    // CSP is explicitly disabled (contentSecurityPolicy: false) since this is an API-only server
    expect(cspHeader).toBeUndefined();
  });

  it('frameguard uses SAMEORIGIN (helmet default prevents clickjacking)', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    // X-Frame-Options: SAMEORIGIN is helmet's default anti-clickjacking protection
    expect(res._headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('setHeader is called for each security header (CSP disabled)', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    // Helmet should call setHeader multiple times (but not for CSP since it's disabled)
    expect(res.setHeader).toHaveBeenCalledWith(
      expect.stringMatching(/strict-transport-security/i),
      expect.any(String)
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      expect.stringMatching(/referrer-policy/i),
      expect.any(String)
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      expect.stringMatching(/x-frame-options/i),
      expect.any(String)
    );
  });
});
