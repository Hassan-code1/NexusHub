/**
 * @file index.ts  (packages/types/src/index.ts)
 * @description Shared TypeScript type definitions for the NexusHub monorepo.
 *
 * These types are consumed by both `apps/api` and `apps/web` to ensure
 * the data shape flowing between the backend and frontend stays in sync.
 *
 * Adding a new shared type:
 *  1. Define it here as an exported interface or type alias.
 *  2. Import it in any app: import { MyType } from '@nexushub/types';
 *
 * Naming conventions:
 *  - Use PascalCase for interfaces and type aliases.
 *  - Suffix DTOs (Data Transfer Objects) with `Dto` (e.g. CreateWorkspaceDto).
 *  - Suffix API response shapes with `Response` (e.g. LoginResponse).
 */

/**
 * User
 *
 * Core user entity shared across the frontend and backend.
 * Mirrors the relevant fields of the `User` Prisma model,
 * intentionally omitting sensitive fields like `password_hash`,
 * `reset_otp`, and `reset_otp_expires`.
 */
export interface User {
  /** UUID primary key */
  id: string;

  /** Unique email address used for login and notifications */
  email: string;

  /** Display name shown in the UI */
  name: string;

  /** Optional URL to the user's profile picture */
  avatarUrl?: string;
}