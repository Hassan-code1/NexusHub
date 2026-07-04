import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID : z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  FRONTEND_URL : z.string().url().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);