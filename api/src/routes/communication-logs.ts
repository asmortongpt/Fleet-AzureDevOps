To refactor the `communication-logs.ts` file to use the repository pattern, we'll need to create a `CommunicationLogRepository` and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


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

export default router;


In this refactored version:

1. We've imported the `CommunicationLogRepository` at the top of the file.

2. We've created an instance of the `CommunicationLogRepository` called `communicationLogRepository`.

3. All `pool.query` calls have been replaced with corresponding methods from the `CommunicationLogRepository`:

   - `getCommunicationLogs` and `getCommunicationLogCount` for the GET / route
   - `getCommunicationLogById` for the GET /:id route
   - `createCommunicationLog` for the POST / route
   - `updateCommunicationLog` for the PUT /:id route

4. The route handlers have been kept intact, with only the database operations being refactored to use the repository methods.

5. Error handling and logging remain the same as in the original code.

Note that this refactoring assumes the existence of a `CommunicationLogRepository` class with the necessary methods. You would need to create this class in a separate file (e.g., `communication-log-repository.ts`) in the `repositories` directory. The `CommunicationLogRepository` class should implement the methods used in this refactored code, encapsulating the database operations.