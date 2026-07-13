import { initializePayment, handleWebhook, verifyPayment } from '../controllers/payment.controller';
import { Booking } from '../models/Booking';
import { Transaction } from '../models/Transaction';

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

const mockInitialize = jest.fn();
const mockVerify = jest.fn();
const mockChargeCard = jest.fn();
const mockValidateSignature = jest.fn();
const mockParseEvent = jest.fn();

jest.mock('../services/payment/factory', () => ({
  getProvider: jest.fn(),
  isProviderConfigured: jest.fn(() => true),
}));

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

function mockProvider(overrides: Record<string, any> = {}) {
  return {
    name: 'paystack',
    initializePayment: mockInitialize,
    verifyPayment: mockVerify,
    chargeCard: mockChargeCard,
    validateWebhookSignature: mockValidateSignature,
    parseWebhookEvent: mockParseEvent,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.endSession.mockClear();
  mockSession.withTransaction.mockImplementation(async (fn: Function) => fn());
  mongooseMock.startSession.mockResolvedValue(mockSession);

  mockInitialize.mockResolvedValue({
    reference: 'psk_ref_123',
    authorizationUrl: 'https://paystack.co/pay/123',
    accessCode: 'access_123',
  });
  mockVerify.mockResolvedValue({
    status: 'success',
    reference: 'psk_ref_123',
    amount: 100,
    currency: 'GHS',
  });
  mockChargeCard.mockResolvedValue({
    status: 'success',
    reference: 'psk_ref_123',
  });
  mockValidateSignature.mockImplementation((_raw: Buffer, headers: Record<string, string>) => {
    return !!headers['x-paystack-signature'];
  });
  mockParseEvent.mockReturnValue({ event: 'success', reference: '' });

  const { getProvider } = require('../services/payment/factory');
  getProvider.mockReturnValue(mockProvider());
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
  it('creates a transaction and returns reference via provider', async () => {
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

  it('uses provider from request body when paymentProvider is specified', async () => {
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

    const { getProvider } = require('../services/payment/factory');
    const customProvider = mockProvider({ name: 'custom' });
    getProvider.mockReturnValue(customProvider);

    const res = fakeRes();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID, paymentMethod: 'card', paymentProvider: 'custom' } }), res, jest.fn());

    expect(getProvider).toHaveBeenCalledWith('custom');
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ paymentProvider: 'custom' }),
    );
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

describe('handleWebhook', () => {
  it('returns 401 when signature is missing', async () => {
    const req = fakeReq({ headers: {}, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for invalid signature', async () => {
    mockValidateSignature.mockReturnValueOnce(false);
    const req = fakeReq({
      headers: { 'x-paystack-signature': 'invalid-sig' },
      body: Buffer.from(JSON.stringify({})),
      params: { provider: 'paystack' },
    });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('processes charge.success event and updates transaction', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'ref_abc123' });

    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue({
      _id: 'tx1', bookingId: BOOKING_ID, amount: 100, paymentRef: 'ref_abc123', status: 'pending',
    });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    expect(Transaction.findOneAndUpdate).toHaveBeenCalledWith(
      { paymentRef: 'ref_abc123', status: 'pending' },
      { $set: { status: 'paid' } },
      expect.any(Object),
    );
  });

  it('processes charge.failed event', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'failed', reference: 'ref_fail' });

    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'tx2', bookingId: BOOKING_ID });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Transaction.findOneAndUpdate).toHaveBeenCalledWith(
      { paymentRef: 'ref_fail', status: 'pending' },
      { $set: { status: 'failed' } },
    );
  });

  it('returns 200 for already-processed webhooks (idempotency)', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'ref_dup' });

    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('defaults to paystack when no provider param is given', async () => {
    const { getProvider } = require('../services/payment/factory');
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'ref1' });
    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: {} });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(getProvider).toHaveBeenCalledWith('paystack');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('verifyPayment', () => {
  it('returns transaction status for a found transaction', async () => {
    const transaction = { _id: 'tx1', status: 'paid', amount: 100, paymentRef: 'ref1', paymentProvider: 'paystack' };
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
    const next = jest.fn();
    await verifyPayment(fakeReq({ params: { reference: 'nonexistent' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('uses transaction.paymentProvider to select provider', async () => {
    const transaction = { _id: 'tx1', status: 'pending', paymentRef: 'ref1', paymentProvider: 'paystack' };
    (Transaction.findOne as jest.Mock).mockResolvedValue(transaction);
    mockVerify.mockResolvedValue({ status: 'success', reference: 'ref1', amount: 100, currency: 'GHS' });
    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue({ ...transaction, status: 'paid' });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const { getProvider } = require('../services/payment/factory');
    const res = fakeRes();
    await verifyPayment(fakeReq({ params: { reference: 'ref1' } }), res, jest.fn());

    expect(getProvider).toHaveBeenCalledWith('paystack');
  });
});

describe('Paystack regression', () => {
  it('initializePayment → verifyPayment → webhook all route through getProvider("paystack")', async () => {
    const { getProvider } = require('../services/payment/factory');

    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: BOOKING_ID,
        clientId: { toString: () => CLIENT_ID },
        stylistId: 'stylist123',
        totalPrice: 50,
        paymentStatus: 'pending',
        save: jest.fn(),
      }),
    });
    (Transaction.create as jest.Mock).mockResolvedValue({});

    const initRes = fakeRes();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID, paymentMethod: 'card' } }), initRes, jest.fn());
    expect(getProvider).toHaveBeenCalledWith('paystack');
    expect(mockInitialize).toHaveBeenCalled();

    const tx = { _id: 'tx1', status: 'pending', paymentRef: 'psk_ref_123', paymentProvider: 'paystack' };
    (Transaction.findOne as jest.Mock).mockResolvedValue(tx);
    mockVerify.mockResolvedValue({ status: 'success', reference: 'psk_ref_123', amount: 50, currency: 'GHS' });
    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue({ ...tx, status: 'paid' });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const verifyRes = fakeRes();
    await verifyPayment(fakeReq({ params: { reference: 'psk_ref_123' } }), verifyRes, jest.fn());
    expect(getProvider).toHaveBeenCalledWith('paystack');
    expect(mockVerify).toHaveBeenCalledWith('psk_ref_123');

    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'psk_ref_123' });
    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue({ ...tx, status: 'paid' });

    const webhookReq = fakeReq({
      headers: { 'x-paystack-signature': 'valid' },
      body: Buffer.from(JSON.stringify({})),
      params: { provider: 'paystack' },
    });
    const webhookRes = fakeRes();
    await handleWebhook(webhookReq, webhookRes, jest.fn());
    expect(getProvider).toHaveBeenCalledWith('paystack');
    expect(mockValidateSignature).toHaveBeenCalled();
    expect(mockParseEvent).toHaveBeenCalled();
  });
});
