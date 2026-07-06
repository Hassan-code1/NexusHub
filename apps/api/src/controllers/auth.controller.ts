import {Request, Response, NextFunction} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/db'
import { env } from '../config/env'
import { success } from 'zod'
import { id } from 'zod/v4/locales'
import { sendPasswordResetEmail } from '../utils/email';
import crypto from 'crypto';

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

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email, password} = req.body;

        const user = await prisma.user.findUnique({where: {email}});

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

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {email, otp, newPassword} = req.body;

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

