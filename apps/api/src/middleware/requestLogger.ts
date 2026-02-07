import pinoHttp from 'pino-http';
import { logger } from '@ujuz/config';

export const requestLogger = pinoHttp({
  // @ts-expect-error pino/pino-http type version mismatch (Logger<never, boolean> vs Logger<never>)
  logger,
});
