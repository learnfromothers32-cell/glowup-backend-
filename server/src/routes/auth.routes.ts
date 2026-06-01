import { Router } from 'express';
import {
  getMe,
  login,
  register,
  socialLogin,
  refresh,
  logout,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { validate, registerSchema, loginSchema, socialLoginSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/social-login', authLimiter, validate(socialLoginSchema), socialLogin);
router.get('/refresh', refresh);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
