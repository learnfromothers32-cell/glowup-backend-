import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/token';

const ACCESS_SECRET = 'test-access-secret-key-for-unit-tests-2026';
const REFRESH_SECRET = 'test-refresh-secret-key-for-unit-tests-2026';

jest.mock('../config/app', () => ({
  appConfig: {
    jwtSecret: 'test-access-secret-key-for-unit-tests-2026',
    jwtRefreshSecret: 'test-refresh-secret-key-for-unit-tests-2026',
  },
  isProduction: false,
}));

describe('token utilities', () => {
  const payload = { id: '507f191e810c19729de860ea', role: 'client' as const };

  describe('signAccessToken', () => {
    it('returns a valid JWT string', () => {
      const token = signAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('decodes to the correct payload', () => {
      const token = signAccessToken(payload);
      const decoded = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('expires within the expected window (15 minutes)', () => {
      const token = signAccessToken(payload);
      const decoded = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
      const nowSec = Math.floor(Date.now() / 1000);
      expect(decoded.exp! - decoded.iat!).toBe(15 * 60);
      expect(decoded.exp).toBeGreaterThan(nowSec);
      expect(decoded.exp).toBeLessThanOrEqual(nowSec + 15 * 60 + 5);
    });
  });

  describe('signRefreshToken', () => {
    it('returns a valid JWT string', () => {
      const token = signRefreshToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('expires within the expected window (7 days)', () => {
      const token = signRefreshToken(payload);
      const decoded = jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;
      const nowSec = Math.floor(Date.now() / 1000);
      expect(decoded.exp! - decoded.iat!).toBe(7 * 24 * 60 * 60);
      expect(decoded.exp).toBeGreaterThan(nowSec);
    });
  });

  describe('verifyAccessToken', () => {
    it('returns the payload from a valid token', () => {
      const token = signAccessToken(payload);
      const result = verifyAccessToken(token);
      expect(result.id).toBe(payload.id);
      expect(result.role).toBe(payload.role);
    });

    it('throws JsonWebTokenError for an invalid token', () => {
      expect(() => verifyAccessToken('garbage.token.value')).toThrow(jwt.JsonWebTokenError);
    });

    it('throws TokenExpiredError for an expired token', () => {
      const token = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '-1s' });
      expect(() => verifyAccessToken(token)).toThrow(jwt.TokenExpiredError);
    });

    it('throws when signed with wrong secret', () => {
      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' });
      expect(() => verifyAccessToken(token)).toThrow(jwt.JsonWebTokenError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('returns the payload from a valid refresh token', () => {
      const token = signRefreshToken(payload);
      const result = verifyRefreshToken(token);
      expect(result.id).toBe(payload.id);
      expect(result.role).toBe(payload.role);
    });

    it('throws for an invalid refresh token', () => {
      expect(() => verifyRefreshToken('bad-token')).toThrow(jwt.JsonWebTokenError);
    });

    it('throws when signed with wrong secret', () => {
      const token = jwt.sign(payload, 'wrong-refresh-secret', { expiresIn: '7d' });
      expect(() => verifyRefreshToken(token)).toThrow(jwt.JsonWebTokenError);
    });
  });

  describe('hashToken', () => {
    it('returns a consistent SHA-256 hex string', () => {
      const hash = hashToken('some-arbitrary-jwt-string');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('returns the same hash for the same input', () => {
      const token = 'same-input';
      expect(hashToken(token)).toBe(hashToken(token));
    });

    it('returns different hashes for different inputs', () => {
      expect(hashToken('input-a')).not.toBe(hashToken('input-b'));
    });

    it('produces a 64-character hex string', () => {
      const hash = hashToken('test');
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });
  });

  describe('access and refresh tokens are independent', () => {
    it('access secret cannot verify a refresh token and vice versa', () => {
      const access = signAccessToken(payload);
      const refresh = signRefreshToken(payload);

      expect(() => verifyAccessToken(refresh)).toThrow();
      expect(() => verifyRefreshToken(access)).toThrow();
    });
  });
});
