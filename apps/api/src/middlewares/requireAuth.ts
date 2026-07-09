/**
 * @file requireAuth.ts  (middlewares/requireAuth.ts)
 * @description Express middleware that enforces JWT authentication on protected routes.
 *
 * How it works:
 *  1. Reads the `Authorization` header and validates it starts with "Bearer ".
 *  2. Extracts and verifies the JWT using the application's JWT_SECRET.
 *  3. Attaches the decoded payload to `req.user` so downstream handlers can
 *     access the authenticated user's ID without re-decoding the token.
 *
 * Token payload shape (as signed in auth.controller.ts):
 *  { id: string, iat: number, exp: number }
 *
 * Failure modes:
 *  - Missing / malformed header  → 401 "Access denied"
 *  - Expired or tampered token   → 401 "Invalid or expired token"
 *
 * TODO: Replace the @ts-ignore with a proper Express type augmentation:
 *   // types/express/index.d.ts
 *   declare namespace Express { interface Request { user?: JwtPayload } }
 */

import {Request, Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'
import { env } from "../config/env"
import { success } from 'zod';

/**
 * Middleware: requireAuth
 *
 * Protects a route by verifying the Bearer JWT in the Authorization header.
 * Passes control to `next()` only when the token is valid and unexpired.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Reject requests that are missing the Authorization header or not using Bearer scheme
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        res.status(401).json({success: false, message: 'Access denied'});
        return;
    }

    // Extract the raw token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    try {
        // jwt.verify throws if the token is expired, malformed, or signed with a different secret
        const decoded = jwt.verify(token, env.JWT_SECRET);
        // @ts-ignore - we wil fix the request type extension later 
        req.user = decoded;
        next();
    } catch (error) {
        // Catches TokenExpiredError, JsonWebTokenError, NotBeforeError from jsonwebtoken
        res.status(401).json({success: false, message: 'Invalid or expired token'});
    }
};

