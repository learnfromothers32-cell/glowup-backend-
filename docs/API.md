# API Reference

## Base URL

```
Production: https://glowup-backend-jcos.onrender.com/api
Development: http://localhost:5000/api
```

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new account | Public |
| POST | `/auth/login` | Login (returns JWT) | Public |
| POST | `/auth/social-login` | Firebase social login | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/forgot-password` | Send reset email | Public |
| POST | `/auth/reset-password` | Reset password | Public |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/me` | Get current user | User |
| PUT | `/users/me` | Update profile | User |
| GET | `/users/:id` | Get user by ID | User |

### Stylists
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stylists` | List stylists (with filters) | Public |
| GET | `/stylists/:id` | Get stylist profile | Public |
| PUT | `/stylists/:id` | Update stylist profile | Stylist |
| GET | `/stylists/:id/services` | Get stylist services | Public |
| GET | `/stylists/:id/reviews` | Get stylist reviews | Public |

### Bookings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/bookings` | Create booking | User |
| GET | `/bookings/me` | Get user bookings | User |
| GET | `/bookings/stylist` | Get stylist bookings | Stylist |
| PATCH | `/bookings/:id/accept` | Accept booking | Stylist |
| PATCH | `/bookings/:id/reject` | Reject booking | Stylist |
| PATCH | `/bookings/:id/complete` | Complete booking | Stylist |
| DELETE | `/bookings/:id` | Cancel booking | User |

### Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/payments/charge` | Initiate card payment | User |
| POST | `/payments/verify` | Verify payment | User |
| POST | `/payments/webhook/:provider` | Provider webhook | Public |
| GET | `/payments/history` | Transaction history | User |

### Services
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/services` | List services | Public |
| POST | `/services` | Create service | Stylist |
| PUT | `/services/:id` | Update service | Stylist |
| DELETE | `/services/:id` | Delete service | Stylist |

### Products (POS)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/products` | List products | Public |
| POST | `/products` | Create product | Stylist |
| PUT | `/products/:id` | Update product | Stylist |
| DELETE | `/products/:id` | Delete product | Stylist |

### Live Streaming
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/live/create` | Create live room | Stylist |
| POST | `/live/join/:id` | Join live room | User |
| POST | `/live/end/:id` | End live room | Stylist |
| GET | `/live/active` | List active rooms | Public |

### Analytics
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/analytics/revenue` | Revenue analytics | Stylist |
| GET | `/analytics/bookings` | Booking analytics | Stylist |
| GET | `/analytics/trending` | Trending stylists/services | Public |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Platform statistics | Admin |
| GET | `/admin/users` | List all users | Admin |
| GET | `/admin/bookings` | List all bookings | Admin |

### Notifications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifications` | Get user notifications | User |
| PATCH | `/notifications/:id/read` | Mark as read | User |
| PATCH | `/notifications/read-all` | Mark all as read | User |

## WebSocket Events

### Namespaces
| Namespace | Purpose |
|-----------|---------|
| `/notifications` | Real-time push notifications |
| `/chat` | Live chat messaging |
| `/streaming` | Live stream signaling + WebRTC |

### Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `new_order` | Server → Client | `{ orderId, amount, customerName }` |
| `booking_update` | Server → Client | `{ bookingId, status }` |
| `chat_message` | Bidirectional | `{ senderId, message, roomId }` |
| `stream_start` | Server → Client | `{ roomId, streamerId }` |
| `stream_end` | Server → Client | `{ roomId }` |
| `reaction` | Bidirectional | `{ type, roomId }` |

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Validation errors:
```json
{
  "success": false,
  "errors": "Field1 is required, Field2 must be positive"
}
```
