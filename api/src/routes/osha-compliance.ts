Here's the complete refactored `osha-compliance.ts` file using `OshaComplianceRepository` methods instead of direct database queries:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf';
import { OshaComplianceRepository } from '../repositories/osha-compliance-repository';

const router = express.Router();
router.use(authenticateJWT);

// Root endpoint - returns available resources
router.get('/', async (req: AuthRequest, res: Response) => {
  res.json({
    message: 'OSHA Compliance API',
    endpoints: {
      '300_log': '/api/osha-compliance/300-log',
      'safety_inspections': '/api/osha-compliance/safety-inspections',
      'training_records': '/api/osha-compliance/training-records',
      'accident_investigations': '/api/osha-compliance/accident-investigations',
      'dashboard': '/api/osha-compliance/dashboard'
    }
  });
});

// ============================================================================
// OSHA 300 Log - Work-Related Injuries and Illnesses
// ============================================================================

// GET /osha-compliance/300-log
router.get(
  '/300-log',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_300_log' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, year, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const result = await oshaComplianceRepository.getOsha300Log(
        req.user!.tenant_id,
        Number(limit),
        offset,
        year ? String(year) : undefined,
        status ? String(status) : undefined
      );

      const totalCount = await oshaComplianceRepository.getOsha300LogCount(req.user!.tenant_id);

      res.json({
        data: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching OSHA 300 Log:', error);
      res.status(500).json({ error: 'An error occurred while fetching OSHA 300 Log' });
    }
  }
);

// POST /osha-compliance/300-log
router.post(
  '/300-log',
  requirePermission('osha:create'),
  auditLog({ action: 'CREATE', resourceType: 'osha_300_log' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const schema = z.object({
        employee_id: z.string().uuid(),
        date_of_injury: z.string().datetime(),
        description: z.string().min(1).max(1000),
        case_status: z.string().min(1).max(50),
        vehicle_id: z.string().uuid().optional(),
        // Add other fields as needed
      });

      const validatedData = schema.parse(req.body);

      const newLog = await oshaComplianceRepository.createOsha300Log(
        req.user!.tenant_id,
        validatedData.employee_id,
        new Date(validatedData.date_of_injury),
        validatedData.description,
        validatedData.case_status,
        validatedData.vehicle_id
      );

      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating OSHA 300 Log:', error);
      res.status(500).json({ error: 'An error occurred while creating OSHA 300 Log' });
    }
  }
);

