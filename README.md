<p align="center">
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript_6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express_4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB_8-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<h1 align="center">GlowUp OS</h1>

<p align="center">
  <strong>The operating system for beauty professionals.</strong><br>
  A production-grade full-stack platform combining real-time booking, live streaming,<br>
  AI-powered style previews, POS, and provider-agnostic payments.
</p>

<p align="center">
  <a href="https://glowup-one.vercel.app">🌐 Live Demo</a> •
  <a href="docs/Architecture.md">📐 Architecture</a> •
  <a href="docs/Payment-System.md">💳 Payments</a> •
  <a href="docs/Case-Study.md">📖 Case Study</a> •
  <a href="docs/API.md">📡 API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tests-164%2B-brightgreen?style=flat-square" alt="164+ Tests">
  <img src="https://img.shields.io/badge/Models-33-47A248?style=flat-square" alt="33 Models">
  <img src="https://img.shields.io/badge/Controllers-28-3178C6?style=flat-square" alt="28 Controllers">
  <img src="https://img.shields.io/badge/Pages-70%2B-61DAFB?style=flat-square" alt="70+ Pages">
  <img src="https://img.shields.io/badge/Languages-10-9B59B6?style=flat-square" alt="10 Languages">
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square" alt="TypeScript Strict">
  <img src="https://img.shields.io/badge/License-Private-red?style=flat-square" alt="License">
</p>

---

## Live Demo

