// inspections.enhanced.ts
import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';
import { rateLimit } from '../middleware/rateLimit';
import { csrfProtection } from '../middleware/csrf';
import { InspectionRepository } from '../repositories/inspection.repository';

const router = express.Router();
router.use(authenticateJWT);
router.use(rateLimit({ windowMs: 60000, max: 100 })); // 100 requests per minute

const inspectionSchema = z.object({
  vehicle_id: z.string(),
  driver_id: z.string(),
  inspection_type: z.enum(['PRE_TRIP', 'POST_TRIP']),
  status: z.enum(['PASSED', 'FAILED']),
  passed: z.boolean(),
  failed_items: z.array(z.string()).optional(),
  odometer_reading: z.number().optional(),
  inspector_notes: z.string().optional(),
  signature_url: z.string().url().optional(),
  completed_at: z.date().optional(),
});

// GET /inspections
router.get(
  '/',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const inspectionRepository = container.resolve(InspectionRepository);
      const inspections = await inspectionRepository.getInspections(req.user!.tenant_id, Number(limit), offset);
      const total = await inspectionRepository.getInspectionsCount(req.user!.tenant_id);

      res.json({
        data: inspections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error(`Get inspections error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /inspections/:id
router.get(
  '/:id',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const inspectionRepository = container.resolve(InspectionRepository);
      const inspection = await inspectionRepository.getInspectionById(req.params.id, req.user!.tenant_id);

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' });
      }

      res.json(inspection);
    } catch (error) {
      console.error(`Get inspection by ID error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /inspections
router.post(
  '/',
  csrfProtection,
  requirePermission('inspection:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = inspectionSchema.parse(req.body);
      const { driver_id, ...inspectionData } = parsedData;

      const inspectionRepository = container.resolve(InspectionRepository);
      const driverExists = await inspectionRepository.checkDriverId(driver_id, req.user!.id, req.user!.tenant_id);

      if (!driverExists) {
        throw new ValidationError('Invalid driver ID');
      }

      const newInspection = await inspectionRepository.createInspection({
        ...inspectionData,
        driver_id,
        tenant_id: req.user!.tenant_id,
      });

      res.status(201).json(newInspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(`Create inspection error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;