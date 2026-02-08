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

  it('sets Content-Security-Policy with default-src none and frame-ancestors none', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const cspHeader = res._headers['content-security-policy'];
    expect(cspHeader).toBeDefined();

    if (typeof cspHeader === 'string') {
      expect(cspHeader).toContain("default-src 'none'");
      expect(cspHeader).toContain("frame-ancestors 'none'");
    } else if (Array.isArray(cspHeader)) {
      const joined = cspHeader.join(';');
      expect(joined).toContain("default-src 'none'");
      expect(joined).toContain("frame-ancestors 'none'");
    }
  });

  it('sets Referrer-Policy to strict-origin-when-cross-origin', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const referrerHeader = res._headers['referrer-policy'];
    expect(referrerHeader).toBeDefined();
    expect(referrerHeader).toBe('strict-origin-when-cross-origin');
  });

  it('sets X-Frame-Options to DENY', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const xFrameOptions = res._headers['x-frame-options'];
    expect(xFrameOptions).toBeDefined();
    expect(xFrameOptions).toBe('DENY');
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

    // Check that multiple headers are set
    expect(Object.keys(res._headers).length).toBeGreaterThan(3);
    expect(res._headers['strict-transport-security']).toBeDefined();
    expect(res._headers['content-security-policy']).toBeDefined();
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

  it('CSP prevents all default sources', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const cspHeader = res._headers['content-security-policy'];

    if (typeof cspHeader === 'string') {
      // Should have default-src 'none' which blocks everything by default
      expect(cspHeader).toContain("default-src 'none'");
    }
  });

  it('CSP prevents framing from any origin', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    const cspHeader = res._headers['content-security-policy'];

    if (typeof cspHeader === 'string') {
      // frame-ancestors 'none' prevents the page from being framed
      expect(cspHeader).toContain("frame-ancestors 'none'");
    }
  });

  it('frameguard action is deny (prevents clickjacking)', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    // X-Frame-Options: DENY is the strongest anti-clickjacking protection
    expect(res._headers['x-frame-options']).toBe('DENY');
  });

  it('setHeader is called for each security header', () => {
    const req = mockReq();
    const res = mockRes();

    helmetMiddleware(req as Request, res as Response, next);

    // Helmet should call setHeader multiple times
    expect(res.setHeader).toHaveBeenCalledWith(
      expect.stringMatching(/strict-transport-security/i),
      expect.any(String)
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      expect.stringMatching(/content-security-policy/i),
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
