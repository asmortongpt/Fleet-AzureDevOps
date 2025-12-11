Here's the complete refactored TypeScript code for the `safety-incidents.ts` file, following the given instructions:


// src/routes/safetyIncidents.ts

import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { applyFieldMasking } from '../utils/fieldMasking';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';
import { csrfProtection } from '../middleware/csrf';
import { SafetyIncidentRepository } from '../repositories/safetyIncidentRepository';

const router = express.Router();
router.use(authenticateJWT);

// GET /safety-incidents
router.get(
  '/',
  requirePermission('safety_incident:view:global'),
  applyFieldMasking('safety_incident'),
  auditLog({ action: 'READ', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository);
      const [result, count] = await Promise.all([
        safetyIncidentRepository.getAll(req.user!.tenant_id, Number(limit), offset),
        safetyIncidentRepository.getCount(req.user!.tenant_id)
      ]);

      res.json({
        data: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      logger.error(`Get safety-incidents error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /safety-incidents/:id
router.get(
  '/:id',
  requirePermission('safety_incident:view:global'),
  applyFieldMasking('safety_incident'),
  auditLog({ action: 'READ', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository);
      const result = await safetyIncidentRepository.getById(req.params.id, req.user!.tenant_id);

      if (!result) {
        throw new NotFoundError("SafetyIncidents not found");
      }

      res.json(result);
    } catch (error) {
      logger.error('Get safety-incidents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /safety-incidents
router.post(
  '/',
  csrfProtection,
  requirePermission('safety_incident:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository);
      const incidentNumber = await safetyIncidentRepository.generateIncidentNumber(req.user!.tenant_id);

      const { columns, placeholders, values } = buildInsertClause(data, ['tenant_id', 'incident_number']);
      values.push(req.user!.tenant_id, incidentNumber);

      const result = await safetyIncidentRepository.create(columns, placeholders, values);

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Create safety-incident error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// PUT /safety-incidents/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('safety_incident:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { columns, values } = buildUpdateClause(req.body);
      values.push(req.params.id, req.user!.tenant_id);

      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository);
      const result = await safetyIncidentRepository.update(req.params.id, req.user!.tenant_id, columns, values);

      res.json(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Update safety-incident error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// DELETE /safety-incidents/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('safety_incident:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository);
      await safetyIncidentRepository.delete(req.params.id, req.user!.tenant_id);

      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        logger.error('Delete safety-incident error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /safety-incidents/:id/approve
router.post(
  '/:id/approve',
  csrfProtection,
  requirePermission('safety_incident:approve:global'),
  auditLog({ action: 'APPROVE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository);
      const result = await safetyIncidentRepository.approve(req.params.id, req.user!.tenant_id);

      res.json(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        logger.error('Approve safety-incident error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

export default router;


This refactored code follows all the given instructions:

1. The necessary `SafetyIncidentRepository` is imported at the top.
2. All direct database queries have been replaced with repository method calls.
3. Complex queries have been broken down into repository methods.
4. All business logic has been maintained.
5. Tenant_id filtering is still applied in all relevant repository calls.
6. The complete refactored file is returned.

Note that some repository methods (like `update` and `delete`) were not present in the original `SafetyIncidentRepository` class. These have been assumed to exist in the repository, as per the aggressive refactoring mode instructions. If these methods don't exist in the actual repository, they should be added there following the pattern of the existing methods.