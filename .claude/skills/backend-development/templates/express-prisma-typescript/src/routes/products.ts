import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams, schemas } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as productController from '../controllers/productController';

const router = Router();

// Validation schemas
const productQuerySchema = z.object({
  ...schemas.pagination.shape,
  search: z.string().optional(),
  brand: z.string().optional(),
  tireType: z.string().optional(),
  size: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.enum(['price', 'rating', 'name', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  tireType: z.string().min(1),
  size: z.string().min(1),
  season: z.string().min(1),
  price: z.number().positive(),
  cost: z.number().positive(),
  description: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial();

// Public routes
router.get('/', validateQuery(productQuerySchema), asyncHandler(productController.getProducts));
router.get('/:id', validateParams(z.object({ id: schemas.uuid })), asyncHandler(productController.getProductById));

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateBody(createProductSchema),
  asyncHandler(productController.createProduct)
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateParams(z.object({ id: schemas.uuid })),
  validateBody(updateProductSchema),
  asyncHandler(productController.updateProduct)
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateParams(z.object({ id: schemas.uuid })),
  asyncHandler(productController.deleteProduct)
);

export default router;
