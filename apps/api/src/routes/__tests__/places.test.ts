import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { ZodError } from 'zod';
import placesRouter from '../places.js';
import { errorHandler } from '../../middleware/errorHandler.js';

vi.mock('@ujuz/config', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('../../services/placesService', () => ({
  fetchNearbyPlaces: vi.fn(),
  searchPlaces: vi.fn(),
  fetchPlaceById: vi.fn(),
}));

vi.mock('../../middleware/deviceAuth', () => ({
  deviceAuthMiddleware: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import {
  fetchNearbyPlaces,
  searchPlaces,
  fetchPlaceById,
} from '../../services/placesService.js';
import { AppError } from '@ujuz/shared';

describe('Places Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/places', placesRouter);
    app.use(errorHandler);
    vi.clearAllMocks();
  });

  describe('GET /places/nearby', () => {
    it('should return 200 with nearby places for valid query', async () => {
      const mockPlaces = [
        {
          placeId: 'place-1',
          name: 'Test Place 1',
          distanceMeters: 100,
          location: { lat: 37.5, lng: 127.0 },
        },
        {
          placeId: 'place-2',
          name: 'Test Place 2',
          distanceMeters: 500,
          location: { lat: 37.51, lng: 127.01 },
        },
      ];

      (fetchNearbyPlaces as any).mockResolvedValue(mockPlaces);

      const response = await request(app)
        .get('/places/nearby')
        .query({ lat: 37.5, lng: 127.0, radius: 5000 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlaces);
      expect(fetchNearbyPlaces).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 37.5,
          lng: 127.0,
          radius: 5000,
        })
      );
    });

    it('should use default values for optional query params', async () => {
      (fetchNearbyPlaces as any).mockResolvedValue([]);

      await request(app).get('/places/nearby').query({ lat: 37.5, lng: 127.0 });

      expect(fetchNearbyPlaces).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 37.5,
          lng: 127.0,
          radius: 5000, // default
          limit: 20, // default
          offset: 0, // default
        })
      );
    });

    it('should accept categories filter as array', async () => {
      (fetchNearbyPlaces as any).mockResolvedValue([]);

      await request(app)
        .get('/places/nearby')
        .query({ lat: 37.5, lng: 127.0, categories: ['hospital', 'clinic'] });

      expect(fetchNearbyPlaces).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: expect.arrayContaining(['hospital', 'clinic']),
        })
      );
    });

    it('should return 400 for missing lat parameter', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({ lng: 127.0, radius: 5000 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for missing lng parameter', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({ lat: 37.5, radius: 5000 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid lat (out of range)', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({ lat: 91, lng: 127.0 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid lng (out of range)', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({ lat: 37.5, lng: 181 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for radius exceeding max limit', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({ lat: 37.5, lng: 127.0, radius: 100000 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 500 when service throws error', async () => {
      (fetchNearbyPlaces as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/places/nearby')
        .query({ lat: 37.5, lng: 127.0 });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('GET /places/search', () => {
    it('should return 200 with search results for valid query', async () => {
      const mockResults = [
        { placeId: 'place-1', name: 'Seoul Hospital' },
        { placeId: 'place-2', name: 'Seoul Clinic' },
      ];

      (searchPlaces as any).mockResolvedValue(mockResults);

      const response = await request(app).get('/places/search').query({ q: 'Seoul' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(searchPlaces).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'Seoul',
          limit: 10, // default
        })
      );
    });

    it('should accept custom limit parameter', async () => {
      (searchPlaces as any).mockResolvedValue([]);

      await request(app).get('/places/search').query({ q: 'test', limit: 25 });

      expect(searchPlaces).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'test',
          limit: 25,
        })
      );
    });

    it('should return 400 for missing query parameter', async () => {
      const response = await request(app).get('/places/search');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for empty query string', async () => {
      const response = await request(app).get('/places/search').query({ q: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for query exceeding max length', async () => {
      const longQuery = 'a'.repeat(51);
      const response = await request(app).get('/places/search').query({ q: longQuery });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid limit (exceeds max)', async () => {
      const response = await request(app)
        .get('/places/search')
        .query({ q: 'test', limit: 100 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 500 when service throws error', async () => {
      (searchPlaces as any).mockRejectedValue(new Error('Search index failure'));

      const response = await request(app).get('/places/search').query({ q: 'test' });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('GET /places/:id', () => {
    it('should return 200 with place details for valid id', async () => {
      const mockPlace = {
        placeId: 'place-123',
        name: 'Test Place',
        location: { lat: 37.5, lng: 127.0 },
        categories: ['hospital'],
      };

      (fetchPlaceById as any).mockResolvedValue(mockPlace);

      const response = await request(app).get('/places/place-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlace);
      expect(fetchPlaceById).toHaveBeenCalledWith('place-123');
    });

    it('should return 404 when place is not found', async () => {
      (fetchPlaceById as any).mockResolvedValue(null);

      const response = await request(app).get('/places/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('place_not_found');
      expect(response.body.error.message).toBe('Place not found');
    });

    it('should accept MongoDB ObjectId format', async () => {
      const mockPlace = { placeId: 'place-oid', name: 'Test' };
      (fetchPlaceById as any).mockResolvedValue(mockPlace);

      const response = await request(app).get('/places/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(fetchPlaceById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should accept alphanumeric place IDs', async () => {
      const mockPlace = { placeId: 'abc-123-xyz', name: 'Test' };
      (fetchPlaceById as any).mockResolvedValue(mockPlace);

      const response = await request(app).get('/places/abc-123-xyz');

      expect(response.status).toBe(200);
      expect(fetchPlaceById).toHaveBeenCalledWith('abc-123-xyz');
    });

    it('should return 400 for excessively long id', async () => {
      const longId = 'a'.repeat(129);
      const response = await request(app).get(`/places/${longId}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 500 when service throws error', async () => {
      (fetchPlaceById as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/places/place-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });
});
