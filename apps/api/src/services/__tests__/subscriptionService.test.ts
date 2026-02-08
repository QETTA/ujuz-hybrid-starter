import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
/**
 * UJUz - Subscription Service Tests
 */

import { ObjectId } from 'mongodb';
import * as subscriptionService from '../subscriptionService.js';
import { AppError } from '@ujuz/shared';

// Mock MongoDB
const mockCollection = {
  findOne: vi.fn(),
  insertOne: vi.fn(),
  updateMany: vi.fn(),
  updateOne: vi.fn(),
};

vi.mock('@ujuz/db', () => ({
  getMongoDb: vi.fn(() => ({
    collection: vi.fn(() => mockCollection),
  })),
  connectMongo: vi.fn(() => ({
    collection: vi.fn(() => mockCollection),
  })),
}));

vi.mock('@ujuz/config', () => ({
  env: {
    MONGODB_URI: 'mongodb://localhost:27017',
    MONGODB_DB_NAME: 'test',
  },
}));

describe('subscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlans', () => {
    it('returns expected plan structure with free, basic, premium tiers', () => {
      const result = subscriptionService.getPlans();

      expect(result.plans).toHaveLength(3);
      expect(result.plans[0].tier).toBe('free');
      expect(result.plans[1].tier).toBe('basic');
      expect(result.plans[2].tier).toBe('premium');
    });

    it('includes correct pricing fields', () => {
      const result = subscriptionService.getPlans();

      // Free plan
      expect(result.plans[0].price_monthly).toBe(0);
      expect(result.plans[0].price_yearly).toBe(0);

      // Basic plan
      expect(result.plans[1].price_monthly).toBe(4900);
      expect(result.plans[1].price_yearly).toBe(49000);

      // Premium plan
      expect(result.plans[2].price_monthly).toBe(9900);
      expect(result.plans[2].price_yearly).toBe(99000);
    });

    it('includes feature limits for each tier', () => {
      const result = subscriptionService.getPlans();

      // Free tier limits
      expect(result.plans[0].features.admission_score_limit).toBe(1);
      expect(result.plans[0].features.to_alert_facility_limit).toBe(1);
      expect(result.plans[0].features.bot_query_daily_limit).toBe(5);

      // Premium tier unlimited (-1)
      expect(result.plans[2].features.admission_score_limit).toBe(-1);
      expect(result.plans[2].features.to_alert_facility_limit).toBe(-1);
      expect(result.plans[2].features.bot_query_daily_limit).toBe(-1);
    });
  });

  describe('getUserSubscription', () => {
    it('returns subscription when user has active subscription', async () => {
      const mockDoc = {
        _id: new ObjectId(),
        user_id: 'user123',
        plan_tier: 'basic',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_start: new Date('2026-01-01'),
        current_period_end: new Date('2026-02-01'),
        admission_scores_used: 2,
        to_alerts_active: 3,
        bot_queries_today: 10,
        last_reset: new Date('2026-01-01'),
        created_at: new Date('2025-12-01'),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await subscriptionService.getUserSubscription('user123');

      expect(result).not.toBeNull();
      expect(result?.user_id).toBe('user123');
      expect(result?.plan.tier).toBe('basic');
      expect(result?.status).toBe('active');
      expect(result?.usage.admission_scores_used).toBe(2);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        user_id: 'user123',
        status: { $in: ['active', 'trial'] },
      });
    });

    it('returns null when user has no subscription', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await subscriptionService.getUserSubscription('user999');

      expect(result).toBeNull();
    });

    it('includes trial status subscriptions', async () => {
      const mockDoc = {
        _id: new ObjectId(),
        user_id: 'user456',
        plan_tier: 'premium',
        billing_cycle: 'monthly',
        status: 'trial',
        current_period_start: new Date('2026-02-01'),
        current_period_end: new Date('2026-03-01'),
        admission_scores_used: 0,
        to_alerts_active: 0,
        bot_queries_today: 0,
        last_reset: new Date('2026-02-01'),
        created_at: new Date('2026-02-01'),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await subscriptionService.getUserSubscription('user456');

      expect(result?.status).toBe('trial');
      expect(result?.plan.tier).toBe('premium');
    });

    it('defaults to free plan if plan_tier not found', async () => {
      const mockDoc = {
        _id: new ObjectId(),
        user_id: 'user789',
        plan_tier: 'unknown_tier',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_start: new Date('2026-01-01'),
        current_period_end: new Date('2026-02-01'),
        admission_scores_used: 0,
        to_alerts_active: 0,
        bot_queries_today: 0,
        last_reset: new Date('2026-01-01'),
        created_at: new Date('2026-01-01'),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await subscriptionService.getUserSubscription('user789');

      expect(result?.plan.tier).toBe('free');
    });
  });

  describe('createSubscription', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-08T00:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('creates subscription with valid plan tier', async () => {
      const mockInsertedId = new ObjectId();
      mockCollection.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockCollection.insertOne.mockResolvedValue({ insertedId: mockInsertedId });

      const result = await subscriptionService.createSubscription('user123', 'basic', 'monthly');

      expect(result.user_id).toBe('user123');
      expect(result.plan.tier).toBe('basic');
      expect(result.billing_cycle).toBe('monthly');
      expect(result.status).toBe('active');
      expect(result.usage.admission_scores_used).toBe(0);
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('throws error with invalid plan tier', async () => {
      await expect(
        subscriptionService.createSubscription('user123', 'invalid_tier', 'monthly')
      ).rejects.toThrow(AppError);

      await expect(
        subscriptionService.createSubscription('user123', 'invalid_tier', 'monthly')
      ).rejects.toMatchObject({
        message: 'Invalid plan',
        statusCode: 400,
        code: 'invalid_plan',
      });
    });

    it('monthly billing adds 1 month to period end', async () => {
      const mockInsertedId = new ObjectId();
      mockCollection.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockCollection.insertOne.mockResolvedValue({ insertedId: mockInsertedId });

      const result = await subscriptionService.createSubscription('user123', 'basic', 'monthly');

      const start = new Date(result.current_period_start);
      const end = new Date(result.current_period_end);

      expect(start.toISOString()).toBe('2026-02-08T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-03-08T00:00:00.000Z');
    });

    it('yearly billing adds 1 year to period end', async () => {
      const mockInsertedId = new ObjectId();
      mockCollection.updateMany.mockResolvedValue({ modifiedCount: 0 });
      mockCollection.insertOne.mockResolvedValue({ insertedId: mockInsertedId });

      const result = await subscriptionService.createSubscription('user456', 'premium', 'yearly');

      const start = new Date(result.current_period_start);
      const end = new Date(result.current_period_end);

      expect(start.toISOString()).toBe('2026-02-08T00:00:00.000Z');
      expect(end.toISOString()).toBe('2027-02-08T00:00:00.000Z');
    });

    it('cancels existing active subscriptions before creating new one', async () => {
      const mockInsertedId = new ObjectId();
      mockCollection.updateMany.mockResolvedValue({ modifiedCount: 1 });
      mockCollection.insertOne.mockResolvedValue({ insertedId: mockInsertedId });

      await subscriptionService.createSubscription('user123', 'premium', 'monthly');

      expect(mockCollection.updateMany).toHaveBeenCalledWith(
        { user_id: 'user123', status: 'active' },
        { $set: { status: 'cancelled' } }
      );
    });
  });

  describe('cancelSubscription', () => {
    it('updates active subscription status to cancelled', async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      await subscriptionService.cancelSubscription('user123');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { user_id: 'user123', status: 'active' },
        { $set: { status: 'cancelled' } }
      );
    });

    it('throws error when no active subscription found', async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

      await expect(subscriptionService.cancelSubscription('user999')).rejects.toThrow(AppError);

      await expect(subscriptionService.cancelSubscription('user999')).rejects.toMatchObject({
        message: 'No active subscription',
        statusCode: 404,
        code: 'no_subscription',
      });
    });
  });

  describe('incrementUsage', () => {
    it('increments admission_scores_used for active subscription', async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      await subscriptionService.incrementUsage('user123', 'admission_scores_used');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { user_id: 'user123', status: { $in: ['active', 'trial'] } },
        { $inc: { admission_scores_used: 1 } }
      );
    });

    it('increments bot_queries_today for trial subscription', async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      await subscriptionService.incrementUsage('user456', 'bot_queries_today');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { user_id: 'user456', status: { $in: ['active', 'trial'] } },
        { $inc: { bot_queries_today: 1 } }
      );
    });

    it('increments to_alerts_active counter', async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      await subscriptionService.incrementUsage('user789', 'to_alerts_active');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { user_id: 'user789', status: { $in: ['active', 'trial'] } },
        { $inc: { to_alerts_active: 1 } }
      );
    });
  });
});
