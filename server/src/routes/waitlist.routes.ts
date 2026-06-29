import { Router } from 'express';
import { getMyWaitlist, getConsumerWaitlist, createWaitlistEntry, notifyWaitlistEntry, removeWaitlistEntry, cancelConsumerEntry, bookConsumerEntry } from '../controllers/waitlist.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

// Client-facing: join waitlist (any authenticated user)
router.post('/', protect, generalLimiter, createWaitlistEntry);

// Consumer-facing: view my entries, cancel my entry, mark as booked
router.get('/my-entries', protect, getConsumerWaitlist);
router.patch('/my-entries/:id/book', protect, bookConsumerEntry);
router.delete('/my-entries/:id', protect, cancelConsumerEntry);

// Stylist-only routes
router.use(protect, requireRole('stylist'));
router.get('/', getMyWaitlist);
router.post('/:id/notify', generalLimiter, notifyWaitlistEntry);
router.delete('/:id', removeWaitlistEntry);

export default router;
