export interface BookingPayload {
  stylistId: string;
  stylistName: string;
  service: string;
  date: string;
  time: string;
  price: string;
  customerName?: string; // optional, default "Customer"
}

export interface Booking {
  bookingId: string;
  status: "confirmed" | "cancelled";
  queuePosition: number;
  estimatedWaitMinutes: number;
  stylistName: string;
  stylistId: string;
  service: string;
  date: string;
  time: string;
  totalPrice: string;
  createdAt: string;
  reviewComment?: string;
  reviewSubmitted?: boolean;
  ratingGiven?: number;
  customerName?: string;
}

const STORAGE_KEY = "glowup_bookings";

function loadBookingsSync(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

let bookings: Booking[] = loadBookingsSync();

export async function createBooking(payload: BookingPayload): Promise<Booking> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const newBooking: Booking = {
    bookingId: `GLW-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "confirmed",
    queuePosition: bookings.length + 1,
    estimatedWaitMinutes: 10 + bookings.length * 5,
    stylistName: payload.stylistName,
    stylistId: payload.stylistId,
    service: payload.service,
    date: payload.date,
    time: payload.time,
    totalPrice: payload.price,
    createdAt: new Date().toISOString(),
    customerName: payload.customerName || "Customer",
  };

  bookings = [newBooking, ...bookings];
  saveBookings(bookings);
  return newBooking;
}

export async function getMyBookings(): Promise<Booking[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...bookings];
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  bookings = bookings.map((b) =>
    b.bookingId === bookingId ? { ...b, status: "cancelled" as const } : b,
  );
  saveBookings(bookings);
}

export async function rescheduleBooking(
  bookingId: string,
  newDate: string,
  newTime: string,
): Promise<Booking> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const index = bookings.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) throw new Error("Booking not found");
  const updated = {
    ...bookings[index],
    date: newDate,
    time: newTime,
    status: "confirmed" as const,
  };
  bookings[index] = updated;
  saveBookings(bookings);
  return updated;
}

export async function submitReview(
  bookingId: string,
  rating: number,
  comment: string,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const index = bookings.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) throw new Error("Booking not found");
  bookings[index] = {
    ...bookings[index],
    reviewSubmitted: true,
    ratingGiven: rating,
    reviewComment: comment,
  };
  saveBookings(bookings);
}

// Get submitted reviews for a specific stylist (from past bookings)
export function getSubmittedReviewsForStylist(
  stylistId: string,
): { user: string; rating: number; comment: string; date: string }[] {
  const all = loadBookingsSync();
  return all
    .filter(
      (b) =>
        b.stylistId === stylistId &&
        b.status === "confirmed" &&
        b.reviewSubmitted,
    )
    .map((b) => ({
      user: b.customerName || "Customer",
      rating: b.ratingGiven || 5,
      comment: b.reviewComment || "",
      date: b.date,
    }));
}

// NEW: get bookings for stylist dashboard
export async function getBookingsForStylist(
  stylistId: string,
): Promise<Booking[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const all = loadBookingsSync();
  return all.filter((b) => b.stylistId === stylistId);
}

export function getNextUpcomingBooking(): Booking | null {
  const all = loadBookingsSync();
  const today = new Date().toISOString().split("T")[0];
  const upcoming = all
    .filter((b) => b.status === "confirmed" && b.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  return upcoming[0] || null;
}
