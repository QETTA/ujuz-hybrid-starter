import cors from 'cors';
import { env, logger } from '@ujuz/config';

const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

if (allowedOrigins.length === 0 && env.NODE_ENV === 'production') {
  logger.warn('CORS_ORIGIN is not set — all cross-origin requests will be blocked in production');
}

export const corsMiddleware = cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
});
