import passport from "passport";
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../utils/db';

passport.use(
    new GoogleStrategy(
    {
        clientID : env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0].value;
            if(!email) return done(new Error('No email found from Google'));

            // 1. Check if user exists, otherwise create them
            let user = await prisma.user.findUnique({where : {email}});

            if(!user){
                user = await prisma.user.create({
                    data: {
                        email,
                        name: profile.displayName,
                        avatar_url: profile.photos?.[0].value,
                        password_hash: '',// OAuth users don't have a local password
                    },
                });
            }
            return done(null, user);
        }catch(error){
            return done(error as Error);
        }
    })
);

export const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
});

export const googleCallback = [
    passport.authenticate('google', {session: false, failureRedirect: `${env.FRONTEND_URL}/login`}),
    async (req: any, res: any) => {
    const user = req.user;

    // 2. Generate Tokens — use `id` to match auth.controller.ts and requireAuth middleware
    const accessToken = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, env.REFRESH_SECRET, { expiresIn: '7d' });

    // 3. Save Session to DB
    await prisma.session.create({
      data: {
        refresh_token : refreshToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 4. Set HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    // 5. Redirect to Frontend with token
    res.redirect(`${env.FRONTEND_URL}/dashboard?token=${accessToken}`);
  },
]