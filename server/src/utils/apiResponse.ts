import { Response } from 'express';
import { ApiResponse } from '../types/api';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) => {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data
  };

  return res.status(statusCode).json(body);
};
