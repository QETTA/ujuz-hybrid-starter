import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { deviceAuth } from '../deviceAuth.js';

// Mock @ujuz/config to control DEVICE_AUTH_ENABLED
vi.mock('@ujuz/config', () => ({
  env: {
    DEVICE_AUTH_ENABLED: true,
  },
}));

// Access the mocked env to toggle it per test
import { env } from '@ujuz/config';

function mockReq(headers: Record<string, string> = {}): Partial<Request> {
  return {
    header: vi.fn((name: string) => headers[name.toLowerCase()]) as unknown as Request['header'],
  };
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('deviceAuth middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    (env as Record<string, unknown>).DEVICE_AUTH_ENABLED = true;
  });

  it('passes through when DEVICE_AUTH_ENABLED is false', () => {
    (env as Record<string, unknown>).DEVICE_AUTH_ENABLED = false;
    const req = mockReq();
    const res = mockRes();

    deviceAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects missing x-device-id header', () => {
    const req = mockReq();
    const res = mockRes();

    deviceAuth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'invalid_device_id' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid UUID format', () => {
    const req = mockReq({ 'x-device-id': 'not-a-uuid' });
    const res = mockRes();

    deviceAuth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects UUID v1 (requires v4)', () => {
    // UUID v1 example
    const req = mockReq({ 'x-device-id': '6ba7b810-9dad-11d1-80b4-00c04fd430c8' });
    const res = mockRes();

    deviceAuth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid UUID v4', () => {
    const req = mockReq({ 'x-device-id': '550e8400-e29b-41d4-a716-446655440000' });
    const res = mockRes();

    deviceAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects empty string', () => {
    const req = mockReq({ 'x-device-id': '' });
    const res = mockRes();

    deviceAuth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
