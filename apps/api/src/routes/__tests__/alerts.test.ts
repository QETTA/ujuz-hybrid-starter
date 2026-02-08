import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
/**
 * Integration tests for alerts routes
 * Tests: GET /to, POST /to, DELETE /to/:facilityId, GET /to/history
 */

import request from 'supertest';
import express, { type Express } from 'express';
import alertsRouter from '../alerts.js';
import { errorHandler } from '../../middleware/errorHandler.js';

// Mock services
vi.mock('../../services/toAlertService', () => ({
  createSubscription: vi.fn(),
  getUserSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
  getAlertHistory: vi.fn(),
}));

// Mock middleware
vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import {
  createSubscription,
  getUserSubscriptions,
  deleteSubscription,
  getAlertHistory,
} from '../../services/toAlertService.js';

describe('Alerts Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/alerts', alertsRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /alerts/to', () => {
    it('should get user subscriptions successfully', async () => {
      const mockResponse = {
        subscriptions: [
          {
            id: '507f1f77bcf86cd799439011',
            user_id: 'test-user-123',
            facility_id: 'facility-001',
            facility_name: '행복 어린이집',
            target_classes: ['0세반', '1세반'],
            is_active: true,
            notification_preferences: { push: true, sms: false, email: false },
            created_at: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '507f1f77bcf86cd799439012',
            user_id: 'test-user-123',
            facility_id: 'facility-002',
            facility_name: '사랑 어린이집',
            target_classes: ['2세반'],
            is_active: true,
            notification_preferences: { push: true, sms: true, email: false },
            created_at: '2024-01-02T00:00:00.000Z',
          },
        ],
      };

      (getUserSubscriptions as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/alerts/to')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockResponse,
      });
      expect(getUserSubscriptions).toHaveBeenCalledWith('test-user-123');
    });

    it('should return 401 when x-user-id is not provided', async () => {
      const response = await request(app).get('/alerts/to');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        ok: false,
        error: 'missing_user_id',
        message: 'x-user-id header required',
      });
    });

    it('should return empty subscriptions array for new user', async () => {
      (getUserSubscriptions as any).mockResolvedValue({ subscriptions: [] });

      const response = await request(app)
        .get('/alerts/to')
        .set('x-user-id', 'new-user-999');

      expect(response.status).toBe(200);
      expect(response.body.data.subscriptions).toEqual([]);
    });

    it('should return 500 when service throws error', async () => {
      (getUserSubscriptions as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/alerts/to')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('POST /alerts/to', () => {
    it('should create TO subscription successfully', async () => {
      const mockSubscription = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'test-user-123',
        facility_id: 'facility-001',
        facility_name: '행복 어린이집',
        target_classes: ['0세반', '1세반'],
        is_active: true,
        notification_preferences: { push: true, sms: false, email: false },
        created_at: '2024-01-01T00:00:00.000Z',
      };

      (createSubscription as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/alerts/to')
        .set('x-user-id', 'test-user-123')
        .send({
          facility_id: 'facility-001',
          facility_name: '행복 어린이집',
          target_classes: ['0세반', '1세반'],
          notification_preferences: { push: true, sms: false, email: false },
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ok: true,
        data: mockSubscription,
      });
      expect(createSubscription).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        facility_id: 'facility-001',
        facility_name: '행복 어린이집',
        target_classes: ['0세반', '1세반'],
        notification_preferences: { push: true, sms: false, email: false },
      });
    });

    it('should create subscription with default values', async () => {
      const mockSubscription = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'test-user-123',
        facility_id: 'facility-001',
        facility_name: '행복 어린이집',
        target_classes: [],
        is_active: true,
        notification_preferences: { push: true, sms: false, email: false },
        created_at: '2024-01-01T00:00:00.000Z',
      };

      (createSubscription as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/alerts/to')
        .set('x-user-id', 'test-user-123')
        .send({
          facility_id: 'facility-001',
          facility_name: '행복 어린이집',
        });

      expect(response.status).toBe(201);
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          target_classes: [],
          notification_preferences: { push: true, sms: false, email: false },
        })
      );
    });

    it('should return 400 for missing facility_id', async () => {
      const response = await request(app)
        .post('/alerts/to')
        .set('x-user-id', 'test-user-123')
        .send({
          facility_name: '행복 어린이집',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for missing facility_name', async () => {
      const response = await request(app)
        .post('/alerts/to')
        .set('x-user-id', 'test-user-123')
        .send({
          facility_id: 'facility-001',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid target_classes (too many)', async () => {
      const response = await request(app)
        .post('/alerts/to')
        .set('x-user-id', 'test-user-123')
        .send({
          facility_id: 'facility-001',
          facility_name: '행복 어린이집',
          target_classes: Array(11).fill('0세반'), // Max is 10
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid facility_name (too long)', async () => {
      const response = await request(app)
        .post('/alerts/to')
        .set('x-user-id', 'test-user-123')
        .send({
          facility_id: 'facility-001',
          facility_name: 'a'.repeat(201), // Max is 200
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 500 when service throws error', async () => {
      (createSubscription as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/alerts/to')
        .set('x-user-id', 'test-user-123')
        .send({
          facility_id: 'facility-001',
          facility_name: '행복 어린이집',
        });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('DELETE /alerts/to/:facilityId', () => {
    it('should delete subscription successfully', async () => {
      (deleteSubscription as any).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/alerts/to/facility-001')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(deleteSubscription).toHaveBeenCalledWith('test-user-123', 'facility-001');
    });

    it('should return 401 when x-user-id is not provided', async () => {
      const response = await request(app).delete('/alerts/to/facility-001');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        ok: false,
        error: 'missing_user_id',
        message: 'x-user-id header required',
      });
    });

    it('should return 500 when service throws error', async () => {
      (deleteSubscription as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .delete('/alerts/to/facility-001')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('GET /alerts/to/history', () => {
    it('should get alert history successfully', async () => {
      const mockHistory = {
        alerts: [
          {
            id: '507f1f77bcf86cd799439011',
            facility_id: 'facility-001',
            facility_name: '행복 어린이집',
            age_class: '0세반',
            detected_at: '2024-01-01T00:00:00.000Z',
            estimated_slots: 2,
            confidence: 0.85,
            is_read: false,
            source: 'auto_detection',
          },
          {
            id: '507f1f77bcf86cd799439012',
            facility_id: 'facility-002',
            facility_name: '사랑 어린이집',
            age_class: '1세반',
            detected_at: '2024-01-02T00:00:00.000Z',
            estimated_slots: 1,
            confidence: 0.92,
            is_read: true,
            source: 'crawler',
          },
        ],
        total: 2,
        unread_count: 1,
      };

      (getAlertHistory as any).mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/alerts/to/history')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockHistory,
      });
      expect(getAlertHistory).toHaveBeenCalledWith('test-user-123');
    });

    it('should return empty history for user with no subscriptions', async () => {
      (getAlertHistory as any).mockResolvedValue({
        alerts: [],
        total: 0,
        unread_count: 0,
      });

      const response = await request(app)
        .get('/alerts/to/history')
        .set('x-user-id', 'new-user-999');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        alerts: [],
        total: 0,
        unread_count: 0,
      });
    });

    it('should return 401 when x-user-id is not provided', async () => {
      const response = await request(app).get('/alerts/to/history');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        ok: false,
        error: 'missing_user_id',
        message: 'x-user-id header required',
      });
    });

    it('should return 500 when service throws error', async () => {
      (getAlertHistory as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/alerts/to/history')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });
});
