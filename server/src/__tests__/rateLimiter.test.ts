import { authLimiter, generalLimiter, readLimiter } from '../middleware/rateLimiter';
import { Request, Response, NextFunction } from 'express';

describe('rate limiters', () => {
  function fakeReq(ip = '127.0.0.1'): Request {
    return { ip, headers: {}, socket: { remoteAddress: ip }, app: { get: () => false } } as unknown as Request;
  }

  function fakeRes(): Response {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      getHeader: jest.fn(),
      writableEnded: false,
    };
    return res as Response;
  }

  describe('authLimiter', () => {
    it('allows requests within the limit', async () => {
      const res = fakeRes();
      const next = jest.fn();
      await authLimiter(fakeReq(), res, next);
      expect(next).toHaveBeenCalled();
    });

    it('eventually returns 429 when limit exceeded', async () => {
      const nextFn = jest.fn();

      for (let i = 0; i < 50; i++) {
        const res = fakeRes();
        await authLimiter(fakeReq('10.0.0.1'), res, jest.fn());
      }

      const blockedRes = fakeRes();
      await authLimiter(fakeReq('10.0.0.1'), blockedRes, nextFn);

      expect(blockedRes.status).toHaveBeenCalledWith(429);
      expect(blockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('Too many') }),
      );
    });
  });

  describe('generalLimiter', () => {
    it('allows requests within the limit', async () => {
      const next = jest.fn();
      await generalLimiter(fakeReq(), fakeRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('readLimiter', () => {
    it('allows requests within the limit', async () => {
      const next = jest.fn();
      await readLimiter(fakeReq(), fakeRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('limiters are separate instances', () => {
    it('each limiter has its own configuration', () => {
      expect(authLimiter).toBeDefined();
      expect(generalLimiter).toBeDefined();
      expect(readLimiter).toBeDefined();
      expect(authLimiter).not.toBe(generalLimiter);
      expect(generalLimiter).not.toBe(readLimiter);
    });
  });
});
