import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as bookingController from '../controllers/bookingController.js';
import * as carController from '../controllers/carController.js';
import * as paymentsAdminController from '../controllers/paymentsAdminController.js';
import * as statsController from '../controllers/statsController.js';
import * as userAdminController from '../controllers/userAdminController.js';
import * as whyChooseUsController from '../controllers/whyChooseUsController.js';
import * as vehicleCategoryController from '../controllers/vehicleCategoryController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  adminBookingFilterSchema,
  adminPaymentFilterSchema,
  updateBookingPaymentStatusSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
} from '../validators/bookingSchemas.js';
import { carBodySchema, carFilterSchema, carUpdateSchema } from '../validators/carSchemas.js';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUserFilterSchema,
} from '../validators/userAdminSchemas.js';
import {
  whyChooseUsBodySchema,
  whyChooseUsUpdateSchema,
} from '../validators/whyChooseUsSchemas.js';
import {
  vehicleCategoryBodySchema,
  vehicleCategoryUpdateSchema,
} from '../validators/vehicleCategorySchemas.js';
import { seoContentUpdateSchema } from '../validators/seoContentSchemas.js';
import * as seoContentController from '../controllers/seoContentController.js';

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
router.patch(
  '/bookings/:id/payment-status',
  validate(updateBookingPaymentStatusSchema),
  bookingController.adminUpdatePaymentStatus,
);
router.patch('/bookings/:id', validate(updateBookingSchema), bookingController.adminUpdateBooking);

router.get(
  '/payments',
  validate(adminPaymentFilterSchema, 'query'),
  paymentsAdminController.adminListPayments,
);
router.get('/payments/:id', paymentsAdminController.adminGetPaymentBooking);

router.get('/users', validate(adminUserFilterSchema, 'query'), userAdminController.adminListUsers);
router.post('/users', validate(adminCreateUserSchema), userAdminController.adminCreateUser);
router.get('/users/:id', userAdminController.adminGetUser);
router.patch('/users/:id', validate(adminUpdateUserSchema), userAdminController.adminUpdateUser);
router.delete('/users/:id', userAdminController.adminDeleteUser);

router.get('/content/why-choose-us', whyChooseUsController.adminListWhyChooseUs);
router.post(
  '/content/why-choose-us',
  validate(whyChooseUsBodySchema),
  whyChooseUsController.adminCreateWhyChooseUs,
);
router.patch(
  '/content/why-choose-us/:id',
  validate(whyChooseUsUpdateSchema),
  whyChooseUsController.adminUpdateWhyChooseUs,
);
router.delete('/content/why-choose-us/:id', whyChooseUsController.adminDeleteWhyChooseUs);

router.get('/content/vehicle-categories', vehicleCategoryController.adminListVehicleCategories);
router.post(
  '/content/vehicle-categories',
  validate(vehicleCategoryBodySchema),
  vehicleCategoryController.adminCreateVehicleCategory,
);
router.patch(
  '/content/vehicle-categories/:id',
  validate(vehicleCategoryUpdateSchema),
  vehicleCategoryController.adminUpdateVehicleCategory,
);
router.delete(
  '/content/vehicle-categories/:id',
  vehicleCategoryController.adminDeleteVehicleCategory,
);

router.get('/content/seo/homepage', seoContentController.adminGetHomepageSeo);
router.patch(
  '/content/seo/homepage',
  validate(seoContentUpdateSchema),
  seoContentController.adminUpdateHomepageSeo,
);

export default router;
