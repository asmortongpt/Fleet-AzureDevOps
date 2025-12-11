import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { serialize } from 'node-html-encoder';
import { csrfProtection } from '../middleware/csrf';

// Import all necessary repositories
import { Osha300LogRepository } from '../repositories/Osha300LogRepository';
import { SafetyInspectionRepository } from '../repositories/SafetyInspectionRepository';
import { TrainingRecordRepository } from '../repositories/TrainingRecordRepository';
import { AccidentInvestigationRepository } from '../repositories/AccidentInvestigationRepository';
import { DashboardRepository } from '../repositories/DashboardRepository';

const router = express.Router();

router.use(authenticateJWT);
router.use(helmet());
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const logSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  year: z.string().optional(),
  status: z.string().optional(),
});

// Root endpoint - returns available resources
router.get('/', async (req: AuthRequest, res: Response) => {
  res.json({
    message: 'OSHA Compliance API',
    endpoints: {
      '300_log': '/api/osha-compliance/300-log',
      safety_inspections: '/api/osha-compliance/safety-inspections',
      training_records: '/api/osha-compliance/training-records',
      accident_investigations: '/api/osha-compliance/accident-investigations',
      dashboard: '/api/osha-compliance/dashboard',
    },
  });
});

// GET /osha-compliance/300-log
router.get(
  '/300-log',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_300_log' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validationResult = logSchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError("Invalid request parameters");
      }

      const { page = 1, limit = 50, year, status } = validationResult.data;
      const offset = (Number(page) - 1) * Number(limit);

      // Create an instance of the repository
      const osha300LogRepository = container.resolve(Osha300LogRepository);

      // Use repository methods instead of pool.query
      const result = await osha300LogRepository.getOsha300Logs(
        req.user!.tenant_id,
        year,
        status,
        Number(limit),
        offset
      );

      const totalCount = await osha300LogRepository.getOsha300LogCount(req.user!.tenant_id);

      res.json({
        data: result.map(row => ({
          ...row,
          employee_full_name: serialize(row.employee_full_name),
          vehicle_unit: serialize(row.vehicle_unit),
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit)),
        },
      });
    } catch (error) {
      console.error(`Get OSHA 300 log error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /osha-compliance/safety-inspections
router.get(
  '/safety-inspections',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'safety_inspection' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const safetyInspectionRepository = container.resolve(SafetyInspectionRepository);
      const inspections = await safetyInspectionRepository.getSafetyInspections(req.user!.tenant_id);
      res.json(inspections);
    } catch (error) {
      console.error(`Get safety inspections error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /osha-compliance/training-records
router.get(
  '/training-records',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'training_record' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const trainingRecordRepository = container.resolve(TrainingRecordRepository);
      const records = await trainingRecordRepository.getTrainingRecords(req.user!.tenant_id);
      res.json(records);
    } catch (error) {
      console.error(`Get training records error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /osha-compliance/accident-investigations
router.get(
  '/accident-investigations',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'accident_investigation' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const accidentInvestigationRepository = container.resolve(AccidentInvestigationRepository);
      const investigations = await accidentInvestigationRepository.getAccidentInvestigations(req.user!.tenant_id);
      res.json(investigations);
    } catch (error) {
      console.error(`Get accident investigations error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /osha-compliance/dashboard
router.get(
  '/dashboard',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const dashboardRepository = container.resolve(DashboardRepository);
      const dashboardData = await dashboardRepository.getDashboardData(req.user!.tenant_id);
      res.json(dashboardData);
    } catch (error) {
      console.error(`Get dashboard data error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;