import { describe, it, expect } from 'vitest';
import { sha256Hex, randomCode } from '../partnerCrypto.js';

describe('sha256Hex', () => {
  it('returns 64-char hex string', () => {
    const hash = sha256Hex('hello');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    expect(sha256Hex('test')).toBe(sha256Hex('test'));
  });

  it('different inputs produce different hashes', () => {
    expect(sha256Hex('a')).not.toBe(sha256Hex('b'));
  });
});

describe('randomCode', () => {
  it('starts with given prefix', () => {
    const code = randomCode('ref');
    expect(code).toMatch(/^ref_/);
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 20 }, () => randomCode('test')));
    expect(codes.size).toBe(20);
  });
});
