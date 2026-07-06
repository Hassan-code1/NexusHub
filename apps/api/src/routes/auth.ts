import { Router } from "express";
import { registerUser, loginUser, forgotPassword, resetPassword } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { authLimiter } from "../middlewares/ratelimiter";

const router = Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Add this right below your login route
router.get('/me', requireAuth, (req, res) => {
    // @ts-ignore
  res.json({ success: true, user: req.user });
});

export default router;