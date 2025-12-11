with repository methods, improving the separation of concerns and making the code more maintainable. Here's the complete refactored file:


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


This refactored version of `charging-sessions.ts` replaces all database queries with repository methods, improving the separation of concerns and making the code more maintainable. The repository methods are assumed to be implemented in the `ChargingSessionRepository` class, which should handle the actual database interactions.