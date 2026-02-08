import crypto from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '@ujuz/config';

export const requestLogger = pinoHttp({
  // @ts-expect-error pino/pino-http type version mismatch (Logger<never, boolean> vs Logger<never>)
  logger,
  genReqId(req, res) {
    const existing = req.headers['x-request-id'];
    // Accept client-provided request ID only if it's a reasonable length
    const id = (typeof existing === 'string' && existing.length <= 128 && existing) || crypto.randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
});
