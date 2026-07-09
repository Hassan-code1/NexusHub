/**
 * @file errorHandler.ts  (middlewares/errorHandler.ts)
 * @description Global Express error-handling middleware.
 *
 * Placement: MUST be the last `app.use()` call in index.ts.
 * Express identifies a 4-argument function as an error handler.
 *
 * Behaviour:
 *  - Logs every unhandled error with full method + path context via Winston.
 *  - Preserves any status code already set on `res` (e.g. res.status(404).send()
 *    before throwing); falls back to 500 if the response is still in the
 *    default 200 state.
 *  - In production, the stack trace is replaced with an emoji to avoid
 *    leaking internal implementation details to clients.
 *  - In development, the full stack trace is included in the JSON response
 *    for easier debugging.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';

/**
 * errorHandler
 *
 * Catches any error passed via `next(error)` in route handlers or middleware
 * and returns a consistent JSON error envelope to the client.
 *
 * @param err  - The thrown or forwarded Error object
 * @param req  - The Express request (used for logging method + path)
 * @param res  - The Express response (used to send the error JSON)
 * @param next - Required signature for Express error handlers (even if unused)
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Structured log: includes HTTP method and path for easy log correlation
  logger.error(`${req.method} ${req.path} - ${err.message}`);

  // Respect any status code set before the error was thrown;
  // only fall back to 500 if the response is still on the default 200.
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Redact the stack trace in production to prevent internal detail leakage
    stack: env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};