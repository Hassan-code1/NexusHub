import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Add this right below your login route
router.get('/me', requireAuth, (req, res) => {
    // @ts-ignore
  res.json({ success: true, user: req.user });
});

export default router;