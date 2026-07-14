import { Document, Schema, Types, model } from 'mongoose';

export interface ILiveChatMessage extends Document {
  sessionId: Types.ObjectId;
  userId: string | Types.ObjectId;
  userName: string;
  userRole: 'client' | 'stylist' | 'moderator';
  message: string;
  parentId?: Types.ObjectId;
  isPinned: boolean;
  mentions: string[];
  createdAt: Date;
}

export interface ILiveSession extends Document {
  stylistId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  privacy: 'public' | 'followers' | 'private';
  isLive: boolean;
  startedAt: Date;
  scheduledAt?: Date;
  endedAt?: Date;
  durationMinutes: number;
  viewerCount: number;
  peakViewers: number;
  recordingUrl?: string;
  totalGifts: number;
  totalCoins: number;
  reactionCounts: Record<string, number>;
  tags: string[];
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILiveSchedule extends Document {
  stylistId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  scheduledAt: Date;
  durationMinutes: number;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const liveChatMessageSchema = new Schema<ILiveChatMessage>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true, index: true },
    userId: { type: Schema.Types.Mixed, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ['client', 'stylist', 'moderator'], default: 'client' },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    parentId: { type: Schema.Types.ObjectId, ref: 'LiveChatMessage' },
    isPinned: { type: Boolean, default: false },
    mentions: [{ type: String }],
  },
  { timestamps: true }
);

liveChatMessageSchema.index({ sessionId: 1, createdAt: -1 });
liveChatMessageSchema.index({ parentId: 1 });

const liveSessionSchema = new Schema<ILiveSession>(
  {
    stylistId: { type: Schema.Types.ObjectId, ref: 'Stylist', required: true, index: true },
    title: { type: String, default: 'Live Session', trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    category: {
      type: String,
      enum: ['hairstyling', 'makeup', 'skincare', 'nail-art', 'braids-weaves', 'barbering', 'waxing-threading', 'beauty-tips'],
      default: 'hairstyling',
      index: true,
    },
    privacy: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    isLive: { type: Boolean, default: true, index: true },
    startedAt: { type: Date, default: Date.now },
    scheduledAt: { type: Date },
    endedAt: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    viewerCount: { type: Number, default: 0 },
    peakViewers: { type: Number, default: 0 },
    recordingUrl: { type: String },
    totalGifts: { type: Number, default: 0 },
    totalCoins: { type: Number, default: 0 },
    reactionCounts: { type: Schema.Types.Mixed, default: {} },
    tags: [{ type: String }],
    location: { type: String },
  },
  { timestamps: true }
);

liveSessionSchema.index({ isLive: 1, viewerCount: -1 });
liveSessionSchema.index({ isLive: 1, category: 1, viewerCount: -1 });
liveSessionSchema.index({ scheduledAt: 1 }, { sparse: true });

const liveScheduleSchema = new Schema<ILiveSchedule>(
  {
    stylistId: { type: Schema.Types.ObjectId, ref: 'Stylist', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    category: {
      type: String,
      enum: ['hairstyling', 'makeup', 'skincare', 'nail-art', 'braids-weaves', 'barbering', 'waxing-threading', 'beauty-tips'],
      default: 'hairstyling',
    },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30 },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

liveScheduleSchema.index({ scheduledAt: 1, isCancelled: 1 });

export const LiveChatMessage = model<ILiveChatMessage>('LiveChatMessage', liveChatMessageSchema);
export const LiveSession = model<ILiveSession>('LiveSession', liveSessionSchema);
export const LiveSchedule = model<ILiveSchedule>('LiveSchedule', liveScheduleSchema);
