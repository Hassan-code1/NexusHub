/**
 * @file db.ts  (utils/db.ts)
 * @description Prisma Client singleton with the native PostgreSQL adapter.
 *
 * Why @prisma/adapter-pg?
 *  The standard Prisma Client embeds its own Rust-based query engine binary.
 *  The `@prisma/adapter-pg` driver adapter replaces that binary with a pure
 *  Node.js pg (node-postgres) driver, which:
 *    - Reduces cold-start time (no native binary to load).
 *    - Works in edge runtimes that forbid native binaries.
 *    - Allows full control over the pg connection pool.
 *
 * Pattern — singleton export:
 *  A single PrismaClient instance is created at module load time and exported
 *  as the default export. Node's module caching ensures every file that imports
 *  this module receives the same instance, preventing connection pool exhaustion
 *  from multiple PrismaClient instances.
 *
 * `verifyDatabaseConnection`:
 *  Called once at application startup (in index.ts) before the HTTP server
 *  starts listening. If the DB is unreachable, the process exits immediately
 *  rather than accepting requests that will all fail.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Instantiate the modern Postgres adapter
// PrismaPg wraps the pg driver and adapts it to Prisma's driver interface
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Pass the adapter directly into the Prisma Client
// This replaces the default query-engine binary with the pure-JS pg driver
const prisma = new PrismaClient({ adapter });

/**
 * verifyDatabaseConnection
 *
 * Attempts to connect to the database and run a lightweight query.
 * Logs the host (extracted from the DATABASE_URL) without exposing credentials.
 *
 * @returns Resolves with connection metadata on success.
 * @throws  Calls process.exit(1) on failure — the server should not start
 *          if the database is unreachable.
 */
export const verifyDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    // Extract host for safe logging — never log the full connection string
    const dbUrl = env.DATABASE_URL;
    const hostStr = dbUrl.includes('@') ? dbUrl.split('@')[1].split('/')[0] : 'unknown-host';
    
    logger.info(`Database connected successfully via adapter to host: ${hostStr}`);
    
    return {
      status: 'connected',
      userCount,
      host: hostStr
    };
  } catch (error) {
    logger.error('Failed to connect to the database', error);
    // Hard exit: an API that can't reach its DB is non-functional
    process.exit(1);
  }
};

// Default export: the singleton Prisma Client used throughout the application
export default prisma;