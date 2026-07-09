/**
 * @file auth.controller.ts
 * @description Request handlers for email/password-based authentication.
 *
 * Exported handlers (mounted via routes/auth.ts):
 *  - registerUser    POST /api/auth/register
 *  - loginUser       POST /api/auth/login
 *  - forgotPassword  POST /api/auth/forgot-password
 *  - resetPassword   POST /api/auth/reset-password
 *
 * Security notes:
 *  - Passwords are hashed with bcrypt (cost factor 12 for register, 10 for reset).
 *  - JWTs use separate secrets for access and refresh tokens.
 *  - The forgot-password response is identical whether the email exists or not
 *    to prevent user enumeration attacks.
 *  - On password reset, all existing sessions are deleted to force re-login
 *    on every device (invalidates stolen refresh tokens).
 */

import {Request, Response, NextFunction} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/db'
import { env } from '../config/env'
import { success } from 'zod'
import { id } from 'zod/v4/locales'
import { sendPasswordResetEmail } from '../utils/email';
import crypto from 'crypto';

/**
 * POST /api/auth/register
 *
 * Creates a new user account.
 * - Hashes the plain-text password before persisting (bcrypt, 12 rounds).
 * - Returns the new user's UUID and email on success.
 * - Delegates any database error (e.g. unique-email violation) to the
 *   global error handler via next().
 */
export const registerUser = async (req : Request, res : Response, next: NextFunction) => {
    try {
        const {email, password, name} = req.body;

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data:{
                email,
                password_hash: hashedPassword,
                name,
            },
        });

        res.status(201).json({success: true, id: user.id, email: user.email})
    } catch (error) {
        next(error)
    }
};

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user with email + password.
 * - Performs a constant-time bcrypt comparison to prevent timing attacks.
 * - On success:
 *    1. Issues a short-lived access token (15 min) in the JSON body.
 *    2. Issues a long-lived refresh token (7 days) in an HttpOnly cookie.
 *    3. Persists the session (refresh token + expiry) in the Session table.
 * - Returns 401 for both "user not found" and "wrong password" to avoid
 *   leaking which part of the credential was incorrect.
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email, password} = req.body;

        const user = await prisma.user.findUnique({where: {email}});

        // Unified 401 for wrong email OR wrong password — prevents enumeration
        if(!user || !(await bcrypt.compare(password, user.password_hash))){
            res.status(401).json({success:false, message: 'Invalid credentials'});
            return;
        }

        //generate token
        const accessToken = jwt.sign({id: user.id}, env.JWT_SECRET, {expiresIn: '15m'});
        const refreshToken = jwt.sign({id: user.id}, env.REFRESH_SECRET, {expiresIn: '7d'});

        //saving session in db
        await prisma.session.create({
            data: {
                user_id: user.id,
                refresh_token: refreshToken,
                expires_at: new Date(Date.now() + 7*24*60*60*1000),// 7days from login
            }
        });

        // HttpOnly prevents JavaScript access; Secure enforces HTTPS in prod;
        // SameSite=Strict blocks the cookie on cross-site requests
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7*24*60*60*1000,
        });

        res.status(200).json({success: true, accessToken });
    } catch (error) {
        next(error)
    }
};

/**
 * POST /api/auth/forgot-password
 *
 * Initiates the OTP-based password-reset flow.
 * - Generates a cryptographically secure 6-digit OTP via crypto.randomInt
 *   (avoids Math.random() which is not cryptographically safe).
 * - OTP is stored (plaintext) on the user row with a 15-minute expiry.
 * - Sends the OTP to the user's registered email via SMTP.
 * - Always returns HTTP 200 with the same message body regardless of whether
 *   the provided email address is registered — this is intentional to prevent
 *   email enumeration by malicious actors.
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {email} = req.body;
        const user = await prisma.user.findUnique({where : {email}});

        if(!user){
            // Return 200 even if user doesn't exist to prevent email enumeration attacks
            return res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });
        }

        // Generate a secure 6-digit numeric OTP (100000 to 999999)
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.user.update({
            where: {email},
            data: {
                reset_otp: otp,
                reset_otp_expires: otpExpires,
            },
        });

        // Send email
        await sendPasswordResetEmail(email, otp);

        res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/reset-password
 *
 * Completes the OTP-based password-reset flow.
 * - Validates the OTP by checking both the value AND that it hasn't expired
 *   (reset_otp_expires > now) in a single atomic Prisma query.
 * - Hashes the new password with bcrypt before storing.
 * - Clears the OTP fields on the user row after successful reset to prevent reuse.
 * - Deletes ALL active sessions for the user, ensuring stolen refresh tokens
 *   cannot be used to maintain access after a password compromise.
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {email, otp, newPassword} = req.body;

        // Single query: match email + otp + non-expired — avoids race conditions
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                reset_otp: otp,
                reset_otp_expires: { gt: new Date() },
            },
        });

        if(!user){
            return res.status(400).json({ success: false, message: 'Invalid or expired otp.' })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear the OTP fields atomically
        await prisma.user.update({
            where: {id: user.id},
            data:{
                password_hash: hashedPassword,
                reset_otp: null,
                reset_otp_expires: null,
            },
        });

        // delete all active sessions to force re login
        await prisma.session.deleteMany({where: {user_id: user.id}});

        res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    }catch(error){
        next(error);
    }
};

