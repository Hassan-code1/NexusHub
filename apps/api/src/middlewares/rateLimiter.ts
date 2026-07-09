/**
 * @file rateLimiter.ts  (middlewares/rateLimiter.ts)
 * @description Redis-backed rate limiter for sensitive authentication endpoints.
 *
 * Why Redis (not in-memory)?
 *  In-memory rate limiters are reset on every server restart and do not work
 *  across multiple API instances (horizontal scaling). Storing counters in Redis
 *  gives us persistence and cross-instance accuracy.
 *
 * Configuration:
 *  - Store  : Redis via ioredis (connected to the Docker redis container)
 *  - Window : 15 minutes (sliding)
 *  - Max    : 5 requests per IP per window
 *  - Headers: Standard `RateLimit-*` headers are sent; legacy `X-RateLimit-*` are not.
 *
 * Applied to (via routes/auth.ts):
 *  POST /api/auth/register
 *  POST /api/auth/login
 *  POST /api/auth/forgot-password
 *  POST /api/auth/reset-password
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from '../config/logger';

// Connect to the Redis container running in Docker
// The URI matches the redis service in docker-compose.yml (port 6379)
const redisClient = new Redis('redis://localhost:6379');

// Log Redis connection errors so they surface in application logs without crashing
redisClient.on('error', (err) => logger.error('Redis Rate Limiter Error:', err));

/**
 * authLimiter
 *
 * Rate-limiting middleware for authentication endpoints.
 * Tracks request counts by IP address in Redis.
 * Responds with HTTP 429 and a JSON error body when the limit is exceeded.
 */
//Rate Limiter For Authentication EndPoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Known typing mismatch in rate-limit-redis
    // rate-limit-redis expects a `sendCommand` function whose signature differs
    // slightly from ioredis's `call()` method; the runtime behavior is correct.
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window`
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,  // Return RateLimit-* headers per RFC 6585
  legacyHeaders: false,   // Disable deprecated X-RateLimit-* headers
});