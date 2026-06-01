import { v2 as cloudinary } from 'cloudinary';
import { appConfig } from './app';

const hasCloudinaryConfig =
  appConfig.cloudinary.cloudName &&
  appConfig.cloudinary.apiKey &&
  appConfig.cloudinary.apiSecret;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: appConfig.cloudinary.cloudName,
    api_key: appConfig.cloudinary.apiKey,
    api_secret: appConfig.cloudinary.apiSecret
  });
}

export { cloudinary };
export const isCloudinaryConfigured = Boolean(hasCloudinaryConfig);
