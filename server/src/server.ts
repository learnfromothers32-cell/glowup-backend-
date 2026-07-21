import http from 'http';
import cron from 'node-cron';
import app from './app';
import { appConfig } from './config/app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initializeFirebase } from './config/firebase';
import { prewarmFirebaseKeys } from './utils/firebase-verify';
import { initSocket } from './socket';
import { runMigrations } from './migrate';
import { syncRedisEngagementToMongo } from './services/trending.service';
import { runDatabaseBackup } from './scripts/backup';
import { cleanupStaleSessions } from './services/live.service';
import logger from './utils/logger';

const server = http.createServer(app);

server.timeout = 30000;

const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
];
const PROD_REQUIRED = [
  'PAYSTACK_SECRET_KEY',
  'REDIS_URL',
];
const MISSING_VARS = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (MISSING_VARS.length > 0) {
  logger.error(`Missing required environment variables: ${MISSING_VARS.join(', ')}`);
  process.exit(1);
}
if (appConfig.env === 'production') {
  const missingProd = PROD_REQUIRED.filter((key) => !process.env[key]);
  if (missingProd.length > 0) {
    logger.warn(`Production missing optional vars (system will have degraded functionality): ${missingProd.join(', ')}`);
    if (missingProd.includes('PAYSTACK_SECRET_KEY')) {
      logger.warn('Payments will be disabled without PAYSTACK_SECRET_KEY');
    }
    if (missingProd.includes('REDIS_URL')) {
      logger.warn('Socket.IO will run in single-instance mode without REDIS_URL');
    }
  }
}

const start = async () => {
  await connectDB();
  await runMigrations();
  await connectRedis();
  initializeFirebase();

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    prewarmFirebaseKeys();
  }

  if (!appConfig.hfToken) {
    logger.warn('HF_TOKEN is not set — AI hairstyle generation will use template overlay (returns original image). Set HF_TOKEN in .env for AI-powered generation.');
  }

  await initSocket(server);

  // Clean up any stale live sessions on startup
  cleanupStaleSessions().catch((err) =>
    logger.error('Failed to cleanup stale live sessions on startup', { error: (err as Error).message }),
  );

  cron.schedule('*/5 * * * *', () => {
    syncRedisEngagementToMongo().catch((err) =>
      logger.error('Failed to sync Redis engagement to MongoDB', { error: (err as Error).message }),
    );
  });

  // Auto-cleanup stale live sessions every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    cleanupStaleSessions().catch((err) =>
      logger.error('Failed to cleanup stale live sessions', { error: (err as Error).message }),
    );
  });

  // Daily database backup at 3:00 AM
  if (appConfig.env === 'production') {
    cron.schedule('0 3 * * *', () => {
      runDatabaseBackup().catch((err) =>
        logger.error('Scheduled database backup failed', { error: (err as Error).message }),
      );
    });
  }

  server.listen(appConfig.port, '0.0.0.0', () => {
    logger.info(`Server running on port ${appConfig.port}`);
    logger.info(`Environment: ${appConfig.env}`);
  });
};

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  const forceKillTimer = setTimeout(() => {
    logger.error('Forced shutdown after 10s timeout — some requests may have been terminated');
    process.exit(1);
  }, 10000);

  forceKillTimer.unref();

  server.close(async () => {
    logger.info('HTTP server closed — draining complete');

    const mongoose = await import('mongoose');
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');

    clearTimeout(forceKillTimer);
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.message : String(reason), stack: reason instanceof Error ? reason.stack : undefined });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

start().catch((err) => {
  logger.error('Failed to start server', { error: (err as Error).message, stack: (err as Error).stack });
  process.exit(1);
});
