/**
 * @file auth.ts  (routes/auth.ts)
 * @description Express router for all authentication and identity endpoints.
 *
 * All routes here are mounted under the `/api/auth` prefix (see index.ts).
 *
 * Route summary:
 *  POST   /register        — Create a new user account
 *  POST   /login           — Authenticate and receive tokens
 *  POST   /forgot-password — Request an OTP for password reset
 *  POST   /reset-password  — Verify OTP and set a new password
 *  GET    /me              — Return the current authenticated user (protected)
 *
 * Middleware applied:
 *  - authLimiter   : Redis-backed rate limiter (5 req / 15 min per IP)
 *                    applied to all write endpoints to prevent brute-force attacks.
 *  - requireAuth   : JWT Bearer token verification; applied to protected routes.
 */

import { Router } from "express";
import { registerUser, loginUser, forgotPassword, resetPassword } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { authLimiter } from "../middlewares/ratelimiter";

const router = Router();

// --- Public Routes (rate-limited) ---

// Creates a new user; hashes password before storage
router.post('/register', authLimiter, registerUser);

// Validates credentials; returns accessToken + sets refreshToken cookie
router.post('/login', authLimiter, loginUser);

// Sends a 6-digit OTP to the user's email; always returns 200 to prevent enumeration
router.post('/forgot-password', authLimiter, forgotPassword);

// Validates OTP + sets new password; invalidates all sessions on success
router.post('/reset-password', authLimiter, resetPassword);

// --- Protected Routes ---

// Returns the decoded JWT payload of the currently authenticated user.
// The @ts-ignore is temporary until a proper Express request type extension
// (declare module 'express-serve-static-core') is added for req.user.
router.get('/me', requireAuth, (req, res) => {
    // @ts-ignore
  res.json({ success: true, user: req.user });
});

export default router;