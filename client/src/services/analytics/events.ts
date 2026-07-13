export const AnalyticsEvents = {
  // Authentication
  USER_REGISTERED: "User Registered",
  USER_LOGGED_IN: "User Logged In",
  USER_LOGGED_OUT: "User Logged Out",

  // Discovery
  SEARCH_PERFORMED: "Search Performed",
  FILTERS_APPLIED: "Filters Applied",
  TRENDING_STYLE_VIEWED: "Trending Style Viewed",

  // Marketplace
  STYLIST_PROFILE_CREATED: "Stylist Profile Created",
  PORTFOLIO_UPLOADED: "Portfolio Uploaded",
  SERVICE_ADDED: "Service Added",

  // Bookings
  BOOKING_STARTED: "Booking Started",
  BOOKING_CREATED: "Booking Created",
  BOOKING_ACCEPTED: "Booking Accepted",
  BOOKING_CANCELLED: "Booking Cancelled",
  BOOKING_COMPLETED: "Booking Completed",

  // Payments
  PAYMENT_STARTED: "Payment Started",
  PAYMENT_SUCCESSFUL: "Payment Successful",
  PAYMENT_FAILED: "Payment Failed",

  // AI
  HAIRSTYLE_AI_STARTED: "Hairstyle AI Started",
  HAIRSTYLE_AI_GENERATED: "Hairstyle AI Generated",

  // Messaging
  CHAT_STARTED: "Chat Started",
  MESSAGE_SENT: "Message Sent",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
