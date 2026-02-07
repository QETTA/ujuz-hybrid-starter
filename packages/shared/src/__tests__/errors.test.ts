import { describe, it, expect } from 'vitest';
import { AppError } from '../errors.js';

describe('AppError', () => {
  it('extends Error', () => {
    const err = new AppError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('defaults to status 500', () => {
    const err = new AppError('fail');
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('fail');
    expect(err.code).toBeUndefined();
  });

  it('accepts custom statusCode and code', () => {
    const err = new AppError('not found', 404, 'not_found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('not_found');
  });
});
