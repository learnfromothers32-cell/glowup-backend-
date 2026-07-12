import { Request, Response } from 'express';
import { register, login, refresh, logout, forgotPassword, resetPassword, verifyEmail } from '../controllers/auth.controller';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/token';

jest.mock('../middleware/asyncHandler', () => ({
  asyncHandler: (handler: Function) => (req: any, res: any, next: any) =>
    Promise.resolve(handler(req, res, next)).catch(next),
}));

jest.mock('../config/app', () => ({
  appConfig: {
    jwtSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    clientUrl: 'http://localhost:5173',
    maxUploadSizeMB: 100,
  },
  isProduction: false,
}));

jest.mock('../utils/token');
jest.mock('../services/user.service');
jest.mock('../models/User');
jest.mock('../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../config/firebase', () => ({ admin: { auth: () => ({ verifyIdToken: jest.fn() }) } }));
jest.mock('../utils/firebase-verify', () => ({ verifyFirebaseToken: jest.fn() }));
jest.mock('../config/cloudinary', () => ({ cloudinary: {}, isCloudinaryConfigured: false, uploadToCloudinary: jest.fn() }));

import { createUser, findUserForLogin, toPublicUser, findOrCreateSocialUser } from '../services/user.service';
import { User } from '../models/User';

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockFindUserForLogin = findUserForLogin as jest.MockedFunction<typeof findUserForLogin>;
const mockToPublicUser = toPublicUser as jest.MockedFunction<typeof toPublicUser>;
const mockFindOrCreateSocialUser = findOrCreateSocialUser as jest.MockedFunction<typeof findOrCreateSocialUser>;
const mockSignAccessToken = signAccessToken as jest.MockedFunction<typeof signAccessToken>;
const mockSignRefreshToken = signRefreshToken as jest.MockedFunction<typeof signRefreshToken>;
const mockHashToken = hashToken as jest.MockedFunction<typeof hashToken>;
const mockVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;

function fakeReq(body: any = {}, cookies: any = {}, headers: any = {}): any {
  return { body, cookies, headers, user: body._user };
}

function fakeRes(): any {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
}

function mockUserDoc(overrides: any = {}) {
  return {
    id: '507f191e810c19729de860ea',
    name: 'Test User',
    email: 'test@example.com',
    role: 'client',
    refreshTokenHash: undefined,
    emailVerified: false,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    avatar: undefined,
    phone: undefined,
    location: undefined,
    points: 0,
    actionCounts: { bookings: 0, favorites: 0, reviews: 0, likes: 0, shares: 0 },
    badges: [],
    createdAt: new Date(),
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSignAccessToken.mockReturnValue('mock-access-token');
  mockSignRefreshToken.mockReturnValue('mock-refresh-token');
  mockHashToken.mockImplementation((t: string) => 'hashed-' + t);
  mockVerifyRefreshToken.mockReturnValue({ id: '507f191e810c19729de860ea', role: 'client' } as any);
  mockToPublicUser.mockImplementation((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    phone: u.phone,
    location: u.location,
    points: u.points,
    actionCounts: u.actionCounts,
    badges: u.badges,
    createdAt: u.createdAt,
  }));
});

describe('register', () => {
  it('creates a user and returns tokens', async () => {
    const user = mockUserDoc();
    mockCreateUser.mockResolvedValue(user as any);

    const res = fakeRes();
    await register(fakeReq({ name: 'Test', email: 'test@example.com', password: 'SecurePass1', role: 'client' }), res, jest.fn());

    expect(mockCreateUser).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBe('mock-access-token');
    expect(body.data.user.email).toBe('test@example.com');
  });

  it('sets refresh token cookie', async () => {
    const user = mockUserDoc();
    mockCreateUser.mockResolvedValue(user as any);

    const res = fakeRes();
    await register(fakeReq({ name: 'Test', email: 't@e.com', password: 'SecurePass1' }), res, jest.fn());

    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', expect.objectContaining({ httpOnly: true }));
  });
});

