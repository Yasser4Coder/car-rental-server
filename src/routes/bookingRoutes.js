import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema } from '../validators/bookingSchemas.js';

const router = Router();

router.post('/', optionalAuth, validate(createBookingSchema), bookingController.createBooking);
router.get('/mine', authenticate, bookingController.getMyBookings);
router.patch('/:id/cancel', authenticate, bookingController.cancelMyBooking);

export default router;
