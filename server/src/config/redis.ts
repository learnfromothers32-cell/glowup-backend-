import { appConfig } from './app';

type RedisClientLike = {
  on(event: 'error', callback: (error: Error) => void): void;
  connect(): Promise<void>;
};

let redisClient: RedisClientLike | null = null;

export const connectRedis = async (): Promise<void> => {
  if (!appConfig.redisUrl) {
    console.log('Redis skipped: REDIS_URL is not configured');
    return;
  }

  try {
    const redis = await import('redis').catch(() => null);

    if (!redis) {
      console.log('Redis skipped: package is not installed');
      return;
    }

    redisClient = redis.createClient({
      url: appConfig.redisUrl
    }) as RedisClientLike;

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    await redisClient.connect();
    console.log('Redis connected');
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
};

export { redisClient };
