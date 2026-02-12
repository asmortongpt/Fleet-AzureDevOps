import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

// All inventory routes require authentication and staff/admin role
router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/', asyncHandler(inventoryController.getInventory));
router.get('/:productId/:locationId', asyncHandler(inventoryController.getInventoryByLocation));
router.put('/:productId/:locationId', asyncHandler(inventoryController.updateInventory));

export default router;
