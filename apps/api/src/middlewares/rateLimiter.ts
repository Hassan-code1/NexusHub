import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from '../config/logger';

// Connect to the Redis container running in Docker
const redisClient = new Redis('redis://localhost:6379');

redisClient.on('error', (err) => logger.error('Redis Rate Limiter Error:', err));

//Rate Limiter For Authentication EndPoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Known typing mismatch in rate-limit-redis
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window`
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false,
});