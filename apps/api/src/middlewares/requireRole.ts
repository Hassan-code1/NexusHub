/**
 * @file requireRole.ts  (middlewares/requireRole.ts)
 * @description Role-Based Access Control (RBAC) middleware for workspace-scoped routes.
 *
 * How it works:
 *  1. Reads `req.user.id` (populated by requireAuth) and `:workspaceId` from
 *     the route params (e.g. DELETE /api/workspaces/:workspaceId).
 *  2. Queries the WorkspaceMember table using the composite unique key
 *     (workspace_id, user_id) for a single efficient lookup.
 *  3. Verifies the member's role is in the `allowedRoles` array.
 *  4. Calls next() only when all checks pass; otherwise returns 401 or 403.
 *
 * Usage:
 *  // Only ADMIN members can delete a workspace
 *  router.delete('/:workspaceId', requireAuth, requireRole(['ADMIN']), handler);
 *
 *  // ADMIN and MEMBER can access a route
 *  router.get('/:workspaceId/channels', requireAuth, requireRole(['ADMIN', 'MEMBER']), handler);
 *
 * Dependency ordering:
 *  requireAuth MUST run before requireRole. requireRole reads req.user.id which
 *  is only set after requireAuth successfully verifies the JWT.
 *
 * Failure modes:
 *  - Missing userId or workspaceId   → 401 "Unauthorized or missing workspace ID"
 *  - User is not a workspace member  → 403 "You are not a member of this workspace"
 *  - User's role is not in allowedRoles → 403 "Insufficient permissions"
 *  - Database error                  → 500 "Internal server error" (logged)
 *
 * Route param assumption:
 *  This middleware assumes the route defines `:workspaceId` as a URL parameter.
 *  It will not work correctly on routes without this param.
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../utils/db';
import { logger } from '../config/logger';

/**
 * requireRole
 *
 * Higher-order middleware factory that returns an Express middleware function.
 * The returned middleware enforces that the authenticated user holds one of the
 * specified roles within the workspace identified by `:workspaceId`.
 *
 * @param allowedRoles - Array of Prisma Role enum values that are permitted.
 *                       Example: ['ADMIN'] or ['ADMIN', 'MEMBER']
 * @returns Express async middleware function.
 */
export const requireRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      // Assumes the route is structured as /api/workspaces/:workspaceId/...
      const workspaceId = req.params.workspaceId;

      // Guard: both values must be present before we can check membership
      if (!userId || !workspaceId) {
        res.status(401).json({ success: false, message: 'Unauthorized or missing workspace ID' });
        return;
      }

      // Single-row lookup using the composite unique index on (workspace_id, user_id)
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspace_id_user_id: {
            workspace_id: workspaceId,
            user_id: userId,
          },
        },
      });

      // No membership record means the user is not part of this workspace at all
      if (!membership) {
        res.status(403).json({ success: false, message: 'You are not a member of this workspace' });
        return;
      }

      // Membership exists but the role is not in the allowed set
      if (!allowedRoles.includes(membership.role)) {
        res.status(403).json({ success: false, message: 'Insufficient permissions' });
        return;
      }

      // All checks passed — hand off to the next handler
      next();
    } catch (error) {
      // Log RBAC failures so they are visible in monitoring; return a generic 500
      logger.error(`RBAC Middleware Error: ${error}`);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};