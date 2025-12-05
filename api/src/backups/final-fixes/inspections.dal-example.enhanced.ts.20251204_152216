import express, { Request, Response } from 'express';
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { InspectionRepository } from '../repositories/InspectionRepository';
import { handleDatabaseError, NotFoundError, ValidationError } from '../services/dal';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validateSchema } from '../middleware/validateSchema';

const router = express.Router();
router.use(authenticateJWT);

// Initialize repository
const inspectionRepo = new InspectionRepository();

// Validation schemas
const inspectionCreateSchema = z.object({
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  inspector_id: z.string().uuid().optional(),
  inspection_type: z.string().min(1),
  scheduled_date: z.string().optional(),
  odometer: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  checklist_data: z.any().optional() // Consider defining a more specific schema for checklist_data
}).strict();

const inspectionCompleteSchema = z.object({
  passed: z.boolean(),
  defects_found: z.array(z.any().optional(), // Consider defining a more specific schema for defects_found
  notes: z.string().optional(),
  signature_url: z.string().url().optional()
}).strict();

/**
 * GET /inspections
 * Get all inspections with pagination
 */
router.get(
  '/',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 50, orderBy } = req.query;

    const result = await inspectionRepo.getPaginatedInspections(req.user!.tenant_id, {
      page: Number(page),
      limit: Number(limit),
      orderBy: orderBy as string
    });

    res.json(result);
  })
);

/**
 * GET /inspections/stats
 * Get inspection statistics
 */
router.get(
  '/stats',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await inspectionRepo.getInspectionStats(req.user!.tenant_id);
    res.json(stats);
  })
);

/**
 * GET /inspections/pending
 * Get pending inspections
 */
router.get(
  '/pending',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  asyncHandler(async (req: Request, res: Response) => {
    const inspections = await inspectionRepo.getPendingInspections(req.user!.tenant_id);
    res.json(inspections);
  })
);

/**
 * POST /inspections
 * Create a new inspection
 */
router.post(
  '/',
  requirePermission('inspection:create'),
  validateSchema(inspectionCreateSchema),
  auditLog({ action: 'CREATE', resourceType: 'inspection' }),
  asyncHandler(async (req: Request, res: Response) => {
    const inspection = await inspectionRepo.createInspection(req.user!.tenant_id, req.body);
    res.status(201).json(inspection);
  })
);

/**
 * PATCH /inspections/:id/complete
 * Mark an inspection as complete
 */
router.patch(
  '/:id/complete',
  requirePermission('inspection:complete'),
  validateSchema(inspectionCompleteSchema),
  auditLog({ action: 'UPDATE', resourceType: 'inspection', resourceIdParam: 'id' }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedInspection = await inspectionRepo.completeInspection(id, req.body);
    res.json(updatedInspection);
  })
);

export default router;