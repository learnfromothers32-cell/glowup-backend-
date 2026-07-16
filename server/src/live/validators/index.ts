import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ── Session Schemas ──

export const createLiveSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be under 2000 characters')
    .optional(),
  category: z
    .string()
    .trim()
    .max(50, 'Category must be under 50 characters')
    .optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .max(30, 'Each tag must be under 30 characters')
    )
    .max(10, 'Cannot have more than 10 tags')
    .optional(),
  scheduledAt: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'scheduledAt must be a valid ISO date string' }
    )
    .optional(),
});

export const updateLiveSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be under 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be under 2000 characters')
    .optional(),
  category: z
    .string()
    .trim()
    .max(50, 'Category must be under 50 characters')
    .optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .max(30, 'Each tag must be under 30 characters')
    )
    .max(10, 'Cannot have more than 10 tags')
    .optional(),
  settings: z
    .object({
      chatEnabled: z.boolean().optional(),
      slowModeMs: z.number().min(0).optional(),
      followersOnly: z.boolean().optional(),
      giftsEnabled: z.boolean().optional(),
      recordingEnabled: z.boolean().optional(),
      maxViewers: z.number().min(1).max(100000).optional(),
    })
    .optional(),
});

export const sessionIdParamSchema = z.object({
  id: z
    .string()
    .regex(objectIdRegex, 'Invalid session ID format'),
});

// ── Query Schemas ──

export const discoverSessionsQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(['trending', 'newest', 'popular']).optional(),
  cursor: z.string().optional(),
  stylistId: z.string().optional(),
  hostUserId: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '20', 10);
      return Math.min(Math.max(num, 1), 50);
    }),
});

export const featuredSessionsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '20', 10);
      return Math.min(Math.max(num, 1), 50);
    }),
});

// ── Moderation Schemas ──

export const moderateUserSchema = z.object({
  sessionId: z
    .string()
    .regex(objectIdRegex, 'Invalid session ID format'),
  userId: z
    .string()
    .regex(objectIdRegex, 'Invalid user ID format'),
  reason: z
    .string()
    .trim()
    .max(500, 'Reason must be under 500 characters')
    .optional(),
});

// ── Export Types ──

export type CreateLiveSessionInput = z.infer<typeof createLiveSessionSchema>;
export type UpdateLiveSessionInput = z.infer<typeof updateLiveSessionSchema>;
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
export type DiscoverSessionsQuery = z.infer<typeof discoverSessionsQuerySchema>;
export type FeaturedSessionsQuery = z.infer<typeof featuredSessionsQuerySchema>;
export type ModerateUserInput = z.infer<typeof moderateUserSchema>;

// ── Chat Schemas ──

export const chatSendSchema = z.object({
  sessionId: z
    .string()
    .regex(objectIdRegex, 'Invalid session ID format'),
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be under 500 characters'),
  messageId: z
    .string()
    .uuid('messageId must be a valid UUID'),
  replyTo: z
    .string()
    .regex(objectIdRegex, 'Invalid replyTo message ID')
    .optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'product', 'booking', 'service']),
        url: z.string().optional(),
        refId: z.string().regex(objectIdRegex).optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .max(5, 'Cannot have more than 5 attachments')
    .optional(),
});

export const chatHistorySchema = z.object({
  sessionId: z
    .string()
    .regex(objectIdRegex, 'Invalid session ID format'),
  cursor: z.string().optional(),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(50)
    .optional(),
});

export const chatDeleteSchema = z.object({
  messageId: z
    .string()
    .regex(objectIdRegex, 'Invalid message ID format'),
  sessionId: z
    .string()
    .regex(objectIdRegex, 'Invalid session ID format'),
  reason: z
    .string()
    .trim()
    .max(200, 'Reason must be under 200 characters')
    .optional(),
});

export const chatPinSchema = z.object({
  messageId: z
    .string()
    .regex(objectIdRegex, 'Invalid message ID format'),
  sessionId: z
    .string()
    .regex(objectIdRegex, 'Invalid session ID format'),
});

// ── Chat Export Types ──

export type ChatSendInput = z.infer<typeof chatSendSchema>;
export type ChatHistoryInput = z.infer<typeof chatHistorySchema>;
export type ChatDeleteInput = z.infer<typeof chatDeleteSchema>;
export type ChatPinInput = z.infer<typeof chatPinSchema>;

// ── Moderation Schemas ──

export const muteUserSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  userId: z.string().regex(objectIdRegex, 'Invalid user ID format'),
  reason: z.string().trim().max(500).optional(),
});

export const unmuteUserSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  userId: z.string().regex(objectIdRegex, 'Invalid user ID format'),
});

export const banUserSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  userId: z.string().regex(objectIdRegex, 'Invalid user ID format'),
  reason: z.string().trim().max(500).optional(),
});

export const unbanUserSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  userId: z.string().regex(objectIdRegex, 'Invalid user ID format'),
});

export const reportMessageSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  messageId: z.string().regex(objectIdRegex, 'Invalid message ID format'),
  reason: z.string().trim().max(500).optional(),
});

export const reportUserSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  userId: z.string().regex(objectIdRegex, 'Invalid user ID format'),
  reason: z.string().trim().max(500).optional(),
});

// ── Moderation Export Types ──

export type MuteUserInput = z.infer<typeof muteUserSchema>;
export type UnmuteUserInput = z.infer<typeof unmuteUserSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type UnbanUserInput = z.infer<typeof unbanUserSchema>;
export type ReportMessageInput = z.infer<typeof reportMessageSchema>;
export type ReportUserInput = z.infer<typeof reportUserSchema>;

// ── Reaction Schemas ──

export const reactionSendSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  type: z.enum(['love', 'fire', 'clap', 'wow', 'glow']),
});

export type ReactionSendInput = z.infer<typeof reactionSendSchema>;

// ── Guest Request Schemas ──

export const guestRequestSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  reason: z.string().trim().max(500).optional(),
});

export const guestRequestActionSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'Invalid session ID format'),
  requestId: z.string().regex(objectIdRegex, 'Invalid request ID format'),
});

export type GuestRequestInput = z.infer<typeof guestRequestSchema>;
export type GuestRequestActionInput = z.infer<typeof guestRequestActionSchema>;
