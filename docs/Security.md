# Security

## Overview

GlowUp OS implements defense-in-depth security across authentication, authorization, data validation, payment processing, and infrastructure.

## Authentication & Authorization

| Layer | Implementation |
|-------|---------------|
| **JWT Access Tokens** | 15-minute expiry, stored in memory only (never localStorage) |
| **Refresh Tokens** | 7-day expiry, stored in httpOnly cookies |
| **Password Hashing** | bcrypt with salt rounds (pre-save hook on User model) |
| **Social Auth** | Firebase Admin SDK verifies Google/Apple tokens server-side |
| **RBAC** | Role-based middleware guards (consumer, stylist, admin) |
| **Token Rotation** | Automatic refresh on 401; stale tokens immediately invalidated |

## Input Validation

Every write endpoint validates request bodies using **Zod schemas**:

```typescript
// Example: server/src/middleware/validate.ts
export const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues.map(i => i.message).join(', ')
    });
  }
  req.body = result.data;
  next();
};
```

## Payment Security

- **HMAC-SHA512** timing-safe webhook signature verification
- **Amount validation** ensures webhook amounts match expected booking amounts
- **Atomic writes** via Mongoose sessions prevent partial payment states
- **No gateway leakage** — payment errors returned as generic messages

## Network Security

| Layer | Measure |
|-------|---------|
| **CORS** | Restricted to `CLIENT_URL` origin (not `*`) |
| **Headers** | Helmet security headers on all responses |
| **CSP** | Content Security Policy via Nginx in production |
| **Rate Limiting** | Sliding window (auth: 50/15min/IP, writes: 100/15min/user) |
| **HTTPS** | Enforced via Nginx + Render/Vercel SSL |

## Data Security

- Production secrets in Render environment variables — never committed
- Firebase private keys stored as environment variables
- MongoDB Atlas with IP whitelist and authentication
- Upstash Redis with TLS and authentication
- Multer file type/size validation before Cloudinary upload

## CSRF Protection

Double-submit cookie pattern on all state-changing requests:

1. Server sets a random CSRF token in a cookie
2. Client includes the token in a header with every mutating request
3. Server compares cookie value with header value
4. Mismatch = reject request

## Error Handling

- Global error handler catches unhandled exceptions
- Sentry integration for server-side error tracking
- Structured Winston logging (no sensitive data in logs)
- Graceful shutdown on SIGTERM (clean Socket.IO + HTTP disconnect)
