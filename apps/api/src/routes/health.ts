/**
 * @file health.ts  (routes/health.ts)
 * @description Minimal health-check router mounted at GET /api/health.
 *
 * Purpose:
 *  - Gives load balancers (AWS ALB, nginx, etc.) and uptime monitors
 *    (UptimeRobot, Checkly) a cheap endpoint to probe.
 *  - Does NOT check DB or Redis connectivity — add a "deep" health route
 *    (e.g. GET /api/health/deep) for that.
 *
 * HTTP 200 { status: 'ok' } indicates the Node.js process is alive
 * and the Express event loop is accepting connections.
 */

import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/health
 *
 * Shallow liveness probe — confirms the HTTP server is reachable.
 * Logs a ping at INFO level for observability.
 */
router.get('/', (req: Request, res: Response) => {
  logger.info('Health check pinged');
  res.status(200).json({ status: 'ok' });
});

export default router;