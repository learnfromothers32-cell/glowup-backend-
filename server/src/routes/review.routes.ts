import { Router } from 'express';
import { createReview, getStylistReviews } from '../controllers/review.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/stylist/:stylistId', getStylistReviews);

router.use(protect);
router.post('/', createReview);

export default router;
