import { describe, it, expect } from 'vitest';
import { insightsQuerySchema } from '../insights.validator.js';

describe('insightsQuerySchema', () => {
  it('parses comma-separated string', () => {
    const result = insightsQuerySchema.parse({ placeIds: 'a,b,c' });
    expect(result.placeIds).toEqual(['a', 'b', 'c']);
  });

  it('parses array input', () => {
    const result = insightsQuerySchema.parse({ placeIds: ['x', 'y', 'z'] });
    expect(result.placeIds).toEqual(['x', 'y', 'z']);
  });

  it('parses mixed input (array with comma-separated strings)', () => {
    const result = insightsQuerySchema.parse({ placeIds: ['a,b', 'c'] });
    expect(result.placeIds).toEqual(['a', 'b', 'c']);
  });

  it('rejects empty string', () => {
    expect(() => insightsQuerySchema.parse({ placeIds: '' })).toThrow();
  });

  it('rejects empty array', () => {
    expect(() => insightsQuerySchema.parse({ placeIds: [] })).toThrow();
  });

  it('rejects more than 100 place IDs', () => {
    const ids = Array.from({ length: 101 }, (_, i) => `place-${i}`);
    expect(() => insightsQuerySchema.parse({ placeIds: ids })).toThrow();
  });

  it('accepts exactly 100 place IDs', () => {
    const ids = Array.from({ length: 100 }, (_, i) => `place-${i}`);
    const result = insightsQuerySchema.parse({ placeIds: ids });
    expect(result.placeIds).toHaveLength(100);
  });

  it('trims whitespace from entries', () => {
    const result = insightsQuerySchema.parse({ placeIds: ' a , b , c ' });
    expect(result.placeIds).toEqual(['a', 'b', 'c']);
  });

  it('filters out empty entries', () => {
    const result = insightsQuerySchema.parse({ placeIds: 'a,,b' });
    expect(result.placeIds).toEqual(['a', 'b']);
  });
});
