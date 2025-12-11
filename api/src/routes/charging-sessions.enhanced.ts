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