import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

export function requireAdminKey(req: Request, _res: Response, next: NextFunction) {
  const configured = env.ADMIN_API_KEY;
  if (!configured) {
    throw new AppError('ADMIN_API_KEY is not configured', 503, 'admin_key_not_configured');
  }

  const provided = req.header('x-admin-key') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(configured);
  const isValid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!isValid) {
    throw new AppError('Unauthorized', 401, 'unauthorized');
  }

  next();
}
