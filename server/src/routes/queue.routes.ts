import { Router } from 'express';
import { getQueueStatus, advanceQueue, markDone, skipQueueEntry } from '../controllers/queue.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/:stylistId', getQueueStatus);
router.post('/:stylistId/advance', protect, requireRole('stylist'), generalLimiter, advanceQueue);
router.post('/:stylistId/done/:entryUserId', protect, requireRole('stylist'), generalLimiter, markDone);
router.post('/:stylistId/skip/:entryUserId', protect, requireRole('stylist'), generalLimiter, skipQueueEntry);

export default router;
