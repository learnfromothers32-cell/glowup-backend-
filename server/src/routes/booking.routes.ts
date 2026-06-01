import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getMyBookings,
  getStylistBookings,
  rescheduleBooking,
  updateBookingStatus
} from '../controllers/booking.controller';
import { protect, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', requireRole('client'), createBooking);
router.get('/my', requireRole('client'), getMyBookings);
router.get('/stylist', requireRole('stylist'), getStylistBookings);
router.patch('/:id/status', requireRole('stylist', 'admin'), updateBookingStatus);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/reschedule', requireRole('client'), rescheduleBooking);

export default router;
