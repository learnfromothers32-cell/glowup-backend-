import { Router } from 'express';
import { getQueueStatus, advanceQueue, markDone } from '../controllers/queue.controller';
import { protect, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/:stylistId', getQueueStatus);
router.post('/:stylistId/advance', protect, requireRole('stylist'), advanceQueue);
router.post('/:stylistId/done/:entryUserId', protect, requireRole('stylist'), markDone);

export default router;
