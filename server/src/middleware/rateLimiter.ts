import rateLimit from 'express-rate-limit';

// NOTE: These rate limiters are per-process (in-memory).
// This is acceptable for single-instance deployments (Render free/starter, single Docker container).
// For multi-instance deployments (scaled Render, Docker Swarm, Kubernetes):
//   1. Use a Redis-backed store: https://github.com/animir/nestjs-rate-limiter or rate-limit-redis
//   2. Or configure rate limiting at the load balancer / API gateway level.
// Socket.IO cross-instance messaging is already handled by the Redis adapter (see socket/index.ts).

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' }
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});