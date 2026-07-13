import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  getMyTransactions,
  chargeCard,
} from '../controllers/payment.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';
import { validate, initializePaymentSchema } from '../middleware/validate';

const router = Router();

router.post('/webhook/:provider', handleWebhook);
router.post('/webhook', handleWebhook);

router.use(protect);

router.post('/initialize', generalLimiter, requireRole('client'), validate(initializePaymentSchema), initializePayment);
router.post('/charge', generalLimiter, requireRole('client'), chargeCard);
router.get('/verify/:reference', verifyPayment);
router.get('/status/:bookingId', getPaymentStatus);
router.get('/transactions', getMyTransactions);

export default router;
