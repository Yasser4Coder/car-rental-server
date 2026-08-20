import { Router } from 'express';
import * as carController from '../controllers/carController.js';
import { validate } from '../middleware/validate.js';
import { carFilterSchema } from '../validators/carSchemas.js';

const router = Router();

router.get('/featured', carController.getFeaturedCars);
router.get('/popular', carController.getPopularCarsHandler);
router.get('/', validate(carFilterSchema, 'query'), carController.getCars);
router.get('/:slugOrId/availability', carController.getCarAvailability);
router.get('/:slugOrId', carController.getCarBySlug);

export default router;
