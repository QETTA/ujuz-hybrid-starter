import 'dotenv/config';
import { Worker } from 'bullmq';
import { logger } from '@ujuz/config';
import { collectSnapshots, updateTrainingDataBlocks } from './snapshotWorker.js';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

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
    }
  },
  { connection: { url: redisUrl } }
);

worker.on('completed', (job) => logger.info({ jobId: job.id, name: job.name }, 'Job completed'));
worker.on('failed', (job, err) => logger.error({ jobId: job?.id, name: job?.name, err }, 'Job failed'));

logger.info('Alert worker started');
