import { Router } from 'express';
import { hello } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import stylistRoutes from './stylist.routes';
import bookingRoutes from './booking.routes';
import reviewRoutes from './review.routes';

const router = Router();

router.get('/hello', hello);
router.use('/auth', authRoutes);
router.use('/stylists', stylistRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);

export default router;
