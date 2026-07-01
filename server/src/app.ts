import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { appConfig } from './config/app';
import apiRoutes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { csrfProtect } from './middleware/csrf.middleware';
import { generalLimiter } from './middleware/rateLimiter';
import { correlationId } from './middleware/correlationId';

const app = express();

app.set('trust proxy', 1);

app.use(correlationId);
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      appConfig.clientUrl,
      'http://localhost:5173',
      'http://localhost:5000',
    ];
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
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use('/api', csrfProtect);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
