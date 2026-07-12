import { Request, Response, NextFunction } from 'express';
import { protect, softAuth, requireRole } from '../middleware/auth.middleware';
import { signAccessToken } from '../utils/token';
import { User } from '../models/User';
import { ApiError } from '../utils/apiError';

jest.mock('../models/User');

const mockUser = {
  id: '507f191e810c19729de860ea',
  role: 'client',
  name: 'Test User',
  email: 'test@example.com',
};

function fakeReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

function fakeRes(): Response {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

const nextFn: NextFunction = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('protect middleware', () => {
  it('calls next with 401 when no Authorization header', async () => {
    await protect(fakeReq(), fakeRes(), nextFn);
    const err = (nextFn as jest.Mock).mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Authentication token required');
  });

  it('calls next with 401 when header lacks Bearer prefix', async () => {
    await protect(fakeReq({ authorization: 'Token abc123' }), fakeRes(), nextFn);
    const err = (nextFn as jest.Mock).mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
  });

  it('calls next with 401 for an invalid token', async () => {
    await protect(fakeReq({ authorization: 'Bearer invalid.jwt.token' }), fakeRes(), nextFn);
    const err = (nextFn as jest.Mock).mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
  });

  it('calls next with 401 when user no longer exists', async () => {
    const token = signAccessToken({ id: mockUser.id, role: 'client' });
    (User.findById as jest.Mock).mockResolvedValue(null);

    await protect(fakeReq({ authorization: `Bearer ${token}` }), fakeRes(), nextFn);
    const err = (nextFn as jest.Mock).mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('User no longer exists');
  });

  it('attaches req.user and calls next() for a valid token', async () => {
    const token = signAccessToken({ id: mockUser.id, role: 'client' });
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const req = fakeReq({ authorization: `Bearer ${token}` });
    const res = fakeRes();
    await protect(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledWith();
    expect((req as any).user).toEqual({ id: mockUser.id, role: 'client' });
  });
});

describe('softAuth middleware', () => {
  it('calls next() without setting user when no header', async () => {
    const req = fakeReq();
    await softAuth(req, fakeRes(), nextFn);
    expect(nextFn).toHaveBeenCalledWith();
    expect((req as any).user).toBeUndefined();
  });

  it('attaches req.user when a valid token is provided', async () => {
    const token = signAccessToken({ id: mockUser.id, role: 'stylist' });
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const req = fakeReq({ authorization: `Bearer ${token}` });
    await softAuth(req, fakeRes(), nextFn);
    expect((req as any).user).toEqual({ id: mockUser.id, role: 'client' });
    expect(nextFn).toHaveBeenCalledWith();
  });

  it('calls next() without error when token is invalid', async () => {
    const req = fakeReq({ authorization: 'Bearer garbage' });
    await softAuth(req, fakeRes(), nextFn);
    expect(nextFn).toHaveBeenCalledWith();
    expect((req as any).user).toBeUndefined();
  });

  it('calls next() without error when user is not found', async () => {
    const token = signAccessToken({ id: mockUser.id, role: 'client' });
    (User.findById as jest.Mock).mockResolvedValue(null);

    await softAuth(fakeReq({ authorization: `Bearer ${token}` }), fakeRes(), nextFn);
    expect(nextFn).toHaveBeenCalledWith();
  });
});

describe('requireRole middleware', () => {
  function makeReqWithUser(role: string) {
    return { user: { id: mockUser.id, role } } as unknown as Request;
  }

  it('calls next() when user has the required role', () => {
    const middleware = requireRole('client');
    middleware(makeReqWithUser('client'), fakeRes(), nextFn);
    expect(nextFn).toHaveBeenCalledWith();
  });

  it('calls next() when user has one of multiple allowed roles', () => {
    const middleware = requireRole('stylist', 'admin');
    middleware(makeReqWithUser('stylist'), fakeRes(), nextFn);
    expect(nextFn).toHaveBeenCalledWith();
  });

  it('calls next(403) when user role is not allowed', () => {
    const middleware = requireRole('admin');
    middleware(makeReqWithUser('client'), fakeRes(), nextFn);
    const err = (nextFn as jest.Mock).mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('You do not have permission');
  });

  it('calls next(401) when req.user is undefined', () => {
    const middleware = requireRole('client');
    middleware({ user: undefined } as unknown as Request, fakeRes(), nextFn);
    const err = (nextFn as jest.Mock).mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Authentication required');
  });

  it('allows admin access when admin role is in the list', () => {
    const middleware = requireRole('admin');
    middleware(makeReqWithUser('admin'), fakeRes(), nextFn);
    expect(nextFn).toHaveBeenCalledWith();
  });
});
