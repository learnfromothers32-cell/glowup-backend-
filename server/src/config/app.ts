import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  mongoUri: process.env.MONGODB_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  hfToken: process.env.HF_TOKEN || '',
  hfModel: process.env.HF_MODEL || 'black-forest-labs/FLUX.1-schnell',
  sentryDsn: process.env.SENTRY_DSN || '',
};

export const isProduction = appConfig.env === 'production';