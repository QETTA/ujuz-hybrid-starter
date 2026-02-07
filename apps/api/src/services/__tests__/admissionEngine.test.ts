import { describe, it, expect } from 'vitest';
import {
  clamp,
  sigmoid,
  probabilityToGrade,
  effectiveHorizon,
  formatBotResponse,
  type AdmissionScoreResult,
  type AdmissionGrade,
} from '../admissionEngineV1.js';

describe('admissionEngineV1 - pure helpers', () => {
  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(50, 1, 99)).toBe(50);
    });

    it('clamps to min', () => {
      expect(clamp(-5, 1, 99)).toBe(1);
      expect(clamp(0, 1, 99)).toBe(1);
    });

    it('clamps to max', () => {
      expect(clamp(100, 1, 99)).toBe(99);
      expect(clamp(999, 1, 99)).toBe(99);
    });

    it('handles min === max', () => {
      expect(clamp(50, 10, 10)).toBe(10);
    });
  });

  describe('sigmoid', () => {
    it('returns 0.5 at x=0', () => {
      expect(sigmoid(0)).toBe(0.5);
    });

    it('approaches 1 for large positive x', () => {
      expect(sigmoid(10)).toBeGreaterThan(0.999);
    });

    it('approaches 0 for large negative x', () => {
      expect(sigmoid(-10)).toBeLessThan(0.001);
    });

    it('is monotonically increasing', () => {
      expect(sigmoid(1)).toBeGreaterThan(sigmoid(0));
      expect(sigmoid(2)).toBeGreaterThan(sigmoid(1));
      expect(sigmoid(0)).toBeGreaterThan(sigmoid(-1));
    });
  });

  describe('probabilityToGrade', () => {
    const cases: [number, AdmissionGrade][] = [
      [1.0, 'A'],
      [0.8, 'A'],
      [0.79, 'B'],
      [0.6, 'B'],
      [0.59, 'C'],
      [0.4, 'C'],
      [0.39, 'D'],
      [0.2, 'D'],
      [0.19, 'F'],
      [0.0, 'F'],
    ];

    it.each(cases)('probability %f → grade %s', (p, expected) => {
      expect(probabilityToGrade(p)).toBe(expected);
    });
  });

  describe('effectiveHorizon', () => {
    it('returns 0 for H=0', () => {
      expect(effectiveHorizon(0, 1)).toBe(0);
    });

    it('returns 0 for negative H', () => {
      expect(effectiveHorizon(-1, 1)).toBe(0);
    });

    it('applies seasonal multipliers for 6 months starting January', () => {
      // Jan=1.1, Feb=1.3, Mar=1.5, Apr=1.05, May=1.0, Jun=0.95
      const result = effectiveHorizon(6, 1);
      const expected = 1.1 + 1.3 + 1.5 + 1.05 + 1.0 + 0.95;
      expect(result).toBeCloseTo(expected, 10);
    });

    it('wraps around December to January', () => {
      // Nov=1.05, Dec=1.15, Jan=1.1, Feb=1.3, Mar=1.5, Apr=1.05
      const result = effectiveHorizon(6, 11);
      const expected = 1.05 + 1.15 + 1.1 + 1.3 + 1.5 + 1.05;
      expect(result).toBeCloseTo(expected, 10);
    });

    it('single month returns that month multiplier', () => {
      // March (month 3) = 1.5
      expect(effectiveHorizon(1, 3)).toBeCloseTo(1.5, 10);
    });

    it('is always >= H * min_multiplier', () => {
      const minMultiplier = 0.9; // July
      for (let m = 1; m <= 12; m++) {
        expect(effectiveHorizon(6, m)).toBeGreaterThanOrEqual(6 * minMultiplier);
      }
    });
  });

  describe('formatBotResponse', () => {
    const makeResult = (overrides?: Partial<AdmissionScoreResult>): AdmissionScoreResult => ({
      facility_id: 'test-001',
      facility_name: '테스트 어린이집',
      probability: 0.65,
      admission_score: 65,
      grade: 'B',
      confidence: 0.8,
      estimated_months_median: 4,
      estimated_months_80th: 7,
      evidence: [
        {
          type: 'to_snapshot',
          summary: '관측 36.0 seat-months, TO 3건',
          source_count: 6,
          confidence: 0.85,
          data_points: { N: 3, E_seat_months: 36 },
        },
      ],
      region_key: 'gangnam',
      engine_version: 'v1.7.0',
      calculated_at: '2026-02-08T00:00:00.000Z',
      ...overrides,
    });

    it('includes probability percentage', () => {
      const output = formatBotResponse(makeResult());
      expect(output).toContain('65%');
    });

    it('includes grade and score', () => {
      const output = formatBotResponse(makeResult());
      expect(output).toContain('등급 B');
      expect(output).toContain('점수 65');
    });

    it('includes evidence summary', () => {
      const output = formatBotResponse(makeResult());
      expect(output).toContain('관측 36.0 seat-months, TO 3건');
    });

    it('includes estimated wait period', () => {
      const output = formatBotResponse(makeResult());
      expect(output).toContain('3-5개월');
      expect(output).toContain('중앙값 4개월');
    });

    it('handles A grade with high probability', () => {
      const output = formatBotResponse(makeResult({ probability: 0.92, grade: 'A', admission_score: 92 }));
      expect(output).toContain('92%');
      expect(output).toContain('등급 A');
    });

    it('handles F grade with low probability', () => {
      const output = formatBotResponse(makeResult({ probability: 0.05, grade: 'F', admission_score: 5 }));
      expect(output).toContain('5%');
      expect(output).toContain('등급 F');
    });
  });
});
