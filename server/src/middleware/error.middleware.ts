import { NextFunction, Request, Response } from 'express';
import { isProduction } from '../config/app';
import { ApiError } from '../utils/apiError';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;

  if (statusCode === 500) {
    console.error(`[500] ${req.method} ${req.originalUrl}:`, error);
  }

  const message =
    error instanceof ApiError
      ? error.message
      : error.name === 'CastError'
        ? `Invalid ID format: ${(error as any).value || error.message}`
        : error.name === 'ValidationError'
          ? `Validation failed: ${error.message}`
          : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: error.stack })
  });
};
