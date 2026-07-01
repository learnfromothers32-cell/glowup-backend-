import { Router } from 'express';
import {
  getMe,
  login,
  register,
  socialLogin,
  refresh,
  logout,
  updateProfile,
  uploadAvatar,
  verifyEmail,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter, generalLimiter } from '../middleware/rateLimiter';
import { upload } from '../utils/upload';
import { validate, registerSchema, loginSchema, socialLoginSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/social-login', authLimiter, validate(socialLoginSchema), socialLogin);
router.post('/refresh', refresh);
router.post('/logout', generalLimiter, logout);
router.post('/verify-email', generalLimiter, verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, generalLimiter, updateProfile);
router.post('/me/image', protect, generalLimiter, upload.single('image'), uploadAvatar);

export default router;
