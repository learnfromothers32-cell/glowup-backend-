# Testing

## Overview

GlowUp OS maintains **164+ automated tests** across **9 test suites**, covering authentication, authorization, payment processing, booking logic, input validation, and security middleware.

## Test Suites

| Suite | Tests | Coverage |
|-------|-------|----------|
| `token.test.ts` | JWT generation, validation, expiry | Auth tokens |
| `auth.middleware.test.ts` | Token verification, RBAC guards | Middleware |
| `validate.test.ts` | Zod schema validation | Input validation |
| `auth.controller.test.ts` | Login, register, social auth | Auth flows |
| `booking.controller.test.ts` | Create, accept, reject, cancel | Booking logic |
| `payment.controller.test.ts` | Charge, verify, webhooks, amount validation | Payment processing |
| `rateLimiter.test.ts` | Rate limiting behavior | Security |
| `redis.test.ts` | Cache operations, fallback | Redis layer |
| `trending.service.test.ts` | Trending calculation | Business logic |

## Running Tests

```bash
cd server
npm test
```

## Payment Test Coverage

The payment test suite (`payment.controller.test.ts`) is particularly comprehensive:

- **Charge Card** — successful initiation, provider errors, amount validation
- **Verify Payment** — successful verification, failed verification, amount mismatch
- **Webhook Handling** — signature verification, amount validation, atomic writes
- **Provider Abstraction** — dynamic provider lookup, unknown provider errors
- **Error Handling** — gateway errors not leaked to client, structured logging

## Test Architecture

Tests use **Jest** with mocked dependencies:

```typescript
// Example: payment.controller.test.ts
jest.mock('../services/payment/factory', () => ({
  getProvider: jest.fn().mockReturnValue({
    initTransaction: jest.fn().mockResolvedValue({ authorization_url: '...' }),
    verifyTransaction: jest.fn().mockResolvedValue({ status: 'success' }),
  }),
}));

describe('PaymentController', () => {
  describe('chargeCard', () => {
    it('should initialize transaction and return authorization URL', async () => { ... });
    it('should return 400 for invalid amount', async () => { ... });
    it('should handle provider errors gracefully', async () => { ... });
  });
  
  describe('webhook', () => {
    it('should verify HMAC signature', async () => { ... });
    it('should reject invalid signatures', async () => { ... });
    it('should validate amount matches expected', async () => { ... });
    it('should update transaction atomically', async () => { ... });
  });
});
```

## CI Integration

Tests run automatically via GitHub Actions on every PR and push to `main`:

```yaml
- name: Run tests
  run: cd server && npm test
```

## Writing New Tests

1. Create test file in `server/src/__tests__/`
2. Name it `<module>.test.ts`
3. Mock external dependencies (database, payment providers, email)
4. Use `describe` blocks for logical grouping
5. Use `it` blocks for individual test cases
6. Aim for >80% coverage on new business logic
