import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REFRESH_SECRET: z.string().min(32),
  SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_SENDER: z.string().email("Smtp Sender must be a valid Email"),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),
});

export const env = envSchema.parse(process.env);