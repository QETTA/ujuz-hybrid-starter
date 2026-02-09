import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * UJUz - Admission Engine V1 Edge-Case Tests
 * 2026-02-09에 발견된 5가지 버그에 대한 regression 테스트
 *
 * Bug 1: capacity_eff=0 → NB p=1.0 crash
 * Bug 2: raw_score > 100 → CALIBRATION_ARRAY undefined index
 * Bug 3: getCacheKey unused region param (TS6133)
 * Bug 4: c.features?.avg_sentiment 잘못된 경로
 * Bug 5: regionLabel('default') → 'default' 노출
 * Bug 6: β_post division-by-zero (4개 경로)
 */

import {
  calculateAdmissionScoreV1,
  clamp,
  type AdmissionScoreInput,
} from '../admissionEngineV1.js';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockInsertOne = vi.fn();
const mockSort = vi.fn();
const mockToArray = vi.fn();

const mockCollection = vi.fn(() => ({
  findOne: mockFindOne,
  find: mockFind,
  insertOne: mockInsertOne,
}));

const mockDb = { collection: mockCollection };

vi.mock('@ujuz/db', () => ({
  getMongoDb: vi.fn(() => mockDb),
  connectMongo: vi.fn(() => mockDb),
}));

vi.mock('@ujuz/config', () => ({
  env: {
    MONGODB_URI: 'mongodb://localhost:27017',
    MONGODB_DB_NAME: 'test_db',
    MONGODB_PLACES_COLLECTION: 'places',
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  regionLabel: (key: string) => {
    const labels: Record<string, string> = {
      gangnam: '강남구', seocho: '서초구', bundang: '분당구',
      wirye: '위례', seongnam: '성남시', songpa: '송파구',
    };
    return labels[key] ?? key;
  },
}));

vi.mock('@ujuz/shared', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode: number, code: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  },
  extractRegionFromAddress: (address: string) => {
    if (address.includes('강남구')) return 'gangnam';
    if (address.includes('서초구')) return 'seocho';
    if (address.includes('송파구')) return 'songpa';
    return null;
  },
}));

vi.mock('jstat', () => ({
  jStat: {
    negbin: {
      cdf: (k: number, r: number, p: number) => {
        // Simplified NB CDF for testing
        if (r <= 0 || p <= 0 || p >= 1) throw new Error(`Invalid NB params: r=${r}, p=${p}`);
        // Return a value proportional to k for testing
        return Math.min(1, k * 0.1);
      },
    },
  },
}));

// ─── Helpers ────────────────────────────────────────────────────

const defaultInput: AdmissionScoreInput = {
  facility_id: 'test-facility-001',
  child_age_band: '2',
  waiting_position: 10,
  priority_type: 'general',
};

function setupFacilityMock(overrides: Record<string, unknown> = {}) {
  const facility = {
    name: '테스트 어린이집',
    capacity: { total: 100 },
    capacity_by_class: { '0': 10, '1': 15, '2': 20, '3': 20, '4': 20, '5': 15 },
    address: '서울특별시 강남구 역삼동 123',
    ...overrides,
  };

  // Collection routing: places → facility, others → null/empty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockCollection as any).mockImplementation((name: string) => {
    if (name === 'places') {
      return {
        findOne: vi.fn().mockResolvedValue(facility),
        find: mockFind,
        insertOne: mockInsertOne,
      };
    }
    if (name === 'admission_blocks') {
      return {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
        }),
      };
    }
    if (name === 'waitlist_snapshots') {
      return {
        findOne: vi.fn().mockResolvedValue(null),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
        }),
      };
    }
    if (name === 'dataBlocks') {
      return {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      };
    }
    if (name === 'admission_scores_v1') {
      return {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: 'test' }),
      };
    }
    return {
      findOne: vi.fn().mockResolvedValue(null),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: 'test' }),
    };
  });
}

// ─── Tests ─────────────────────────────────────────────────────

