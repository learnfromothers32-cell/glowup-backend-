import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import * as Sentry from '@sentry/node';
import { appConfig } from './config/app';
import apiRoutes from './routes';
import configRoutes from './routes/config.routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { csrfProtect } from './middleware/csrf.middleware';
import { generalLimiter } from './middleware/rateLimiter';
import { correlationId } from './middleware/correlationId';
import logger from './utils/logger';

const app = express();

if (appConfig.sentryDsn) {
  Sentry.init({
    dsn: appConfig.sentryDsn,
    environment: appConfig.env,
    tracesSampleRate: 0.1,
  });
}

app.set('trust proxy', 1);

app.use(correlationId);
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [appConfig.clientUrl];
    if (appConfig.env !== 'production') {
      allowed.push('http://localhost:5173', 'http://localhost:5000');
    }
    if (!origin || allowed.some((a) => origin === a || origin.startsWith(a + '/'))) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(generalLimiter);
app.use(compression());
if (appConfig.env === 'production') {
  app.use(morgan('combined', { stream: { write: (msg: string) => logger.info(msg.trim()) } }));
} else {
  app.use(morgan('dev'));
}
// Capture raw body for Paystack webhook signature verification (must be before JSON parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json', limit: '500kb' }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use('/api', csrfProtect);

// Serve uploads with type restrictions and rate limiting.
// In production, prefer Cloudinary for file hosting — local uploads are a dev fallback.
const ALLOWED_UPLOAD_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)$/i;
app.use('/uploads', (req, _res, next) => {
  if (!ALLOWED_UPLOAD_EXTENSIONS.test(req.path)) {
    return _res.status(403).json({ success: false, message: 'File type not allowed' });
  }
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  index: false,
  dotfiles: 'deny',
  immutable: true,
  maxAge: '1d',
}));

app.use('/api/config', configRoutes);
app.use('/api', apiRoutes);

app.use(notFound);
if (appConfig.sentryDsn) {
  app.use(Sentry.expressErrorHandler() as any);
}
app.use(errorHandler);

export default app;
