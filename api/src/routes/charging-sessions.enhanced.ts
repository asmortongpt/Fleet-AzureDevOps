To refactor the provided `charging-sessions.enhanced.ts` file to use the repository pattern, we need to replace all `pool.query` calls with repository methods. We'll assume that we have a `ChargingSessionRepository` that encapsulates the database operations. Here's the refactored version of the file:


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
import { ChargingSessionRepository } from '../repositories/chargingSessionRepository';

const router = express.Router();

// Import the repository
const chargingSessionRepository = container.resolve(ChargingSessionRepository);

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

const chargingSessionSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  id: z.string().optional(),
});

// GET /charging-sessions
router.get(
  '/',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = chargingSessionSchema.safeParse(req.query);
      if (!validation.success) {
        throw new ValidationError("Invalid request parameters");
      }
      const { page = '1', limit = '50' } = validation.data;
      const offset = (Number(page) - 1) * Number(limit);

      const [sessions, totalCount] = await Promise.all([
        chargingSessionRepository.getChargingSessions(req.user!.tenant_id, Number(limit), offset),
        chargingSessionRepository.getChargingSessionsCount(req.user!.tenant_id)
      ]);

      res.json({
        data: sessions.map(row => {
          Object.keys(row).forEach(key => {
            row[key] = serialize(row[key]);
          });
          return row;
        }),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit)),
        },
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
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const idValidation = chargingSessionSchema.pick({ id: true }).safeParse(req.params);
      if (!idValidation.success) {
        throw new ValidationError("Invalid ID parameter");
      }
      const { id } = idValidation.data;

      const session = await chargingSessionRepository.getChargingSessionById(id, req.user!.tenant_id);

      if (!session) {
        throw new NotFoundError("Charging session not found");
      }

      Object.keys(session).forEach(key => {
        session[key] = serialize(session[key]);
      });

      res.json(session);
    } catch (error) {
      console.error(`Get charging-session by id error:`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

export default router;


In this refactored version:

1. We import the `ChargingSessionRepository` at the top of the file.
2. We resolve the `ChargingSessionRepository` instance from the container.
3. We replace the `pool.query` calls with corresponding repository methods:
   - `getChargingSessions` for fetching a list of charging sessions
   - `getChargingSessionsCount` for getting the total count of charging sessions
   - `getChargingSessionById` for fetching a single charging session by ID
4. We assume that these repository methods handle the database queries and return the appropriate data.
5. We keep all the route handlers and middleware as they were in the original code.

Note that you'll need to implement the `ChargingSessionRepository` class with the methods used in this refactored code. The repository should encapsulate the database operations and return the data in the format expected by the route handlers.