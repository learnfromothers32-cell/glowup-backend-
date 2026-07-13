# Database Design

## Overview

GlowUp OS uses **MongoDB 8** with **Mongoose 8** ODM. The schema design follows a document-oriented approach optimized for the marketplace's read patterns.

## Models (33 total)

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Consumer accounts | name, email, password, cartData, loyaltyPoints, referralCode |
| **Stylist** | Stylist profiles | userId, services, portfolio, workingHours, location, rating |
| **Booking** | Appointments | userId, stylistId, serviceId, date, timeSlot, status, paymentRef |
| **Service** | Stylist offerings | stylistId, name, price, duration, category, description |
| **Transaction** | Payment records | userId, bookingId, amount, provider, status, paymentRef, providerMetadata |

### Marketplace Models

| Model | Purpose |
|-------|---------|
| **Product** | POS products (name, price, stock, barcode, images) |
| **Inventory** | Stock tracking per product per stylist |
| **Review** | Stylist reviews (userId, stylistId, rating, comment) |
| **Favorite** | Saved stylists/services |
| **Notification** | Push/in-app notifications |

### Real-time Models

| Model | Purpose |
|-------|---------|
| **LiveRoom** | Active live streams (stylistId, viewers, status) |
| **ChatMessage** | Live chat messages |
| **ChatRoom** | Chat room metadata |

### Platform Models

| Model | Purpose |
|-------|---------|
| **LoyaltyTransaction** | Points earning/redemption history |
| **Referral** | Referral tracking |
| **Analytics** | Aggregated analytics data |
| **Banner** | Marketing banners |
| **FAQ** | Frequently asked questions |
| **Policy** | Platform policies |

## Schema Design Principles

### 1. Reference, Don't Embed (for large collections)
```typescript
// Booking references Stylist and Service (not embedded)
{
  userId: ObjectId,
  stylistId: ObjectId,  // Reference, not embedded stylist doc
  serviceId: ObjectId,  // Reference, not embedded service doc
  date: Date,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}
```

### 2. Embed for Small, Bounded Arrays
```typescript
// User cart is embedded (small, bounded, always fetched with user)
{
  cartData: {
    [productId]: {
      [size]: quantity
    }
  }
}
```

### 3. Compound Indexes for Common Queries
```typescript
// Booking queries: "get all bookings for stylist X on date Y"
Booking.index({ stylistId: 1, date: 1, status: 1 });

// Transaction queries: "get all transactions for user X with status Y"
Transaction.index({ userId: 1, status: 1 });
```

## Connection Management

```typescript
// server/src/config/database.ts
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI!, {
    maxPoolSize: 10,      // Connection pool
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};
```

## Seed Data

```bash
cd server
npm run seed
```

Creates sample data for development:
- Consumer accounts
- Stylist profiles with services
- Sample bookings and transactions
- Product catalog
