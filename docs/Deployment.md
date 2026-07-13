# Deployment

## Production Architecture

```
                    ┌──────────────┐
                    │   Vercel     │
                    │  (Frontend)  │
                    │  React 19    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Render    │
                    │  (Backend)   │
                    │  Express 4   │
                    └──┬───────┬───┘
                       │       │
                ┌──────▼──┐ ┌──▼──────┐
                │ MongoDB │ │  Redis  │
                │  Atlas  │ │ Upstash │
                └─────────┘ └─────────┘
```

## Current Production Stack

| Service | Provider | URL |
|---------|----------|-----|
| **Frontend** | Vercel | [glowup-one.vercel.app](https://glowup-one.vercel.app) |
| **Backend** | Render | [glowup-backend-jcos.onrender.com](https://glowup-backend-jcos.onrender.com) |
| **Database** | MongoDB Atlas | Managed hosting |
| **Cache** | Upstash | Managed Redis |

## Docker Compose (Self-Hosted)

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Spins up: **Nginx** (port 80/443) → **Client** (port 3000) + **Server** (port 5000) → **MongoDB** + **Redis**

## Render Deployment

1. Connect GitHub repository to Render
2. Set environment variables in Render Dashboard
3. Render auto-deploys on push to `main`
4. Backend uses `Dockerfile.prod` (multi-stage build)

## Vercel Deployment

1. Connect GitHub repository to Vercel
2. Set `VITE_API_BASE_URL` to Render backend URL
3. Vercel auto-deploys on push to `main`

## Required Environment Variables

### Server
| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | Server port (default: 5000) | No |
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `REDIS_URL` | Upstash Redis URL | Yes |
| `JWT_SECRET` | Token signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `PAYSTACK_SECRET_KEY` | Paystack live key | Yes |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook HMAC secret | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `CLIENT_URL` | Frontend origin for CORS | Yes |
| `SENTRY_DSN` | Sentry DSN | No |
| `CLARITY_ID` | Microsoft Clarity ID | No |

### Client
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `VITE_SOCKET_URL` | Socket.IO server URL |
| `VITE_CLARITY_ID` | Microsoft Clarity ID |

## CI/CD Pipeline

GitHub Actions runs on every PR and push to `main`:

```yaml
# .github/workflows/ci.yml
jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Install dependencies
      - Run TypeScript type checking
      - Run ESLint
```

## Docker Configuration

### Development
```bash
docker compose up
```

### Production
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Production Dockerfile Highlights
- Multi-stage build (build → production)
- Non-root user
- Health check endpoint
- Graceful shutdown handling
