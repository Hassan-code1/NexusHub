import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${req.method} ${req.path} - ${err.message}`);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};