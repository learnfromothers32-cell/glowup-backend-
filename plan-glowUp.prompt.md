## Backend Plan for GlowUp (MERN)

This is a step-by-step build plan for turning GlowUp from mock data into a real MERN booking backend.

### What this plan gives you

- A single practical path from your existing frontend to a full backend
- A backend structure using your current `server/` folder
- A Mongoose-powered database design and JWT auth flow
- Clear API endpoints to replace mock data
- A deployment-ready workflow with MongoDB Atlas and Vercel front-end integration

## Step-by-step build plan

### Step 1: Prepare the backend workspace

1. Use the existing `server/` folder as the backend root.
2. Verify the backend can run locally:
   - `cd server`
   - `npm install`
   - `npm run dev`
3. Create `.env.local` or `.env` with these values:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_URL=http://localhost:5173`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `REDIS_URL` (optional)
4. Confirm `server/src/app.ts` sets up Express, CORS, JSON parsing, and the default `/api/hello` route.

### Step 2: Define a clean backend architecture

Set up this folder structure inside `server/src`:

- `config/` — DB, Redis, Cloudinary, app config
- `models/` — Mongoose schemas
- `routes/` — Express route definitions
- `controllers/` — request handlers
- `middleware/` — auth, role checks, error handling
- `services/` — reusable business logic helpers
- `utils/` — token helpers and common utilities
- `types/` — shared TypeScript request/response shapes if needed

This separation keeps the app maintainable and matches real-world backend projects.

### Step 3: Choose your database access strategy

Use Mongoose because:

- you already have it installed
- it simplifies schema design and validation
- it adds helpful model methods for relations
- it is easier for a solo developer than the raw MongoDB driver

### Step 4: Design the data models

Create Mongoose schemas for the following entities:

- `User`
- `Stylist`
- `Service`
- `Booking`
- `Review`
- `Comment`
- `PortfolioItem` / `BeforeAfter`

Also keep gamification and live status in the models:

- user points, badges, action counts
- stylist `isLive`, `liveTitle`, `viewerCount`

This mirrors how a real booking app stores users, providers, bookings, and media.

### Step 5: Implement authentication and authorization

Create these auth features:

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `GET /api/auth/me`

Backend details:

- hash passwords with `bcryptjs`
- sign JWTs with `jsonwebtoken`
- verify tokens in `Authorization: Bearer <token>`
- attach `req.user` in middleware
- add a role middleware for `client` vs `stylist`

Frontend details:

- store token + user in `localStorage`
- restore auth state in `AuthContext` on app load
- use the token for protected requests

### Step 6: Build core stylist APIs

Add endpoints for stylist discovery and detail data:

- `GET /api/stylists`
- `GET /api/stylists/:id`
- `GET /api/stylists/:id/reviews`
- `GET /api/stylists/:id/portfolio`
- `GET /api/search`
- `GET /api/stylists/:stylistId/services`

Also add stylist management endpoints for the stylist dashboard:

- `POST /api/stylists/:stylistId/services`
- `PUT /api/services/:id`
- `DELETE /api/services/:id`

This gives you the core of the consumer and stylist discovery flow.

### Step 7: Build the booking flow

Add booking endpoints:

- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/stylist`
- `PUT /api/bookings/:id/cancel`
- `PUT /api/bookings/:id/reschedule`

This is the most important MVP behavior: clients create bookings and stylists can view them.

### Step 8: Add reviews, favorites, bookmarks, and gamification

Add these features next:

- `POST /api/reviews`
- `POST /api/users/me/favorites`
- `GET /api/users/me/favorites`
- `POST /api/users/me/bookmarks`
- `GET /api/users/me/stats`

Persist:

- saved stylists
- review records
- user points/actions
- booking history

This turns static mock behavior into real user state.

### Step 9: Add media uploads and portfolio assets

For stylist images and before/after content:

- create `POST /api/uploads/image`
- use `multer` for upload handling in development
- use Cloudinary for production storage and URL delivery
- save uploaded URLs in the stylist model

This gives stylists real portfolio and image content.

### Step 10: Connect and swap the frontend API layer

Migrate the React front-end from mocks to the backend in this order:

1. `src/api/stylists.ts`
2. `src/api/auth.ts`
3. `src/api/bookings.ts`
4. `src/api/reviews.ts`
5. `src/api/favorites.ts`
6. `src/api/uploads.ts`

Then update `src/context/AuthContext.tsx` to:

- call `register` and `login` endpoints
- store the returned JWT and user
- restore session using `/api/auth/me`

Replace mock booking, stylist, and review usage gradually so the app remains stable.

### Step 11: Test locally and verify the flows

Check these flows first:

- auth register/login and session restore
- user can fetch stylist list and stylist detail
- user can book a service
- user can view `my bookings`
- stylist can view their bookings
- role protection works correctly

Use the browser, Postman, or a REST client during this step.

### Step 12: Deploy the backend and wire the frontend

Deploy backend on Railway or Render.

In production:

- set `MONGODB_URI` to Atlas
- set `JWT_SECRET` to a strong secret
- set `CLIENT_URL` to your Vercel app
- set `VITE_API_BASE_URL` in the frontend to the backend URL

Then verify from the deployed frontend that login, stylist listing, and booking work.

## Real-world flow summary

A real booking app like Fresha separates the two sides:

- Consumer side: search, stylist profiles, service menus, booking flow, favorites, reviews, bookings history.
- Stylist side: dashboard, service management, bookings list, portfolio, availability/live status.

In GlowUp, the backend must make both sides real by storing:

- user accounts and roles
- stylist profiles and services
- bookings and reviews
- favorites/bookmarks
- live status and media assets

Your current app already has the UI for both flows. The backend will complete the system.

## Recommended first implementation order

1. Setup backend project and environment
2. Build auth and JWT middleware
3. Build stylist list/detail APIs
4. Build booking creation and booking queries
5. Connect frontend `AuthContext` and `src/api/stylists.ts`
6. Verify consumer search and booking flow
7. Add stylist service management APIs
8. Add reviews, favorites, and gamification
9. Add uploads and portfolio media
10. Deploy backend and update frontend env

## Files to update

- `server/package.json`
- `server/tsconfig.json`
- `server/src/app.ts`
- `server/src/server.ts`
- `server/src/config/db.ts`
- `server/src/config/cloudinary.ts`
- `server/src/models/User.ts`
- `server/src/models/Stylist.ts`
- `server/src/models/Service.ts`
- `server/src/models/Booking.ts`
- `server/src/models/Review.ts`
- `server/src/models/Comment.ts`
- `server/src/routes/auth.ts`
- `server/src/routes/stylists.ts`
- `server/src/routes/bookings.ts`
- `server/src/routes/reviews.ts`
- `server/src/routes/users.ts`
- `server/src/routes/uploads.ts`
- `server/src/controllers/authController.ts`
- `server/src/controllers/stylistController.ts`
- `server/src/controllers/bookingController.ts`
- `server/src/controllers/reviewController.ts`
- `server/src/middleware/authMiddleware.ts`
- `server/src/middleware/roleMiddleware.ts`
- `server/src/middleware/errorMiddleware.ts`
- `client/src/api/*.ts`
- `client/src/context/AuthContext.tsx`

## Validation checklist

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/stylists`
- `GET /api/stylists/:id`
- `POST /api/bookings`
- `GET /api/bookings/my`
- role-based route blocking

## Notes

- Keep the UI unchanged while migrating the data layer.
- Start with auth and stylist discovery before adding bookings and media.
- A backend-first MVP should focus on persistence and real user state.
