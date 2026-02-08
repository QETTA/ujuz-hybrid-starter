import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
/**
 * Integration tests for bot routes
 * Tests: POST /query, GET /conversations, GET /conversations/:id, DELETE /conversations/:id
 */

import request from 'supertest';
import express, { type Express } from 'express';
import botRouter from '../bot.js';
import { errorHandler } from '../../middleware/errorHandler.js';

// Mock services
vi.mock('../../services/botService', () => ({
  processQuery: vi.fn(),
  getConversations: vi.fn(),
  getConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

// Mock middleware
vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import {
  processQuery,
  getConversations,
  getConversation,
  deleteConversation,
} from '../../services/botService.js';

describe('Bot Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/bot', botRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /bot/query', () => {
    it('should process bot query successfully', async () => {
      const mockResponse = {
        conversation_id: '507f1f77bcf86cd799439011',
        message: {
          id: '507f1f77bcf86cd799439012',
          role: 'assistant' as const,
          content: '안녕하세요! 어린이집 관련 질문이 있으시면 무엇이든 물어보세요.',
          intent: 'GENERAL',
          created_at: '2024-01-01T00:00:00.000Z',
        },
        suggestions: ['어린이집 추천해줘', '입소 점수 알아보기', 'TO 알림 설정'],
      };

      (processQuery as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/bot/query')
        .set('x-user-id', 'test-user-123')
        .send({
          message: '안녕하세요',
          context: {
            location: { lat: 37.5665, lng: 126.9780 },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockResponse,
      });
      expect(processQuery).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        message: '안녕하세요',
        conversation_id: undefined,
        context: {
          location: { lat: 37.5665, lng: 126.9780 },
        },
      });
    });

    it('should process query with conversation_id and full context', async () => {
      const mockResponse = {
        conversation_id: '507f1f77bcf86cd799439011',
        message: {
          id: '507f1f77bcf86cd799439012',
          role: 'assistant' as const,
          content: '입소 점수를 확인해 보겠습니다.',
          intent: 'ADMISSION_INQUIRY',
          created_at: '2024-01-01T00:00:00.000Z',
        },
        suggestions: ['입소 점수 계산해줘', 'TO 알림 설정하고 싶어'],
      };

      (processQuery as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/bot/query')
        .set('x-user-id', 'test-user-456')
        .send({
          message: '이 어린이집 입소 가능할까요?',
          conversation_id: '507f1f77bcf86cd799439011',
          context: {
            facility_id: 'facility-123',
            child_id: 'child-789',
            child_age_band: '2',
            waiting_position: 5,
            priority_type: 'dual_income',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(processQuery).toHaveBeenCalledWith({
        user_id: 'test-user-456',
        message: '이 어린이집 입소 가능할까요?',
        conversation_id: '507f1f77bcf86cd799439011',
        context: {
          facility_id: 'facility-123',
          child_id: 'child-789',
          child_age_band: '2',
          waiting_position: 5,
          priority_type: 'dual_income',
        },
      });
    });

    it('should use "anonymous" when x-user-id is not provided', async () => {
      const mockResponse = {
        conversation_id: '507f1f77bcf86cd799439011',
        message: {
          id: '507f1f77bcf86cd799439012',
          role: 'assistant' as const,
          content: 'Response',
          intent: 'GENERAL',
          created_at: '2024-01-01T00:00:00.000Z',
        },
        suggestions: [],
      };

      (processQuery as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/bot/query')
        .send({ message: 'Hello' });

      expect(response.status).toBe(200);
      expect(processQuery).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'anonymous' })
      );
    });

    it('should return 400 for invalid request body (missing message)', async () => {
      const response = await request(app)
        .post('/bot/query')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid message (too long)', async () => {
      const response = await request(app)
        .post('/bot/query')
        .send({
          message: 'a'.repeat(5001),
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 400 for invalid context (invalid lat/lng)', async () => {
      const response = await request(app)
        .post('/bot/query')
        .send({
          message: 'Test',
          context: {
            location: { lat: 200, lng: 300 }, // Out of range
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return 500 when service throws error', async () => {
      (processQuery as any).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/bot/query')
        .send({ message: 'Test' });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('GET /bot/conversations', () => {
    it('should get user conversations successfully', async () => {
      const mockResponse = {
        conversations: [
          {
            id: '507f1f77bcf86cd799439011',
            title: '어린이집 문의',
            last_message: '감사합니다',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T01:00:00.000Z',
          },
          {
            id: '507f1f77bcf86cd799439012',
            title: '입소 점수',
            last_message: '도움이 되셨길 바랍니다',
            created_at: '2024-01-02T00:00:00.000Z',
            updated_at: '2024-01-02T01:00:00.000Z',
          },
        ],
      };

      (getConversations as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/bot/conversations')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockResponse,
      });
      expect(getConversations).toHaveBeenCalledWith('test-user-123');
    });

    it('should use "anonymous" when x-user-id is not provided', async () => {
      (getConversations as any).mockResolvedValue({ conversations: [] });

      const response = await request(app).get('/bot/conversations');

      expect(response.status).toBe(200);
      expect(getConversations).toHaveBeenCalledWith('anonymous');
    });

    it('should return 500 when service throws error', async () => {
      (getConversations as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/bot/conversations')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('GET /bot/conversations/:id', () => {
    it('should get conversation by id successfully', async () => {
      const mockConversation = {
        id: '507f1f77bcf86cd799439011',
        user_id: 'test-user-123',
        title: '어린이집 문의',
        messages: [
          {
            id: '507f1f77bcf86cd799439012',
            role: 'user' as const,
            content: '안녕하세요',
            intent: 'GENERAL',
            created_at: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '507f1f77bcf86cd799439013',
            role: 'assistant' as const,
            content: '안녕하세요! 무엇을 도와드릴까요?',
            intent: 'GENERAL',
            created_at: '2024-01-01T00:00:01.000Z',
          },
        ],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:01.000Z',
      };

      (getConversation as any).mockResolvedValue(mockConversation);

      const response = await request(app)
        .get('/bot/conversations/507f1f77bcf86cd799439011')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockConversation,
      });
      expect(getConversation).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'test-user-123');
    });

    it('should return 404 when conversation not found', async () => {
      (getConversation as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/bot/conversations/nonexistent')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        ok: false,
        error: 'not_found',
      });
    });

    it('should return 500 when service throws error', async () => {
      (getConversation as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/bot/conversations/507f1f77bcf86cd799439011')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('DELETE /bot/conversations/:id', () => {
    it('should delete conversation successfully', async () => {
      (deleteConversation as any).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/bot/conversations/507f1f77bcf86cd799439011')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(deleteConversation).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'test-user-123');
    });

    it('should use "anonymous" when x-user-id is not provided', async () => {
      (deleteConversation as any).mockResolvedValue(undefined);

      const response = await request(app).delete('/bot/conversations/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(deleteConversation).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'anonymous');
    });

    it('should return 500 when service throws error', async () => {
      (deleteConversation as any).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .delete('/bot/conversations/507f1f77bcf86cd799439011')
        .set('x-user-id', 'test-user-123');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('internal_error');
    });
  });
});
