import { Router, Response } from "express";
import { z } from 'zod';

import { pool } from '../config/database';
import { container } from '../container';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { validateBody, validateParams } from '../middleware/validate';
import { InspectionController } from '../modules/inspections/controllers/inspection.controller';
import { TYPES } from '../types';
import { logger } from '../utils/logger';

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

// GET inspection violations — policy violations associated with the inspected vehicle
// SafetyInspectionDrilldowns calls /api/inspections/:id/violations
router.get("/:id/violations",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.INSPECTION_READ],
    enforceTenantIsolation: true,
    resourceType: 'inspection'
  }),
  async (req: AuthRequest, res: Response) => {
    try {
      const inspectionId = req.params.id

      // Find violations for the same vehicle around the inspection date (±30 days)
      const result = await pool.query(
        `SELECT
          pv.id,
          pv.violation_date,
          pv.violation_description as description,
          pv.severity,
          pv.case_status as status,
          pv.location,
          pv.employee_number as driver_id,
          d.first_name || ' ' || d.last_name as driver_name,
          pt.policy_name
        FROM policy_violations pv
        LEFT JOIN drivers d ON pv.employee_number = d.id
        LEFT JOIN policy_templates pt ON pv.policy_id = pt.id
        JOIN inspections i ON i.id = $1
        WHERE pv.vehicle_id = i.vehicle_id
          AND pv.violation_date BETWEEN
            (i.started_at::date - INTERVAL '30 days')
            AND (i.started_at::date + INTERVAL '30 days')
        ORDER BY pv.violation_date DESC`,
        [inspectionId]
      )

      res.json(result.rows)
    } catch (error) {
      logger.error('Get inspection violations error:', error)
      res.json([])
    }
  }
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
