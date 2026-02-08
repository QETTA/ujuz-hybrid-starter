import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { ZodError } from 'zod';
import insightsRouter from '../insights.js';
import { errorHandler } from '../../middleware/errorHandler.js';

vi.mock('@ujuz/config', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('../../services/insightsService', () => ({
  fetchInsights: vi.fn(),
}));

vi.mock('../../middleware/deviceAuth', () => ({
  deviceAuthMiddleware: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import { fetchInsights } from '../../services/insightsService.js';

describe('Insights Route', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/insights', insightsRouter);
    app.use(errorHandler);
    vi.clearAllMocks();
  });

  describe('GET /insights', () => {
    it('should return 200 with insights for valid placeIds array', async () => {
      const mockInsights = [
        { placeId: 'place-1', insights: { rating: 4.5, reviewCount: 120 } },
        { placeId: 'place-2', insights: { rating: 4.2, reviewCount: 85 } },
      ];

      (fetchInsights as any).mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/insights')
        .query({ placeIds: ['place-1', 'place-2'] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInsights);
      expect(fetchInsights).toHaveBeenCalledWith(['place-1', 'place-2']);
    });

    it('should handle placeIds as comma-separated string', async () => {
      const mockInsights = [{ placeId: 'place-1' }, { placeId: 'place-2' }];

      (fetchInsights as any).mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/insights')
        .query({ placeIds: 'place-1,place-2' });

      expect(response.status).toBe(200);
      expect(fetchInsights).toHaveBeenCalledWith(['place-1', 'place-2']);
    });

    it('should handle placeIds[] bracket notation (common in query strings)', async () => {
      const mockInsights = [{ placeId: 'place-1' }];

      (fetchInsights as any).mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/insights')
        .query({ 'placeIds[]': 'place-1' });

      expect(response.status).toBe(200);
      expect(fetchInsights).toHaveBeenCalledWith(['place-1']);
    });

    it('should handle single placeId parameter', async () => {
      const mockInsights = [{ placeId: 'place-single' }];

      (fetchInsights as any).mockResolvedValue(mockInsights);

      const response = await request(app).get('/insights').query({ placeId: 'place-single' });

      expect(response.status).toBe(200);
      expect(fetchInsights).toHaveBeenCalledWith(['place-single']);
    });

    it('should trim whitespace from placeIds', async () => {
      (fetchInsights as any).mockResolvedValue([]);

      await request(app)
        .get('/insights')
        .query({ placeIds: ' place-1 , place-2 , place-3 ' });

      expect(fetchInsights).toHaveBeenCalledWith(['place-1', 'place-2', 'place-3']);
    });

    it('should filter out empty strings from placeIds', async () => {
      (fetchInsights as any).mockResolvedValue([]);

      await request(app)
        .get('/insights')
        .query({ placeIds: 'place-1,,place-2, ,place-3' });

      expect(fetchInsights).toHaveBeenCalledWith(['place-1', 'place-2', 'place-3']);
    });

    it('should return 400 for missing placeIds parameter', async () => {
      const response = await request(app).get('/insights');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for empty placeIds array', async () => {
      const response = await request(app).get('/insights').query({ placeIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for placeIds exceeding max limit (100)', async () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => `place-${i}`);

      const response = await request(app).get('/insights').query({ placeIds: tooManyIds });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should accept exactly 100 placeIds (boundary test)', async () => {
      const exactlyMaxIds = Array.from({ length: 100 }, (_, i) => `place-${i}`);
      (fetchInsights as any).mockResolvedValue([]);

      const response = await request(app).get('/insights').query({ placeIds: exactlyMaxIds });

      expect(response.status).toBe(200);
      expect(fetchInsights).toHaveBeenCalledWith(exactlyMaxIds);
    });

    it('should return 400 for placeIds with empty strings after parsing', async () => {
      const response = await request(app).get('/insights').query({ placeIds: '  ,  ,  ' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 500 when service throws error', async () => {
      (fetchInsights as any).mockRejectedValue(new Error('MongoDB query failed'));

      const response = await request(app)
        .get('/insights')
        .query({ placeIds: ['place-1'] });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });

    it('should handle multiple placeIds[] parameters (multiple query params)', async () => {
      const mockInsights = [{ placeId: 'place-1' }, { placeId: 'place-2' }];
      (fetchInsights as any).mockResolvedValue(mockInsights);

      // Simulating: ?placeIds[]=place-1&placeIds[]=place-2
      const response = await request(app)
        .get('/insights?placeIds[]=place-1&placeIds[]=place-2');

      expect(response.status).toBe(200);
      expect(fetchInsights).toHaveBeenCalledWith(['place-1', 'place-2']);
    });

    it('should return insights in same order as requested placeIds', async () => {
      const mockInsights = [
        { placeId: 'place-3' },
        { placeId: 'place-1' },
        { placeId: 'place-2' },
      ];

      (fetchInsights as any).mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/insights')
        .query({ placeIds: ['place-3', 'place-1', 'place-2'] });

      expect(response.status).toBe(200);
      expect(response.body[0].placeId).toBe('place-3');
      expect(response.body[1].placeId).toBe('place-1');
      expect(response.body[2].placeId).toBe('place-2');
    });

    it('should handle response format consistency', async () => {
      const mockInsights = [
        { placeId: 'place-1', insights: {} },
        { placeId: 'place-2' }, // Missing insights
      ];

      (fetchInsights as any).mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/insights')
        .query({ placeIds: ['place-1', 'place-2'] });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      response.body.forEach((item: any) => {
        expect(item).toHaveProperty('placeId');
      });
    });
  });
});
