
import { Router } from 'express';

import { scanSessionsController } from '../controllers/scan-sessions.controller';
import { authenticateJWT } from '../middleware/auth'

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT)

router.post('/', scanSessionsController.create);
router.get('/:id', scanSessionsController.get);
router.get('/vehicle/:vehicleId', scanSessionsController.listByVehicle);
router.post('/:id/upload-credentials', scanSessionsController.createUploadCredentials);
router.post('/:id/upload-complete', scanSessionsController.uploadComplete);
router.put('/:id', scanSessionsController.update);

export default router;
