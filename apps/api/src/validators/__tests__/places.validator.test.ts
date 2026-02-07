import { describe, it, expect } from 'vitest';
import { nearbyQuerySchema, searchQuerySchema, placeIdParamSchema } from '../places.validator.js';

describe('nearbyQuerySchema', () => {
  it('parses valid nearby query', () => {
    const result = nearbyQuerySchema.parse({ lat: '37.5', lng: '127.0' });
    expect(result.lat).toBe(37.5);
    expect(result.lng).toBe(127.0);
    expect(result.radius).toBe(5000); // default
    expect(result.limit).toBe(20); // default
    expect(result.offset).toBe(0); // default
  });

  it('rejects latitude out of range', () => {
    expect(() => nearbyQuerySchema.parse({ lat: '91', lng: '127' })).toThrow();
    expect(() => nearbyQuerySchema.parse({ lat: '-91', lng: '127' })).toThrow();
  });

  it('rejects longitude out of range', () => {
    expect(() => nearbyQuerySchema.parse({ lat: '37', lng: '181' })).toThrow();
  });

  it('rejects missing lat/lng', () => {
    expect(() => nearbyQuerySchema.parse({})).toThrow();
  });

  it('accepts custom radius within bounds', () => {
    const result = nearbyQuerySchema.parse({ lat: '37', lng: '127', radius: '10000' });
    expect(result.radius).toBe(10000);
  });

  it('rejects radius below minimum', () => {
    expect(() => nearbyQuerySchema.parse({ lat: '37', lng: '127', radius: '50' })).toThrow();
  });

  it('rejects radius above maximum', () => {
    expect(() => nearbyQuerySchema.parse({ lat: '37', lng: '127', radius: '100000' })).toThrow();
  });

  it('parses comma-separated categories', () => {
    const result = nearbyQuerySchema.parse({ lat: '37', lng: '127', categories: '어린이집,유치원' });
    expect(result.categories).toEqual(['어린이집', '유치원']);
  });

  it('rejects empty string for radius (coerced to NaN)', () => {
    // parseNumber converts '' to undefined, then z.coerce.number() on undefined → NaN → validation fails
    expect(() => nearbyQuerySchema.parse({ lat: '37', lng: '127', radius: '' })).toThrow();
  });

  it('rejects limit above 50', () => {
    expect(() => nearbyQuerySchema.parse({ lat: '37', lng: '127', limit: '100' })).toThrow();
  });
});

describe('searchQuerySchema', () => {
  it('parses valid search query', () => {
    const result = searchQuerySchema.parse({ q: '해맑은어린이집' });
    expect(result.q).toBe('해맑은어린이집');
    expect(result.limit).toBe(10); // default
  });

  it('rejects empty query', () => {
    expect(() => searchQuerySchema.parse({ q: '' })).toThrow();
  });

  it('rejects query over 50 chars', () => {
    expect(() => searchQuerySchema.parse({ q: 'a'.repeat(51) })).toThrow();
  });

  it('accepts custom limit', () => {
    const result = searchQuerySchema.parse({ q: 'test', limit: '5' });
    expect(result.limit).toBe(5);
  });
});

describe('placeIdParamSchema', () => {
  it('parses valid place id', () => {
    const result = placeIdParamSchema.parse({ id: 'abc123' });
    expect(result.id).toBe('abc123');
  });

  it('rejects empty id', () => {
    expect(() => placeIdParamSchema.parse({ id: '' })).toThrow();
  });

  it('rejects id over 128 chars', () => {
    expect(() => placeIdParamSchema.parse({ id: 'x'.repeat(129) })).toThrow();
  });
});
