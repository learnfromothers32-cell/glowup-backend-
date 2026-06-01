import { NextFunction, Request, Response } from 'express';
import { isProduction } from '../config/app';
import { ApiError } from '../utils/apiError';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(isProduction ? {} : { stack: error.stack })
  });
};
