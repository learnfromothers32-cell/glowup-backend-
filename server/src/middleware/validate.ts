import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiError } from '../utils/apiError';

export const validate = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, message);
    }
    req.body = result.data;
    next();
  };

export const validateQuery = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, message);
    }
    req.query = result.data;
    next();
  };

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  role: z.enum(['client', 'stylist']).default('client')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

export const socialLoginSchema = z.object({
  idToken: z.string().min(1, 'Social token is required'),
  role: z.enum(['client', 'stylist']).default('client')
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
});

export const trendingTrackSchema = z.object({
  postId: z.string().min(1, 'postId is required'),
  event: z.enum(['view', 'like', 'unlike', 'share', 'comment', 'bookmark'], {
    errorMap: () => ({ message: 'Invalid trending event type' }),
  }),
});

export const trendingReportSchema = z.object({
  postId: z.string().min(1, 'postId is required'),
  stylistId: z.string().min(1, 'stylistId is required'),
  reason: z.string().min(1, 'reason is required').max(500, 'Reason must be under 500 characters'),
});

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBookingSchema = z.object({
  stylistId: z.string().regex(objectIdRegex, 'Invalid stylistId format (must be a 24-character hex string)'),
  serviceId: z.string().regex(objectIdRegex, 'Invalid serviceId format (must be a 24-character hex string)'),
  startTime: z.string()
    .min(1, 'startTime is required')
    .refine(val => !isNaN(new Date(val).getTime()), 'startTime must be a valid ISO date string'),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
  paymentMethod: z.enum(['card', 'mobile-money', 'cash']).optional(),
  timezone: z.string().optional(),
});

export const getAvailableSlotsSchema = z.object({
  date: z.string()
    .optional()
    .refine(val => val === undefined || !isNaN(new Date(val).getTime()), 'date must be a valid ISO date string'),
  serviceId: z.string()
    .regex(objectIdRegex, 'Invalid serviceId format (must be a 24-character hex string)')
    .optional(),
});

export const rescheduleBookingSchema = z.object({
  startTime: z.string().min(1, 'startTime is required'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']),
});

export const createReviewSchema = z.object({
  stylistId: z.string().min(1, 'stylistId is required'),
  bookingId: z.string().min(1, 'bookingId is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be under 1000 characters').optional(),
});

export const initializePaymentSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
});

export const createConversationSchema = z.object({
  stylistId: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
  bookingId: z.string().optional(),
  subject: z.string().max(200).optional(),
}).refine(
  (data) => data.stylistId || data.clientId,
  { message: 'Either stylistId or clientId is required' },
);

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message is required').max(2000),
});

export const createCommentSchema = z.object({
  transformationId: z.string().min(1, 'transformationId is required'),
  stylistId: z.string().min(1, 'stylistId is required'),
  text: z.string().min(1, 'Comment is required').max(1000),
  userName: z.string().optional(),
  userAvatar: z.string().optional(),
});

export const reportStreamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  reason: z.string().min(1, 'reason is required').max(500),
});

export const reportCommentSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  commentId: z.string().min(1, 'commentId is required'),
  reason: z.string().min(1, 'reason is required').max(500),
});
