import { describe, it, expect } from 'vitest';
import { extractRegion, extractRegionFromAddress } from '../extractRegion.js';

describe('extractRegion', () => {
  // Keyword matching
  it('matches 위례 address', () => {
    expect(extractRegion({ address: '경기도 성남시 위례동 123' })).toBe('wirye');
  });

  it('matches 분당구 address', () => {
    expect(extractRegion({ address: '경기도 성남시 분당구 정자동' })).toBe('bundang');
  });

  it('matches 강남구 address', () => {
    expect(extractRegion({ address: '서울특별시 강남구 역삼동' })).toBe('gangnam');
  });

  it('matches 서초구 address', () => {
    expect(extractRegion({ address: '서울특별시 서초구 반포동' })).toBe('seocho');
  });

  it('matches 송파구 address', () => {
    expect(extractRegion({ address: '서울특별시 송파구 잠실동' })).toBe('songpa');
  });

  it('matches 성남시 address', () => {
    expect(extractRegion({ address: '경기도 성남시 수정구' })).toBe('seongnam');
  });

  // Priority: wirye before seongnam (위례 contains 성남 in many addresses)
  it('prioritizes wirye over seongnam for 위례 address', () => {
    expect(extractRegion({ address: '경기도 성남시 수정구 위례동' })).toBe('wirye');
  });

  // Bounding box fallback
  it('falls back to bbox when address has no match', () => {
    // Coordinates inside wirye bbox [127.125, 37.465, 127.155, 37.495]
    expect(extractRegion({ address: '알수없는 주소', lat: 37.48, lng: 127.14 })).toBe('wirye');
  });

  it('uses bbox when no address provided', () => {
    expect(extractRegion({ lat: 37.48, lng: 127.14 })).toBe('wirye');
  });

  // No match
  it('returns null for unrecognized address', () => {
    expect(extractRegion({ address: '부산광역시 해운대구' })).toBeNull();
  });

  it('returns null for out-of-range coordinates', () => {
    expect(extractRegion({ lat: 35.0, lng: 129.0 })).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(extractRegion({})).toBeNull();
  });
});

describe('extractRegionFromAddress', () => {
  it('returns region for valid address', () => {
    expect(extractRegionFromAddress('서울 강남구 삼성동')).toBe('gangnam');
  });

  it('returns null for undefined', () => {
    expect(extractRegionFromAddress(undefined)).toBeNull();
  });

  it('returns null for empty string (no keyword match)', () => {
    expect(extractRegionFromAddress('')).toBeNull();
  });
});
