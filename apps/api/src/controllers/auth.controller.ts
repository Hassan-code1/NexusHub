import {Request, Response, NextFunction} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/db'
import { env } from '../config/env'


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

