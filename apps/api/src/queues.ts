import { Queue } from 'bullmq';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const alertsQueue = new Queue('alerts', {
  connection: { url: redisUrl }
});

export const aiQueue = new Queue('ai', {
  connection: { url: redisUrl }
});
