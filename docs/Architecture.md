# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                        │
│  Vite 8 · TypeScript 6 · Tailwind CSS · Framer Motion · i18n   │
│  Zustand 5 · Leaflet Maps · Socket.IO Client · Paystack SDK    │
└───────────────┬─────────────────────────┬───────────────────────┘
                │ REST API                │ WebSocket
                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REVERSE PROXY (Nginx)                         │
│              /api/* → :5000  /socket.io → :5000                 │
└───────────────┬─────────────────────────┬───────────────────────┘
                │                         │
                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVER (Express 4 + TypeScript 5)              │
│  29 Route Groups · 28 Controllers · 33 Mongoose Models         │
│  Zod Validation · RBAC Middleware · Rate Limiting               │
└──────┬──────────┬──────────┬──────────┬─────────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   ┌───────┐ ┌───────┐ ┌────────┐ ┌──────────┐
   │MongoDB│ │ Redis │ │Paystack│ │HuggingFace│
   │  8.0  │ │  7.0  │ │  API   │ │  FLUX     │
   └───────┘ └───────┘ └────────┘ └──────────┘
```

## Data Flow — Booking

```
Consumer selects time slot
  → POST /api/bookings (Zod validated)
  → BookingController.createBooking
    → Locks slot (atomic findOneAndUpdate with date + stylistId)
    → Creates booking (status: pending)
    → Sends Socket.IO notification to stylist
    → Returns booking to consumer
Stylist accepts via dashboard
  → PATCH /api/bookings/:id/accept
    → Updates status → confirmed
    → Notifies consumer via Socket.IO
```

## Data Flow — Payment

```
Consumer clicks "Pay Now"
  → POST /api/payments/charge (dynamic provider lookup)
  → PaymentController.chargeCard
    → PaystackProvider.initTransaction(amount, email, metadata)
    → Returns authorization_url to client
  → Consumer completes payment on Paystack
  → Paystack sends webhook → POST /api/payments/webhook/paystack
    → HMAC-SHA512 signature verified
    → Transaction updated atomically (session)
    → Booking status → confirmed
    → Stock deducted if applicable
```

## Authentication Flow

```
1. User logs in → POST /api/auth/login
2. Server validates credentials → bcrypt compare
3. Issues JWT access token (15min) + refresh token (7d, httpOnly cookie)
4. Client stores access token in memory only
5. Every request: Authorization: Bearer <token>
6. On 401 → client uses refresh token to rotate
7. Social login: Firebase token → Firebase Admin verify → issue JWT
```

## Real-time Architecture

```
Socket.IO connected
  → Redis adapter (multi-instance pub/sub)
  → Namespaces: /notifications, /chat, /streaming
  → Room-based broadcasting for live streams
  → WebRTC signaling via Socket.IO for peer connections
```

## Rate Limiting

| Scope | Window | Limit | Strategy |
|-------|--------|-------|----------|
| Auth endpoints | 15 min | 50 req/IP | Sliding window |
| Write endpoints | 15 min | 100 req/user | Token bucket |
| General API | 15 min | 100 req/user | Standard |

## Key Engineering Decisions

### Why Provider-Agnostic Payments?
MTN MoMo and M-Pesa operate through Paystack's aggregated channels. Rather than maintaining separate integrations, we built a `CardPaymentProvider` interface with a factory pattern. Adding a new provider requires implementing **one interface** — no controller or route changes.

### Why Mongoose Sessions for Payments?
A single payment webhook triggers 3–4 database writes (transaction update, booking confirmation, inventory deduction, loyalty points). Without sessions, a failure mid-write leaves inconsistent data. Sessions ensure all-or-nothing atomicity.

### Why Socket.IO Over Native WebSocket?
Socket.IO provides automatic reconnection, room-based broadcasting, namespace isolation, and a Redis adapter for horizontal scaling — all critical for live streaming and real-time chat.

### Why Zustand Over Redux?
For a marketplace app with many independent UI states (booking flow, chat, POS, streaming), Zustand's minimal API and slice pattern avoids the boilerplate overhead of Redux while keeping state predictable.

### Why i18next Over a Lighter Solution?
Ten languages with pluralization, interpolation, and namespace splitting. i18next's ecosystem handles this at scale where lighter solutions would require custom code.
