import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const hello = asyncHandler(async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  let redisStatus = 'not configured';
  if (redisClient) {
    try {
      await redisClient.ping();
      redisStatus = 'healthy';
    } catch {
      redisStatus = 'unhealthy';
    }
  }

  res.json({
    success: true,
    message: 'Hello from backend',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

export const health = asyncHandler(async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  let redisStatus = 'not configured';
  let redisLatency: number | null = null;
  if (redisClient) {
    try {
      const start = Date.now();
      await redisClient.ping();
      redisLatency = Date.now() - start;
      redisStatus = 'healthy';
    } catch {
      redisStatus = 'unhealthy';
    }
  }

  const uptime = process.uptime();

  const healthy = dbStatus === 'healthy' && redisStatus !== 'unhealthy';

  const statusCode = healthy ? 200 : 503;

  return res.status(statusCode).json({
    success: healthy,
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    services: {
      database: {
        status: dbStatus,
        state: dbState[mongoose.connection.readyState] || 'unknown',
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatency,
      },
    },
    memory: process.memoryUsage(),
    version: '1.0.0',
  });
});