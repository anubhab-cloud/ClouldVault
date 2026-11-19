import { Request, Response, NextFunction } from 'express';
import { sendError } from '../common/response.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  logger.error(`Unhandled error on ${req.method} ${req.url}:`, err.message);

  if (err instanceof ZodError) {
    return sendError(
      res,
      'VALIDATION_FAILED',
      'Request input validation failed',
      422,
      err.errors
    );
  }

  // Fallback 500 error
  return sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected internal server error occurred',
    500
  );
}
