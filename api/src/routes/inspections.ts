import { Router } from "express";
import { z } from 'zod';

import { container } from '../container';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { validateBody, validateParams } from '../middleware/validate';
import { InspectionController } from '../modules/inspections/controllers/inspection.controller';
import { TYPES } from '../types';

const router = Router();
const inspectionController = container.get<InspectionController>(TYPES.InspectionController);

// Validation schemas
const idSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

const createInspectionSchema = z.object({
  inspection_number: z.string().optional(),
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid().optional(),
  inspector_id: z.string().uuid().optional(),
  inspection_type: z.enum(['pre_trip', 'post_trip', 'periodic', 'annual', 'dot', 'safety']),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'failed']).default('scheduled'),
  passed: z.boolean().optional(),
  failed_items: z.array(z.string()).optional(),
  checklist_data: z.record(z.any()).optional(),
  odometer_reading: z.number().optional(),
  inspector_notes: z.string().optional(),
  signature_url: z.string().optional(),
  scheduled_date: z.string().optional(),
  completed_at: z.string().optional()
});

const updateInspectionSchema = createInspectionSchema.partial();

// SECURITY: All routes require authentication
router.use(authenticateJWT);

// GET all inspections
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.INSPECTION_READ],
    enforceTenantIsolation: true,
    resourceType: 'inspection'
  }),
  asyncHandler((req, res, next) => inspectionController.getAll(req, res, next))
);

// GET inspection by ID
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.INSPECTION_READ],
    enforceTenantIsolation: true,
    resourceType: 'inspection'
  }),
  validateParams(idSchema),
  asyncHandler((req, res, next) => inspectionController.getById(req, res, next))
);

// POST create inspection
router.post("/",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.INSPECTION_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'inspection'
  }),
  validateBody(createInspectionSchema),
  asyncHandler((req, res, next) => inspectionController.create(req, res, next))
);

// PUT update inspection
router.put("/:id",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.INSPECTION_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'inspection'
  }),
  validateParams(idSchema),
  validateBody(updateInspectionSchema),
  asyncHandler((req, res, next) => inspectionController.update(req, res, next))
);

// DELETE inspection
router.delete("/:id",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.INSPECTION_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'inspection'
  }),
  validateParams(idSchema),
  asyncHandler((req, res, next) => inspectionController.delete(req, res, next))
);

export default router;
