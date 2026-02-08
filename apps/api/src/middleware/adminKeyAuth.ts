import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

export function requireAdminKey(req: Request, _res: Response, next: NextFunction) {
  const configured = env.ADMIN_API_KEY;
  if (!configured) {
    // Return generic 401 — never reveal whether the key is configured
    throw new AppError('Unauthorized', 401, 'unauthorized');
  }

  const provided = req.header('x-admin-key') ?? '';
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(configured).digest();
  const isValid = crypto.timingSafeEqual(a, b);

  if (!isValid) {
    throw new AppError('Unauthorized', 401, 'unauthorized');
  }

  next();
}
