import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const secret = process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me';

export function signToken(userId: string) {
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return next();

  try {
    const payload = jwt.verify(match[1], secret) as { userId: string };
    req.userId = payload.userId;
  } catch {
    // ignore invalid token
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: 'UNAUTHORIZED' });
  next();
}
