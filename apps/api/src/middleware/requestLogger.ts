import pinoHttp from 'pino-http';
import { logger } from '@ujuz/config';

export const requestLogger = pinoHttp({
  logger: logger as any
});
