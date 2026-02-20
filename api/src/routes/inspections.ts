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

import { flexUuid } from '../middleware/validation'

const router = Router();
const inspectionController = container.get<InspectionController>(TYPES.InspectionController);

// Validation schemas
const idSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

const createInspectionSchema = z.object({
  vehicle_id: flexUuid,
  driver_id: flexUuid.optional(),
  inspector_id: flexUuid.optional(),
  type: z.enum(['pre_trip', 'post_trip', 'annual', 'dot', 'safety', 'emissions', 'special']),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'failed']).default('scheduled'),
  inspector_name: z.string().optional(),
  location: z.string().optional(),
  started_at: z.string(),
  completed_at: z.string().optional(),
  defects_found: z.number().int().min(0).optional(),
  passed_inspection: z.boolean().optional(),
  notes: z.string().optional(),
  checklist_data: z.record(z.string(), z.any()).optional(),
  signature_url: z.string().optional()
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
