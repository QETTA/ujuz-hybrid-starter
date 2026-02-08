import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from "vitest";
/**
 * UJUz - GroupBuys Routes Integration Tests
 * Tests for GET /, GET /joined, GET /:id, POST /:id/join, DELETE /:id/leave
 */

import request from 'supertest';
import express from 'express';
import groupBuysRouter from '../groupBuys.js';

// Mock groupBuy service
vi.mock('../../services/groupBuyService', () => ({
  listGroupBuys: vi.fn(),
  getGroupBuyById: vi.fn(),
  joinGroupBuy: vi.fn(),
  leaveGroupBuy: vi.fn(),
  getUserJoinedGroupBuys: vi.fn(),
}));

// Mock rate limiter
vi.mock('../../middleware/rateLimit', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import {
  listGroupBuys,
  getGroupBuyById,
  joinGroupBuy,
  leaveGroupBuy,
  getUserJoinedGroupBuys,
} from '../../services/groupBuyService.js';

const mockListGroupBuys = listGroupBuys as any;
const mockGetGroupBuyById = getGroupBuyById as any;
const mockJoinGroupBuy = joinGroupBuy as any;
const mockLeaveGroupBuy = leaveGroupBuy as any;
const mockGetUserJoinedGroupBuys = getUserJoinedGroupBuys as any;

describe('GroupBuys Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/group-buys', groupBuysRouter);

    // Error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      if (err.name === 'ZodError') {
        res.status(400).json({ ok: false, error: 'validation_error', details: err.errors });
        return;
      }
      if (err.statusCode) {
        res.status(err.statusCode).json({ ok: false, error: err.code || err.message });
        return;
      }
      res.status(500).json({ ok: false, error: err.message });
    });

    vi.clearAllMocks();
  });

  describe('GET /group-buys', () => {
    it('should return list of group buys with default pagination', async () => {
      const mockResult = {
        group_buys: [
          {
            id: 'gb1',
            title: 'Group Buy 1',
            item_type: 'ticket',
            status: 'active',
            current_amount: 0,
            current_quantity: 15,
            goal_quantity: 20,
            achievement_rate: 75,
            supporter_count: 15,
            start_date: '2024-01-01T00:00:00.000Z',
            end_date: '2024-01-31T23:59:59.000Z',
          },
          {
            id: 'gb2',
            title: 'Group Buy 2',
            item_type: 'product',
            status: 'active',
            current_amount: 0,
            current_quantity: 30,
            goal_quantity: 50,
            achievement_rate: 60,
            supporter_count: 30,
            start_date: '2024-01-05T00:00:00.000Z',
            end_date: '2024-02-05T23:59:59.000Z',
          },
        ],
        total: 2,
      };

      mockListGroupBuys.mockResolvedValue(mockResult);

      const response = await request(app).get('/group-buys');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockResult,
      });
      expect(mockListGroupBuys).toHaveBeenCalledWith({
        item_type: undefined,
        status: undefined,
        sort_by: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should filter by item_type', async () => {
      mockListGroupBuys.mockResolvedValue({ group_buys: [], total: 0 });

      const response = await request(app)
        .get('/group-buys')
        .query({ item_type: 'ticket' });

      expect(response.status).toBe(200);
      expect(mockListGroupBuys).toHaveBeenCalledWith(
        expect.objectContaining({ item_type: 'ticket' })
      );
    });

    it('should filter by status', async () => {
      mockListGroupBuys.mockResolvedValue({ group_buys: [], total: 0 });

      const response = await request(app)
        .get('/group-buys')
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      expect(mockListGroupBuys).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      );
    });

    it('should sort by sort_by parameter', async () => {
      mockListGroupBuys.mockResolvedValue({ group_buys: [], total: 0 });

      const response = await request(app)
        .get('/group-buys')
        .query({ sort_by: 'deadline' });

      expect(response.status).toBe(200);
      expect(mockListGroupBuys).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: 'deadline' })
      );
    });

    it('should handle custom pagination', async () => {
      mockListGroupBuys.mockResolvedValue({ group_buys: [], total: 0 });

      const response = await request(app)
        .get('/group-buys')
        .query({ limit: 50, offset: 20 });

      expect(response.status).toBe(200);
      expect(mockListGroupBuys).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 20 })
      );
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/group-buys')
        .query({ limit: 150 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should reject negative offset', async () => {
      const response = await request(app)
        .get('/group-buys')
        .query({ offset: -10 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('should handle service error', async () => {
      mockListGroupBuys.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/group-buys');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('GET /group-buys/joined', () => {
    it('should return user joined group buys', async () => {
      const mockResult = {
        group_buys: [
          {
            id: 'gb1',
            title: 'My Group Buy',
            item_type: 'ticket',
            status: 'active',
            current_amount: 0,
            current_quantity: 10,
            goal_quantity: 20,
            achievement_rate: 50,
            supporter_count: 10,
            start_date: '2024-01-01T00:00:00.000Z',
            end_date: '2024-01-31T23:59:59.000Z',
          },
        ],
        total: 1,
      };

      mockGetUserJoinedGroupBuys.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/group-buys/joined')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockResult,
      });
      expect(mockGetUserJoinedGroupBuys).toHaveBeenCalledWith('user123');
    });

    it('should use anonymous as default user_id', async () => {
      mockGetUserJoinedGroupBuys.mockResolvedValue({ group_buys: [], total: 0 });

      const response = await request(app).get('/group-buys/joined');

      expect(response.status).toBe(200);
      expect(mockGetUserJoinedGroupBuys).toHaveBeenCalledWith('anonymous');
    });

    it('should return empty list when user has no joined group buys', async () => {
      mockGetUserJoinedGroupBuys.mockResolvedValue({ group_buys: [], total: 0 });

      const response = await request(app)
        .get('/group-buys/joined')
        .set('x-user-id', 'user456');

      expect(response.status).toBe(200);
      expect(response.body.data.group_buys).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should handle service error', async () => {
      mockGetUserJoinedGroupBuys.mockRejectedValue(new Error('Query failed'));

      const response = await request(app)
        .get('/group-buys/joined')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('GET /group-buys/:id', () => {
    it('should return group buy by id', async () => {
      const mockGroupBuy = {
        id: 'gb123',
        title: 'Test Group Buy',
        subtitle: 'Great deal!',
        description: 'Detailed description',
        item_type: 'ticket',
        ticket_id: 'ticket-1',
        goal_quantity: 50,
        current_amount: 0,
        current_quantity: 25,
        achievement_rate: 50,
        supporter_count: 25,
        group_price: 15000,
        regular_price: 20000,
        max_discount_rate: 25,
        status: 'active',
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T23:59:59.000Z',
        thumbnail_url: 'https://example.com/image.jpg',
        tags: ['popular', 'limited'],
        maker_name: 'Test Maker',
      };

      mockGetGroupBuyById.mockResolvedValue(mockGroupBuy);

      const response = await request(app).get('/group-buys/gb123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockGroupBuy,
      });
      expect(mockGetGroupBuyById).toHaveBeenCalledWith('gb123');
    });

    it('should return 404 when group buy not found', async () => {
      mockGetGroupBuyById.mockResolvedValue(null);

      const response = await request(app).get('/group-buys/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        ok: false,
        error: 'not_found',
      });
    });

    it('should handle service error', async () => {
      mockGetGroupBuyById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/group-buys/gb123');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('POST /group-buys/:id/join', () => {
    it('should join group buy successfully', async () => {
      const mockUpdatedGroupBuy = {
        id: 'gb123',
        title: 'Test Group Buy',
        item_type: 'ticket',
        status: 'active',
        current_amount: 0,
        current_quantity: 26,
        goal_quantity: 50,
        achievement_rate: 52,
        supporter_count: 26,
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T23:59:59.000Z',
      };

      mockJoinGroupBuy.mockResolvedValue(mockUpdatedGroupBuy);

      const response = await request(app)
        .post('/group-buys/gb123/join')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        data: mockUpdatedGroupBuy,
      });
      expect(mockJoinGroupBuy).toHaveBeenCalledWith('gb123', 'user123');
    });

    it('should use anonymous as default user_id', async () => {
      const mockResult = {
        id: 'gb123',
        title: 'Test',
        item_type: 'ticket',
        status: 'active',
        current_amount: 0,
        current_quantity: 1,
        goal_quantity: 10,
        achievement_rate: 10,
        supporter_count: 1,
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T23:59:59.000Z',
      };

      mockJoinGroupBuy.mockResolvedValue(mockResult);

      const response = await request(app).post('/group-buys/gb123/join');

      expect(response.status).toBe(200);
      expect(mockJoinGroupBuy).toHaveBeenCalledWith('gb123', 'anonymous');
    });

    it('should handle already joined error (409)', async () => {
      const error: any = new Error('Already joined');
      error.statusCode = 409;
      error.code = 'already_joined';

      mockJoinGroupBuy.mockRejectedValue(error);

      const response = await request(app)
        .post('/group-buys/gb123/join')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('already_joined');
    });

    it('should handle not found error (404)', async () => {
      const error: any = new Error('Group buy not found');
      error.statusCode = 404;
      error.code = 'not_found';

      mockJoinGroupBuy.mockRejectedValue(error);

      const response = await request(app)
        .post('/group-buys/nonexistent/join')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('not_found');
    });

    it('should handle service error', async () => {
      mockJoinGroupBuy.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .post('/group-buys/gb123/join')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('DELETE /group-buys/:id/leave', () => {
    it('should leave group buy successfully', async () => {
      mockLeaveGroupBuy.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/group-buys/gb123/leave')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockLeaveGroupBuy).toHaveBeenCalledWith('gb123', 'user123');
    });

    it('should use anonymous as default user_id', async () => {
      mockLeaveGroupBuy.mockResolvedValue(undefined);

      const response = await request(app).delete('/group-buys/gb123/leave');

      expect(response.status).toBe(200);
      expect(mockLeaveGroupBuy).toHaveBeenCalledWith('gb123', 'anonymous');
    });

    it('should handle not found error (404)', async () => {
      const error: any = new Error('Group buy not found');
      error.statusCode = 404;
      error.code = 'not_found';

      mockLeaveGroupBuy.mockRejectedValue(error);

      const response = await request(app)
        .delete('/group-buys/nonexistent/leave')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('not_found');
    });

    it('should handle user not in group buy', async () => {
      mockLeaveGroupBuy.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/group-buys/gb123/leave')
        .set('x-user-id', 'user-not-in-group');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it('should handle service error', async () => {
      mockLeaveGroupBuy.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .delete('/group-buys/gb123/leave')
        .set('x-user-id', 'user123');

      expect(response.status).toBe(500);
      expect(response.body.ok).toBe(false);
    });
  });
});
