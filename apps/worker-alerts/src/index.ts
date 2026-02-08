import { Worker } from 'bullmq';
import { connectMongo, closeMongo, getMongoDb } from '@ujuz/db';
import { env, logger } from '@ujuz/config';
import { collectSnapshots, updateTrainingDataBlocks } from './snapshotWorker.js';

async function main() {
  // 1. MongoDB 연결 (snapshotWorker 필수)
  if (env.MONGODB_URI && env.MONGODB_DB_NAME) {
    await connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME, 5);
    logger.info('Alert worker connected to MongoDB');
  }

  const db = getMongoDb();
  if (!db) {
    logger.fatal('MongoDB not available - Alert worker requires database');
    process.exit(1);
  }

  // 2. BullMQ Worker (DB 준비 후)
  const worker = new Worker(
    'alerts',
    async (job) => {
      const jobType = job.name ?? job.data?.type;

      switch (jobType) {
        case 'collect_snapshots': {
          const result = await collectSnapshots();
          logger.info({ result }, 'Snapshot collection job completed');
          return result;
        }

        case 'update_training_blocks': {
          const updated = await updateTrainingDataBlocks();
          logger.info({ updated }, 'Training data blocks job completed');
          return { updated };
        }

        default:
          logger.warn({ jobType }, 'Unknown job type');
          return undefined;
      }
    },
    { connection: { url: env.REDIS_URL } },
  );

  worker.on('completed', (job) => logger.info({ jobId: job.id, name: job.name }, 'Job completed'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, name: job?.name, err }, 'Job failed'));

  // 3. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Alert worker shutting down');
    await worker.close();
    await closeMongo();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  logger.info('Alert worker started');
}

main().catch((err) => {
  console.error('Failed to start alert worker:', err);
  process.exit(1);
});
