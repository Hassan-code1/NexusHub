import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { googleAuth, googleCallback } from "../controllers/oauth.controller";

const router = Router();


//login/register Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);


// demo /me route
router.get('/me', requireAuth, (req, res) => {
    // @ts-ignore
  res.json({ success: true, user: req.user });
});

export default router;