import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import healthRouter from '../health.js';

vi.mock('@ujuz/config', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  get env() {
    return {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost:27017',
      MONGODB_DB_NAME: 'test-db',
      GIT_SHA: process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.SOURCE_VERSION,
    };
  },
}));

vi.mock('@ujuz/db', () => ({
  connectMongo: vi.fn(),
  pingMongo: vi.fn(),
}));

import { connectMongo, pingMongo } from '@ujuz/db';
import { logger } from '@ujuz/config';

describe('Health Route', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(healthRouter);  // Mount at root, not at /health
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 with ok:true when MongoDB is healthy', async () => {
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: true, latencyMs: 42 });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ok: true,
        version: expect.any(String),
        timestamp: expect.any(String),
        uptime_seconds: expect.any(Number),
        node_env: 'test',
        mongo: { ok: true, latencyMs: 42 },
      });
    });

    it('should include gitSha when GIT_SHA env var is set', async () => {
      process.env.GIT_SHA = 'abc123def456';
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: true });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.gitSha).toBe('abc123def456');

      delete process.env.GIT_SHA;
    });

    it('should include gitSha from VERCEL_GIT_COMMIT_SHA', async () => {
      process.env.VERCEL_GIT_COMMIT_SHA = 'vercel-sha-789';
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: true });

      const response = await request(app).get('/health');

      expect(response.body.gitSha).toBe('vercel-sha-789');

      delete process.env.VERCEL_GIT_COMMIT_SHA;
    });

    it('should include gitSha from SOURCE_VERSION', async () => {
      process.env.SOURCE_VERSION = 'source-version-xyz';
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: true });

      const response = await request(app).get('/health');

      expect(response.body.gitSha).toBe('source-version-xyz');

      delete process.env.SOURCE_VERSION;
    });

    it('should return 503 when MongoDB ping fails', async () => {
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: false });

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        ok: false,
        mongo: { ok: false },
      });
    });

    it('should return 503 when MongoDB connection throws error', async () => {
      (connectMongo as any).mockRejectedValue(new Error('Connection timeout'));
      (pingMongo as any).mockResolvedValue({ ok: false });

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        ok: false,
        mongo: { ok: false, error: 'connection_failed' },
      });
      expect(logger.error).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        'Mongo connection failed'
      );
    });

    it('should include uptime_seconds as positive integer', async () => {
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: true });

      const response = await request(app).get('/health');

      expect(response.body.uptime_seconds).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(response.body.uptime_seconds)).toBe(true);
    });

    it('should return valid ISO 8601 timestamp', async () => {
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: true });

      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should return version matching semantic versioning pattern', async () => {
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: true });

      const response = await request(app).get('/health');

      expect(response.body.version).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it('should handle MongoDB ping with latency information', async () => {
      (connectMongo as any).mockResolvedValue({});
      (pingMongo as any).mockResolvedValue({ ok: true, latencyMs: 125 });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.mongo.latencyMs).toBe(125);
    });
  });
});
