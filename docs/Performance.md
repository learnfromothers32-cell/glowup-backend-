# Performance

## Optimizations

| Category | Technique | Implementation |
|----------|-----------|----------------|
| **Bundle** | Code splitting | React.lazy + Suspense on all route pages |
| **Bundle** | Tree shaking | Vite + Rollup automatic dead code elimination |
| **Images** | Auto-optimization | Cloudinary auto-format, width/quality params |
| **Images** | Lazy loading | Intersection Observer on image-heavy pages |
| **Caching** | Redis | Trending data, Socket.IO adapter, session store |
| **Caching** | In-memory fallback | When Redis unavailable, falls back to Map |
| **Database** | Compound indexes | Booking (stylist + date + status), Transaction (userId + status) |
| **Database** | Connection pooling | Mongoose default pool (10 sockets) |
| **Network** | Gzip compression | Nginx on all text/json responses |
| **Network** | HTTP/2 | Nginx reverse proxy |
| **Network** | CDN | Vercel Edge Network for static assets |

## Bundle Analysis

```bash
cd client
npm run build -- --mode analyze
```

Generates Rollup visualizer report showing bundle composition.

## Database Indexes

```typescript
// Booking compound index
BookingSchema.index({ stylistId: 1, date: 1, status: 1 });

// Transaction compound index
TransactionSchema.index({ userId: 1, status: 1 });

// Service lookup index
ServiceSchema.index({ stylistId: 1, category: 1 });
```

## Redis Caching Strategy

| Data | TTL | Invalidation |
|------|-----|-------------|
| Trending stylists | 5 min | On new booking/review |
| Trending services | 5 min | On new booking/review |
| Socket.IO rooms | Session | On disconnect |
| Session data | 15 min | On logout |

## Code Splitting

```typescript
// All route pages lazy-loaded
const Dashboard = lazy(() => import('./pages/consumer/Dashboard'));
const Booking = lazy(() => import('./pages/consumer/Booking'));
const POS = lazy(() => import('./pages/stylist/POS'));
```

## Monitoring

- **Sentry** — Client + server error tracking with source maps
- **Microsoft Clarity** — Session replays, heatmaps, user behavior
- **Winston** — Structured server-side logging
- **Render Metrics** — CPU, memory, response time
