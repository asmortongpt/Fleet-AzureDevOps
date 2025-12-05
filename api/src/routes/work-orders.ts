import { Router } from "express";
import { csrfProtection } from '../middleware/csrf'
import { container } from '../container';
import { TYPES } from '../types';
import { WorkOrderController } from '../modules/work-orders/controllers/work-order.controller';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateJWT } from '../middleware/auth';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validate';

const router = Router();
const workOrderController = container.get<WorkOrderController>(TYPES.WorkOrderController);

// Validation schemas
const idSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

const createWorkOrderSchema = z.object({
  work_order_number: z.string(),
  vehicle_id: z.string().uuid(),
  facility_id: z.string().uuid().optional(),
  assigned_technician_id: z.string().uuid().optional(),
  type: z.enum(['preventive', 'corrective', 'inspection']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['open', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('open'),
  description: z.string().min(1),
  odometer_reading: z.number().optional(),
  engine_hours_reading: z.number().optional(),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
  notes: z.string().optional()
});

const updateWorkOrderSchema = createWorkOrderSchema.partial();

// SECURITY: All routes require authentication
router.use(authenticateJWT);

// GET all work orders
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.WORK_ORDER_READ],
    enforceTenantIsolation: true,
    resourceType: 'work_order'
  }),
  asyncHandler((req, res, next) => workOrderController.getAll(req, res, next))
);

// GET work order by ID
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.WORK_ORDER_READ],
    enforceTenantIsolation: true,
    resourceType: 'work_order'
  }),
  validateParams(idSchema),
  asyncHandler((req, res, next) => workOrderController.getById(req, res, next))
);

// POST create work order
router.post("/",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.WORK_ORDER_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'work_order'
  }),
  validateBody(createWorkOrderSchema),
  asyncHandler((req, res, next) => workOrderController.create(req, res, next))
);

// PUT update work order
router.put("/:id",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.WORK_ORDER_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'work_order'
  }),
  validateParams(idSchema),
  validateBody(updateWorkOrderSchema),
  asyncHandler((req, res, next) => workOrderController.update(req, res, next))
);

// DELETE work order
router.delete("/:id",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.WORK_ORDER_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'work_order'
  }),
  validateParams(idSchema),
  asyncHandler((req, res, next) => workOrderController.delete(req, res, next))
);

export default router;
