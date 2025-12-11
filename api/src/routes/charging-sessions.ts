To refactor the `charging-sessions.ts` file to use the repository pattern, we'll need to create a `ChargingSessionRepository` and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { chargingSessionSchema } from '../schemas/comprehensive.schema';
import { uuidParamSchema, paginationSchema } from '../schemas/common.schema';
import { ChargingSessionRepository } from '../repositories/charging-session.repository';

const router = express.Router();
router.use(authenticateJWT);

// Initialize the repository
const chargingSessionRepository = container.resolve(ChargingSessionRepository);

// GET /charging-sessions
router.get(
  '/',
  requirePermission('charging_session:view:fleet'),
  validateQuery(paginationSchema),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [sessions, totalCount] = await Promise.all([
        chargingSessionRepository.findAllByTenantId(req.user!.tenant_id, Number(limit), offset),
        chargingSessionRepository.countByTenantId(req.user!.tenant_id)
      ]);

      res.json({
        data: sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error(`Get charging-sessions error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /charging-sessions/:id
router.get(
  '/:id',
  requirePermission('charging_session:view:fleet'),
  validateParams(uuidParamSchema),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const session = await chargingSessionRepository.findByIdAndTenantId(req.params.id, req.user!.tenant_id);

      if (!session) {
        return res.status(404).json({ error: `Charging session not found` });
      }

      res.json(session);
    } catch (error) {
      console.error('Get charging-sessions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /charging-sessions
router.post(
  '/',
  csrfProtection,
  requirePermission('charging_session:create:own'),
  validateBody(chargingSessionSchema),
  auditLog({ action: 'CREATE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const newSession = await chargingSessionRepository.create({
        ...req.body,
        tenant_id: req.user!.tenant_id
      });

      res.status(201).json(newSession);
    } catch (error) {
      console.error('Create charging-session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /charging-sessions/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('charging_session:update:own'),
  validateParams(uuidParamSchema),
  validateBody(chargingSessionSchema.partial()),
  auditLog({ action: 'UPDATE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const updatedSession = await chargingSessionRepository.updateByIdAndTenantId(
        req.params.id,
        req.user!.tenant_id,
        req.body
      );

      if (!updatedSession) {
        return res.status(404).json({ error: 'Charging session not found' });
      }

      res.json(updatedSession);
    } catch (error) {
      console.error('Update charging-session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /charging-sessions/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('charging_session:delete:own'),
  validateParams(uuidParamSchema),
  auditLog({ action: 'DELETE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await chargingSessionRepository.deleteByIdAndTenantId(req.params.id, req.user!.tenant_id);

      if (!deleted) {
        return res.status(404).json({ error: 'Charging session not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete charging-session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


In this refactored version:

1. We've imported the `ChargingSessionRepository` at the top of the file.

2. We've initialized the repository using the dependency injection container.

3. All `pool.query` calls have been replaced with corresponding repository methods:
   - `findAllByTenantId` for fetching all sessions
   - `countByTenantId` for counting sessions
   - `findByIdAndTenantId` for fetching a single session
   - `create` for creating a new session
   - `updateByIdAndTenantId` for updating a session
   - `deleteByIdAndTenantId` for deleting a session

4. The repository methods are assumed to handle the tenant_id filtering, so we no longer need to include it in the query conditions.

5. We've kept all the route handlers as requested, but replaced the database operations with repository calls.

6. Error handling and logging remain the same.

Note that you'll need to create the `ChargingSessionRepository` class in a separate file (`../repositories/charging-session.repository.ts`) and implement the necessary methods. The repository should encapsulate the database operations and return the results in the format expected by the route handlers.

Also, make sure to update the dependency injection container to include the `ChargingSessionRepository` class.