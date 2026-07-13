import { initializePayment, handleWebhook, verifyPayment, chargeCard } from '../controllers/payment.controller';
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

function makeBooking(overrides: Record<string, any> = {}) {
  return {
    _id: BOOKING_ID,
    clientId: { toString: () => CLIENT_ID },
    stylistId: 'stylist123',
    totalPrice: 100,
    paymentStatus: 'pending',
    paymentId: undefined,
    save: jest.fn(),
    id: BOOKING_ID,
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
  mockParseEvent.mockReturnValue({ event: 'success', reference: '', amount: undefined, providerMetadata: undefined });

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
      populate: jest.fn().mockResolvedValue(makeBooking()),
    });
    (Transaction.create as jest.Mock).mockResolvedValue([{}]);

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
      populate: jest.fn().mockResolvedValue(makeBooking()),
    });
    (Transaction.create as jest.Mock).mockResolvedValue([{}]);

    const { getProvider } = require('../services/payment/factory');
    const customProvider = mockProvider({ name: 'custom' });
    getProvider.mockReturnValue(customProvider);

    const res = fakeRes();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID, paymentMethod: 'card', paymentProvider: 'custom' } }), res, jest.fn());

    expect(getProvider).toHaveBeenCalledWith('custom');
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
      populate: jest.fn().mockResolvedValue(makeBooking({ clientId: { toString: () => 'different-user' } })),
    });
    const next = jest.fn();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('throws 400 when booking is already paid', async () => {
    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeBooking({ paymentStatus: 'paid' })),
    });
    const next = jest.fn();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('throws 503 when provider initialization fails', async () => {
    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeBooking()),
    });
    mockInitialize.mockRejectedValueOnce(new Error('network timeout'));

    const next = jest.fn();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID, paymentMethod: 'card' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(503);
  });

  it('generates dev reference when provider not configured in dev mode', async () => {
    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeBooking()),
    });
    const { isProviderConfigured } = require('../services/payment/factory');
    isProviderConfigured.mockReturnValueOnce(false);
    (Transaction.create as jest.Mock).mockResolvedValue([{}]);

    const res = fakeRes();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID, paymentMethod: 'card' } }), res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body.data.reference).toMatch(/^DEV-/);
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

  it('processes charge.success and updates transaction atomically', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'ref_abc123', amount: 100 });

    const mockTx = {
      _id: 'tx1', bookingId: BOOKING_ID, amount: 100, paymentRef: 'ref_abc123', status: 'pending',
      save: jest.fn(),
    };
    const mockSessionObj = { session: jest.fn().mockReturnValue({}) };
    (Transaction.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(mockTx) });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('processes charge.failed event', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'failed', reference: 'ref_fail', amount: undefined });

    const mockTx = {
      _id: 'tx2', bookingId: BOOKING_ID, status: 'pending', save: jest.fn(),
    };
    (Transaction.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(mockTx) });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockTx.status).toBe('failed');
  });

  it('returns 200 for already-processed webhooks (idempotency)', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'ref_dup', amount: 100 });

    (Transaction.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('defaults to paystack when no provider param is given', async () => {
    const { getProvider } = require('../services/payment/factory');
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'ref1', amount: undefined });
    (Transaction.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: {} });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(getProvider).toHaveBeenCalledWith('paystack');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 200 for unknown event types', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'unknown', reference: '' });

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 200 for webhooks with empty reference', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: '', amount: undefined });

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects webhook when amount mismatches transaction amount', async () => {
    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'ref_mismatch', amount: 999 });

    const mockTx = {
      _id: 'tx3', bookingId: BOOKING_ID, amount: 100, paymentRef: 'ref_mismatch', status: 'pending',
      save: jest.fn(),
    };
    (Transaction.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(mockTx) });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const req = fakeReq({ headers: { 'x-paystack-signature': 'valid-sig' }, body: Buffer.from(JSON.stringify({})), params: { provider: 'paystack' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockTx.save).not.toHaveBeenCalled();
  });

  it('returns 200 for unconfigured provider', async () => {
    const { isProviderConfigured } = require('../services/payment/factory');
    isProviderConfigured.mockReturnValueOnce(false);

    const req = fakeReq({ headers: {}, body: Buffer.from(JSON.stringify({})), params: { provider: 'nonexistent' } });
    const res = fakeRes();
    await handleWebhook(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('verifyPayment', () => {
  it('returns transaction status for a found transaction', async () => {
    const transaction = { _id: 'tx1', status: 'paid', amount: 100, paymentRef: 'ref1', paymentProvider: 'paystack' };
    (Transaction.findOne as jest.Mock).mockResolvedValue(transaction);

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

  it('returns current status immediately for non-pending transactions', async () => {
    const transaction = { _id: 'tx1', status: 'paid', amount: 100, paymentRef: 'ref1', paymentProvider: 'paystack' };
    (Transaction.findOne as jest.Mock).mockResolvedValue(transaction);

    const res = fakeRes();
    await verifyPayment(fakeReq({ params: { reference: 'ref1' } }), res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body.data.status).toBe('paid');
  });

  it('rejects verification when amount does not match', async () => {
    const transaction = { _id: 'tx1', status: 'pending', amount: 100, paymentRef: 'ref1', paymentProvider: 'paystack' };
    (Transaction.findOne as jest.Mock).mockResolvedValue(transaction);
    mockVerify.mockResolvedValueOnce({ status: 'success', reference: 'ref1', amount: 200, currency: 'GHS' });

    const next = jest.fn();
    await verifyPayment(fakeReq({ params: { reference: 'ref1' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(402);
  });

  it('handles provider verification failure gracefully', async () => {
    const transaction = { _id: 'tx1', status: 'pending', amount: 100, paymentRef: 'ref1', paymentProvider: 'paystack' };
    (Transaction.findOne as jest.Mock).mockResolvedValue(transaction);
    mockVerify.mockRejectedValueOnce(new Error('network error'));

    const res = fakeRes();
    await verifyPayment(fakeReq({ params: { reference: 'ref1' } }), res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body.data.status).toBe('pending');
  });

  it('uses transaction.paymentProvider to select provider', async () => {
    const transaction = { _id: 'tx1', status: 'pending', paymentRef: 'ref1', paymentProvider: 'paystack', amount: 100 };
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

describe('chargeCard', () => {
  it('charges card successfully and creates transaction', async () => {
    const booking = makeBooking();
    (Booking.findById as jest.Mock).mockResolvedValue(booking);

    const res = fakeRes();
    await chargeCard(fakeReq({ body: { bookingId: BOOKING_ID, token: 'tok_test' } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.status).toBe('paid');
    expect(body.data.reference).toBe('psk_ref_123');
  });

  it('throws 404 when booking not found', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(null);
    const next = jest.fn();
    await chargeCard(fakeReq({ body: { bookingId: BOOKING_ID, token: 'tok_test' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('throws 403 when paying for another users booking', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(
      makeBooking({ clientId: { toString: () => 'other-user' } }),
    );
    const next = jest.fn();
    await chargeCard(fakeReq({ body: { bookingId: BOOKING_ID, token: 'tok_test' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('throws 400 when booking is already paid', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(
      makeBooking({ paymentStatus: 'paid' }),
    );
    const next = jest.fn();
    await chargeCard(fakeReq({ body: { bookingId: BOOKING_ID, token: 'tok_test' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it('throws 503 when provider API call fails', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(makeBooking());
    mockChargeCard.mockRejectedValueOnce(new Error('timeout'));

    const next = jest.fn();
    await chargeCard(fakeReq({ body: { bookingId: BOOKING_ID, token: 'tok_test' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(503);
  });

  it('throws 402 when charge is declined', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(makeBooking());
    mockChargeCard.mockResolvedValueOnce({ status: 'failed', reference: 'ref_fail', gatewayResponse: 'Insufficient funds' });

    const next = jest.fn();
    await chargeCard(fakeReq({ body: { bookingId: BOOKING_ID, token: 'tok_test' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(402);
  });

  it('error message does not leak gateway response details', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(makeBooking());
    mockChargeCard.mockResolvedValueOnce({ status: 'failed', reference: 'ref_fail', gatewayResponse: 'Internal bank error code XYZ' });

    const next = jest.fn();
    await chargeCard(fakeReq({ body: { bookingId: BOOKING_ID, token: 'tok_test' } }), fakeRes(), next);
    expect(next.mock.calls[0][0].message).not.toContain('Internal bank error code XYZ');
  });

  it('accepts paymentProvider from request body', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(makeBooking());

    const { getProvider } = require('../services/payment/factory');
    const customProvider = mockProvider({ name: 'custom', chargeCard: mockChargeCard });
    getProvider.mockReturnValue(customProvider);

    const res = fakeRes();
    await chargeCard(fakeReq({ body: { bookingId: BOOKING_ID, token: 'tok_test', paymentProvider: 'custom' } }), res, jest.fn());

    expect(getProvider).toHaveBeenCalledWith('custom');
  });
});

describe('Paystack regression', () => {
  it('initializePayment → verifyPayment → webhook all route through getProvider("paystack")', async () => {
    const { getProvider } = require('../services/payment/factory');

    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeBooking({ totalPrice: 50 })),
    });
    (Transaction.create as jest.Mock).mockResolvedValue([{}]);

    const initRes = fakeRes();
    await initializePayment(fakeReq({ body: { bookingId: BOOKING_ID, paymentMethod: 'card' } }), initRes, jest.fn());
    expect(getProvider).toHaveBeenCalledWith('paystack');
    expect(mockInitialize).toHaveBeenCalled();

    const tx = { _id: 'tx1', status: 'pending', paymentRef: 'psk_ref_123', paymentProvider: 'paystack', amount: 50 };
    (Transaction.findOne as jest.Mock).mockResolvedValue(tx);
    mockVerify.mockResolvedValue({ status: 'success', reference: 'psk_ref_123', amount: 50, currency: 'GHS' });
    (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue({ ...tx, status: 'paid' });
    (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const verifyRes = fakeRes();
    await verifyPayment(fakeReq({ params: { reference: 'psk_ref_123' } }), verifyRes, jest.fn());
    expect(getProvider).toHaveBeenCalledWith('paystack');
    expect(mockVerify).toHaveBeenCalledWith('psk_ref_123');

    mockValidateSignature.mockReturnValueOnce(true);
    mockParseEvent.mockReturnValueOnce({ event: 'success', reference: 'psk_ref_123', amount: 50 });
    (Transaction.findOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

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
