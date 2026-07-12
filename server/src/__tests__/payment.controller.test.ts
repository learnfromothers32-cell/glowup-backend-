import crypto from 'crypto';
import { initializePayment, paystackWebhook, verifyPayment } from '../controllers/payment.controller';
import { Booking } from '../models/Booking';
import { Transaction } from '../models/Transaction';

const PAYSTACK_SECRET = 'sk_test_fake_secret_key';
const BOOKING_ID = '507f191e810c19729de860ea';
const CLIENT_ID = '507f191e810c19729de860eb';

jest.mock('../middleware/asyncHandler', () => ({
  asyncHandler: (handler: Function) => (req: any, res: any, next: any) =>
    Promise.resolve(handler(req, res, next)).catch(next),
}));

jest.mock('../config/app', () => ({
  appConfig: {
    paystackSecretKey: 'sk_test_fake_secret_key',
    clientUrl: 'http://localhost:5173',
  },
  isProduction: false,
}));

jest.mock('paystack-sdk', () => {
  const mockInitialize = jest.fn().mockResolvedValue({
    data: { reference: 'psk_ref_123', authorization_url: 'https://paystack.co/pay/123', access_code: 'access_123' },
  });
  const mockVerify = jest.fn().mockResolvedValue({
    data: { status: 'success', reference: 'psk_ref_123' },
  });

  const MockPaystack = jest.fn().mockImplementation(() => ({
    transaction: { initialize: mockInitialize, verify: mockVerify },
  }));
  (MockPaystack as any).__mocks = { initialize: mockInitialize, verify: mockVerify };
  return MockPaystack;
});

jest.mock('../models/Booking');
jest.mock('../models/Transaction');
jest.mock('../models/Stylist', () => ({ Stylist: { findOne: jest.fn() } }));
jest.mock('../services/email.service', () => ({ sendVerificationEmail: jest.fn() }));
jest.mock('../utils/logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('../socket', () => ({ getIO: () => ({ of: () => ({ to: () => ({ emit: jest.fn() }) }) }) }));
jest.mock('../utils/notify', () => ({
  notifyBookingCreated: jest.fn(),
  notifyBookingStatusChange: jest.fn(),
  notifyNewBookingForStylist: jest.fn(),
  notifyBookingRescheduled: jest.fn(),
}));
jest.mock('../utils/queue', () => ({ emitQueueUpdate: jest.fn() }));

const mockSession = {
  endSession: jest.fn(),
  withTransaction: jest.fn().mockImplementation(async (fn: Function) => fn()),
};

const mongooseMock = { startSession: jest.fn() };

jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  startSession: (...args: any[]) => mongooseMock.startSession(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.endSession.mockClear();
  mockSession.withTransaction.mockImplementation(async (fn: Function) => fn());
  mongooseMock.startSession.mockResolvedValue(mockSession);
});

function fakeReq(overrides: any = {}): any {
  return {
    body: {},
    params: {},
    headers: {},
    user: { id: CLIENT_ID, role: 'client', email: 'client@test.com' },
    ...overrides,
  };
}

function fakeRes(): any {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('initializePayment', () => {
  it('creates a transaction and returns reference via Paystack SDK', async () => {
    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: BOOKING_ID,
        clientId: { toString: () => CLIENT_ID },
        stylistId: 'stylist123',
        totalPrice: 100,
        paymentStatus: 'pending',
        paymentId: undefined,
        save: jest.fn(),
      }),
    });
    (Transaction.create as jest.Mock).mockResolvedValue({});

    const res = fakeRes();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID, paymentMethod: 'card' } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.reference).toBe('psk_ref_123');
    expect(body.data.authorization_url).toBe('https://paystack.co/pay/123');
  });

  it('throws 404 when booking not found', async () => {
    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });
    const next = jest.fn();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('throws 403 when paying for another users booking', async () => {
    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: BOOKING_ID,
        clientId: { toString: () => 'different-user' },
        totalPrice: 100,
        paymentStatus: 'pending',
      }),
    });
    const next = jest.fn();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('throws 400 when booking is already paid', async () => {
    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: BOOKING_ID,
        clientId: { toString: () => CLIENT_ID },
        totalPrice: 100,
        paymentStatus: 'paid',
      }),
    });
    const next = jest.fn();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
});

describe('paystackWebhook', () => {
  function signPayload(payload: object) {
    const raw = Buffer.from(JSON.stringify(payload));
    const hmac = crypto.createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex');
    return { raw, signature: hmac };
  }

  it('returns 401 when signature is missing', async () => {
    const payload = { event: 'charge.success', data: { reference: 'ref1' } };
    const req = fakeReq({ headers: {}, body: Buffer.from(JSON.stringify(payload)) });
    const res = fakeRes();
    await paystackWebhook(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for invalid signature', async () => {
    const payload = { event: 'charge.success', data: { reference: 'ref1' } };
    const req = fakeReq({
      headers: { 'x-paystack-signature': 'invalid-sig' },
      body: Buffer.from(JSON.stringify(payload)),
    });
    const res = fakeRes();
    await paystackWebhook(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('processes charge.success event and updates transaction', async () => {
    const payload = { event: 'charge.success', data: { reference: 'ref_abc123' } };
    const { raw, signature } = signPayload(payload);

    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue({
      _id: 'tx1', bookingId: BOOKING_ID, amount: 100, paymentRef: 'ref_abc123', status: 'pending',
    });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const req = fakeReq({ headers: { 'x-paystack-signature': signature }, body: raw });
    const res = fakeRes();
    await paystackWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    expect(Transaction.findOneAndUpdate).toHaveBeenCalledWith(
      { paymentRef: 'ref_abc123', status: 'pending' },
      { $set: { status: 'paid' } },
      expect.any(Object),
    );
  });

  it('processes charge.failed event', async () => {
    const payload = { event: 'charge.failed', data: { reference: 'ref_fail' } };
    const { raw, signature } = signPayload(payload);

    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'tx2', bookingId: BOOKING_ID });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const req = fakeReq({ headers: { 'x-paystack-signature': signature }, body: raw });
    const res = fakeRes();
    await paystackWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Transaction.findOneAndUpdate).toHaveBeenCalledWith(
      { paymentRef: 'ref_fail', status: 'pending' },
      { $set: { status: 'failed' } },
    );
  });

  it('returns 200 for already-processed webhooks (idempotency)', async () => {
    const payload = { event: 'charge.success', data: { reference: 'ref_dup' } };
    const { raw, signature } = signPayload(payload);

    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    const req = fakeReq({ headers: { 'x-paystack-signature': signature }, body: raw });
    const res = fakeRes();
    await paystackWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});

describe('verifyPayment', () => {
  it('returns transaction status for a found transaction', async () => {
    const transaction = { _id: 'tx1', status: 'paid', amount: 100, paymentRef: 'ref1' };
    (Transaction.findOne as jest.Mock).mockResolvedValue(transaction);
    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue(transaction);
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const res = fakeRes();
    await verifyPayment(fakeReq({ params: { reference: 'ref1' } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.transaction).toBeDefined();
  });

  it('returns 404 for non-existent transaction', async () => {
    (Transaction.findOne as jest.Mock).mockResolvedValue(null);
    // Make paystack verify throw so the catch block triggers Transaction.findOne
    const PaystackMock = require('paystack-sdk');
    (PaystackMock.__mocks.verify as jest.Mock).mockRejectedValueOnce(new Error('Verification failed'));
    const next = jest.fn();
    await verifyPayment(fakeReq({ params: { reference: 'nonexistent' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });
});
