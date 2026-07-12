jest.mock('../config/app', () => ({
  appConfig: { redisUrl: '' },
}));

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { connectRedis, redisClient } from '../config/redis';
import logger from '../utils/logger';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('connectRedis', () => {
  it('skips connection when REDIS_URL is empty', async () => {
    await connectRedis();
    expect(logger.info).toHaveBeenCalledWith('Redis skipped: REDIS_URL is not configured');
  });

  it('leaves redisClient as null when skipped', async () => {
    await connectRedis();
    expect(redisClient).toBeNull();
  });
});

describe('redisClient exports', () => {
  it('exports redisClient as null by default', () => {
    expect(redisClient).toBeNull();
  });
});
