To refactor the `inspections.enhanced.ts` file and replace all `pool.query` or `db.query` calls with repository methods, we need to create a repository class that encapsulates the database operations. Below is the refactored version of the file, assuming we have created an `InspectionRepository` class with appropriate methods.

First, let's define the `InspectionRepository` class (which should be in a separate file, e.g., `inspection.repository.ts`):


// inspection.repository.ts
import { PoolClient } from 'pg';

export class InspectionRepository {
  constructor(private client: PoolClient) {}

  async getInspections(tenantId: string, limit: number, offset: number): Promise<any[]> {
    const result = await this.client.query(
      `SELECT id, tenant_id, vehicle_id, driver_id, inspection_type, status,
              passed, failed_items, odometer_reading, inspector_notes,
              signature_url, completed_at, created_at, updated_at
       FROM inspections WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    return result.rows;
  }

  async getInspectionsCount(tenantId: string): Promise<number> {
    const result = await this.client.query(
      `SELECT COUNT(*) FROM inspections WHERE tenant_id = $1`,
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getInspectionById(id: string, tenantId: string): Promise<any> {
    const result = await this.client.query(
      `SELECT id, tenant_id, vehicle_id, driver_id, inspection_type, status,
              passed, failed_items, checklist_data, odometer_reading,
              inspector_notes, signature_url, completed_at, created_at, updated_at
       FROM inspections WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async checkDriverId(driverId: string, userId: string, tenantId: string): Promise<boolean> {
    const result = await this.client.query(
      `SELECT id FROM drivers WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
      [driverId, userId, tenantId]
    );
    return result.rows.length > 0;
  }
}


Now, let's refactor the `inspections.enhanced.ts` file to use the `InspectionRepository`:


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
import { ValidationError } from '../utils/errors';
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
      console.error('Get inspection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /inspections
router.post(
  '/',
  csrfProtection,
  requirePermission('inspection:create:own', {
    customCheck: async (req: AuthRequest) => {
      // Validate driver_id matches the authenticated user
      const driverId = req.body.driver_id;
      if (!driverId) {
        return false;
      }

      const inspectionRepository = container.resolve(InspectionRepository);
      return await inspectionRepository.checkDriverId(driverId, req.user!.id, req.user!.tenant_id);
    },
  }),
  auditLog({ action: 'CREATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = inspectionSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsedData.error });
      }

      const inspectionRepository = container.resolve(InspectionRepository);
      const newInspection = await inspectionRepository.createInspection({
        ...parsedData.data,
        tenant_id: req.user!.tenant_id,
      });

      res.status(201).json(newInspection);
    } catch (error) {
      console.error('Create inspection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


In this refactored version, we've replaced all `pool.query` calls with methods from the `InspectionRepository` class. We assume that the `InspectionRepository` is registered in the dependency injection container and can be resolved using `container.resolve(InspectionRepository)`.

Note that you'll need to implement the `createInspection` method in the `InspectionRepository` class to handle the POST request. Also, make sure to adjust the import paths and any other dependencies according to your project structure.