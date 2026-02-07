import type { Request, Response, NextFunction } from 'express';

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });

  const got = req.header('x-admin-key');
  if (!got || got !== expected) return res.status(401).json({ error: 'UNAUTHORIZED' });

  next();
}
