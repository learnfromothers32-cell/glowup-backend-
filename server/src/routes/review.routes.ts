import { Router } from 'express';
import { createReview, getStylistReviews, deleteReview } from '../controllers/review.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/stylist/:stylistId', getStylistReviews);

router.use(protect);
router.post('/', createReview);
router.delete('/:id', deleteReview);

export default router;
