/**
 * Shared utility for x-user-id header validation
 * Prevents CRITICAL security issues: missing user validation, auth bypass
 */

import type { Request, Response } from 'express';

export function getUserId(req: Request, res: Response): string | null {
  const userId = req.header('x-user-id');

  if (!userId || userId.length < 1 || userId.length > 200) {
    res.status(401).json({
      ok: false,
      error: 'missing_user_id',
      message: 'x-user-id header required'
    });
    return null;
  }

  return userId;
}
