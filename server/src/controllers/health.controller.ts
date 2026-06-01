import { Request, Response } from 'express';

export const hello = (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Hello from backend'
  });
};
