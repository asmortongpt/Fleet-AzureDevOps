import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as orderController from '../controllers/orderController';

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(orderController.getOrders));
router.get('/:id', asyncHandler(orderController.getOrderById));
router.post('/', asyncHandler(orderController.createOrder));
router.patch('/:id/status', asyncHandler(orderController.updateOrderStatus));

export default router;