describe('login', () => {
  it('returns tokens for valid credentials', async () => {
    const user = mockUserDoc();
    mockFindUserForLogin.mockResolvedValue(user as any);

    const res = fakeRes();
    await login(fakeReq({ email: 'test@example.com', password: 'SecurePass1' }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBe('mock-access-token');
  });

  it('throws 401 for invalid password', async () => {
    const user = mockUserDoc({ comparePassword: jest.fn().mockResolvedValue(false) });
    mockFindUserForLogin.mockResolvedValue(user as any);

    const next = jest.fn();
    await login(fakeReq({ email: 'test@example.com', password: 'WrongPass1' }), fakeRes(), next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('throws 401 for non-existent user', async () => {
    mockFindUserForLogin.mockResolvedValue(null);

    const next = jest.fn();
    await login(fakeReq({ email: 'nobody@example.com', password: 'SecurePass1' }), fakeRes(), next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});

describe('refresh', () => {
  it('returns new tokens for a valid refresh cookie', async () => {
    const user = mockUserDoc({ refreshTokenHash: 'hashed-mock-refresh-token' });
    (User.findById as jest.Mock).mockResolvedValue(user);

    const res = fakeRes();
    const req = fakeReq({}, { refreshToken: 'mock-refresh-token' }, { origin: 'http://localhost:5173' });

    await refresh(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.accessToken).toBe('mock-access-token');
    expect(user.save).toHaveBeenCalled();
  });

  it('throws 401 when no refresh token cookie', async () => {
    const next = jest.fn();
    await refresh(fakeReq({}, {}, { origin: 'http://localhost:5173' }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejects cross-origin requests', async () => {
    const next = jest.fn();
    await refresh(fakeReq({}, { refreshToken: 'some-token' }, { origin: 'https://evil.com' }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('clears cookie and throws 401 for revoked token', async () => {
    const user = mockUserDoc({ refreshTokenHash: 'some-other-hash' });
    (User.findById as jest.Mock).mockResolvedValue(user);

    const res = fakeRes();
    const next = jest.fn();
    await refresh(fakeReq({}, { refreshToken: 'mock-refresh-token' }, { origin: 'http://localhost:5173' }), res, next);

    expect(res.clearCookie).toHaveBeenCalled();
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});

describe('logout', () => {
  it('clears the refresh token cookie', async () => {
    const res = fakeRes();
    await logout(fakeReq({}, {}), res, jest.fn());
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data).toBeNull();
  });

  it('clears refresh token hash when valid token is present', async () => {
    const user = mockUserDoc({ refreshTokenHash: 'hash' });
    (User.findById as jest.Mock).mockResolvedValue(user);

    const res = fakeRes();
    await logout(fakeReq({}, { refreshToken: 'valid-token' }), res, jest.fn());
    expect(user.save).toHaveBeenCalled();
    expect(user.refreshTokenHash).toBeUndefined();
  });
});

describe('forgotPassword', () => {
  it('always returns the same success message regardless of email existence', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const res = fakeRes();
    await forgotPassword(fakeReq({ email: 'nonexistent@test.com' }), res, jest.fn());
    expect(res.json.mock.calls[0][0].message).toBe('If that email is registered, a reset link has been sent');
  });

  it('sets resetPasswordToken when user exists', async () => {
    const user = mockUserDoc({ save: jest.fn() });
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const res = fakeRes();
    await forgotPassword(fakeReq({ email: 'test@example.com' }), res, jest.fn());
    expect(user.save).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });
});

describe('resetPassword', () => {
  it('throws 400 for invalid/expired token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const next = jest.fn();
    await resetPassword(fakeReq({ token: 'bad', password: 'NewPass1' }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('updates password and clears tokens for valid reset token', async () => {
    const user = mockUserDoc();
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const res = fakeRes();
    await resetPassword(fakeReq({ token: 'valid-reset-token', password: 'NewSecure1' }), res, jest.fn());

    expect(user.save).toHaveBeenCalled();
    expect(user.refreshTokenHash).toBeUndefined();
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });
});

describe('verifyEmail', () => {
  it('throws 400 when no token provided', async () => {
    const next = jest.fn();
    await verifyEmail(fakeReq({}), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('throws 400 for invalid verification token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const next = jest.fn();
    await verifyEmail(fakeReq({ token: 'invalid-token' }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('marks email as verified for valid token', async () => {
    const user = mockUserDoc({ emailVerified: false });
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const res = fakeRes();
    await verifyEmail(fakeReq({ token: 'valid-token' }), res, jest.fn());
    expect(user.save).toHaveBeenCalled();
    expect(user.emailVerified).toBe(true);
  });
});
