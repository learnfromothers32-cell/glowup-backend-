import { Router } from 'express';
import { hello } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import stylistRoutes from './stylist.routes';
import bookingRoutes from './booking.routes';
import reviewRoutes from './review.routes';
import queueRoutes from './queue.routes';
import paymentRoutes from './payment.routes';
import favoritesRoutes from './favorites.routes';

const router = Router();

router.get('/hello', hello);
router.use('/auth', authRoutes);
router.use('/stylists', stylistRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/queue', queueRoutes);
router.use('/payments', paymentRoutes);
router.use('/favorites', favoritesRoutes);

export default router;
