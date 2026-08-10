import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as bookingController from '../controllers/bookingController.js';
import * as carController from '../controllers/carController.js';
import * as statsController from '../controllers/statsController.js';
import * as userAdminController from '../controllers/userAdminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  adminBookingFilterSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
} from '../validators/bookingSchemas.js';
import { carBodySchema, carFilterSchema, carUpdateSchema } from '../validators/carSchemas.js';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUserFilterSchema,
} from '../validators/userAdminSchemas.js';

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many uploads, try again later' },
});

router.use(authenticate, requireAdmin);

router.get('/stats/overview', statsController.overview);
router.get('/stats/timeseries', statsController.timeseries);
router.get('/stats/top-cars', statsController.topCars);
router.get('/stats/locations', statsController.locations);

router.get('/cars', validate(carFilterSchema, 'query'), carController.adminListCars);
router.post('/cars', validate(carBodySchema), carController.adminCreateCar);
router.get('/cars/:id', carController.adminGetCar);
router.patch('/cars/:id', validate(carUpdateSchema), carController.adminUpdateCar);
router.delete('/cars/:id', carController.adminDeleteCar);
router.post(
  '/cars/:id/images',
  uploadLimiter,
  upload.array('images', 8),
  carController.adminUploadImages,
);
router.delete('/cars/:id/images', carController.adminDeleteImage);

router.get(
  '/bookings',
  validate(adminBookingFilterSchema, 'query'),
  bookingController.adminListBookings,
);
router.get('/bookings/:id', bookingController.adminGetBooking);
router.patch(
  '/bookings/:id/status',
  validate(updateBookingStatusSchema),
  bookingController.adminUpdateStatus,
);
router.patch('/bookings/:id', validate(updateBookingSchema), bookingController.adminUpdateBooking);

router.get('/users', validate(adminUserFilterSchema, 'query'), userAdminController.adminListUsers);
router.post('/users', validate(adminCreateUserSchema), userAdminController.adminCreateUser);
router.get('/users/:id', userAdminController.adminGetUser);
router.patch('/users/:id', validate(adminUpdateUserSchema), userAdminController.adminUpdateUser);
router.delete('/users/:id', userAdminController.adminDeleteUser);

export default router;
