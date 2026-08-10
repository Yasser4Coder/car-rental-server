import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as paymentsController from '../controllers/paymentsController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  checkoutSessionSchema,
  checkoutStatusQuerySchema,
} from '../validators/paymentSchemas.js';

const router = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many checkout attempts. Try again later.' },
});

router.get('/config', paymentsController.paymentsConfig);

router.post(
  '/checkout-session',
  checkoutLimiter,
  optionalAuth,
  validate(checkoutSessionSchema),
  paymentsController.createCheckoutSession,
);

router.get(
  '/checkout-status',
  optionalAuth,
  validate(checkoutStatusQuerySchema, 'query'),
  paymentsController.checkoutSessionStatus,
);

export default router;
