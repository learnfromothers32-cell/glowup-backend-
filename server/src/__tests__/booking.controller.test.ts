import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createBooking, updateBookingStatus, cancelBooking } from '../controllers/booking.controller';
import { Booking } from '../models/Booking';
import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { Availability } from '../models/Availability';
import { StylistSettings } from '../models/StylistSettings';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Conversation } from '../models/Conversation';
import { Queue } from '../models/Queue';

jest.mock('../middleware/asyncHandler', () => ({
  asyncHandler: (handler: Function) => (req: any, res: any, next: any) =>
    Promise.resolve(handler(req, res, next)).catch(next),
}));

const mockSession = {
  endSession: jest.fn(),
  withTransaction: jest.fn().mockImplementation(async (fn: Function) => fn()),
};

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    startSession: jest.fn(),
    Types: actual.Types,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.endSession.mockClear();
  mockSession.withTransaction.mockImplementation(async (fn: Function) => fn());
  (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);
});
jest.mock('../models/Booking');
jest.mock('../models/Service');
jest.mock('../models/Stylist');
jest.mock('../models/Availability');
jest.mock('../models/StylistSettings');
jest.mock('../models/User');
jest.mock('../models/Client');
jest.mock('../models/Conversation');
jest.mock('../models/Queue');
jest.mock('../socket', () => ({ getIO: () => ({ of: () => ({ to: () => ({ emit: jest.fn() }) }) }) }));
jest.mock('../utils/notify', () => ({
  notifyBookingCreated: jest.fn().mockResolvedValue(undefined),
  notifyBookingStatusChange: jest.fn().mockResolvedValue(undefined),
  notifyNewBookingForStylist: jest.fn().mockResolvedValue(undefined),
  notifyBookingRescheduled: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../utils/queue', () => ({ emitQueueUpdate: jest.fn() }));
jest.mock('../utils/logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

const STYLIST_ID = '507f191e810c19729de860ea';
const SERVICE_ID = '507f191e810c19729de860eb';
const CLIENT_ID = '507f191e810c19729de860ec';
const BOOKING_ID = '507f191e810c19729de860ed';
const USER_ID = '507f191e810c19729de860ee';

function fakeReq(overrides: any = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: CLIENT_ID, role: 'client' },
    ...overrides,
  };
}

function fakeRes(): any {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function mockBooking(overrides: any = {}) {
  return {
    _id: BOOKING_ID,
    clientId: { _id: CLIENT_ID, toString: () => CLIENT_ID },
    stylistId: STYLIST_ID,
    serviceId: SERVICE_ID,
    startTime: new Date('2026-08-01T10:00:00Z'),
    endTime: new Date('2026-08-01T10:30:00Z'),
    status: 'pending',
    totalPrice: 50,
    paymentStatus: 'pending',
    save: jest.fn(),
    ...overrides,
  };
}

describe('createBooking', () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  futureDate.setUTCHours(10, 0, 0, 0);
  const futureTime = futureDate.toISOString();

  beforeEach(() => {
    (Service.findOne as jest.Mock).mockResolvedValue({
      _id: SERVICE_ID,
      stylistId: STYLIST_ID,
      price: 50,
      duration: 30,
    });
    (Availability.findOne as jest.Mock).mockResolvedValue({
      stylistId: STYLIST_ID,
      bufferMinutes: 0,
      maxClientsPerSlot: 1,
      timezone: 'UTC',
      schedule: new Map([['sunday', { enabled: true, start: '09:00', end: '17:00', breaks: [] }], ['monday', { enabled: true, start: '09:00', end: '17:00', breaks: [] }], ['tuesday', { enabled: true, start: '09:00', end: '17:00', breaks: [] }], ['wednesday', { enabled: true, start: '09:00', end: '17:00', breaks: [] }], ['thursday', { enabled: true, start: '09:00', end: '17:00', breaks: [] }], ['friday', { enabled: true, start: '09:00', end: '17:00', breaks: [] }], ['saturday', { enabled: true, start: '09:00', end: '17:00', breaks: [] }]]),
      dateOverrides: [],
    });
    (Booking.countDocuments as jest.Mock).mockResolvedValue(0);
    (StylistSettings.findOne as jest.Mock).mockResolvedValue(null);
    (Booking.create as jest.Mock).mockResolvedValue(mockBooking());
    (Client.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
    (Conversation.findOne as jest.Mock).mockResolvedValue(null);
    (Conversation.create as jest.Mock).mockResolvedValue(null);
    (Stylist.findById as jest.Mock).mockResolvedValue({ _id: STYLIST_ID, name: 'Test Stylist', userId: USER_ID });
    (User.findById as jest.Mock).mockResolvedValue({ _id: CLIENT_ID, name: 'Client' });
    (Queue.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
    (Queue.findOne as jest.Mock).mockResolvedValue(null);
  });

  it('creates a booking and returns 201', async () => {
    const res = fakeRes();
    await createBooking(
      fakeReq({ body: { stylistId: STYLIST_ID, serviceId: SERVICE_ID, startTime: futureTime } }),
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.booking).toBeDefined();
  });

  it('throws 400 when missing required fields', async () => {
    const next = jest.fn();
    await createBooking(fakeReq({ body: {} }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('throws 400 for invalid stylistId format', async () => {
    const next = jest.fn();
    await createBooking(fakeReq({ body: { stylistId: 'bad', serviceId: SERVICE_ID, startTime: futureTime } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('throws 404 when service not found for stylist', async () => {
    (Service.findOne as jest.Mock).mockResolvedValue(null);
    const next = jest.fn();
    await createBooking(fakeReq({ body: { stylistId: STYLIST_ID, serviceId: SERVICE_ID, startTime: futureTime } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('throws 409 on duplicate booking (MongoDB 11000)', async () => {
    (Booking.create as jest.Mock).mockRejectedValue({ code: 11000 });
    const next = jest.fn();
    await createBooking(fakeReq({ body: { stylistId: STYLIST_ID, serviceId: SERVICE_ID, startTime: futureTime } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(409);
    expect(next.mock.calls[0][0].message).toContain('just booked');
  });

  it('throws 409 when slot conflicts with existing booking', async () => {
    (Booking.countDocuments as jest.Mock).mockResolvedValue(1);
    const next = jest.fn();
    await createBooking(fakeReq({ body: { stylistId: STYLIST_ID, serviceId: SERVICE_ID, startTime: futureTime } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(409);
  });

  it('throws 409 when slot is fully booked (capacity exceeded)', async () => {
    (Booking.countDocuments as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    const next = jest.fn();
    await createBooking(fakeReq({ body: { stylistId: STYLIST_ID, serviceId: SERVICE_ID, startTime: futureTime } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(409);
    expect(next.mock.calls[0][0].message).toContain('fully booked');
  });
});

describe('updateBookingStatus', () => {
  it('transitions a pending booking to confirmed', async () => {
    const booking = mockBooking({ status: 'pending' });
    (Booking.findById as jest.Mock).mockResolvedValue(booking);
    (Stylist.findOne as jest.Mock).mockResolvedValue({ userId: USER_ID });
    (Booking.findOneAndUpdate as jest.Mock).mockResolvedValue({ ...booking, status: 'confirmed' });

    const res = fakeRes();
    await updateBookingStatus(
      fakeReq({ params: { id: BOOKING_ID }, body: { status: 'confirmed' }, user: { id: USER_ID, role: 'stylist' } }),
      res,
      jest.fn(),
    );

    expect(res.json).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.booking.status).toBe('confirmed');
  });

  it('throws 400 for invalid booking ID', async () => {
    const next = jest.fn();
    await updateBookingStatus(fakeReq({ params: { id: 'bad' }, body: { status: 'confirmed' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('throws 404 when booking not found', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(null);
    const next = jest.fn();
    await updateBookingStatus(fakeReq({ params: { id: BOOKING_ID }, body: { status: 'confirmed' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('throws 400 for invalid status transition', async () => {
    const booking = mockBooking({ status: 'completed' });
    (Booking.findById as jest.Mock).mockResolvedValue(booking);
    const next = jest.fn();
    await updateBookingStatus(fakeReq({ params: { id: BOOKING_ID }, body: { status: 'pending' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('throws 403 when non-admin/non-stylist tries to update', async () => {
    const booking = mockBooking();
    (Booking.findById as jest.Mock).mockResolvedValue(booking);
    (Stylist.findOne as jest.Mock).mockResolvedValue(null);
    const next = jest.fn();
    await updateBookingStatus(
      fakeReq({ params: { id: BOOKING_ID }, body: { status: 'confirmed' }, user: { id: 'other', role: 'client' } }),
      fakeRes(),
      next,
    );
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});

describe('cancelBooking', () => {
  it('cancels a pending booking', async () => {
    const booking = mockBooking({ status: 'pending' });
    (Booking.findById as jest.Mock).mockResolvedValue(booking);
    (Stylist.findOne as jest.Mock).mockResolvedValue(null);
    (Booking.findOneAndUpdate as jest.Mock).mockResolvedValue({ ...booking, status: 'cancelled' });
    (Queue.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    const res = fakeRes();
    await cancelBooking(fakeReq({ params: { id: BOOKING_ID }, body: {} }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.booking.status).toBe('cancelled');
  });

  it('throws 400 when cancelling a completed booking', async () => {
    const booking = mockBooking({ status: 'completed' });
    (Booking.findById as jest.Mock).mockResolvedValue(booking);
    const next = jest.fn();
    await cancelBooking(fakeReq({ params: { id: BOOKING_ID }, body: {} }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('throws 403 when unauthorized user tries to cancel', async () => {
    const booking = mockBooking({
      clientId: { _id: 'other', toString: () => 'other' },
      stylistId: '507f191e810c19729de860ea',
    });
    (Booking.findById as jest.Mock).mockResolvedValue(booking);
    (Stylist.findOne as jest.Mock).mockResolvedValue(null);
    const next = jest.fn();
    await cancelBooking(
      fakeReq({ params: { id: BOOKING_ID }, user: { id: CLIENT_ID, role: 'client' } }),
      fakeRes(),
      next,
    );
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});
