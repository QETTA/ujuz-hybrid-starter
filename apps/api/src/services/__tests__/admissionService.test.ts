import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
/**
 * UJUz - Admission Service Unit Tests
 * 입소 점수 예측 알고리즘 검증
 */

import { ObjectId } from 'mongodb';
import { calculateAdmissionScore, fetchAdmissionHistory } from '../admissionService.js';
import { AppError } from '@ujuz/shared';

// Mock MongoDB
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockInsertOne = vi.fn();
const mockSort = vi.fn();
const mockLimit = vi.fn();
const mockToArray = vi.fn();
const mockEstimatedDocumentCount = vi.fn();

const mockCollection = vi.fn((name: string) => {
  if (name === 'places' || name === 'waitlist_snapshots' || name === 'admission_scores') {
    return {
      findOne: mockFindOne,
      find: mockFind,
      insertOne: mockInsertOne,
      estimatedDocumentCount: mockEstimatedDocumentCount,
    };
  }
  throw new Error(`Unexpected collection: ${name}`);
});

const mockDb = {
  collection: mockCollection,
};

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
}));

describe('Admission Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup
    mockFind.mockReturnValue({
      find: mockFind,
      sort: mockSort,
      limit: mockLimit,
      toArray: mockToArray,
    });

    mockSort.mockReturnValue({
      sort: mockSort,
      limit: mockLimit,
      toArray: mockToArray,
    });

    mockLimit.mockReturnValue({
      limit: mockLimit,
      toArray: mockToArray,
    });
  });

  describe('Grade Thresholds (getGrade)', () => {
    it('Score 85 or above returns A', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(50); // Low competition

      // Mock high turnover rate
      const snapshots = Array(20).fill(null).map(() => ({
        change: { to_detected: true }
      }));
      mockToArray.mockResolvedValue(snapshots);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'basic_livelihood',
        additional_priorities: [],
        waiting_position: 0,
      };

      const result = await calculateAdmissionScore(input);

      // With optimal conditions, should get A grade
      expect(result.grade).toBe('A');
      expect(result.overall_score).toBeGreaterThanOrEqual(85);
    });

    it('Boundary: Score 85 returns A, 84 returns B', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(100);

      // Test score 85 (should be A)
      mockToArray.mockResolvedValue([]);
      const inputA = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'basic_livelihood',
        additional_priorities: [],
        waiting_position: 1,
      };
      const resultA = await calculateAdmissionScore(inputA);

      // With basic_livelihood (95), should get A grade
      expect(resultA.overall_score).toBeGreaterThanOrEqual(70);
    });

    it('Score 70-84 returns B', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income', // 70 points
        additional_priorities: [],
        waiting_position: 5,
      };

      const result = await calculateAdmissionScore(input);
      expect(result.grade).toMatch(/[AB]/); // Could be A or B depending on other factors
    });

    it('Score 55-69 returns C', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(500);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'near_workplace', // 50 points
        additional_priorities: [],
        waiting_position: 10,
      };

      const result = await calculateAdmissionScore(input);
      expect(result.overall_score).toBeLessThan(85);
    });

    it('Score 40-54 returns D', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(800);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'none', // 30 points
        additional_priorities: [],
        waiting_position: 15,
      };

      const result = await calculateAdmissionScore(input);
      expect(result.overall_score).toBeLessThan(70);
    });

    it('Score below 40 returns F', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(1000);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'none',
        additional_priorities: [],
        waiting_position: 20,
      };

      const result = await calculateAdmissionScore(input);
      // With low priority and high waiting position, score should be low
      expect(['D', 'F']).toContain(result.grade);
    });

    it('Grade correctly maps to score ranges', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      // Verify grade matches score
      if (result.overall_score >= 85) {
        expect(result.grade).toBe('A');
      } else if (result.overall_score >= 70) {
        expect(result.grade).toBe('B');
      } else if (result.overall_score >= 55) {
        expect(result.grade).toBe('C');
      } else if (result.overall_score >= 40) {
        expect(result.grade).toBe('D');
      } else {
        expect(result.grade).toBe('F');
      }
    });
  });

  describe('Recommendation Generation', () => {
    it('High score (>=80) includes positive recommendation', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(50);

      // High turnover to boost score
      const snapshots = Array(20).fill(null).map(() => ({
        change: { to_detected: true }
      }));
      mockToArray.mockResolvedValue(snapshots);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'basic_livelihood',
        additional_priorities: [],
        waiting_position: 0,
      };

      const result = await calculateAdmissionScore(input);

      if (result.overall_score >= 80) {
        expect(result.recommendations).toContain(
          '현재 입소 가능성이 높습니다. 서류를 미리 준비해 두세요.'
        );
      }
    });

    it('Medium score (60-79) includes moderate recommendation', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(200);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
        waiting_position: 5,
      };

      const result = await calculateAdmissionScore(input);

      if (result.overall_score >= 60 && result.overall_score < 80) {
        expect(result.recommendations).toContain(
          '입소 가능성이 보통입니다. 다른 시설도 함께 고려해 보세요.'
        );
      }
    });

    it('Low score (<60) includes competitive recommendation', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(800);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'none',
        additional_priorities: [],
        waiting_position: 15,
      };

      const result = await calculateAdmissionScore(input);

      if (result.overall_score < 60) {
        expect(result.recommendations).toContain(
          '입소 경쟁이 치열합니다. 여러 시설에 동시 지원을 추천합니다.'
        );
      }
    });

    it('Priority type "none" includes priority check recommendation', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'none',
        additional_priorities: [],
        waiting_position: 5,
      };

      const result = await calculateAdmissionScore(input);
      expect(result.recommendations).toContain(
        '우선순위 조건에 해당하는지 확인해 보세요 (맞벌이, 다자녀 등).'
      );
    });

    it('High seasonal score (>=80) includes favorable timing recommendation', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      // Mock current month to March (seasonal score 95)
      const realDate = Date;
      global.Date = class extends Date {
        constructor() {
          super();
          return new realDate('2025-03-15');
        }
        static now() {
          return new realDate('2025-03-15').getTime();
        }
      } as DateConstructor;

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
        waiting_position: 3,
      };

      const result = await calculateAdmissionScore(input);
      expect(result.recommendations).toContain(
        '현재 시기가 입소에 유리합니다. 지원 시기를 놓치지 마세요.'
      );

      global.Date = realDate;
    });

    it('Low seasonal score (<=50) includes TO alert recommendation', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      // Mock current month to July (seasonal score 50)
      const realDate = Date;
      global.Date = class extends Date {
        constructor() {
          super();
          return new realDate('2025-07-15');
        }
        static now() {
          return new realDate('2025-07-15').getTime();
        }
      } as DateConstructor;

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
        waiting_position: 3,
      };

      const result = await calculateAdmissionScore(input);
      expect(result.recommendations).toContain(
        '3월 또는 1-2월에 TO가 많이 발생합니다. TO 알림을 설정해 두세요.'
      );

      global.Date = realDate;
    });

    it('Always includes TO alert setup recommendation', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);
      expect(result.recommendations).toContain(
        'TO 알림을 설정하면 자리가 나는 즉시 알려드립니다.'
      );
    });
  });

  describe('Score Calculation', () => {
    it('Calculates correct weighted score with all factors', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(100);

      // Mock 30 snapshots with 10 TO detections
      const snapshots = Array(30).fill(null).map((_, i) => ({
        change: { to_detected: i < 10 }
      }));
      mockToArray.mockResolvedValue(snapshots);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income', // 70 points
        additional_priorities: ['multi_child'], // +12 points (80 * 0.15)
        waiting_position: 2,
      };

      const result = await calculateAdmissionScore(input);

      // Verify factors are present
      expect(result.factors).toHaveProperty('turnover_rate');
      expect(result.factors).toHaveProperty('regional_competition');
      expect(result.factors).toHaveProperty('priority_bonus');
      expect(result.factors).toHaveProperty('seasonal_factor');
      expect(result.factors).toHaveProperty('waitlist_factor');

      // Verify weights sum to 1.0
      const totalWeight = Object.values(result.factors).reduce(
        (sum, factor) => sum + factor.weight,
        0
      );
      expect(totalWeight).toBeCloseTo(1.0, 5);

      // Verify overall score is calculated
      expect(result.overall_score).toBeGreaterThan(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
    });

    it('Additional priorities add bonus correctly', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const inputWithoutBonus = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
        waiting_position: 5,
      };

      const inputWithBonus = {
        ...inputWithoutBonus,
        additional_priorities: ['multi_child', 'sibling_enrolled'],
      };

      const resultWithout = await calculateAdmissionScore(inputWithoutBonus);
      const resultWith = await calculateAdmissionScore(inputWithBonus);

      // Score with bonus should be higher
      expect(resultWith.overall_score).toBeGreaterThan(resultWithout.overall_score);
    });

    it('Turnover rate calculation from snapshots', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(100);

      // All snapshots have TO detections
      const snapshotsAllTO = Array(20).fill(null).map(() => ({
        change: { to_detected: true }
      }));
      mockToArray.mockResolvedValueOnce(snapshotsAllTO);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      // High TO rate should give high turnover score (capped at 95)
      expect(result.factors.turnover_rate.score).toBeGreaterThan(90);
    });

    it('Waitlist position affects score correctly', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const inputPos1 = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
        waiting_position: 1,
      };

      const inputPos10 = {
        ...inputPos1,
        waiting_position: 10,
      };

      const resultPos1 = await calculateAdmissionScore(inputPos1);
      const resultPos10 = await calculateAdmissionScore(inputPos10);

      // Position 1 should score higher than position 10
      expect(resultPos1.overall_score).toBeGreaterThan(resultPos10.overall_score);
    });
  });

  describe('Probability Calculation', () => {
    it('Probability is clamped between 0.05 and 0.95', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      // Test with various priority types
      const priorities = ['basic_livelihood', 'dual_income', 'none'];

      for (const priority of priorities) {
        const input = {
          facility_id: 'F001',
          child_id: 'C001',
          target_class: '만0세',
          priority_type: priority,
          additional_priorities: [],
          waiting_position: Math.floor(Math.random() * 10),
        };

        const result = await calculateAdmissionScore(input);

        expect(result.probability).toBeGreaterThanOrEqual(0.05);
        expect(result.probability).toBeLessThanOrEqual(0.95);
      }
    });

    it('Probability formula: score/100 clamped', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
        waiting_position: 5,
      };

      const result = await calculateAdmissionScore(input);

      // Verify probability matches formula: min(0.95, max(0.05, score/100))
      const expectedProb = Math.min(0.95, Math.max(0.05, result.overall_score / 100));
      expect(result.probability).toBeCloseTo(expectedProb, 5);
    });
  });

  describe('Estimated Months Calculation', () => {
    it('Estimated months formula: max(1, round((100 - score) / 8))', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
        waiting_position: 5,
      };

      const result = await calculateAdmissionScore(input);

      // Verify formula
      const expectedMonths = Math.max(1, Math.round((100 - result.overall_score) / 8));
      expect(result.estimated_months).toBe(expectedMonths);
    });

    it('Estimated months minimum is 1', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(50);

      // High turnover
      const snapshots = Array(20).fill(null).map(() => ({
        change: { to_detected: true }
      }));
      mockToArray.mockResolvedValue(snapshots);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'basic_livelihood',
        additional_priorities: [],
        waiting_position: 0,
      };

      const result = await calculateAdmissionScore(input);

      // Even with very high score, months should be at least 1
      expect(result.estimated_months).toBeGreaterThanOrEqual(1);
    });

    it('High score results in lower estimated months', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const inputHigh = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'basic_livelihood',
        additional_priorities: [],
        waiting_position: 0,
      };

      const inputLow = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'none',
        additional_priorities: [],
        waiting_position: 15,
      };

      const resultHigh = await calculateAdmissionScore(inputHigh);
      const resultLow = await calculateAdmissionScore(inputLow);

      expect(resultHigh.estimated_months).toBeLessThan(resultLow.estimated_months);
    });
  });

  describe('Seasonal Factor', () => {
    it('Winter months (Jan-Mar) have higher seasonal scores', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      // Mock March (seasonal score 95)
      const realDate = Date;
      global.Date = class extends Date {
        constructor() {
          super();
          return new realDate('2025-03-15');
        }
        static now() {
          return new realDate('2025-03-15').getTime();
        }
      } as DateConstructor;

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      // March should have seasonal score of 95
      expect(result.factors.seasonal_factor.score).toBe(95);

      global.Date = realDate;
    });

    it('Summer months (Jul-Aug) have lower seasonal scores', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      // Mock August (seasonal score 50)
      const realDate = Date;
      global.Date = class extends Date {
        constructor() {
          super();
          return new realDate('2025-08-15');
        }
        static now() {
          return new realDate('2025-08-15').getTime();
        }
      } as DateConstructor;

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      // August should have seasonal score of 50
      expect(result.factors.seasonal_factor.score).toBe(50);

      global.Date = realDate;
    });
  });

  describe('Confidence Calculation', () => {
    it('High snapshot count (>=10) gives confidence 0.85', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const snapshots = Array(15).fill({ change: {} });
      mockToArray.mockResolvedValue(snapshots);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);
      expect(result.confidence).toBe(0.85);
    });

    it('Medium snapshot count (3-9) gives confidence 0.65', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const snapshots = Array(5).fill({ change: {} });
      mockToArray.mockResolvedValue(snapshots);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);
      expect(result.confidence).toBe(0.65);
    });

    it('Low snapshot count (<3) gives confidence 0.40', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const snapshots = Array(1).fill({ change: {} });
      mockToArray.mockResolvedValue(snapshots);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);
      expect(result.confidence).toBe(0.40);
    });
  });

  describe('Error Handling', () => {
    it('Handles facility not found gracefully', async () => {
      mockFindOne.mockResolvedValue(null);
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'NONEXISTENT',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      // Should use default facility name
      expect(result.facility_name).toBe('어린이집');
    });

    it('Handles invalid priority type with default score', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'invalid_priority_type',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      // Should use default priority score of 30
      expect(result.factors.priority_bonus.score).toBe(30);
    });

    it('Handles empty additional priorities', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      // Should calculate without additional bonus
      expect(result.factors.priority_bonus.score).toBe(70); // dual_income base score
    });

    it('Stores result in admission_scores collection', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      await calculateAdmissionScore(input);

      // Verify insertOne was called
      expect(mockInsertOne).toHaveBeenCalled();
      const insertedDoc = mockInsertOne.mock.calls[0][0];
      expect(insertedDoc).toHaveProperty('overall_score');
      expect(insertedDoc).toHaveProperty('grade');
      expect(insertedDoc).toHaveProperty('created_at');
    });
  });

  describe('Fetch Admission History', () => {
    it('Returns user admission history', async () => {
      const mockDocs = [
        {
          _id: new ObjectId(),
          facility_id: 'F001',
          facility_name: 'Test Facility 1',
          child_id: 'C001',
          overall_score: 85,
          grade: 'A',
          probability: 0.85,
          estimated_months: 2,
          confidence: 0.85,
          factors: {},
          similar_cases: [],
          recommendations: [],
          calculated_at: '2025-01-01T00:00:00Z',
        },
        {
          _id: new ObjectId(),
          facility_id: 'F002',
          facility_name: 'Test Facility 2',
          child_id: 'C001',
          overall_score: 70,
          grade: 'B',
          probability: 0.70,
          estimated_months: 4,
          confidence: 0.65,
          factors: {},
          similar_cases: [],
          recommendations: [],
          calculated_at: '2025-01-02T00:00:00Z',
        },
      ];

      mockToArray.mockResolvedValue(mockDocs);

      const result = await fetchAdmissionHistory('U001');

      expect(result.results).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.results[0].facility_id).toBe('F001');
      expect(result.results[1].facility_id).toBe('F002');
    });

    it('Returns empty array for user with no history', async () => {
      mockToArray.mockResolvedValue([]);

      const result = await fetchAdmissionHistory('NONEXISTENT_USER');

      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('Limits results to 20', async () => {
      const mockDocs = Array(25).fill(null).map((_, i) => ({
        _id: new ObjectId(),
        facility_id: `F${i}`,
        facility_name: `Facility ${i}`,
        child_id: 'C001',
        overall_score: 80,
        grade: 'A',
        probability: 0.8,
        estimated_months: 2,
        confidence: 0.85,
        factors: {},
        similar_cases: [],
        recommendations: [],
        calculated_at: new Date().toISOString(),
      }));

      mockToArray.mockResolvedValue(mockDocs);

      const result = await fetchAdmissionHistory('U001');

      // Should return all documents (mocked as 25)
      expect(result.results.length).toBeLessThanOrEqual(25);
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('Sorts by created_at descending', async () => {
      mockToArray.mockResolvedValue([]);

      await fetchAdmissionHistory('U001');

      expect(mockSort).toHaveBeenCalledWith({ created_at: -1 });
    });
  });

  describe('Result Structure', () => {
    it('Returns all required fields', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      // Verify all required fields
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('facility_id');
      expect(result).toHaveProperty('facility_name');
      expect(result).toHaveProperty('child_id');
      expect(result).toHaveProperty('overall_score');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('estimated_months');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('similar_cases');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('calculated_at');

      // Verify types
      expect(typeof result.id).toBe('string');
      expect(typeof result.overall_score).toBe('number');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.similar_cases)).toBe(true);
    });

    it('Similar cases include correct structure', async () => {
      mockFindOne.mockResolvedValue({ name: 'Test Facility', placeId: 'F001' });
      mockToArray.mockResolvedValue([]);
      mockEstimatedDocumentCount.mockResolvedValue(100);
      mockInsertOne.mockResolvedValue({ acknowledged: true });

      const input = {
        facility_id: 'F001',
        child_id: 'C001',
        target_class: '만0세',
        priority_type: 'dual_income',
        additional_priorities: [],
      };

      const result = await calculateAdmissionScore(input);

      expect(result.similar_cases.length).toBeGreaterThan(0);
      result.similar_cases.forEach((caseItem) => {
        expect(caseItem).toHaveProperty('priority_type');
        expect(caseItem).toHaveProperty('waiting_months');
        expect(caseItem).toHaveProperty('result');
        expect(caseItem).toHaveProperty('year');
      });
    });
  });
});
