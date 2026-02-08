import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
/**
 * UJUz - Users Routes Integration Tests
 * Tests for GET /me, PATCH /me, POST /me/children, POST /me/push-token
 */

import request from 'supertest';
import express from 'express';
import usersRouter from '../users.js';

// Mock MongoDB
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockUpdateOne = vi.fn();
const mockInsertOne = vi.fn();
const mockToArray = vi.fn();

vi.mock('@ujuz/db', () => ({
  getMongoDb: vi.fn(() => ({
    collection: vi.fn((name: string) => ({
      findOne: mockFindOne,
      find: mockFind,
      updateOne: mockUpdateOne,
      insertOne: mockInsertOne,
    })),
  })),
  connectMongo: vi.fn(),
}));

// Mock env
vi.mock('@ujuz/config', () => ({
  env: {
    MONGODB_URI: 'mongodb://test',
    MONGODB_DB_NAME: 'test_db',
  },
}));

// Mock rate limiter
vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Users Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', usersRouter);

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

  describe('GET /users/me', () => {
    it('should return user profile with children', async () => {
      const mockUser = {
        user_id: 'user123',
        display_name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.png',
      };

      const mockChildren = [
        {
          _id: { toString: () => 'child1' },
          nickname: 'Child 1',
          birth_date: '2020-01-01',
          age_class: '영아',
          target_facilities: ['facility1', 'facility2'],
        },
        {
          _id: { toString: () => 'child2' },
          nickname: 'Child 2',
          birth_date: '2021-06-15',
          age_class: '유아',
          target_facilities: [],
        },
      ];

      mockFindOne.mockResolvedValue(mockUser);
      mockFind.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockChildren),
      });

      const response = await request(app)
        .get('/users/me')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: {
          id: 'user123',
          display_name: 'Test User',
          email: 'test@example.com',
          avatar_url: 'https://example.com/avatar.png',
          children: [
            {
              id: 'child1',
              nickname: 'Child 1',
              birth_date: '2020-01-01',
              age_class: '영아',
              target_facilities: ['facility1', 'facility2'],
            },
            {
              id: 'child2',
              nickname: 'Child 2',
              birth_date: '2021-06-15',
              age_class: '유아',
              target_facilities: [],
            },
          ],
        },
      });
    });

    it('should return default profile when user not found', async () => {
      mockFindOne.mockResolvedValue(null);
      mockFind.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/users/me')
        .set('x-user-id', 'new-user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: {
          id: 'new-user',
          display_name: null,
          email: null,
          avatar_url: null,
          children: [],
        },
      });
    });

    it('should use anonymous as default user_id when header is missing', async () => {
      mockFindOne.mockResolvedValue(null);
      mockFind.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      const response = await request(app).get('/users/me');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('anonymous');
    });

    it('should handle database error', async () => {
      mockFindOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/users/me')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update user profile successfully', async () => {
      mockUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const response = await request(app)
        .patch('/users/me')
        .set('x-user-id', 'user123')
        .send({
          display_name: 'Updated Name',
          avatar_url: 'https://example.com/new-avatar.png',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { user_id: 'user123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            display_name: 'Updated Name',
            avatar_url: 'https://example.com/new-avatar.png',
          }),
        }),
        { upsert: true }
      );
    });

    it('should update only display_name', async () => {
      mockUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const response = await request(app)
        .patch('/users/me')
        .set('x-user-id', 'user123')
        .send({ display_name: 'John Doe' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it('should reject invalid avatar_url', async () => {
      const response = await request(app)
        .patch('/users/me')
        .set('x-user-id', 'user123')
        .send({ avatar_url: 'not-a-valid-url' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe('validation_error');
    });

    it('should reject display_name exceeding 50 characters', async () => {
      const response = await request(app)
        .patch('/users/me')
        .set('x-user-id', 'user123')
        .send({ display_name: 'a'.repeat(51) });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should handle database error during update', async () => {
      mockUpdateOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch('/users/me')
        .set('x-user-id', 'user123')
        .send({ display_name: 'Test' });

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('POST /users/me/children', () => {
    it('should add child successfully', async () => {
      const mockInsertedId = { toString: () => 'new-child-id' };
      mockInsertOne.mockResolvedValue({ insertedId: mockInsertedId });

      const response = await request(app)
        .post('/users/me/children')
        .set('x-user-id', 'user123')
        .send({
          nickname: 'My Child',
          birth_date: '2022-03-15',
          age_class: '영아',
          target_facilities: ['facility1'],
          priority_types: ['국공립'],
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ok: true,
        data: {
          id: 'new-child-id',
          nickname: 'My Child',
          birth_date: '2022-03-15',
          age_class: '영아',
        },
      });

      expect(mockInsertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          nickname: 'My Child',
          birth_date: '2022-03-15',
          age_class: '영아',
          target_facilities: ['facility1'],
          priority_types: ['국공립'],
        })
      );
    });

    it('should add child with minimal fields', async () => {
      const mockInsertedId = { toString: () => 'child-id-2' };
      mockInsertOne.mockResolvedValue({ insertedId: mockInsertedId });

      const response = await request(app)
        .post('/users/me/children')
        .set('x-user-id', 'user123')
        .send({
          nickname: 'Child Name',
          birth_date: '2023-01-01',
        });

      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
    });

    it('should reject missing nickname', async () => {
      const response = await request(app)
        .post('/users/me/children')
        .set('x-user-id', 'user123')
        .send({
          birth_date: '2022-03-15',
        });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject invalid birth_date format', async () => {
      const response = await request(app)
        .post('/users/me/children')
        .set('x-user-id', 'user123')
        .send({
          nickname: 'Test Child',
          birth_date: '2022/03/15', // Wrong format
        });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject nickname exceeding 50 characters', async () => {
      const response = await request(app)
        .post('/users/me/children')
        .set('x-user-id', 'user123')
        .send({
          nickname: 'a'.repeat(51),
          birth_date: '2022-03-15',
        });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject too many target_facilities', async () => {
      const response = await request(app)
        .post('/users/me/children')
        .set('x-user-id', 'user123')
        .send({
          nickname: 'Test',
          birth_date: '2022-03-15',
          target_facilities: Array(21).fill('facility'),
        });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should handle database error during insert', async () => {
      mockInsertOne.mockRejectedValue(new Error('Insert failed'));

      const response = await request(app)
        .post('/users/me/children')
        .set('x-user-id', 'user123')
        .send({
          nickname: 'Test Child',
          birth_date: '2022-03-15',
        });

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('POST /users/me/push-token', () => {
    it('should register push token successfully', async () => {
      mockUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const response = await request(app)
        .post('/users/me/push-token')
        .set('x-user-id', 'user123')
        .send({ token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { user_id: 'user123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            push_token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          }),
        }),
        { upsert: true }
      );
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/users/me/push-token')
        .set('x-user-id', 'user123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject empty token', async () => {
      const response = await request(app)
        .post('/users/me/push-token')
        .set('x-user-id', 'user123')
        .send({ token: '' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject token exceeding 500 characters', async () => {
      const response = await request(app)
        .post('/users/me/push-token')
        .set('x-user-id', 'user123')
        .send({ token: 'a'.repeat(501) });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should handle database error', async () => {
      mockUpdateOne.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .post('/users/me/push-token')
        .set('x-user-id', 'user123')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });
});
