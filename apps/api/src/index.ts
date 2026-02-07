import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import { env, logger } from '@ujuz/config';
import { connectMongo, closeMongo, ensureIndexes } from '@ujuz/db';
import { corsMiddleware } from './middleware/cors.js';
import { helmetMiddleware } from './middleware/helmet.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { deviceAuth } from './middleware/deviceAuth.js';
import healthRouter from './routes/health.js';
import placesRouter from './routes/places.js';
import insightsRouter from './routes/insights.js';
import groupBuysRouter from './routes/groupBuys.js';
import peerRouter from './routes/peer.js';
import admissionRouter from './routes/admission.js';
import admissionV1Router from './routes/admissionV1.js';
import alertsRouter from './routes/alerts.js';
import botRouter from './routes/bot.js';
import subscriptionsRouter from './routes/subscriptions.js';
import usersRouter from './routes/users.js';

// UJUz Hybrid (partners/referrals/external ingest)
import partnersRouter from './routes/partners.js';
import referralsRouter from './routes/referrals.js';
import widgetsRouter from './routes/widgets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.disable('x-powered-by');

// Middleware order: helmet -> cors -> json -> requestLogger -> routes -> errorHandler
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// ChatGPT Connector: serve ai-plugin.json and openapi.yaml
app.use('/.well-known', express.static(join(__dirname, '../public/.well-known')));
app.use('/openapi.yaml', (_req, res) => {
  res.sendFile(join(__dirname, '../public/openapi.yaml'));
});

// Public routes
app.use(healthRouter);

// UJUz Hybrid public endpoints (no deviceAuth; each has its own auth/rate-limit)
app.use('/api/ujuz/referrals', referralsRouter);
app.use('/api/ujuz/widgets', widgetsRouter);
app.use('/api/ujuz/partners', partnersRouter);

// Device auth protected routes (existing)
app.use('/places', deviceAuth, placesRouter);
app.use('/insights', deviceAuth, insightsRouter);
app.use('/group-buys', deviceAuth, groupBuysRouter);
app.use('/peer', deviceAuth, peerRouter);

// UJUz core feature routes
app.use('/api/ujuz/admission', deviceAuth, admissionRouter);
app.use('/api/ujuz/v1', deviceAuth, admissionV1Router);
app.use('/api/ujuz/alerts', deviceAuth, alertsRouter);
app.use('/api/ujuz/bot', deviceAuth, botRouter);
app.use('/api/ujuz/subscriptions', deviceAuth, subscriptionsRouter);
app.use('/api/ujuz/users', deviceAuth, usersRouter);

app.use(errorHandler);

let server: ReturnType<typeof app.listen> | null = null;
const mongoConfigured = Boolean(env.MONGODB_URI && env.MONGODB_DB_NAME);

(async function main() {
  // Security: warn if device auth is off in production
  if (env.NODE_ENV === 'production' && !env.DEVICE_AUTH_ENABLED) {
    logger.warn('DEVICE_AUTH_ENABLED is false in production — all deviceAuth routes are unprotected');
  }

  if (mongoConfigured) {
    try {
      await connectMongo(env.MONGODB_URI as string, env.MONGODB_DB_NAME as string, 5);
      await ensureIndexes();
      logger.info('MongoDB connected and indexes ensured');
    } catch (error) {
      logger.fatal({ error }, 'MongoDB connection failed during startup - aborting');
      // Exit non-zero to avoid running in degraded mode when DB is required
      process.exit(1);
    }
  }

  server = app.listen(env.PORT, env.HOST, () => {
    logger.info({ host: env.HOST, port: env.PORT }, 'Server listening');
  });
})();

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down');
  if (server) {
    server.close(async () => {
      await closeMongo();
      process.exit(0);
    });
  } else {
    // If server not started, still ensure mongo client closed
    closeMongo().then(() => process.exit(0));
  }

  setTimeout(() => {
    logger.warn('Force exiting after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
