import { Router } from 'express';
import {
  getPublishedArticles,
  getArticleBySlug,
  getArticleById,
  getMyArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getCategories,
} from '../controllers/article.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/categories', getCategories);

router.get('/published', getPublishedArticles);
router.get('/published/:slug', getArticleBySlug);

router.use(protect);

router.get('/my', requireRole('stylist', 'admin'), getMyArticles);
router.get('/:id', getArticleById);
router.post('/', generalLimiter, requireRole('stylist', 'admin'), createArticle);
router.put('/:id', generalLimiter, requireRole('stylist', 'admin'), updateArticle);
router.delete('/:id', requireRole('stylist', 'admin'), deleteArticle);

export default router;
