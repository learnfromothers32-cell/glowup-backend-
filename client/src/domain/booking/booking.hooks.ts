import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBooking,
  getMyBookings,
  getStylistBookings,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
} from "../../api/bookings";
import type { CreateBookingData } from "../../api/bookings";
import type { Booking } from "./booking.types";

const BOOKINGS_KEY = "bookings";
const MY_BOOKINGS_KEY = [BOOKINGS_KEY, "my"];
const STYLIST_BOOKINGS_KEY = [BOOKINGS_KEY, "stylist"];

function adaptBooking(b: any): Booking {
  const startTime = b.startTime || new Date().toISOString();
  return {
    _id: b._id || b.id,
    id: b._id || b.id,
    clientId: b.clientId,
    stylistId: b.stylistId,
    serviceId: b.serviceId,
    startTime,
    endTime: b.endTime || new Date(new Date(startTime).getTime() + 3600000).toISOString(),
    status: b.status || "pending",
    totalPrice: b.totalPrice ?? 0,
    notes: b.notes,
    paymentId: b.paymentId,
    paymentStatus: b.paymentStatus || "pending",
    paymentMethod: b.paymentMethod,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  } as Booking;
}

export function useMyBookings() {
  return useQuery({
    queryKey: MY_BOOKINGS_KEY,
    queryFn: async () => {
      const bookings = await getMyBookings();
      return (bookings || []).map(adaptBooking);
    },
    staleTime: 15_000,
    retry: 1,
  });
}

export function useStylistBookingsQuery() {
  return useQuery({
    queryKey: STYLIST_BOOKINGS_KEY,
    queryFn: async () => {
      const bookings = await getStylistBookings();
      return (bookings || []).map(adaptBooking);
    },
    staleTime: 15_000,
    retry: 1,
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingData) => createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: STYLIST_BOOKINGS_KEY });
    },
  });
}

export function useUpdateBookingStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY] });
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY] });
    },
  });
}

export function useRescheduleBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startTime }: { id: string; startTime: string }) =>
      rescheduleBooking(id, startTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY] });
    },
  });
}
