import { Router } from 'express';
import { env } from '@ujuz/config';
import { connectMongo, pingMongo } from '@ujuz/db';
import { logger } from '@ujuz/config';

const router = Router();

const startedAt = Date.now();

router.get('/health', async (_req, res) => {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);

  const response: Record<string, unknown> = {
    ok: true,
    timestamp,
    version: 'v1.5.4',
    uptime_seconds: uptimeSeconds,
    node_env: env.NODE_ENV,
  };

  const gitSha = env.GIT_SHA;

  if (gitSha) {
    response.gitSha = gitSha;
  }

  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    response.ok = false;
    response.mongo = { ok: false, reason: 'not_configured' };
    res.status(503).json(response);
    return;
  }

  try {
    await connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
    const ping = await pingMongo();
    response.mongo = ping;
    if (!ping.ok) {
      response.ok = false;
      res.status(503).json(response);
      return;
    }
    res.json(response);
  } catch (error) {
    logger.error({ error }, 'Mongo connection failed');
    response.ok = false;
    response.mongo = { ok: false, error: 'connection_failed' };
    res.status(503).json(response);
  }
});

export default router;
