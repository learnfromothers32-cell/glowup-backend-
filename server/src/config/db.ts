import mongoose from 'mongoose';
import { appConfig } from './app';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(appConfig.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
