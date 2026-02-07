import cors from 'cors';
import { env } from '@ujuz/config';

const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

export const corsMiddleware = cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true
});
