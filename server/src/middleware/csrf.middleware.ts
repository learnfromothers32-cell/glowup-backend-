import { NextFunction, Request, Response } from 'express';
import { appConfig } from '../config/app';
import { ApiError } from '../utils/apiError';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Allowed origins for state-changing requests
const ALLOWED_ORIGINS = [
  appConfig.clientUrl,
  'http://localhost:5173',
  'http://localhost:5000',
].filter(Boolean);

export const csrfProtect = (req: Request, _res: Response, next: NextFunction) => {
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;

  if (origin) {
    // If an origin is present, it MUST match our allowed list
    const originOk = ALLOWED_ORIGINS.some((allowed) => origin.toString() === allowed || origin.toString().startsWith(allowed + '/'));
    if (!originOk) {
      throw new ApiError(403, 'Cross-origin request blocked');
    }
  }
  // Note: Requests without Origin/Referer (mobile apps, curl, server-to-server) are allowed.
  // Cookie-based CSRF is mitigated separately: the refresh cookie is httpOnly + sameSite=lax,
  // and the /auth/refresh endpoint performs its own Origin check.

  next();
};
