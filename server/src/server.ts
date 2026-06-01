import http from 'http';
import app from './app';
import { appConfig } from './config/app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initializeFirebase } from './config/firebase';

const server = http.createServer(app);

const start = async () => {
  await connectDB();
  await connectRedis();
  initializeFirebase();
  server.listen(appConfig.port, () => {
    console.log(`Server running on port ${appConfig.port}`);
    console.log(`Environment: ${appConfig.env}`);
  });
};

start();
