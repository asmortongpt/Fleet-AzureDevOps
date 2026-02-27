import { Router } from 'express';
import { z } from 'zod';
import { validateBody, schemas } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as authController from '../controllers/authController';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: schemas.email,
  password: schemas.password,
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN']).default('CUSTOMER'),
});

const loginSchema = z.object({
  email: schemas.email,
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Routes
router.post('/register', validateBody(registerSchema), asyncHandler(authController.register));
router.post('/login', validateBody(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validateBody(refreshSchema), asyncHandler(authController.refreshToken));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getProfile));

export default router;
