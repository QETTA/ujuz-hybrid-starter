import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '@ujuz/config';
import { AppError } from '@ujuz/shared';
import { Sentry, sentryEnabled } from '../sentry.js';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Invalid request',
        details: error.flatten()
      }
    });
    return;
  }

  if (error instanceof AppError) {
    // Report server errors (5xx) to Sentry, skip client errors (4xx)
    if (sentryEnabled && error.statusCode >= 500) {
      Sentry.captureException(error);
    }
    res.status(error.statusCode).json({
      error: {
        code: error.code ?? 'app_error',
        message: error.message
      }
    });
    return;
  }

  // Unexpected errors — always report to Sentry
  if (sentryEnabled) {
    Sentry.captureException(error);
  }
  logger.error({ error }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Internal server error'
    }
  });
}
