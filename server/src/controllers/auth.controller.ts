import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/token';
import { createUser, findUserForLogin, toPublicUser, findOrCreateSocialUser } from '../services/user.service';
import { appConfig } from '../config/app';
import logger from '../utils/logger';
import { admin } from '../config/firebase';
import { verifyFirebaseToken } from '../utils/firebase-verify';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { cloudinary, isCloudinaryConfigured, uploadToCloudinary } from '../config/cloudinary';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie('refreshToken', token, COOKIE_OPTIONS);

const clearRefreshCookie = (res: Response) =>
  res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });

// ---------- Register ----------

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  const user = await createUser({ name, email, password, role });

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });

  user.refreshTokenHash = hashToken(refreshToken);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await user.save();

  sendVerificationEmail(user.email, verificationToken).catch((err) => {
    logger.error('Failed to send verification email', { error: (err as Error).message });
  });

  setRefreshCookie(res, refreshToken);

  return sendSuccess(res, {
    accessToken,
    user: toPublicUser(user)
  }, 'Registration successful', 201);
});

// ---------- Login ----------

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await findUserForLogin(email);

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);

  return sendSuccess(res, {
    accessToken,
    user: toPublicUser(user)
  }, 'Login successful');
});

// ---------- Social Login ----------

export const socialLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, role } = req.body;

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    try {
      decoded = await verifyFirebaseToken(idToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired social token');
    }
  }

  const { email, name, picture, uid } = decoded;

  if (!email) {
    throw new ApiError(400, 'Social account must have an email address');
  }

  const user = await findOrCreateSocialUser({
    email,
    name,
    avatar: picture,
    role,
    providerId: uid
  });

  if (!user) {
    throw new ApiError(404, 'No account found with this email. Please sign up first.');
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);

  return sendSuccess(res, {
    accessToken,
    user: toPublicUser(user)
  }, 'Social login successful');
});

// ---------- Refresh ----------

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  // CSRF protection: verify Origin matches the configured client URL
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    const allowedOrigins = [appConfig.clientUrl, 'http://localhost:5173', 'http://localhost:5000'];
    const originOk = allowedOrigins.some((allowed) => origin === allowed || origin.startsWith(allowed + '/'));
    if (!originOk) {
      clearRefreshCookie(res);
      throw new ApiError(403, 'Cross-origin request blocked');
    }
  }

  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new ApiError(401, 'Refresh token not found');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.id);
  if (!user) {
    clearRefreshCookie(res);
    throw new ApiError(401, 'User no longer exists');
  }

  const tokenHash = hashToken(token);
  if (user.refreshTokenHash !== tokenHash) {
    clearRefreshCookie(res);
    user.refreshTokenHash = undefined;
    await user.save();
    throw new ApiError(401, 'Refresh token has been revoked');
  }

  const newAccessToken = signAccessToken({ id: user.id, role: user.role });
  const newRefreshToken = signRefreshToken({ id: user.id, role: user.role });

  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  setRefreshCookie(res, newRefreshToken);

  return sendSuccess(res, {
    accessToken: newAccessToken,
    user: toPublicUser(user)
  }, 'Token refreshed');
});

// ---------- Logout ----------

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.id);
      if (user) {
        user.refreshTokenHash = undefined;
        await user.save();
      }
    } catch {
      // Token already invalid, just clear cookie
    }
  }

  clearRefreshCookie(res);
  return sendSuccess(res, null, 'Logged out');
});

// ---------- Get Me ----------

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sendSuccess(res, { user: toPublicUser(user) });
});

// ---------- Update Profile ----------

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, location, avatar } = req.body;

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone;
  if (location !== undefined) user.location = location;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  return sendSuccess(res, { user: toPublicUser(user) }, 'Profile updated');
});

// ---------- Upload Avatar ----------

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  let imageUrl: string;

  if (isCloudinaryConfigured) {
    imageUrl = await uploadToCloudinary(req.file.path, 'profiles', {
      transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }]
    });
  } else {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  user.avatar = imageUrl;
  await user.save();

  return sendSuccess(res, { avatar: imageUrl, user: toPublicUser(user) }, 'Avatar updated');
});

// ---------- Verify Email ----------

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return sendSuccess(res, null, 'Email verified successfully');
});

// ---------- Forgot Password ----------

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    // Don't reveal whether the email exists
    return sendSuccess(res, null, 'If that email is registered, a reset link has been sent');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  sendPasswordResetEmail(user.email, resetToken).catch((err) => {
    logger.error('Failed to send password reset email', { error: (err as Error).message });
  });

  return sendSuccess(res, null, 'If that email is registered, a reset link has been sent');
});

// ---------- Reset Password ----------

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshTokenHash = undefined;
  await user.save();

  return sendSuccess(res, null, 'Password reset successful');
});
