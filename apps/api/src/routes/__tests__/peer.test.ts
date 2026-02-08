import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
/**
 * UJUz - Peer Routes Integration Tests
 * Tests for GET /live-status, GET /activities, GET /trending/places, POST /activity
 */

import request from 'supertest';
import express from 'express';
import peerRouter from '../peer.js';

// Mock peer service
vi.mock('../../services/peerService', () => ({
  getLiveStatus: vi.fn(),
  getActivities: vi.fn(),
  getTrendingPlaces: vi.fn(),
  recordActivity: vi.fn(),
}));

// Mock rate limiter
vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import {
  getLiveStatus,
  getActivities,
  getTrendingPlaces,
  recordActivity,
} from '../../services/peerService.js';

const mockGetLiveStatus = getLiveStatus as any;
const mockGetActivities = getActivities as any;
const mockGetTrendingPlaces = getTrendingPlaces as any;
const mockRecordActivity = recordActivity as any;

describe('Peer Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/peer', peerRouter);

    // Error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      if (err.name === 'ZodError') {
        res.status(400).json({ ok: false, error: 'validation_error', details: err.errors });
        return;
      }
      res.status(err.statusCode || 500).json({ ok: false, error: err.message });
    });

    vi.clearAllMocks();
  });

  describe('GET /peer/live-status', () => {
    it('should return live status successfully', async () => {
      const mockStatus = {
        total_active: 42,
        by_age_group: [
          { age_group: '영아', count: 15, latest_activity: '2024-01-01T10:00:00.000Z' },
          { age_group: '유아', count: 27, latest_activity: '2024-01-01T10:05:00.000Z' },
        ],
        snapshot_at: '2024-01-01T10:10:00.000Z',
      };

      mockGetLiveStatus.mockResolvedValue(mockStatus);

      const response = await request(app).get('/peer/live-status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockStatus,
      });
      expect(mockGetLiveStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle empty live status', async () => {
      mockGetLiveStatus.mockResolvedValue({
        total_active: 0,
        by_age_group: [],
        snapshot_at: '2024-01-01T10:00:00.000Z',
      });

      const response = await request(app).get('/peer/live-status');

      expect(response.status).toBe(200);
      expect(response.body.data.total_active).toBe(0);
      expect(response.body.data.by_age_group).toEqual([]);
    });

    it('should handle service error', async () => {
      mockGetLiveStatus.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app).get('/peer/live-status');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('GET /peer/activities', () => {
    it('should return activities with default pagination', async () => {
      const mockResult = {
        activities: [
          {
            id: 'activity1',
            user_id: 'user123',
            activity_type: 'visit',
            place_id: 'place1',
            place_name: 'Test Place',
            age_group: '영아',
            description: 'Great place!',
            created_at: '2024-01-01T09:00:00.000Z',
          },
          {
            id: 'activity2',
            user_id: 'user456',
            activity_type: 'review',
            place_id: 'place2',
            place_name: 'Another Place',
            age_group: '유아',
            created_at: '2024-01-01T08:00:00.000Z',
            description: undefined,
          },
        ],
        total: 2,
      };

      mockGetActivities.mockResolvedValue(mockResult);

      const response = await request(app).get('/peer/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockResult,
      });
      expect(mockGetActivities).toHaveBeenCalledWith(20, 0);
    });

    it('should handle custom pagination', async () => {
      mockGetActivities.mockResolvedValue({ activities: [], total: 0 });

      const response = await request(app)
        .get('/peer/activities')
        .query({ limit: 50, offset: 10 });

      expect(response.status).toBe(200);
      expect(mockGetActivities).toHaveBeenCalledWith(50, 10);
    });

    it('should enforce maximum limit of 100', async () => {
      mockGetActivities.mockResolvedValue({ activities: [], total: 0 });

      const response = await request(app)
        .get('/peer/activities')
        .query({ limit: 200 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject negative offset', async () => {
      const response = await request(app)
        .get('/peer/activities')
        .query({ offset: -5 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject invalid limit type', async () => {
      const response = await request(app)
        .get('/peer/activities')
        .query({ limit: 'not-a-number' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should return empty activities list', async () => {
      mockGetActivities.mockResolvedValue({ activities: [], total: 0 });

      const response = await request(app).get('/peer/activities');

      expect(response.status).toBe(200);
      expect(response.body.data.activities).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should handle service error', async () => {
      mockGetActivities.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/peer/activities');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('GET /peer/trending/places', () => {
    it('should return trending places with default limit', async () => {
      const mockResult = {
        places: [
          {
            place_id: 'place1',
            place_name: 'Popular Place',
            activity_count: 150,
            unique_visitors: 45,
          },
          {
            place_id: 'place2',
            place_name: 'Trending Place',
            activity_count: 120,
            unique_visitors: 38,
          },
        ],
      };

      mockGetTrendingPlaces.mockResolvedValue(mockResult);

      const response = await request(app).get('/peer/trending/places');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockResult,
      });
      expect(mockGetTrendingPlaces).toHaveBeenCalledWith(10);
    });

    it('should handle custom limit', async () => {
      mockGetTrendingPlaces.mockResolvedValue({ places: [] });

      const response = await request(app)
        .get('/peer/trending/places')
        .query({ limit: 25 });

      expect(response.status).toBe(200);
      expect(mockGetTrendingPlaces).toHaveBeenCalledWith(25);
    });

    it('should enforce maximum limit of 30', async () => {
      const response = await request(app)
        .get('/peer/trending/places')
        .query({ limit: 50 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject limit below 1', async () => {
      const response = await request(app)
        .get('/peer/trending/places')
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should return empty trending places', async () => {
      mockGetTrendingPlaces.mockResolvedValue({ places: [] });

      const response = await request(app).get('/peer/trending/places');

      expect(response.status).toBe(200);
      expect(response.body.data.places).toEqual([]);
    });

    it('should handle service error', async () => {
      mockGetTrendingPlaces.mockRejectedValue(new Error('Aggregation failed'));

      const response = await request(app).get('/peer/trending/places');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('POST /peer/activity', () => {
    it('should record activity successfully', async () => {
      const mockResult = {
        id: 'new-activity-id',
        created_at: '2024-01-01T12:00:00.000Z',
      };

      mockRecordActivity.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/peer/activity')
        .set('x-user-id', 'user123')
        .send({
          activity_type: 'visit',
          place_id: 'place1',
          place_name: 'Test Place',
          age_group: '영아',
          description: 'Had a great experience!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ok: true,
        data: mockResult,
      });
      expect(mockRecordActivity).toHaveBeenCalledWith({
        user_id: 'user123',
        activity_type: 'visit',
        place_id: 'place1',
        place_name: 'Test Place',
        age_group: '영아',
        description: 'Had a great experience!',
      });
    });

    it('should record activity with minimal fields', async () => {
      mockRecordActivity.mockResolvedValue({
        id: 'activity-id',
        created_at: '2024-01-01T12:00:00.000Z',
      });

      const response = await request(app)
        .post('/peer/activity')
        .set('x-user-id', 'user456')
        .send({ activity_type: 'review' });

      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
    });

    it('should use anonymous as default user_id', async () => {
      mockRecordActivity.mockResolvedValue({
        id: 'activity-id',
        created_at: '2024-01-01T12:00:00.000Z',
      });

      const response = await request(app)
        .post('/peer/activity')
        .send({ activity_type: 'question' });

      expect(response.status).toBe(201);
      expect(mockRecordActivity).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'anonymous' })
      );
    });

    it('should reject missing activity_type', async () => {
      const response = await request(app)
        .post('/peer/activity')
        .set('x-user-id', 'user123')
        .send({
          place_id: 'place1',
          description: 'Missing activity type',
        });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject invalid activity_type', async () => {
      const response = await request(app)
        .post('/peer/activity')
        .set('x-user-id', 'user123')
        .send({ activity_type: 'invalid_type' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should accept all valid activity types', async () => {
      const validTypes = ['visit', 'review', 'question', 'info_share', 'recommendation'];

      for (const type of validTypes) {
        vi.clearAllMocks();
        mockRecordActivity.mockResolvedValue({
          id: 'activity-id',
          created_at: '2024-01-01T12:00:00.000Z',
        });

        const response = await request(app)
          .post('/peer/activity')
          .set('x-user-id', 'user123')
          .send({ activity_type: type });

        expect(response.status).toBe(201);
      }
    });

    it('should reject description exceeding 2000 characters', async () => {
      const response = await request(app)
        .post('/peer/activity')
        .set('x-user-id', 'user123')
        .send({
          activity_type: 'review',
          description: 'a'.repeat(2001),
        });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject place_name exceeding 200 characters', async () => {
      const response = await request(app)
        .post('/peer/activity')
        .set('x-user-id', 'user123')
        .send({
          activity_type: 'visit',
          place_name: 'a'.repeat(201),
        });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should handle service error', async () => {
      mockRecordActivity.mockRejectedValue(new Error('Insert failed'));

      const response = await request(app)
        .post('/peer/activity')
        .set('x-user-id', 'user123')
        .send({ activity_type: 'visit' });

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });
});
