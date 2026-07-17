/**
 * @file express.d.ts  (types/express.d.ts)
 * @description TypeScript module augmentation for the Express Request interface.
 *
 * Problem solved:
 *  By default, Express's `Request` interface does not include a `user` property.
 *  When requireAuth assigns `req.user = decoded`, TypeScript raises a type error.
 *  This file merges a `user` property into the global `Express.Request` interface
 *  so that `req.user` is correctly typed everywhere in the application.
 *
 * How TypeScript declaration merging works here:
 *  - `declare global { namespace Express { interface Request { ... } } }` extends
 *    the existing `Express.Request` interface rather than replacing it.
 *  - TypeScript combines all interface declarations with the same name, so our
 *    added `user?` property becomes part of every `req: Request` throughout the app.
 *  - The `export {}` at the bottom is CRITICAL: it forces TypeScript to treat this
 *    file as an ES module. Without it, `declare global` has no effect because
 *    TypeScript treats files without imports/exports as global scripts, and the
 *    augmentation would be ignored.
 *
 * Type used:
 *  `User` from `@nexushub/types` is the shared entity interface (id, email, name,
 *  avatarUrl). The JWT payload decoded by requireAuth matches this shape.
 *
 * The `?` (optional) on `user` reflects that `req.user` is only set after
 * requireAuth runs. On unprotected routes, `req.user` will be undefined.
 * Use `req.user!.id` inside handlers that are always guarded by requireAuth.
 */

// apps/api/src/types/express.d.ts

import { User } from '@nexushub/types';

declare global {
  namespace Express {
    // This merges with the existing Express.Request interface
    interface Request {
      user?: User;
    }
  }
}

// CRITICAL: This empty export forces TypeScript to treat this file as a module, 
// which is required for the 'declare global' block to work properly.
export {};