| Platform | URL | Status |
|----------|-----|--------|
| **Frontend** (Vercel) | [glowup-one.vercel.app](https://glowup-one.vercel.app) | Deployed |
| **Backend API** (Render) | [glowup-backend-jcos.onrender.com](https://glowup-backend-jcos.onrender.com) | Deployed |
| **API Health** | [/api/health](https://glowup-backend-jcos.onrender.com/api/health) | Operational |

> First-time Render spins may take 30–60 seconds to wake up.

---

## What is GlowUp?

Beauty professionals manage their businesses through fragmented tools — WhatsApp for booking, cash for payments, paper for inventory, Instagram for marketing. **GlowUp OS consolidates the entire lifecycle** into one platform: discovery → booking → payment → operations → growth.

Built for barbers, stylists, and beauty studios who deserve better tools.

**Serves:** Consumers (booking), Stylists (business management), Admins (platform oversight).

---

## Screenshots

> Add your screenshots to `screenshots/` and reference them here. See [docs/Screenshots.md](docs/Screenshots.md) for the full list.

<!-- ![Landing](screenshots/hero.png) -->
<!-- ![Dashboard](screenshots/consumer-dashboard.png) -->
<!-- ![Booking](screenshots/booking.png) -->
<!-- ![POS](screenshots/pos.png) -->
<!-- ![Analytics](screenshots/analytics.png) -->
<!-- ![Mobile](screenshots/mobile.png) -->

---

## Key Features

<details>
<summary><strong>Consumer Features</strong></summary>

| Feature | What It Does |
|---------|-------------|
| 🔍 **Smart Discovery** | Browse stylists by location, service, price, rating on Leaflet maps |
| 📅 **Real-Time Booking** | Atomic slot reservation with conflict prevention |
| 💳 **Multi-Payment** | Paystack cards, MTN MoMo, Cash on Delivery |
| 🤖 **AI Style Previews** | Upload selfie → HuggingFace FLUX generates hairstyle previews |
| 📺 **Live Streaming** | Join stylist rooms via WebRTC; chat, react, book in-stream |
| 🌍 **10 Languages** | Full i18n (en, es, fr, de, pt, zh, ja, ko, ar, hi) |
| 🌙 **Dark/Light Mode** | System-aware theme with manual toggle |
| ⭐ **Favorites & Rebooking** | Save stylists and services for quick access |

</details>

<details>
<summary><strong>Stylist / Business Features</strong></summary>

| Feature | What It Does |
|---------|-------------|
| 🖥️ **POS System** | Accept walk-ins, scan barcodes, real-time stock deduction |
| 📊 **Analytics Dashboard** | Revenue charts, booking trends, top services, stylist metrics |
| 💰 **Financial Overview** | Transaction history, EOD reports, earnings breakdown, CSV export |
| 📦 **Product Catalog** | Products with images, stock levels, cost prices, barcode generation |
| 👥 **Customer CRM** | Loyalty points, spending history, customer analytics |
| 🎯 **Loyalty System** | Configurable points-per-naira rules, redemption thresholds |
| 📡 **Live Studio** | Go live with viewer count, chat, reactions, booking links |
| 🛠️ **Service Management** | Create/edit/delete with categories, duration, pricing, photos |

</details>

<details>
<summary><strong>Platform Features</strong></summary>

| Feature | What It Does |
|---------|-------------|
| 🔐 **RBAC** | Consumer, Stylist, Admin roles with granular permissions |
| 👑 **Admin Dashboard** | Platform-wide analytics, user management, flagged content |
| 🔔 **Real-Time Notifications** | Socket.IO-powered instant alerts across the platform |
| 📋 **Onboarding Wizards** | Multi-step flows for consumers and stylists |
| 🎁 **Referral System** | Code generation, tracking, reward distribution |
| 🔎 **Unified Search** | Search across stylists, services, and products |

</details>

---

## Engineering Highlights

These are the technical accomplishments that demonstrate production engineering maturity:

### Provider-Agnostic Payment Architecture

Built a `CardPaymentProvider` interface with a factory pattern. Paystack is wired today. **Adding Stripe, MTN MoMo, or M-Pesa requires implementing one interface** — zero changes to controllers or routes. All webhook verification is provider-aware via dynamic routes.

### Atomic Multi-Write Operations

Payment webhooks trigger 4 database writes (transaction, booking, inventory, loyalty). All run inside **Mongoose sessions** — either all succeed or all roll back. Zero partial-payment states.

### Real-Time Booking with Race Condition Prevention

Atomic `findOneAndUpdate` with date + stylistId as the conflict key. Database-level locking prevents double-bookings under concurrent load.

### Real-Time Communication

Socket.IO with **Redis adapter** for horizontal scaling. Three isolated namespaces (notifications, chat, streaming). WebRTC signaling for peer-to-peer live video.

### Security Hardening

JWT access tokens (15min, memory-only) + refresh tokens (7d, httpOnly). HMAC-SHA512 timing-safe webhook verification. Zod validation on every write endpoint. Helmet headers. Rate limiting. CSRF protection. RBAC middleware.

### Observability Stack

**Sentry** for client + server error tracking. **Microsoft Clarity** for session replays and heatmaps. **Winston** structured logging. Health check endpoint with uptime and service status.

### Production Deployment

Docker multi-stage builds. Nginx reverse proxy. GitHub Actions CI (lint + typecheck). Deployed on **Vercel** (frontend) + **Render** (backend) + **MongoDB Atlas** + **Upstash Redis**.

### Testing

**164+ automated tests** across 9 suites covering auth, payments, bookings, validation, rate limiting, Redis, and trending logic. Payment tests verify HMAC signatures, amount validation, and atomic writes.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript 6, Vite 8, Tailwind CSS, Zustand 5, Framer Motion, React Router 7 | UI with concurrent features, type safety, state management |
| **Real-Time** | Socket.IO 4, WebRTC signaling | Live chat, notifications, streaming |
| **Maps** | React-Leaflet | Interactive maps with marker clustering |
| **Forms** | React Hook Form + Zod | Performant forms with schema validation |
| **i18n** | i18next + react-i18next | 10-language internationalization |
| **Backend** | Node.js 22, Express 4, TypeScript 5, Mongoose 8 | API server with type safety |
| **Database** | MongoDB 8, Redis 7 | Document storage + caching layer |
| **Payments** | Paystack (provider-agnostic abstraction) | Card payments with webhook verification |
| **AI** | HuggingFace FLUX | Hairstyle generation from selfies |
| **Auth** | JWT + Firebase Admin | Access/refresh tokens + social login |
| **Email** | Nodemailer | Transactional email |
| **Storage** | Cloudinary | Image/video upload and optimization |
| **Monitoring** | Sentry, Microsoft Clarity, Winston | Error tracking, analytics, logging |
| **Infrastructure** | Docker, Nginx, GitHub Actions | Containerization, reverse proxy, CI/CD |
| **Hosting** | Vercel (FE), Render (BE), MongoDB Atlas, Upstash | Production deployment |

---

## Architecture

```
┌──────────────────────────────────────┐
│           CLIENT (React 19)          │
│  Vite · TypeScript · Tailwind · i18n │
└──────────────┬───────────────────────┘
               │ REST + WebSocket
┌──────────────▼───────────────────────┐
│        REVERSE PROXY (Nginx)         │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│     SERVER (Express 4 + TS 5)        │
│  29 Routes · 28 Controllers · 33 Models │
│  Zod · RBAC · Sessions · Rate Limit  │
└──┬───────┬───────┬───────┬───────────┘
   │       │       │       │
   ▼       ▼       ▼       ▼
MongoDB  Redis  Paystack  HuggingFace
  8.0     7.0     API       FLUX
```

> See [docs/Architecture.md](docs/Architecture.md) for detailed data flows, authentication flow, and real-time architecture.

---

## Project Structure

```
glowup-backend-/
├── client/          # React 19 SPA — 70+ pages, 29 API modules, 10 locales
├── server/          # Express 4 API — 33 models, 28 controllers, 164+ tests
├── nginx/           # Reverse proxy config
├── docker-compose.yml
├── docker-compose.prod.yml
├── render.yaml
└── .github/workflows/ci.yml
```

> See full structure in [docs/Architecture.md](docs/Architecture.md).

---

## Performance

| Optimization | Implementation |
|-------------|----------------|
| Code splitting | React.lazy + Suspense on all route pages |
| Image optimization | Cloudinary auto-format, width/quality params |
| Redis caching | Trending data (5min TTL), Socket.IO adapter, sessions |
| Database indexes | Compound indexes on Booking, Transaction, Service |
| Lazy loading | Intersection Observer on image-heavy pages |
| Compression | Nginx gzip on all text/json responses |
| Connection pooling | Mongoose pool (10 sockets) |

> Full details in [docs/Performance.md](docs/Performance.md).

---

## Security

| Layer | Measure |
|-------|---------|
| Auth | JWT (15min) in memory + refresh (7d) in httpOnly cookies |
| Passwords | bcrypt with salt rounds |
| Payments | HMAC-SHA512 timing-safe verification + amount validation |
| Validation | Zod schemas on every write endpoint |
| Headers | Helmet + CSP via Nginx |
| Rate Limiting | Auth: 50/15min/IP, Writes: 100/15min/user |
| RBAC | Role-based middleware (consumer/stylist/admin) |
| CORS | Restricted to `CLIENT_URL` origin |

> Full details in [docs/Security.md](docs/Security.md).

---

## Testing

```
164+ tests · 9 suites · 100% passing
```

| Suite | What It Tests |
|-------|--------------|
| `payment.controller.test.ts` | Charge, verify, webhooks, HMAC, amount validation |
| `booking.controller.test.ts` | Create, accept, reject, cancel, race conditions |
| `auth.controller.test.ts` | Login, register, social auth, token refresh |
| `auth.middleware.test.ts` | JWT verification, RBAC guards |
| `validate.test.ts` | Zod schema validation |
| `rateLimiter.test.ts` | Rate limiting behavior |
| `redis.test.ts` | Cache operations, fallback |
| `trending.service.test.ts` | Trending calculation |
| `token.test.ts` | Token generation, expiry |

> Full details in [docs/Testing.md](docs/Testing.md).

---

## Production Readiness

| Category | Status |
|----------|--------|
| TypeScript strict mode | Enabled (client + server) |
| Input validation | Zod on all write endpoints |
| Auth + RBAC | JWT refresh rotation + role guards |
| Payment security | HMAC verification + atomic writes |
| Error handling | Global handler + Sentry |
| Logging | Winston structured logging |
| Containerization | Multi-stage Dockerfile + docker-compose |
| CI/CD | GitHub Actions (lint + typecheck) |
| Monitoring | Sentry + Clarity + health check endpoint |
| Tests | 164+ automated, 9 suites |

---

## Roadmap

**Current** — Production launch, payment hardening, test coverage

**Next** — Stripe integration, push notifications (FCM), video calls (WebRTC P2P)

**Future** — AI recommendations, React Native mobile, vendor marketplace, WhatsApp Business

---

## Getting Started

```bash
git clone https://github.com/learnfromothers32-cell/glowup-backend-.git
cd glowup-backend-
npm install && cd client && npm install && cd ../server && npm install

cp server/.env.example server/.env  # Fill in credentials
cp client/.env.example client/.env

cd server && npm run dev   # API on :5000
cd client && npm run dev   # UI on :5173
```

See [docs/Deployment.md](docs/Deployment.md) for production deployment, Docker setup, and environment variables.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/Architecture.md) | System design, data flows, engineering decisions |
| [Payment System](docs/Payment-System.md) | Provider abstraction, webhooks, atomic writes |
| [Security](docs/Security.md) | Auth, validation, CSRF, rate limiting |
| [Deployment](docs/Deployment.md) | Production setup, Docker, environment variables |
| [API Reference](docs/API.md) | All endpoints, WebSocket events, error formats |
| [Testing](docs/Testing.md) | Test suites, coverage, CI integration |
| [Performance](docs/Performance.md) | Caching, indexes, optimization strategies |
| [Database](docs/Database.md) | Schema design, 33 models, indexes |
| [Case Study](docs/Case-Study.md) | Business context, technical challenges, lessons learned |
| [Screenshots](docs/Screenshots.md) | Screenshot guide and placeholders |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Ensure tests pass (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## License

Private — All rights reserved.

---

<p align="center">
  Built with care for beauty professionals who deserve better tools.
</p>
