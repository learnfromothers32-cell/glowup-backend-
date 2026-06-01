import api from './axios';

export interface CreateBookingData {
  stylistId: string;
  serviceId: string;
  startTime: string;
  notes?: string;
}

export const createBooking = async (bookingData: CreateBookingData) => {
  const { data } = await api.post('/bookings', bookingData);
  return data;
};

export const getMyBookings = async () => {
  const { data } = await api.get('/bookings/my');
  return data.data.bookings;
};

export const getStylistBookings = async () => {
  const { data } = await api.get('/bookings/stylist');
  return data.data.bookings;
};

export const updateBookingStatus = async (id: string, status: string) => {
  const { data } = await api.patch(`/bookings/${id}/status`, { status });
  return data;
};

export const cancelBooking = async (id: string) => {
  const { data } = await api.patch(`/bookings/${id}/cancel`);
  return data;
};
