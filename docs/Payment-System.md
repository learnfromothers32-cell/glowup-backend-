# Payment System

## Architecture

The payment layer is **fully provider-agnostic** — currently wired to Paystack, ready for Stripe/MoMo/M-Pesa by implementing one interface.

```typescript
// server/src/services/payment/types.ts
interface CardPaymentProvider {
  initializeTransaction(
    amount: number,
    email: string,
    metadata: Record<string, string>
  ): Promise<PaymentInitResult>;
  verifyTransaction(reference: string): Promise<PaymentVerificationResult>;
}
```

## Provider Registry

```typescript
// server/src/services/payment/factory.ts
const providers = new Map<string, CardPaymentProvider>();
providers.set('paystack', new PaystackProvider());

export function getProvider(name: string): CardPaymentProvider {
  const provider = providers.get(name);
  if (!provider) throw new Error(`Unknown provider: ${name}`);
  return provider;
}
```

## Webhook Flow

Webhook routes are **provider-aware** via dynamic params:

```
POST /api/payments/webhook/:provider
```

### Verification Steps
1. Extract provider from URL params
2. Get provider instance from factory
3. Verify HMAC-SHA512 signature (timing-safe comparison)
4. Parse webhook payload
5. Validate amount matches expected booking amount
6. Update transaction atomically (Mongoose session)
7. Update booking status
8. Deduct inventory if applicable
9. Award loyalty points

## Atomic Writes

All multi-write operations run inside **Mongoose sessions**:

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Update transaction
  await Transaction.findByIdAndUpdate(txnId, { status: 'completed' }, { session });
  
  // 2. Confirm booking
  await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed' }, { session });
  
  // 3. Deduct inventory
  await Product.findByIdAndUpdate(productId, { $inc: { stock: -qty } }, { session });
  
  // 4. Award loyalty points
  await User.findByIdAndUpdate(userId, { $inc: { loyaltyPoints: points } }, { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Amount Validation

Webhook handlers validate that the amount received matches the expected amount:

```typescript
if (webhookAmount !== expectedAmount) {
  logger.warn('Amount mismatch', { expected: expectedAmount, received: webhookAmount });
  return res.status(400).json({ error: 'Amount mismatch' });
}
```

## Supported Providers

| Provider | Status | Method | Currency |
|----------|--------|--------|----------|
| Paystack | Live | Card, Bank Transfer, USSD | NGN, GHS, KES, ZAR |
| Stripe | Ready (interface implemented) | Card | Multi-currency |
| MTN MoMo | Ready (via Paystack channels) | Mobile Money | GHS |
| M-Pesa | Ready (via Paystack channels) | Mobile Money | KES |

## Adding a New Provider

1. Implement `CardPaymentProvider` interface
2. Register in `factory.ts`
3. Add webhook signature verification in `webhook.ts`
4. No controller or route changes needed

## Platform Fees

```typescript
// server/src/services/payment/platform-fee.ts
export function calculatePlatformFee(amount: number, feePercent: number = 2.5): number {
  return Math.round(amount * (feePercent / 100));
}
```

## Security

- HMAC-SHA512 timing-safe signature verification
- Amount validation on every webhook
- Provider-agnostic error handling (no gateway details leaked to client)
- Structured logging on all payment events
