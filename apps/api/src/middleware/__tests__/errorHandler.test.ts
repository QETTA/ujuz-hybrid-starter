import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { AppError } from '@ujuz/shared';

// Mock Sentry + logger before importing errorHandler
vi.mock('../../sentry.js', () => ({
  Sentry: { captureException: vi.fn() },
  sentryEnabled: true,
}));
vi.mock('@ujuz/config', () => ({
  logger: { error: vi.fn() },
}));

import { errorHandler } from '../errorHandler.js';
import { Sentry } from '../../sentry.js';

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  const req = {} as Request;
  const next = vi.fn() as NextFunction;
  let res: Partial<Response>;

  beforeEach(() => {
    res = mockRes();
    vi.clearAllMocks();
  });

  // --- ZodError ---
  it('returns 400 with validation_error for ZodError', () => {
    const schema = z.object({ name: z.string() });
    let zodErr: ZodError;
    try { schema.parse({ name: 123 }); } catch (e) { zodErr = e as ZodError; }

    errorHandler(zodErr!, req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'validation_error',
          message: 'Invalid request',
        }),
      })
    );
  });

  it('includes flatten details for ZodError', () => {
    const schema = z.object({ age: z.number() });
    let zodErr: ZodError;
    try { schema.parse({ age: 'old' }); } catch (e) { zodErr = e as ZodError; }

    errorHandler(zodErr!, req, res as Response, next);

    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error.details).toBeDefined();
    expect(body.error.details.fieldErrors).toHaveProperty('age');
  });

  it('does not report ZodError to Sentry', () => {
    const schema = z.string();
    let zodErr: ZodError;
    try { schema.parse(42); } catch (e) { zodErr = e as ZodError; }

    errorHandler(zodErr!, req, res as Response, next);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  // --- AppError ---
  it('returns correct status for AppError 404', () => {
    const err = new AppError('Not found', 404, 'not_found');

    errorHandler(err, req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'not_found', message: 'Not found' },
    });
  });

  it('does not report 4xx AppError to Sentry', () => {
    const err = new AppError('Bad request', 400, 'bad_input');

    errorHandler(err, req, res as Response, next);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('reports 5xx AppError to Sentry', () => {
    const err = new AppError('DB timeout', 503, 'db_timeout');

    errorHandler(err, req, res as Response, next);

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('defaults code to app_error when AppError has no code', () => {
    const err = new AppError('Something wrong', 422);

    errorHandler(err, req, res as Response, next);

    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error.code).toBe('app_error');
  });

  // --- Unhandled Error ---
  it('returns 500 with internal_error for generic Error', () => {
    const err = new Error('kaboom');

    errorHandler(err, req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'internal_error', message: 'Internal server error' },
    });
  });

  it('reports generic Error to Sentry', () => {
    const err = new Error('unexpected');

    errorHandler(err, req, res as Response, next);

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it('does not leak error message for generic Error', () => {
    const err = new Error('secret DB password exposed');

    errorHandler(err, req, res as Response, next);

    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error.message).toBe('Internal server error');
    expect(body.error.message).not.toContain('secret');
  });
});
