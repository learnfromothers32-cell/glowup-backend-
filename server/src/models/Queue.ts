import { Document, Schema, Types, model } from 'mongoose';

export type QueueEntryStatus = 'waiting' | 'in-service' | 'done' | 'skipped';

export interface IQueueEntry {
  userId: Types.ObjectId;
  position: number;
  joinedAt: Date;
  estimatedServiceMins: number;
  status: QueueEntryStatus;
  bookingId?: Types.ObjectId;
}

export interface IQueue extends Document {
  id: string;
  stylistId: Types.ObjectId;
  entries: IQueueEntry[];
  currentPosition: number;
  predictedWaitMins: number;
  avgServiceDuration: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  recalculate: () => void;
}

const queueEntrySchema = new Schema<IQueueEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, required: true },
    joinedAt: { type: Date, default: Date.now },
    estimatedServiceMins: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['waiting', 'in-service', 'done', 'skipped'],
      default: 'waiting'
    },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' }
  },
  { _id: false }
);

const queueSchema = new Schema<IQueue>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      unique: true,
      index: true
    },
    entries: { type: [queueEntrySchema], default: [] },
    currentPosition: { type: Number, default: 0 },
    predictedWaitMins: { type: Number, default: 0 },
    avgServiceDuration: { type: Number, default: 30 },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

queueSchema.methods.recalculate = function () {
  const waiting = this.entries.filter(
    (e: IQueueEntry) => e.status === 'waiting'
  );

  waiting.forEach((entry: IQueueEntry, idx: number) => {
    entry.position = idx + 1;
  });

  this.currentPosition = this.entries.filter(
    (e: IQueueEntry) => e.status === 'waiting' || e.status === 'in-service'
  ).length;

  const activeEntries = this.entries.filter(
    (e: IQueueEntry) => e.status === 'waiting'
  );

  if (activeEntries.length > 0) {
    const avgMins = this.avgServiceDuration || 30;
    this.predictedWaitMins = Math.round(
      (this.currentPosition - 1) * avgMins
    );
  } else {
    this.predictedWaitMins = 0;
  }

  this.lastUpdated = new Date();
};

export const Queue = model<IQueue>('Queue', queueSchema);