describe('admissionEngineV1 - edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bug 1: capacity_eff=0 guard (P0)', () => {
    it('clamp(raw_score, 0, 100) prevents negative and overflow', () => {
      // raw_score = Math.round(100 * P_6m) → could be > 100 or < 0
      expect(clamp(Math.round(100 * 1.02), 0, 100)).toBe(100);
      expect(clamp(Math.round(100 * -0.1), 0, 100)).toBe(0);
      expect(clamp(Math.round(100 * 0.65), 0, 100)).toBe(65);
    });

    it('clamp(calibrated, 1, 99) keeps score in display range', () => {
      expect(clamp(0, 1, 99)).toBe(1);
      expect(clamp(100, 1, 99)).toBe(99);
      expect(clamp(50, 1, 99)).toBe(50);
    });

    it('does not crash when facility has zero capacity', async () => {
      setupFacilityMock({
        capacity: 0,
        capacity_by_class: {},
      });

      // Should not throw — capacity_eff is Math.max(1, ...)
      const result = await calculateAdmissionScoreV1(defaultInput);

      // The engine should return a valid result
      expect(result).toBeDefined();
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
      expect(result.admission_score).toBeGreaterThanOrEqual(1);
      expect(result.admission_score).toBeLessThanOrEqual(99);
    });

    it('does not crash when capacity_by_class is missing for age band', async () => {
      setupFacilityMock({
        capacity: { total: 50 },
        capacity_by_class: { '0': 5 }, // Only age band 0, not 2
      });

      const result = await calculateAdmissionScoreV1({
        ...defaultInput,
        child_age_band: '2', // Not in capacity_by_class
      });

      expect(result).toBeDefined();
      expect(result.admission_score).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Bug 2: raw_score CALIBRATION_ARRAY bounds', () => {
    it('clamp prevents index out of bounds for probability > 1.0', () => {
      // Simulates float drift: probability slightly > 1
      const raw = clamp(Math.round(100 * 1.001), 0, 100);
      expect(raw).toBe(100);
      // CALIBRATION_ARRAY[100] should exist (101 elements: 0..100)
    });

    it('clamp prevents negative index', () => {
      const raw = clamp(Math.round(100 * -0.05), 0, 100);
      expect(raw).toBe(0);
    });
  });

  describe('Bug 3: getCacheKey region removal', () => {
    it('returns result with valid structure (cache key internal)', async () => {
      setupFacilityMock();

      const result = await calculateAdmissionScoreV1(defaultInput);

      // Validates the engine didn't error on getCacheKey
      expect(result.facility_id).toBe(defaultInput.facility_id);
      expect(result.engine_version).toBeDefined();
      expect(typeof result.engine_version).toBe('string');
    });
  });

  describe('Bug 5: regionLabel default fallback', () => {
    it('uses 기타 지역 for unknown region addresses', async () => {
      setupFacilityMock({
        address: '제주도 서귀포시 어딘가', // Not matching any region
      });

      const result = await calculateAdmissionScoreV1(defaultInput);

      // Check evidence cards for definition field
      const similarCases = result.evidence.find(e => e.type === 'similar_cases');
      expect(similarCases).toBeDefined();
      expect(similarCases!.data_points?.definition).toContain('기타 지역');
    });

    it('uses proper region label for known regions', async () => {
      setupFacilityMock({
        address: '서울특별시 강남구 역삼동',
      });

      const result = await calculateAdmissionScoreV1(defaultInput);

      const similarCases = result.evidence.find(e => e.type === 'similar_cases');
      expect(similarCases).toBeDefined();
      expect(similarCases!.data_points?.definition).toContain('강남구');
    });
  });

  describe('facility_not_found handling', () => {
    it('throws when facility is not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockCollection as any).mockImplementation(() => ({
        findOne: vi.fn().mockResolvedValue(null),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
        }),
        insertOne: vi.fn().mockResolvedValue({ insertedId: 'test' }),
      }));

      await expect(
        calculateAdmissionScoreV1(defaultInput)
      ).rejects.toThrow();
    });
  });

  describe('prebuilt block with invalid data (Bug 6: β_post guard)', () => {
    it('handles prebuilt block with NaN alpha/beta', async () => {
      setupFacilityMock();

      // Override admission_blocks to return a block with bad data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockCollection as any).mockImplementation((name: string) => {
        if (name === 'places') {
          return {
            findOne: vi.fn().mockResolvedValue({
              name: '테스트 어린이집',
              capacity: { total: 50 },
              capacity_by_class: { '2': 10 },
              address: '서울 강남구 역삼동',
            }),
          };
        }
        if (name === 'admission_blocks') {
          return {
            find: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([
                  {
                    _id: 'block-1',
                    facility_id: 'test-facility-001',
                    block_type: 'admission_vacancy_to',
                    confidence: 0.8,
                    is_active: true,
                    valid_until: new Date(Date.now() + 86400000),
                    data: {
                      N: 5,
                      E_seat_months: 36,
                      rho_observed: 0.14,
                      alpha_post: NaN,  // Bad data
                      beta_post: 0,     // Bad data (zero)
                    },
                  },
                ]),
              }),
            }),
          };
        }
        if (name === 'waitlist_snapshots') {
          return {
            findOne: vi.fn().mockResolvedValue(null),
            find: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
            }),
          };
        }
        if (name === 'dataBlocks') {
          return {
            find: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue([]),
            }),
          };
        }
        return {
          findOne: vi.fn().mockResolvedValue(null),
          insertOne: vi.fn().mockResolvedValue({ insertedId: 'test' }),
        };
      });

      // Should NOT crash even with NaN/zero alpha/beta — guards should catch it
      const result = await calculateAdmissionScoreV1(defaultInput);
      expect(result).toBeDefined();
      expect(Number.isFinite(result.probability)).toBe(true);
      expect(Number.isFinite(result.admission_score)).toBe(true);
    });
  });

  describe('result shape validation', () => {
    it('returns all required fields', async () => {
      setupFacilityMock();

      const result = await calculateAdmissionScoreV1(defaultInput);

      expect(result).toHaveProperty('facility_id');
      expect(result).toHaveProperty('facility_name');
      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('admission_score');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('estimated_months_median');
      expect(result).toHaveProperty('estimated_months_80th');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('engine_version');
      expect(result).toHaveProperty('region_key');
      expect(result).toHaveProperty('calculated_at');
    });

    it('grade is one of A/B/C/D/F', async () => {
      setupFacilityMock();
      const result = await calculateAdmissionScoreV1(defaultInput);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    });

    it('probability is between 0 and 1', async () => {
      setupFacilityMock();
      const result = await calculateAdmissionScoreV1(defaultInput);
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
    });

    it('admission_score is between 1 and 99', async () => {
      setupFacilityMock();
      const result = await calculateAdmissionScoreV1(defaultInput);
      expect(result.admission_score).toBeGreaterThanOrEqual(1);
      expect(result.admission_score).toBeLessThanOrEqual(99);
    });

    it('evidence array is non-empty', async () => {
      setupFacilityMock();
      const result = await calculateAdmissionScoreV1(defaultInput);
      expect(result.evidence.length).toBeGreaterThan(0);
    });
  });
});
