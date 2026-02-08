import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
/**
 * Integration tests for memories routes
 * Tests: POST /, GET /, GET /:key, PUT /:key, DELETE /:key
 */

import request from 'supertest';
import express, { type Express } from 'express';
import memoriesRouter from '../memories.js';
import { errorHandler } from '../../middleware/errorHandler.js';

// Mock services
vi.mock('../../services/userMemoryService', () => ({
  saveMemory: vi.fn(),
  getMemory: vi.fn(),
  listMemories: vi.fn(),
  updateMemory: vi.fn(),
  deleteMemory: vi.fn(),
  searchMemories: vi.fn(),
}));

// Mock middleware
vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import {
  saveMemory,
  getMemory,
  listMemories,
  updateMemory,
  deleteMemory,
  searchMemories,
} from '../../services/userMemoryService.js';

describe('Memories Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/memories', memoriesRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /memories', () => {
    const validBody = {
      memory_key: 'checklist',
      content: 'Buy supplies for school',
      tags: ['todo', 'school'],
      metadata: { facility_id: 'f123' },
    };

    it('should save memory successfully', async () => {
      const mockMemory = {
        user_id: 'test-user',
        memory_key: 'checklist',
        content: 'Buy supplies for school',
        tags: ['todo', 'school'],
        metadata: { facility_id: 'f123' },
        is_active: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      (saveMemory as any).mockResolvedValue(mockMemory);

      const response = await request(app)
        .post('/memories')
        .set('x-user-id', 'test-user')
        .send(validBody);

      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(saveMemory).toHaveBeenCalledWith(
        'test-user',
        'checklist',
        'Buy supplies for school',
        ['todo', 'school'],
        { facility_id: 'f123' },
      );
    });

    it('should return 401 when x-user-id not provided', async () => {
      const response = await request(app)
        .post('/memories')
        .send({ memory_key: 'note', content: 'test' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        ok: false,
        error: 'missing_user_id',
        message: 'x-user-id header required',
      });
    });

    it('should return 400 for missing memory_key', async () => {
      const response = await request(app)
        .post('/memories')
        .set('x-user-id', 'test-user')
        .send({ content: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for missing content', async () => {
      const response = await request(app)
        .post('/memories')
        .set('x-user-id', 'test-user')
        .send({ memory_key: 'note' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid memory_key format', async () => {
      const response = await request(app)
        .post('/memories')
        .set('x-user-id', 'test-user')
        .send({ memory_key: 'has spaces!', content: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for content exceeding max length', async () => {
      const response = await request(app)
        .post('/memories')
        .set('x-user-id', 'test-user')
        .send({ memory_key: 'note', content: 'a'.repeat(5001) });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 500 when service throws', async () => {
      (saveMemory as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/memories')
        .set('x-user-id', 'test-user')
        .send(validBody);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('GET /memories', () => {
    it('should list memories', async () => {
      const mockResult = {
        memories: [
          { user_id: 'user-1', memory_key: 'note1', content: 'Hello', tags: [], metadata: {}, is_active: true, created_at: new Date(), updated_at: new Date() },
        ],
        total: 1,
      };

      (listMemories as any).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/memories')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(listMemories).toHaveBeenCalledWith('user-1', undefined, 20);
    });

    it('should filter by tag', async () => {
      (listMemories as any).mockResolvedValue({ memories: [], total: 0 });

      const response = await request(app)
        .get('/memories?tag=facility')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(listMemories).toHaveBeenCalledWith('user-1', 'facility', 20);
    });

    it('should search when q is provided', async () => {
      (searchMemories as any).mockResolvedValue([
        { user_id: 'user-1', memory_key: 'note', content: 'milk', tags: [], metadata: {}, is_active: true, created_at: new Date(), updated_at: new Date() },
      ]);

      const response = await request(app)
        .get('/memories?q=milk')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(searchMemories).toHaveBeenCalledWith('user-1', 'milk', 20);
      expect(listMemories).not.toHaveBeenCalled();
    });

    it('should respect limit parameter', async () => {
      (listMemories as any).mockResolvedValue({ memories: [], total: 0 });

      const response = await request(app)
        .get('/memories?limit=5')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(listMemories).toHaveBeenCalledWith('user-1', undefined, 5);
    });

    it('should return 500 when service throws', async () => {
      (listMemories as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/memories')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /memories/:key', () => {
    it('should return memory when found', async () => {
      const mockMemory = {
        user_id: 'user-1',
        memory_key: 'note',
        content: 'Hello',
        tags: [],
        metadata: {},
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (getMemory as any).mockResolvedValue(mockMemory);

      const response = await request(app)
        .get('/memories/note')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(getMemory).toHaveBeenCalledWith('user-1', 'note');
    });

    it('should return 404 when not found', async () => {
      (getMemory as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/memories/missing')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ ok: false, error: 'not_found' });
    });

    it('should return 500 when service throws', async () => {
      (getMemory as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/memories/note')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /memories/:key', () => {
    it('should update memory successfully', async () => {
      const mockMemory = {
        user_id: 'user-1',
        memory_key: 'note',
        content: 'Updated',
        tags: ['updated'],
        metadata: {},
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (updateMemory as any).mockResolvedValue(mockMemory);

      const response = await request(app)
        .put('/memories/note')
        .set('x-user-id', 'user-1')
        .send({ content: 'Updated', tags: ['updated'] });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(updateMemory).toHaveBeenCalledWith('user-1', 'note', 'Updated', ['updated']);
    });

    it('should return 404 when memory not found', async () => {
      (updateMemory as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/memories/missing')
        .set('x-user-id', 'user-1')
        .send({ content: 'test' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ ok: false, error: 'not_found' });
    });

    it('should return 400 for missing content', async () => {
      const response = await request(app)
        .put('/memories/note')
        .set('x-user-id', 'test-user')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for content exceeding max length', async () => {
      const response = await request(app)
        .put('/memories/note')
        .set('x-user-id', 'test-user')
        .send({ content: 'a'.repeat(5001) });

      expect(response.status).toBe(400);
    });

    it('should return 500 when service throws', async () => {
      (updateMemory as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .put('/memories/note')
        .set('x-user-id', 'user-1')
        .send({ content: 'test' });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /memories/:key', () => {
    it('should delete memory successfully', async () => {
      (deleteMemory as any).mockResolvedValue(true);

      const response = await request(app)
        .delete('/memories/note')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(deleteMemory).toHaveBeenCalledWith('user-1', 'note');
    });

    it('should return 404 when memory not found', async () => {
      (deleteMemory as any).mockResolvedValue(false);

      const response = await request(app)
        .delete('/memories/missing')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ ok: false, error: 'not_found' });
    });

    it('should return 401 when x-user-id not provided', async () => {
      const response = await request(app).delete('/memories/note');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        ok: false,
        error: 'missing_user_id',
        message: 'x-user-id header required',
      });
    });

    it('should return 500 when service throws', async () => {
      (deleteMemory as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .delete('/memories/note')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(500);
    });
  });
});
