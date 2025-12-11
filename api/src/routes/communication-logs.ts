Here's the complete refactored version of the `communication-logs.ts` file, replacing all `pool.query` calls with repository methods:


import express, { Response } from 'express';

import logger from '../config/logger'; // Wave 16: Add Winston logger
import { NotFoundError } from '../errors/app-error';
import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';

// Import the CommunicationLogRepository
import { CommunicationLogRepository } from '../repositories/communication-log-repository';

const router = express.Router();
router.use(authenticateJWT);

// Create an instance of the CommunicationLogRepository
const communicationLogRepository = new CommunicationLogRepository();

// GET /communication-logs
router.get(
  '/',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [logs, totalCount] = await Promise.all([
        communicationLogRepository.getCommunicationLogs(req.user!.tenant_id, Number(limit), offset),
        communicationLogRepository.getCommunicationLogCount(req.user!.tenant_id)
      ]);

      res.json({
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      logger.error(`Get communication-logs error:`, error); // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /communication-logs/:id
router.get(
  '/:id',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const log = await communicationLogRepository.getCommunicationLogById(req.params.id, req.user!.tenant_id);

      if (!log) {
        return res.status(404).json({ error: `CommunicationLogs not found` });
      }

      res.json(log);
    } catch (error) {
      logger.error('Get communication-logs error:', error); // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /communication-logs (system-generated only)
router.post(
  '/',
  csrfProtection,
  requirePermission('communication:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        [`tenant_id`],
        1
      );

      const newLog = await communicationLogRepository.createCommunicationLog(
        req.user!.tenant_id,
        columnNames,
        placeholders,
        values
      );

      res.status(201).json(newLog);
    } catch (error) {
      logger.error(`Create communication-logs error:`, error); // Wave 16: Winston logger
      res.status(500).json({ error: `Internal server error` });
    }
  }
);

// PUT /communication-logs/:id (system-generated only)
router.put(
  `/:id`,
  csrfProtection,
  requirePermission('communication:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;
      const { fields, values } = buildUpdateClause(data, 3);

      const updatedLog = await communicationLogRepository.updateCommunicationLog(
        req.params.id,
        req.user!.tenant_id,
        fields,
        values
      );

      if (!updatedLog) {
        return res.status(404).json({ error: `CommunicationLogs not found` });
      }

      res.json(updatedLog);
    } catch (error) {
      logger.error(`Update communication-logs error:`, error); // Wave 16: Winston logger
      res.status(500).json({ error: `Internal server error` });
    }
  }
);

// DELETE /communication-logs/:id (system-generated only)
router.delete(
  `/:id`,
  csrfProtection,
  requirePermission('communication:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await communicationLogRepository.deleteCommunicationLog(
        req.params.id,
        req.user!.tenant_id
      );

      if (!deleted) {
        return res.status(404).json({ error: `CommunicationLogs not found` });
      }

      res.status(204).send();
    } catch (error) {
      logger.error(`Delete communication-logs error:`, error); // Wave 16: Winston logger
      res.status(500).json({ error: `Internal server error` });
    }
  }
);

export default router;


This refactored version of `communication-logs.ts` replaces all `pool.query` calls with corresponding methods from the `CommunicationLogRepository`. The repository methods used are:

1. `getCommunicationLogs`
2. `getCommunicationLogCount`
3. `getCommunicationLogById`
4. `createCommunicationLog`
5. `updateCommunicationLog`
6. `deleteCommunicationLog`

These methods should be implemented in the `CommunicationLogRepository` class, which would encapsulate the database operations and provide a cleaner interface for the route handlers.

Note that this refactoring assumes the existence of a `CommunicationLogRepository` class in the `../repositories/communication-log-repository` file. You would need to create this file and implement the necessary methods to complete the refactoring process.