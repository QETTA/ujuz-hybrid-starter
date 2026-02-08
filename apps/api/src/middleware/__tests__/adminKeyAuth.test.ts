import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const mockEnv: Record<string, unknown> = { ADMIN_API_KEY: 'test-admin-key-123' };
vi.mock('@ujuz/config', () => ({ env: mockEnv }));

import { requireAdminKey } from '../adminKeyAuth.js';
import { AppError } from '@ujuz/shared';

function mockReq(headers: Record<string, string> = {}): Partial<Request> {
  return {
    header: vi.fn((name: string) => {
      const key = Object.keys(headers).find(
        (k) => k.toLowerCase() === name.toLowerCase(),
      );
      return key ? headers[key] : undefined;
    }) as any,
  };
}

function mockRes(): Partial<Response> {
  return {};
}

describe('requireAdminKey', () => {
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.ADMIN_API_KEY = 'test-admin-key-123';
  });

  it('throws 503 when ADMIN_API_KEY is not configured', () => {
    mockEnv.ADMIN_API_KEY = undefined;
    const req = mockReq();

    try {
      requireAdminKey(req as Request, mockRes() as Response, next);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).statusCode).toBe(503);
      expect((e as AppError).code).toBe('admin_key_not_configured');
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() with correct key', () => {
    const req = mockReq({ 'x-admin-key': 'test-admin-key-123' });

    requireAdminKey(req as Request, mockRes() as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws 401 with wrong key', () => {
    const req = mockReq({ 'x-admin-key': 'wrong-key' });

    try {
      requireAdminKey(req as Request, mockRes() as Response, next);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).statusCode).toBe(401);
      expect((e as AppError).code).toBe('unauthorized');
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('throws 401 with empty string key', () => {
    const req = mockReq({ 'x-admin-key': '' });

    try {
      requireAdminKey(req as Request, mockRes() as Response, next);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).statusCode).toBe(401);
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('throws 401 when x-admin-key header is missing', () => {
    const req = mockReq();

    try {
      requireAdminKey(req as Request, mockRes() as Response, next);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).statusCode).toBe(401);
      expect((e as AppError).code).toBe('unauthorized');
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('does not leak ADMIN_API_KEY in error messages', () => {
    const req = mockReq({ 'x-admin-key': 'wrong-key' });

    try {
      requireAdminKey(req as Request, mockRes() as Response, next);
      throw new Error('should have thrown');
    } catch (e) {
      const err = e as AppError;
      expect(err.message).not.toContain('test-admin-key-123');
      expect(err.code).not.toContain('test-admin-key-123');
    }
  });

  it('handles very long key without error', () => {
    const longKey = 'k'.repeat(10_000);
    mockEnv.ADMIN_API_KEY = longKey;
    const req = mockReq({ 'x-admin-key': longKey });

    requireAdminKey(req as Request, mockRes() as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
