import {
  registerSchema,
  loginSchema,
  socialLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createBookingSchema,
  initializePaymentSchema,
  updateBookingStatusSchema,
  rescheduleBookingSchema,
  createReviewSchema,
  getAvailableSlotsSchema,
  createConversationSchema,
  sendMessageSchema,
  createCommentSchema,
  reportStreamSchema,
  reportCommentSchema,
  trendingTrackSchema,
  trendingReportSchema,
} from '../middleware/validate';
import { ZodError } from 'zod';

describe('Zod validation schemas', () => {
  describe('registerSchema', () => {
    it('accepts a valid registration payload', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass1',
        role: 'client',
      });
      expect(result.success).toBe(true);
    });

    it('defaults role to client when omitted', () => {
      const result = registerSchema.safeParse({
        name: 'Jane',
        email: 'jane@test.com',
        password: 'SecurePass1',
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.role).toBe('client');
    });

    it('rejects a missing name', () => {
      const result = registerSchema.safeParse({ email: 'a@b.com', password: 'SecurePass1' });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid email', () => {
      const result = registerSchema.safeParse({ name: 'X', email: 'not-an-email', password: 'SecurePass1' });
      expect(result.success).toBe(false);
    });

    it('rejects a password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({ name: 'X', email: 'a@b.com', password: 'Sh1' });
      expect(result.success).toBe(false);
    });

    it('rejects a password without an uppercase letter', () => {
      const result = registerSchema.safeParse({ name: 'X', email: 'a@b.com', password: 'lowercase1' });
      expect(result.success).toBe(false);
    });

    it('rejects a password without a lowercase letter', () => {
      const result = registerSchema.safeParse({ name: 'X', email: 'a@b.com', password: 'ALLCAPS1' });
      expect(result.success).toBe(false);
    });

    it('rejects a password without a number', () => {
      const result = registerSchema.safeParse({ name: 'X', email: 'a@b.com', password: 'NoNumberHere' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role values', () => {
      const result = registerSchema.safeParse({ name: 'X', email: 'a@b.com', password: 'SecurePass1', role: 'admin' });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com', password: 'pass' }).success).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(loginSchema.safeParse({ email: 'bad', password: 'pass' }).success).toBe(false);
    });

    it('rejects empty password', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    });
  });

  describe('socialLoginSchema', () => {
    it('accepts a valid idToken', () => {
      const result = socialLoginSchema.safeParse({ idToken: 'firebase-token-123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty idToken', () => {
      expect(socialLoginSchema.safeParse({ idToken: '' }).success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('accepts a valid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'user@test.com' }).success).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'not-email' }).success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    const valid = { token: 'abc', password: 'StrongPass1' };

    it('accepts valid token and password', () => {
      expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects missing token', () => {
      expect(resetPasswordSchema.safeParse({ password: 'StrongPass1' }).success).toBe(false);
    });

    it('rejects weak password', () => {
      expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'weak' }).success).toBe(false);
    });
  });

  describe('createBookingSchema', () => {
    const valid = {
      stylistId: '507f191e810c19729de860ea',
      serviceId: '507f191e810c19729de860eb',
      startTime: '2026-08-01T10:00:00.000Z',
    };

    it('accepts a valid booking payload', () => {
      expect(createBookingSchema.safeParse(valid).success).toBe(true);
    });

    it('accepts optional fields', () => {
      const full = { ...valid, notes: 'Please be on time', paymentMethod: 'card', timezone: 'Africa/Accra' };
      expect(createBookingSchema.safeParse(full).success).toBe(true);
    });

    it('rejects invalid stylistId format', () => {
      expect(createBookingSchema.safeParse({ ...valid, stylistId: 'short' }).success).toBe(false);
    });

    it('rejects invalid startTime', () => {
      expect(createBookingSchema.safeParse({ ...valid, startTime: 'not-a-date' }).success).toBe(false);
    });

    it('rejects notes exceeding 500 characters', () => {
      expect(createBookingSchema.safeParse({ ...valid, notes: 'x'.repeat(501) }).success).toBe(false);
    });

    it('rejects invalid paymentMethod', () => {
      expect(createBookingSchema.safeParse({ ...valid, paymentMethod: 'bitcoin' }).success).toBe(false);
    });
  });

  describe('initializePaymentSchema', () => {
    it('accepts a valid bookingId', () => {
      expect(initializePaymentSchema.safeParse({ bookingId: 'abc123' }).success).toBe(true);
    });

    it('rejects empty bookingId', () => {
      expect(initializePaymentSchema.safeParse({ bookingId: '' }).success).toBe(false);
    });
  });

  describe('updateBookingStatusSchema', () => {
    it('accepts all valid statuses', () => {
      for (const status of ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']) {
        expect(updateBookingStatusSchema.safeParse({ status }).success).toBe(true);
      }
    });

    it('rejects invalid status', () => {
      expect(updateBookingStatusSchema.safeParse({ status: 'unknown' }).success).toBe(false);
    });
  });

  describe('rescheduleBookingSchema', () => {
    it('accepts a startTime', () => {
      expect(rescheduleBookingSchema.safeParse({ startTime: '2026-09-01T10:00:00Z' }).success).toBe(true);
    });

    it('rejects empty startTime', () => {
      expect(rescheduleBookingSchema.safeParse({ startTime: '' }).success).toBe(false);
    });
  });

  describe('createReviewSchema', () => {
    const valid = { stylistId: 's1', bookingId: 'b1', rating: 4 };

    it('accepts a valid review', () => {
      expect(createReviewSchema.safeParse(valid).success).toBe(true);
    });

    it('accepts optional comment', () => {
      expect(createReviewSchema.safeParse({ ...valid, comment: 'Great!' }).success).toBe(true);
    });

    it('rejects rating < 1', () => {
      expect(createReviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
    });

    it('rejects rating > 5', () => {
      expect(createReviewSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
    });

    it('rejects non-integer rating', () => {
      expect(createReviewSchema.safeParse({ ...valid, rating: 3.5 }).success).toBe(false);
    });

    it('rejects comment > 1000 characters', () => {
      expect(createReviewSchema.safeParse({ ...valid, comment: 'x'.repeat(1001) }).success).toBe(false);
    });
  });

  describe('getAvailableSlotsSchema', () => {
    it('accepts empty query (defaults)', () => {
      expect(getAvailableSlotsSchema.safeParse({}).success).toBe(true);
    });

    it('accepts valid date string', () => {
      expect(getAvailableSlotsSchema.safeParse({ date: '2026-07-01' }).success).toBe(true);
    });

    it('rejects invalid date', () => {
      expect(getAvailableSlotsSchema.safeParse({ date: 'not-a-date' }).success).toBe(false);
    });

    it('rejects invalid serviceId format', () => {
      expect(getAvailableSlotsSchema.safeParse({ serviceId: 'bad' }).success).toBe(false);
    });
  });

  describe('conversation/message schemas', () => {
    it('createConversationSchema accepts valid client input', () => {
      expect(createConversationSchema.safeParse({ stylistId: 's1', bookingId: 'b1', subject: 'Hi' }).success).toBe(true);
    });

    it('createConversationSchema accepts valid stylist input', () => {
      expect(createConversationSchema.safeParse({ clientId: 'c1', bookingId: 'b1', subject: 'Hi' }).success).toBe(true);
    });

    it('createConversationSchema rejects input without stylistId or clientId', () => {
      expect(createConversationSchema.safeParse({ bookingId: 'b1' }).success).toBe(false);
    });

    it('sendMessageSchema accepts valid message', () => {
      expect(sendMessageSchema.safeParse({ content: 'Hi' }).success).toBe(true);
    });

    it('sendMessageSchema rejects empty content', () => {
      expect(sendMessageSchema.safeParse({ content: '' }).success).toBe(false);
    });

    it('sendMessageSchema rejects > 2000 chars', () => {
      expect(sendMessageSchema.safeParse({ content: 'x'.repeat(2001) }).success).toBe(false);
    });
  });

  describe('trending schemas', () => {
    it('trendingTrackSchema accepts valid event', () => {
      expect(trendingTrackSchema.safeParse({ postId: 'p1', event: 'like' }).success).toBe(true);
    });

    it('trendingTrackSchema rejects invalid event', () => {
      expect(trendingTrackSchema.safeParse({ postId: 'p1', event: 'invalid' }).success).toBe(false);
    });

    it('trendingReportSchema accepts valid input', () => {
      expect(trendingReportSchema.safeParse({ postId: 'p1', stylistId: 's1', reason: 'Spam' }).success).toBe(true);
    });

    it('trendingReportSchema rejects reason > 500 chars', () => {
      expect(trendingReportSchema.safeParse({ postId: 'p1', stylistId: 's1', reason: 'x'.repeat(501) }).success).toBe(false);
    });
  });

  describe('comment/stream report schemas', () => {
    it('reportStreamSchema accepts valid input', () => {
      expect(reportStreamSchema.safeParse({ sessionId: 's1', reason: 'Inappropriate' }).success).toBe(true);
    });

    it('reportCommentSchema accepts valid input', () => {
      expect(reportCommentSchema.safeParse({ sessionId: 's1', commentId: 'c1', reason: 'Spam' }).success).toBe(true);
    });
  });
});
