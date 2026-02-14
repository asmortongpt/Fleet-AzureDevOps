
import { Router } from 'express';

import { scanSessionsController } from '../controllers/scan-sessions.controller';
import { authenticateJWT } from '../middleware/auth'

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT)

router.post('/', (req, res) => scanSessionsController.create(req, res));
router.get('/:id', (req, res) => scanSessionsController.get(req, res));
router.get('/vehicle/:vehicleId', (req, res) => scanSessionsController.listByVehicle(req, res));
router.post('/:id/upload-credentials', (req, res) => scanSessionsController.createUploadCredentials(req, res));
router.post('/:id/upload-complete', (req, res) => scanSessionsController.uploadComplete(req, res));
router.put('/:id', (req, res) => scanSessionsController.update(req, res));

export default router;
