import {Request, Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'
import { env } from "../config/env"
import { success } from 'zod';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        res.status(401).json({success: false, message: 'Access denied'});
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        // @ts-ignore - we wil fix the request type extension later 
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({success: false, message: 'Invalid or expired token'});
    }
};

