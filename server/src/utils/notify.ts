import { Notification, INotification } from '../models/Notification';
import { getIO } from '../socket';

type NotifType = INotification['type'];

interface NotifyInput {
  userId: string;
  type: NotifType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

function emitNotificationSocket(userId: string, notification: any) {
  try {
    getIO().of('/queue').to(`user:${userId}`).emit('notification:new', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      metadata: notification.metadata,
      read: notification.read,
      createdAt: notification.createdAt,
    });
  } catch {
    // socket not initialized
  }
}

export async function createNotification(input: NotifyInput) {
  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link || '/app',
    metadata: input.metadata,
  });
  emitNotificationSocket(input.userId, notification);
  return notification;
}

export async function notifyBookingCreated(userId: string, stylistName: string, bookingId: string) {
  return createNotification({
    userId,
    type: 'booking',
    title: 'Booking Placed',
    message: `Your booking with ${stylistName} is pending stylist confirmation. We'll notify you when it's confirmed.`,
    link: `/app/my-bookings`,
    metadata: { bookingId },
  });
}

export async function notifyBookingStatusChange(userId: string, status: string, bookingId: string) {
  const messages: Record<string, string> = {
    confirmed: 'Your booking has been confirmed',
    'in-progress': 'Your appointment is now in progress',
    completed: 'Your appointment has been completed',
    cancelled: 'Your booking has been cancelled',
  };
  return createNotification({
    userId,
    type: 'booking',
    title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: messages[status] || `Your booking status changed to ${status}`,
    link: '/app/my-bookings',
    metadata: { bookingId, status },
  });
}

export async function notifyBookingReminder(userId: string, stylistName: string, bookingId: string, startTime: Date) {
  return createNotification({
    userId,
    type: 'reminder',
    title: 'Upcoming Appointment',
    message: `Your appointment with ${stylistName} starts in 1 hour`,
    link: `/app/my-bookings`,
    metadata: { bookingId, startTime },
  });
}

export async function notifyNewStylist(userId: string, stylistName: string, stylistId: string) {
  return createNotification({
    userId,
    type: 'stylist',
    title: 'New Stylist Available',
    message: `${stylistName} has joined GlowUp! Check out their profile.`,
    link: `/app/stylist/${stylistId}`,
    metadata: { stylistId },
  });
}

export async function notifyBadgeEarned(userId: string, badgeName: string) {
  return createNotification({
    userId,
    type: 'badge',
    title: 'Badge Earned!',
    message: `Congratulations! You earned the "${badgeName}" badge.`,
    link: '/app/rewards',
    metadata: { badge: badgeName },
  });
}

export async function notifyNewBookingForStylist(stylistId: string, clientName: string, bookingId: string) {
  return createNotification({
    userId: stylistId,
    type: 'booking',
    title: 'New Booking',
    message: `${clientName} has booked an appointment with you.`,
    link: `/app/stylist/bookings`,
    metadata: { bookingId },
  });
}

export async function notifyBookingRescheduled(clientId: string, stylistName: string, bookingId: string) {
  return createNotification({
    userId: clientId,
    type: 'booking',
    title: 'Booking Rescheduled',
    message: `Your booking with ${stylistName} has been rescheduled.`,
    link: '/app/my-bookings',
    metadata: { bookingId },
  });
}

export async function notifyPromo(userId: string, promoMessage: string, link?: string) {
  return createNotification({
    userId,
    type: 'promo',
    title: 'Special Offer',
    message: promoMessage,
    link: link || '/app',
  });
}
