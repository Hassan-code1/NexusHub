/**
 * @file workspace.ts  (routes/workspace.ts)
 * @description Express router for all Workspace endpoints.
 *
 * All routes here are mounted under the `/api/workspaces` prefix (see index.ts).
 * Authentication is enforced globally via `router.use(requireAuth)` so every
 * route in this file requires a valid Bearer JWT — no route here is public.
 *
 * Route summary:
 *  POST   /          — Create a new workspace (authenticated user becomes ADMIN)
 *  GET    /          — List all workspaces the current user is a member of
 *  DELETE /:workspaceId — Delete a workspace (ADMIN role required)
 *
 * Middleware applied:
 *  - requireAuth   : Applied globally to all routes in this router.
 *                    Validates the Bearer JWT and populates req.user.
 *  - requireRole   : Applied per-route to enforce workspace-level RBAC.
 *                    Reads `:workspaceId` from the URL and checks the user's
 *                    role in the WorkspaceMember table before allowing access.
 *
 * RBAC note:
 *  requireRole(['ADMIN']) means only workspace members with role === 'ADMIN'
 *  can access that route. Non-members receive 403 "not a member"; members with
 *  insufficient role receive 403 "insufficient permissions".
 */

import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { requireRole } from '../middlewares/requireRole';
import { createWorkspace, getUserWorkspaces } from '../controllers/workspace.controller';

const router = Router();

// Enforce authentication globally on all workspace routes
// Any request without a valid Bearer token is rejected here before reaching handlers
router.use(requireAuth);

// POST /api/workspaces — Create a workspace; the caller becomes the ADMIN owner
router.post('/', createWorkspace);

// GET /api/workspaces — List all workspaces the authenticated user belongs to
router.get('/', getUserWorkspaces);

// DELETE /api/workspaces/:workspaceId — Delete a workspace (ADMIN-only)
// Example placeholder for RBAC protection testing
router.delete('/:workspaceId', requireRole(['ADMIN']), (req, res) => {
  res.json({ success: true, message: 'Workspace deleted successfully.' });
});

export default router;