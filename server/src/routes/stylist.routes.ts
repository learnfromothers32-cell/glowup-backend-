import { Router } from 'express';
import {
  getStylistById,
  getStylistServices,
  getStylists,
  getMyStylistProfile,
  saveOnboarding,
  updateMyProfile,
  addMyService,
  updateMyService,
  deleteMyService,
  uploadPortfolioImage,
  removePortfolioImage
} from '../controllers/stylist.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', getStylists);
router.get('/me', protect, requireRole('stylist'), getMyStylistProfile);
router.put('/me', protect, requireRole('stylist'), updateMyProfile);
router.post('/onboarding', protect, requireRole('stylist'), saveOnboarding);
router.post('/services', protect, requireRole('stylist'), addMyService);
router.put('/services/:id', protect, requireRole('stylist'), updateMyService);
router.delete('/services/:id', protect, requireRole('stylist'), deleteMyService);
router.post('/portfolio', protect, requireRole('stylist'), upload.single('image'), uploadPortfolioImage);
router.delete('/portfolio', protect, requireRole('stylist'), removePortfolioImage);
router.get('/:id/services', getStylistServices);
router.get('/:id', getStylistById);

export default router;
