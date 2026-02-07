import { describe, it, expect } from 'vitest';
import { monthRange, ReferralEventTypeSchema } from '../referralService.js';

describe('referralService - monthRange', () => {
  it('parses valid YYYY-MM period', () => {
    const { start, endExclusive } = monthRange('2026-03');
    expect(start.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(endExclusive.toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });

  it('handles January (year boundary for endExclusive)', () => {
    const { start, endExclusive } = monthRange('2025-12');
    expect(start.toISOString()).toBe('2025-12-01T00:00:00.000Z');
    expect(endExclusive.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('handles February', () => {
    const { start, endExclusive } = monthRange('2026-02');
    expect(start.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(endExclusive.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('throws on invalid format (no dash)', () => {
    expect(() => monthRange('202603')).toThrow('Invalid period format');
  });

  it('throws on invalid format (extra chars)', () => {
    expect(() => monthRange('2026-03-01')).toThrow('Invalid period format');
  });

  it('throws on empty string', () => {
    expect(() => monthRange('')).toThrow('Invalid period format');
  });

  it('throws on non-date string', () => {
    expect(() => monthRange('hello')).toThrow('Invalid period format');
  });

  it('start is always before endExclusive', () => {
    for (let m = 1; m <= 12; m++) {
      const period = `2026-${String(m).padStart(2, '0')}`;
      const { start, endExclusive } = monthRange(period);
      expect(start.getTime()).toBeLessThan(endExclusive.getTime());
    }
  });

  it('endExclusive is exactly 1 month after start', () => {
    const { start, endExclusive } = monthRange('2026-06');
    expect(endExclusive.getUTCMonth() - start.getUTCMonth()).toBe(1);
    expect(endExclusive.getUTCDate()).toBe(1);
    expect(start.getUTCDate()).toBe(1);
  });
});

describe('ReferralEventTypeSchema', () => {
  it('accepts valid event types', () => {
    expect(ReferralEventTypeSchema.parse('INSTALL')).toBe('INSTALL');
    expect(ReferralEventTypeSchema.parse('SIGNUP')).toBe('SIGNUP');
    expect(ReferralEventTypeSchema.parse('SUBSCRIBE')).toBe('SUBSCRIBE');
    expect(ReferralEventTypeSchema.parse('DEAL_PURCHASE')).toBe('DEAL_PURCHASE');
  });

  it('rejects invalid event types', () => {
    expect(() => ReferralEventTypeSchema.parse('UNKNOWN')).toThrow();
    expect(() => ReferralEventTypeSchema.parse('')).toThrow();
    expect(() => ReferralEventTypeSchema.parse('install')).toThrow(); // case-sensitive
  });
});
