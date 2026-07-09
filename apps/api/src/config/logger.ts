/**
 * @file logger.ts  (config/logger.ts)
 * @description Winston-based structured logger for the NexusHub API.
 *
 * Log levels used across the application:
 *  - error   : Unhandled exceptions, DB failures, SMTP errors
 *  - warn    : (reserved for future use, e.g. deprecated endpoint calls)
 *  - info    : Server startup, health pings, successful email delivery
 *  - http    : Every inbound HTTP request (piped from Morgan)
 *  - debug   : Verbose development-only diagnostics
 *
 * Level selection:
 *  - development → 'debug' (all levels printed)
 *  - production  → 'info'  (debug and http suppressed)
 *
 * Output format:
 *  - Console transport uses colorized, human-readable output:
 *    [2026-07-09T09:00:00.000Z] info: API Server running on port 5000
 *  - The underlying JSON format is retained on the logger instance, making it
 *    easy to add a file or cloud transport (e.g. Datadog, Logtail) later
 *    without changing call sites.
 *
 * Usage:
 *  import { logger } from '../config/logger';
 *  logger.info('Something happened');
 *  logger.error('Something broke', err);
 *  logger.http('GET /api/health 200 1ms');  // used by Morgan stream
 */

import winston from 'winston';
import { env } from './env';

export const logger = winston.createLogger({
  // In development, capture all levels including verbose debug messages.
  // In production, suppress debug/http to reduce log noise and cost.
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',

  // Base format for all transports: ISO timestamp + JSON structure
  // This makes logs machine-parseable by log aggregation services
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),

  transports: [
    // Console transport: overrides the base format with a human-readable
    // colorized output for local development readability
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),   // applies ANSI color codes per level
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    }),
    // Add additional transports here for production (file, Datadog, etc.):
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});