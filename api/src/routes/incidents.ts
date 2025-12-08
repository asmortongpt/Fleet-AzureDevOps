import { Router } from "express";
import { z } from 'zod';

import { container } from '../container';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf'
;
import { asyncHandler } from '../middleware/errorHandler';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { validateBody, validateParams } from '../middleware/validate'
import { IncidentController } from '../modules/incidents/controllers/incident.controller';
import { TYPES } from '../types';

const router = Router();
const incidentController = container.get<IncidentController>(TYPES.IncidentController);

// Validation schemas
const idSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

const createIncidentSchema = z.object({
  incident_number: z.string(),
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  facility_id: z.string().uuid().optional(),
  incident_type: z.enum(['accident', 'damage', 'theft', 'breakdown', 'safety', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['reported', 'investigating', 'resolved', 'closed']).default('reported'),
  incident_date: z.string(),
  location: z.string().optional(),
  description: z.string().min(1),
  injuries_reported: z.boolean().optional(),
  police_report_filed: z.boolean().optional(),
  police_report_number: z.string().optional(),
  estimated_cost: z.number().optional(),
  actual_cost: z.number().optional(),
  insurance_claim_number: z.string().optional(),
  photos: z.array(z.string()).optional(),
  witness_statements: z.string().optional(),
  notes: z.string().optional(),
  reported_by: z.string()
});

const updateIncidentSchema = createIncidentSchema.partial();

// SECURITY: All routes require authentication
router.use(authenticateJWT);

// GET all incidents
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.INCIDENT_READ],
    enforceTenantIsolation: true,
    resourceType: 'incident'
  }),
  asyncHandler((req, res, next) => incidentController.getAll(req, res, next))
);

// GET incident by ID
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.INCIDENT_READ],
    enforceTenantIsolation: true,
    resourceType: 'incident'
  }),
  validateParams(idSchema),
  asyncHandler((req, res, next) => incidentController.getById(req, res, next))
);

// POST create incident
router.post("/",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.INCIDENT_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'incident'
  }),
  validateBody(createIncidentSchema),
  asyncHandler((req, res, next) => incidentController.create(req, res, next))
);

// PUT update incident
router.put("/:id",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.INCIDENT_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'incident'
  }),
  validateParams(idSchema),
  validateBody(updateIncidentSchema),
  asyncHandler((req, res, next) => incidentController.update(req, res, next))
);

// DELETE incident
router.delete("/:id",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.INCIDENT_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'incident'
  }),
  validateParams(idSchema),
  asyncHandler((req, res, next) => incidentController.delete(req, res, next))
);

export default router;
