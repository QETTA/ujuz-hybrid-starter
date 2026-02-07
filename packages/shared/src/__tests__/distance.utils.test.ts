import { describe, it, expect } from 'vitest';
import { distanceMeters } from '../distance.utils.js';

describe('distanceMeters', () => {
  it('returns 0 for same point', () => {
    expect(distanceMeters(37.5665, 126.978, 37.5665, 126.978)).toBe(0);
  });

  it('calculates Seoul City Hall → Gangnam Station (~8.9km)', () => {
    // Seoul City Hall: 37.5665, 126.9780
    // Gangnam Station: 37.4979, 127.0276
    const d = distanceMeters(37.5665, 126.978, 37.4979, 127.0276);
    expect(d).toBeGreaterThan(8_000);
    expect(d).toBeLessThan(10_000);
  });

  it('calculates Seoul → Busan (~325km)', () => {
    const d = distanceMeters(37.5665, 126.978, 35.1796, 129.0756);
    expect(d).toBeGreaterThan(300_000);
    expect(d).toBeLessThan(350_000);
  });

  it('is symmetric', () => {
    const ab = distanceMeters(37.5665, 126.978, 35.1796, 129.0756);
    const ba = distanceMeters(35.1796, 129.0756, 37.5665, 126.978);
    expect(ab).toBeCloseTo(ba, 5);
  });
});
