import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/authSchemas.js';

const router = Router();

router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateMe);

export default router;
