Thank you for providing the refactored version of the `charging-sessions.enhanced.ts` file. I'll review the changes and provide the complete file with some additional improvements and comments.

Here's the complete refactored version of the `charging-sessions.enhanced.ts` file, replacing all `pool.query` calls with repository methods:


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

// Import and resolve the ChargingSessionRepository
const chargingSessionRepository = container.resolve(ChargingSessionRepository);

// Apply middleware
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

// Define schema for query parameters
const chargingSessionSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  id: z.string().optional(),
});

/**
 * GET /charging-sessions
 * Retrieve a list of charging sessions with pagination
 */
router.get(
  '/',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate query parameters
      const validation = chargingSessionSchema.safeParse(req.query);
      if (!validation.success) {
        throw new ValidationError("Invalid request parameters");
      }

      // Extract and process pagination parameters
      const { page = '1', limit = '50' } = validation.data;
      const offset = (Number(page) - 1) * Number(limit);

      // Fetch charging sessions and total count concurrently
      const [sessions, totalCount] = await Promise.all([
        chargingSessionRepository.getChargingSessions(req.user!.tenant_id, Number(limit), offset),
        chargingSessionRepository.getChargingSessionsCount(req.user!.tenant_id)
      ]);

      // Serialize session data and prepare response
      const serializedSessions = sessions.map(row => {
        Object.keys(row).forEach(key => {
          row[key] = serialize(row[key]);
        });
        return row;
      });

      res.json({
        data: serializedSessions,
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

/**
 * GET /charging-sessions/:id
 * Retrieve a specific charging session by ID
 */
router.get(
  '/:id',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate ID parameter
      const idValidation = chargingSessionSchema.pick({ id: true }).safeParse(req.params);
      if (!idValidation.success) {
        throw new ValidationError("Invalid ID parameter");
      }
      const { id } = idValidation.data;

      // Fetch charging session by ID
      const session = await chargingSessionRepository.getChargingSessionById(id, req.user!.tenant_id);

      if (!session) {
        throw new NotFoundError("Charging session not found");
      }

      // Serialize session data
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
2. We resolve the `ChargingSessionRepository` instance from the dependency injection container.
3. We replace all database query calls with corresponding repository methods:
   - `pool.query` for fetching charging sessions is replaced with `chargingSessionRepository.getChargingSessions`.
   - `pool.query` for counting charging sessions is replaced with `chargingSessionRepository.getChargingSessionsCount`.
   - `pool.query` for fetching a single charging session by ID is replaced with `chargingSessionRepository.getChargingSessionById`.

4. We've added comments to explain the purpose of each route and important sections of the code.

5. We've extracted the serialization of session data into a separate step for better readability.

6. We've added a comment to explain the purpose of the middleware application.

This refactoring encapsulates the database operations within the `ChargingSessionRepository`, improving the separation of concerns and making the code more maintainable and testable. The use of repository methods also allows for easier unit testing and potential future changes in the data access layer without affecting the route handlers.