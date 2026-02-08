import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
/**
 * Integration tests for subscriptions routes
 * Tests: GET /plans, GET /me, POST /subscribe, POST /cancel
 */

import request from 'supertest';
import express, { type Express } from 'express';
import subscriptionsRouter from '../subscriptions.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { AppError } from '@ujuz/shared';

// Mock services
vi.mock('../../services/subscriptionService', () => ({
  getPlans: vi.fn(),
  getUserSubscription: vi.fn(),
  createSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
}));

vi.mock('../../services/referralService', () => ({
  trackReferralEvent: vi.fn(),
}));

// Mock middleware
vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import {
  getPlans,
  getUserSubscription,
  createSubscription,
  cancelSubscription,
} from '../../services/subscriptionService.js';

import { trackReferralEvent } from '../../services/referralService.js';

describe('Subscriptions Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/subscriptions', subscriptionsRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /subscriptions/plans', () => {
    it('should get available plans successfully', async () => {
      const mockPlans = {
        plans: [
          {
            id: 'free',
            tier: 'free',
            name: '무료',
            description: '기본 기능 체험',
            price_monthly: 0,
            price_yearly: 0,
            features: {
              admission_score_limit: 1,
              to_alert_facility_limit: 1,
              bot_query_daily_limit: 5,
              priority_support: false,
              ad_free: false,
              export_data: false,
            },
          },
          {
            id: 'basic',
            tier: 'basic',
            name: '기본',
            description: '핵심 기능 활용',
            price_monthly: 4900,
            price_yearly: 49000,
            features: {
              admission_score_limit: 5,
              to_alert_facility_limit: 5,
              bot_query_daily_limit: 30,
              priority_support: false,
              ad_free: true,
              export_data: false,
            },
          },
        ],
      };

      (getPlans as any).mockReturnValue(mockPlans);

      const response = await request(app).get('/subscriptions/plans');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockPlans,
      });
      expect(getPlans).toHaveBeenCalled();
    });

    it('should not require authentication', async () => {
      (getPlans as any).mockReturnValue({ plans: [] });

      const response = await request(app).get('/subscriptions/plans');

      expect(response.status).toBe(200);
    });

    it('should return 500 when service throws error', async () => {
      (getPlans as any).mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app).get('/subscriptions/plans');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('GET /subscriptions/me', () => {
    it('should get user subscription successfully', async () => {
      const mockSubscription = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'device-123',
        plan: {
          id: 'basic',
          tier: 'basic',
          name: '기본',
          description: '핵심 기능 활용',
          price_monthly: 4900,
          price_yearly: 49000,
          features: {
            admission_score_limit: 5,
            to_alert_facility_limit: 5,
            bot_query_daily_limit: 30,
            priority_support: false,
            ad_free: true,
            export_data: false,
          },
        },
        billing_cycle: 'monthly',
        status: 'active',
        current_period_start: '2024-01-01T00:00:00.000Z',
        current_period_end: '2024-02-01T00:00:00.000Z',
        usage: {
          admission_scores_used: 2,
          to_alerts_active: 3,
          bot_queries_today: 10,
          last_reset: '2024-01-01T00:00:00.000Z',
        },
        created_at: '2024-01-01T00:00:00.000Z',
      };

      (getUserSubscription as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .get('/subscriptions/me')
        .set('x-device-id', 'device-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: {
          subscription: mockSubscription,
        },
      });
      expect(getUserSubscription).toHaveBeenCalledWith('device-123');
    });

    it('should return null when user has no subscription', async () => {
      (getUserSubscription as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/subscriptions/me')
        .set('x-device-id', 'device-456');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: {
          subscription: null,
        },
      });
    });

    it('should return 401 when x-device-id is missing', async () => {
      const response = await request(app).get('/subscriptions/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          code: 'missing_device_id',
          message: 'missing x-device-id',
        },
      });
    });

    it('should return 500 when service throws error', async () => {
      (getUserSubscription as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/subscriptions/me')
        .set('x-device-id', 'device-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('POST /subscriptions/subscribe', () => {
    it('should create subscription successfully', async () => {
      const mockSubscription = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'device-123',
        plan: {
          id: 'basic',
          tier: 'basic',
          name: '기본',
          description: '핵심 기능 활용',
          price_monthly: 4900,
          price_yearly: 49000,
          features: {
            admission_score_limit: 5,
            to_alert_facility_limit: 5,
            bot_query_daily_limit: 30,
            priority_support: false,
            ad_free: true,
            export_data: false,
          },
        },
        billing_cycle: 'monthly',
        status: 'active',
        current_period_start: '2024-01-01T00:00:00.000Z',
        current_period_end: '2024-02-01T00:00:00.000Z',
        usage: {
          admission_scores_used: 0,
          to_alerts_active: 0,
          bot_queries_today: 0,
          last_reset: '2024-01-01T00:00:00.000Z',
        },
        created_at: '2024-01-01T00:00:00.000Z',
      };

      (createSubscription as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          plan_tier: 'basic',
          billing_cycle: 'monthly',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: {
          subscription: mockSubscription,
        },
      });
      expect(createSubscription).toHaveBeenCalledWith('device-123', 'basic', 'monthly');
    });

    it('should create subscription with yearly billing', async () => {
      const mockSubscription = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'device-123',
        plan: {
          id: 'premium',
          tier: 'premium',
          name: '프리미엄',
          price_monthly: 9900,
          price_yearly: 99000,
        },
        billing_cycle: 'yearly',
        status: 'active',
        current_period_start: '2024-01-01T00:00:00.000Z',
        current_period_end: '2025-01-01T00:00:00.000Z',
      };

      (createSubscription as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          plan_tier: 'premium',
          billing_cycle: 'yearly',
        });

      expect(response.status).toBe(200);
      expect(createSubscription).toHaveBeenCalledWith('device-123', 'premium', 'yearly');
    });

    it('should use default billing_cycle (monthly)', async () => {
      const mockSubscription = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'device-123',
        plan: { tier: 'basic', price_monthly: 4900 },
        billing_cycle: 'monthly',
        status: 'active',
      };

      (createSubscription as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          plan_tier: 'basic',
        });

      expect(response.status).toBe(200);
      expect(createSubscription).toHaveBeenCalledWith('device-123', 'basic', 'monthly');
    });

    it('should track referral event when referral_code is provided', async () => {
      const mockSubscription = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'device-123',
        plan: { tier: 'basic', price_monthly: 4900 },
        billing_cycle: 'monthly',
        status: 'active',
      };

      (createSubscription as any).mockResolvedValue(mockSubscription);
      (trackReferralEvent as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          plan_tier: 'basic',
          billing_cycle: 'monthly',
          referral_code: 'FRIEND123',
        });

      expect(response.status).toBe(200);
      expect(trackReferralEvent).toHaveBeenCalledWith({
        code: 'FRIEND123',
        type: 'SUBSCRIBE',
        user_id: 'device-123',
        device_id: 'device-123',
        amount: 4900,
        meta: { plan_tier: 'basic', billing_cycle: 'monthly' },
      });
    });

    it('should not fail subscription if referral tracking fails', async () => {
      const mockSubscription = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'device-123',
        plan: { tier: 'basic', price_monthly: 4900 },
        billing_cycle: 'monthly',
        status: 'active',
      };

      (createSubscription as any).mockResolvedValue(mockSubscription);
      (trackReferralEvent as any).mockRejectedValue(new Error('Referral service error'));

      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          plan_tier: 'basic',
          billing_cycle: 'monthly',
          referral_code: 'FRIEND123',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.subscription).toEqual(mockSubscription);
    });

    it('should return 401 when x-device-id is missing', async () => {
      const response = await request(app)
        .post('/subscriptions/subscribe')
        .send({
          plan_tier: 'basic',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          code: 'missing_device_id',
          message: 'missing x-device-id',
        },
      });
    });

    it('should return 400 for missing plan_tier', async () => {
      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          billing_cycle: 'monthly',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid billing_cycle', async () => {
      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          plan_tier: 'basic',
          billing_cycle: 'quarterly', // Invalid
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid referral_code (too short)', async () => {
      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          plan_tier: 'basic',
          referral_code: 'ABC', // Min 4 characters
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 500 when service throws error', async () => {
      (createSubscription as any).mockRejectedValue(new Error('Payment failed'));

      const response = await request(app)
        .post('/subscriptions/subscribe')
        .set('x-device-id', 'device-123')
        .send({
          plan_tier: 'basic',
        });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('POST /subscriptions/cancel', () => {
    it('should cancel subscription successfully', async () => {
      (cancelSubscription as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/subscriptions/cancel')
        .set('x-device-id', 'device-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
      });
      expect(cancelSubscription).toHaveBeenCalledWith('device-123');
    });

    it('should return 401 when x-device-id is missing', async () => {
      const response = await request(app).post('/subscriptions/cancel');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          code: 'missing_device_id',
          message: 'missing x-device-id',
        },
      });
    });

    it('should return 404 when no active subscription found', async () => {
      const appError = new AppError('No active subscription', 404, 'no_subscription');
      (cancelSubscription as any).mockRejectedValue(appError);

      const response = await request(app)
        .post('/subscriptions/cancel')
        .set('x-device-id', 'device-456');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('no_subscription');
    });

    it('should return 500 when service throws error', async () => {
      (cancelSubscription as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/subscriptions/cancel')
        .set('x-device-id', 'device-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });
});
