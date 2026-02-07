import type { NextFunction, Request, Response } from 'express';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { env } from '@ujuz/config';

export function deviceAuth(req: Request, res: Response, next: NextFunction): void {
  if (!env.DEVICE_AUTH_ENABLED) {
    next();
    return;
  }

  const deviceId = req.header('x-device-id');

  if (!deviceId || !uuidValidate(deviceId) || uuidVersion(deviceId) !== 4) {
    res.status(401).json({ ok: false, error: 'invalid_device_id' });
    return;
  }

  next();
}
