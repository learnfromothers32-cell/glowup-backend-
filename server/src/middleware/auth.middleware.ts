import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { UserRole } from '../types/auth';
import { ApiError } from '../utils/apiError';
import { verifyAccessToken } from '../utils/token';

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token required');
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission'));
    }

    next();
  };
