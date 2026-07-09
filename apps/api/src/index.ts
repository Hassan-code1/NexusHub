/**
 * @file index.ts
 * @description Application entry point for the NexusHub API server.
 *
 * Responsibilities:
 *  - Bootstraps the Express application with all global middleware.
 *  - Mounts feature routers under their respective URL prefixes.
 *  - Verifies the PostgreSQL database connection before accepting traffic.
 *  - Starts the HTTP server only after a successful DB handshake.
 *
 * Middleware order (matters):
 *  1. helmet    — sets security-related HTTP headers
 *  2. cors      — enables cross-origin resource sharing
 *  3. json      — parses incoming JSON request bodies
 *  4. cookies   — parses Cookie header into req.cookies
 *  5. morgan    — HTTP request logging (piped to Winston)
 *  6. routers   — feature-specific route handlers
 *  7. error     — global error handler (must be last)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { logger } from './config/logger';

import { errorHandler } from './middlewares/errorHandler';

import { verifyDatabaseConnection } from './utils/db'; // Import the new DB utility

import healthRouter from './routes/health';
import authRouter from './routes/auth';

const app = express();

// --- Global Middleware ---

// helmet sets security headers (X-Frame-Options, CSP, HSTS, etc.)
app.use(helmet());

// cors allows the frontend origin to call this API cross-origin
app.use(cors());

// Parse JSON request bodies (needed for all POST/PUT/PATCH routes)
app.use(express.json());

// Parse the Cookie header so req.cookies is populated (used for refreshToken)
app.use(cookieParser());

// Morgan logs every HTTP request; the output is piped into Winston
// so it appears alongside application logs in the same format
app.use(
  morgan('dev', {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

// --- Route Mounting ---

// System health check — used by load balancers and uptime monitors
app.use('/api/health', healthRouter);

// All authentication & identity endpoints (register, login, OAuth, etc.)
app.use('/api/auth/', authRouter);

// --- Global Error Handler ---
// Must be registered AFTER all routes so it catches errors passed via next(err)
app.use(errorHandler);

// --- Server Boot ---
// The DB connection is verified before the server begins accepting requests.
// If the DB is unreachable, verifyDatabaseConnection() calls process.exit(1).
verifyDatabaseConnection().then(() => {
  app.listen(env.PORT, () => {
    logger.info(`API Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
});