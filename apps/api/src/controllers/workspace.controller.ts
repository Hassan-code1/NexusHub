/**
 * @file workspace.controller.ts
 * @description Request handlers for Workspace management.
 *
 * Exported handlers (mounted via routes/workspace.ts):
 *  - createWorkspace    POST /api/workspaces
 *  - getUserWorkspaces  GET  /api/workspaces
 *
 * All handlers require a valid JWT (enforced at the router level via requireAuth).
 * The authenticated user's ID is read from `req.user.id`, which is populated by
 * the requireAuth middleware after JWT verification.
 *
 * Design decisions:
 *  - Workspace creation uses a Prisma $transaction to guarantee that if the
 *    WorkspaceMember insert fails, the Workspace row is also rolled back —
 *    preventing orphaned workspaces with no ADMIN.
 *  - Slugs are generated with a random 6-char hex suffix to avoid collisions
 *    while remaining human-readable (e.g. "engineering-team-a1b2c3").
 *  - getUserWorkspaces fetches via the WorkspaceMember junction table so it
 *    returns all workspaces the user belongs to (owned or joined), not just owned.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';
import crypto from 'crypto';

/**
 * generateSlug
 *
 * Converts a workspace name into a URL-safe slug and appends a 3-byte (6-char)
 * hex random suffix to prevent collisions between identically-named workspaces.
 *
 * Example: "Engineering Team" → "engineering-team-a1b2c3"
 *
 * @param name - The raw workspace name from the request body.
 * @returns A unique, URL-safe slug string.
 */
// Generates a unique, URL-safe slug (e.g., "engineering-team-a1b2c3")
const generateSlug = (name: string) => {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const hash = crypto.randomBytes(3).toString('hex');
  return `${baseSlug}-${hash}`;
};

/**
 * POST /api/workspaces
 *
 * Creates a new workspace and atomically assigns the creator as its ADMIN member.
 *
 * Transaction guarantees:
 *  - If workspace creation succeeds but the membership insert fails, the entire
 *    operation is rolled back. This prevents a workspace existing without an ADMIN.
 *
 * @body name {string} - The display name of the workspace (required).
 * @returns 201 with the created workspace object on success.
 */
export const createWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const userId = req.user!.id; 

    // Execute as a strict transaction
    const result = await prisma.$transaction(async (tx) => {
      const newWorkspace = await tx.workspace.create({
        data: {
          name,
          slug: generateSlug(name),
          owner_id: userId,
        },
      });

      // The creator is automatically assigned the ADMIN role
      await tx.workspaceMember.create({
        data: {
          workspace_id: newWorkspace.id,
          user_id: userId,
          role: 'ADMIN',
        },
      });

      return newWorkspace;
    });

    res.status(201).json({ success: true, workspace: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces
 *
 * Returns all workspaces the authenticated user is a member of.
 *
 * Implementation note:
 *  Fetches WorkspaceMember rows for the user (via the junction table) with the
 *  related Workspace included. This returns workspaces the user owns AND workspaces
 *  they have joined, regardless of role.
 *
 * @returns 200 with an array of workspace objects (may be empty if no memberships).
 */
export const getUserWorkspaces = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const memberships = await prisma.workspaceMember.findMany({
      where: { user_id: userId },
      include: {
        workspace: true, // JOIN the Workspace record onto each membership row
      },
    });

    // Map the array to return just the workspace objects
    const workspaces = memberships.map(m => m.workspace);

    res.status(200).json({ success: true, workspaces });
  } catch (error) {
    next(error);
  }
};