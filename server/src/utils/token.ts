import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { appConfig } from '../config/app';
import { AuthUser } from '../types/auth';
import { ApiError } from './apiError';

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

export const signAccessToken = (user: AuthUser) => {
  if (!appConfig.jwtSecret) {
    throw new ApiError(500, 'JWT_SECRET is not configured');
  }
  return jwt.sign(user, appConfig.jwtSecret, { expiresIn: ACCESS_EXPIRES });
};

export const verifyAccessToken = (token: string): AuthUser => {
  if (!appConfig.jwtSecret) {
    throw new ApiError(500, 'JWT_SECRET is not configured');
  }
  return jwt.verify(token, appConfig.jwtSecret, { algorithms: ['HS256'] }) as AuthUser;
};

export const signRefreshToken = (user: AuthUser) => {
  if (!appConfig.jwtRefreshSecret) {
    throw new ApiError(500, 'JWT_REFRESH_SECRET is not configured');
  }
  return jwt.sign(user, appConfig.jwtRefreshSecret, { expiresIn: REFRESH_EXPIRES });
};

export const verifyRefreshToken = (token: string): AuthUser => {
  if (!appConfig.jwtRefreshSecret) {
    throw new ApiError(500, 'JWT_REFRESH_SECRET is not configured');
  }
  return jwt.verify(token, appConfig.jwtRefreshSecret, { algorithms: ['HS256'] }) as AuthUser;
};

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');