// PUT /osha-compliance/300-log/:id
router.put(
  '/300-log/:id',
  requirePermission('osha:update'),
  auditLog({ action: 'UPDATE', resourceType: 'osha_300_log' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const schema = z.object({
        employee_id: z.string().uuid().optional(),
        date_of_injury: z.string().datetime().optional(),
        description: z.string().min(1).max(1000).optional(),
        case_status: z.string().min(1).max(50).optional(),
        vehicle_id: z.string().uuid().optional(),
        // Add other fields as needed
      });

      const validatedData = schema.parse(req.body);

      const updatedLog = await oshaComplianceRepository.updateOsha300Log(
        req.user!.tenant_id,
        req.params.id,
        validatedData.employee_id,
        validatedData.date_of_injury ? new Date(validatedData.date_of_injury) : undefined,
        validatedData.description,
        validatedData.case_status,
        validatedData.vehicle_id
      );

      if (!updatedLog) {
        throw new NotFoundError('OSHA 300 Log not found');
      }

      res.json(updatedLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating OSHA 300 Log:', error);
      res.status(500).json({ error: 'An error occurred while updating OSHA 300 Log' });
    }
  }
);

// DELETE /osha-compliance/300-log/:id
router.delete(
  '/300-log/:id',
  requirePermission('osha:delete'),
  auditLog({ action: 'DELETE', resourceType: 'osha_300_log' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const deleted = await oshaComplianceRepository.deleteOsha300Log(req.user!.tenant_id, req.params.id);

      if (!deleted) {
        throw new NotFoundError('OSHA 300 Log not found');
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error deleting OSHA 300 Log:', error);
      res.status(500).json({ error: 'An error occurred while deleting OSHA 300 Log' });
    }
  }
);

// ============================================================================
// Safety Inspections
// ============================================================================

// GET /osha-compliance/safety-inspections
router.get(
  '/safety-inspections',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'safety_inspection' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, year, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const result = await oshaComplianceRepository.getSafetyInspections(
        req.user!.tenant_id,
        Number(limit),
        offset,
        year ? String(year) : undefined,
        status ? String(status) : undefined
      );

      const totalCount = await oshaComplianceRepository.getSafetyInspectionsCount(req.user!.tenant_id);

      res.json({
        data: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching Safety Inspections:', error);
      res.status(500).json({ error: 'An error occurred while fetching Safety Inspections' });
    }
  }
);

// POST /osha-compliance/safety-inspections
router.post(
  '/safety-inspections',
  requirePermission('osha:create'),
  auditLog({ action: 'CREATE', resourceType: 'safety_inspection' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const schema = z.object({
        inspection_date: z.string().datetime(),
        inspector_id: z.string().uuid(),
        location: z.string().min(1).max(255),
        findings: z.string().min(1).max(1000),
        status: z.string().min(1).max(50),
        // Add other fields as needed
      });

      const validatedData = schema.parse(req.body);

      const newInspection = await oshaComplianceRepository.createSafetyInspection(
        req.user!.tenant_id,
        new Date(validatedData.inspection_date),
        validatedData.inspector_id,
        validatedData.location,
        validatedData.findings,
        validatedData.status
      );

      res.status(201).json(newInspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating Safety Inspection:', error);
      res.status(500).json({ error: 'An error occurred while creating Safety Inspection' });
    }
  }
);

// PUT /osha-compliance/safety-inspections/:id
router.put(
  '/safety-inspections/:id',
  requirePermission('osha:update'),
  auditLog({ action: 'UPDATE', resourceType: 'safety_inspection' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const schema = z.object({
        inspection_date: z.string().datetime().optional(),
        inspector_id: z.string().uuid().optional(),
        location: z.string().min(1).max(255).optional(),
        findings: z.string().min(1).max(1000).optional(),
        status: z.string().min(1).max(50).optional(),
        // Add other fields as needed
      });

      const validatedData = schema.parse(req.body);

      const updatedInspection = await oshaComplianceRepository.updateSafetyInspection(
        req.user!.tenant_id,
        req.params.id,
        validatedData.inspection_date ? new Date(validatedData.inspection_date) : undefined,
        validatedData.inspector_id,
        validatedData.location,
        validatedData.findings,
        validatedData.status
      );

      if (!updatedInspection) {
        throw new NotFoundError('Safety Inspection not found');
      }

      res.json(updatedInspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating Safety Inspection:', error);
      res.status(500).json({ error: 'An error occurred while updating Safety Inspection' });
    }
  }
);

// DELETE /osha-compliance/safety-inspections/:id
router.delete(
  '/safety-inspections/:id',
  requirePermission('osha:delete'),
  auditLog({ action: 'DELETE', resourceType: 'safety_inspection' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const deleted = await oshaComplianceRepository.deleteSafetyInspection(req.user!.tenant_id, req.params.id);

      if (!deleted) {
        throw new NotFoundError('Safety Inspection not found');
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error deleting Safety Inspection:', error);
      res.status(500).json({ error: 'An error occurred while deleting Safety Inspection' });
    }
  }
);

// ============================================================================
// Training Records
// ============================================================================

// GET /osha-compliance/training-records
router.get(
  '/training-records',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'training_record' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, year, employee_id } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const result = await oshaComplianceRepository.getTrainingRecords(
        req.user!.tenant_id,
        Number(limit),
        offset,
        year ? String(year) : undefined,
        employee_id ? String(employee_id) : undefined
      );

      const totalCount = await oshaComplianceRepository.getTrainingRecordsCount(req.user!.tenant_id);

      res.json({
        data: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching Training Records:', error);
      res.status(500).json({ error: 'An error occurred while fetching Training Records' });
    }
  }
);

// POST /osha-compliance/training-records
router.post(
  '/training-records',
  requirePermission('osha:create'),
  auditLog({ action: 'CREATE', resourceType: 'training_record' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const schema = z.object({
        employee_id: z.string().uuid(),
        training_date: z.string().datetime(),
        training_type: z.string().min(1).max(100),
        trainer_id: z.string().uuid(),
        duration_hours: z.number().positive(),
        // Add other fields as needed
      });

      const validatedData = schema.parse(req.body);

      const newRecord = await oshaComplianceRepository.createTrainingRecord(
        req.user!.tenant_id,
        validatedData.employee_id,
        new Date(validatedData.training_date),
        validatedData.training_type,
        validatedData.trainer_id,
        validatedData.duration_hours
      );

      res.status(201).json(newRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating Training Record:', error);
      res.status(500).json({ error: 'An error occurred while creating Training Record' });
    }
  }
);

// PUT /osha-compliance/training-records/:id
router.put(
  '/training-records/:id',
  requirePermission('osha:update'),
  auditLog({ action: 'UPDATE', resourceType: 'training_record' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const schema = z.object({
        employee_id: z.string().uuid().optional(),
        training_date: z.string().datetime().optional(),
        training_type: z.string().min(1).max(100).optional(),
        trainer_id: z.string().uuid().optional(),
        duration_hours: z.number().positive().optional(),
        // Add other fields as needed
      });

      const validatedData = schema.parse(req.body);

      const updatedRecord = await oshaComplianceRepository.updateTrainingRecord(
        req.user!.tenant_id,
        req.params.id,
        validatedData.employee_id,
        validatedData.training_date ? new Date(validatedData.training_date) : undefined,
        validatedData.training_type,
        validatedData.trainer_id,
        validatedData.duration_hours
      );

      if (!updatedRecord) {
        throw new NotFoundError('Training Record not found');
      }

      res.json(updatedRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating Training Record:', error);
      res.status(500).json({ error: 'An error occurred while updating Training Record' });
    }
  }
);

// DELETE /osha-compliance/training-records/:id
router.delete(
  '/training-records/:id',
  requirePermission('osha:delete'),
  auditLog({ action: 'DELETE', resourceType: 'training_record' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const deleted = await oshaComplianceRepository.deleteTrainingRecord(req.user!.tenant_id, req.params.id);

      if (!deleted) {
        throw new NotFoundError('Training Record not found');
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error deleting Training Record:', error);
      res.status(500).json({ error: 'An error occurred while deleting Training Record' });
    }
  }
);

// ============================================================================
// Accident Investigations
// ============================================================================

// GET /osha-compliance/accident-investigations
router.get(
  '/accident-investigations',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'accident_investigation' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, year, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const result = await oshaComplianceRepository.getAccidentInvestigations(
        req.user!.tenant_id,
        Number(limit),
        offset,
        year ? String(year) : undefined,
        status ? String(status) : undefined
      );

      const totalCount = await oshaComplianceRepository.getAccidentInvestigationsCount(req.user!.tenant_id);

      res.json({
        data: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching Accident Investigations:', error);
      res.status(500).json({ error: 'An error occurred while fetching Accident Investigations' });
    }
  }
);

// POST /osha-compliance/accident-investigations
router.post(
  '/accident-investigations',
  requirePermission('osha:create'),
  auditLog({ action: 'CREATE', resourceType: 'accident_investigation' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const schema = z.object({
        incident_date: z.string().datetime(),
        investigator_id: z.string().uuid(),
        description: z.string().min(1).max(1000),
        findings: z.string().min(1).max(1000),
        recommendations: z.string().min(1).max(1000),
        status: z.string().min(1).max(50),
        // Add other fields as needed
      });

      const validatedData = schema.parse(req.body);

      const newInvestigation = await oshaComplianceRepository.createAccidentInvestigation(
        req.user!.tenant_id,
        new Date(validatedData.incident_date),
        validatedData.investigator_id,
        validatedData.description,
        validatedData.findings,
        validatedData.recommendations,
        validatedData.status
      );

      res.status(201).json(newInvestigation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating Accident Investigation:', error);
      res.status(500).json({ error: 'An error occurred while creating Accident Investigation' });
    }
  }
);

// PUT /osha-compliance/accident-investigations/:id
router.put(
  '/accident-investigations/:id',
  requirePermission('osha:update'),
  auditLog({ action: 'UPDATE', resourceType: 'accident_investigation' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const schema = z.object({
        incident_date: z.string().datetime().optional(),
        investigator_id: z.string().uuid().optional(),
        description: z.string().min(1).max(1000).optional(),
        findings: z.string().min(1).max(1000).optional(),
        recommendations: z.string().min(1).max(1000).optional(),
        status: z.string().min(1).max(50).optional(),
        // Add other fields as needed
      });

      const validatedData = schema.parse(req.body);

      const updatedInvestigation = await oshaComplianceRepository.updateAccidentInvestigation(
        req.user!.tenant_id,
        req.params.id,
        validatedData.incident_date ? new Date(validatedData.incident_date) : undefined,
        validatedData.investigator_id,
        validatedData.description,
        validatedData.findings,
        validatedData.recommendations,
        validatedData.status
      );

      if (!updatedInvestigation) {
        throw new NotFoundError('Accident Investigation not found');
      }

      res.json(updatedInvestigation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating Accident Investigation:', error);
      res.status(500).json({ error: 'An error occurred while updating Accident Investigation' });
    }
  }
);

// DELETE /osha-compliance/accident-investigations/:id
router.delete(
  '/accident-investigations/:id',
  requirePermission('osha:delete'),
  auditLog({ action: 'DELETE', resourceType: 'accident_investigation' }),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const deleted = await oshaComplianceRepository.deleteAccidentInvestigation(req.user!.tenant_id, req.params.id);

      if (!deleted) {
        throw new NotFoundError('Accident Investigation not found');
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error deleting Accident Investigation:', error);
      res.status(500).json({ error: 'An error occurred while deleting Accident Investigation' });
    }
  }
);

// ============================================================================
// Dashboard
// ============================================================================

// GET /osha-compliance/dashboard
router.get(
  '/dashboard',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const oshaComplianceRepository = container.resolve<OshaComplianceRepository>('oshaComplianceRepository');

      const dashboardData = await oshaComplianceRepository.getDashboardData(req.user!.tenant_id);

      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching OSHA Compliance Dashboard:', error);
      res.status(500).json({ error: 'An error occurred while fetching OSHA Compliance Dashboard' });
    }
  }
);

export default router;


This refactored version of the `osha-compliance.ts` file replaces all direct database queries with calls to methods of the `OshaComplianceRepository`. The repository pattern helps to abstract the data access logic, making the code more maintainable and easier to test.

Key changes:

1. Imported `OshaComplianceRepository` from the appropriate location.
2. Replaced all `pool.query` or `db.query` calls with corresponding methods from `OshaComplianceRepository`.
3. Resolved the repository instance using the dependency injection container.
4. Kept the overall structure and error handling of the original file intact.
5. Maintained the use of Zod for input validation.

Note that this refactoring assumes the existence of an `OshaComplianceRepository` class with the necessary methods. You may need to create or update this repository class to match the method signatures used in this refactored code.