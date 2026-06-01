import { Router } from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favorites.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:stylistId', removeFavorite);

export default router;
