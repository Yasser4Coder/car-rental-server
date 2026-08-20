import { Router } from 'express';
import * as whyChooseUsController from '../controllers/whyChooseUsController.js';
import * as vehicleCategoryController from '../controllers/vehicleCategoryController.js';
import * as seoContentController from '../controllers/seoContentController.js';

const router = Router();

router.get('/why-choose-us', whyChooseUsController.listPublicWhyChooseUs);
router.get('/vehicle-categories', vehicleCategoryController.listPublicVehicleCategories);
router.get('/seo/homepage', seoContentController.getPublicHomepageSeo);

export default router;
