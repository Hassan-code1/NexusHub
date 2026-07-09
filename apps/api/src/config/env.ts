/**
 * @file env.ts  (config/env.ts)
 * @description Type-safe environment variable validation using Zod.
 *
 * Why Zod for env validation?
 *  Raw `process.env` values are all `string | undefined`. Without validation,
 *  missing or malformed env vars cause cryptic runtime errors deep in the app.
 *  Parsing at startup with Zod:
 *    - Fails fast with a clear error message if any required variable is absent.
 *    - Provides TypeScript types for every env value (no more `string | undefined`).
 *    - Enforces constraints (e.g. JWT_SECRET must be ≥ 32 chars, PORT is a string).
 *
 * Usage:
 *  import { env } from '../config/env';
 *  env.PORT           // string
 *  env.NODE_ENV       // 'development' | 'production' | 'test'
 *  env.JWT_SECRET     // string (guaranteed ≥ 32 chars)
 *
 * The `dotenv.config()` call loads variables from the `.env` file into
 * `process.env` before the schema parses them. In production, variables
 * are injected directly by the hosting platform (no .env file needed).
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file into process.env (no-op if the file doesn't exist)
dotenv.config();

/**
 * envSchema
 *
 * Zod schema that defines the shape and constraints of every
 * environment variable the application depends on.
 * Parsing will throw a ZodError at startup if validation fails.
 */
const envSchema = z.object({
  // HTTP server port — defaults to 5000 if not set
  PORT: z.string().default('5000'),

  // Controls logging verbosity and stack-trace exposure in error responses
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // PostgreSQL connection string (required, must be a valid URL)
  DATABASE_URL: z.string().url(),

  // Secret used to sign short-lived access tokens (min 32 chars for HS256 security)
  JWT_SECRET: z.string().min(32),

  // Secret used to sign long-lived refresh tokens (separate secret limits blast radius)
  REFRESH_SECRET: z.string().min(32),

  // SMTP configuration for transactional email (password reset OTPs)
  SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: z.coerce.number().default(587),  // coerce converts the string from process.env to number
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_SENDER: z.string().email("Smtp Sender must be a valid Email"),

  // The web application URL — used for CORS, OAuth redirects, and email links
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),
});

/**
 * Parsed and validated environment configuration.
 * Throws at module load time if any variable is missing or invalid.
 * Import this object instead of accessing process.env directly.
 */
export const env = envSchema.parse(process.env);