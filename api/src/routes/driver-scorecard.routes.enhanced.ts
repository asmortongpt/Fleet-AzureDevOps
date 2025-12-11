import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import driverScorecardService from '../services/driver-scorecard.service';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf';

// Import repositories
import { DriverRepository } from '../repositories/driver.repository';
import { ScorecardRepository } from '../repositories/scorecard.repository';

const router = express.Router();
router.use(authenticateJWT);
router.use(express.json());

const leaderboardQuerySchema = z.object({
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  limit: z.string().optional().default('50'),
});

const scorecardQuerySchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
});

// Initialize the repositories
const driverRepository = new DriverRepository();
const scorecardRepository = new ScorecardRepository();

// Scope validator for driver-specific endpoints
// Allows access if user is viewing their own driver record
async function validateDriverScope(req: AuthRequest): Promise<boolean> {
  const driverId = req.params.driverId;
  const userId = req.user!.id;

  try {
    // Check if the requested driverId belongs to the authenticated user
    const driver = await driverRepository.getDriverByIdAndUserId(driverId, userId);
    return driver !== null;
  } catch (error) {
    console.error('Driver scope validation error:', error);
    return false;
  }
}

// GET /api/driver-scorecard/leaderboard - Get driver leaderboard
router.get(
  '/leaderboard',
  requirePermission('driver:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const queryResult = leaderboardQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res
          .status(400)
          .json({ error: 'Invalid query parameters', details: queryResult.error });
      }
      const { periodStart, periodEnd, limit } = queryResult.data;

      const leaderboard = await driverScorecardService.getLeaderboard(
        req.user!.tenant_id,
        periodStart ? new Date(periodStart) : undefined,
        periodEnd ? new Date(periodEnd) : undefined,
        parseInt(limit)
      );

      res.json(leaderboard);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/driver-scorecard/driver/:driverId - Get driver scorecard
router.get(
  '/driver/:driverId',
  requirePermission('driver:view:own', { validateScope: validateDriverScope }),
  auditLog({ action: 'READ', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driverId } = req.params;
      const queryResult = scorecardQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res
          .status(400)
          .json({ error: 'Invalid query parameters', details: queryResult.error });
      }
      const { periodStart, periodEnd } = queryResult.data;

      const score = await driverScorecardService.calculateDriverScore(
        driverId,
        req.user!.tenant_id,
        new Date(periodStart),
        new Date(periodEnd)
      );

      res.json(score);
    } catch (error) {
      console.error('Get driver scorecard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/driver-scorecard/driver/:driverId/history - Get score history
router.get(
  '/driver/:driverId/history',
  requirePermission('driver:view:own', { validateScope: validateDriverScope }),
  auditLog({ action: 'READ', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driverId } = req.params;

      const history = await scorecardRepository.getScoreHistory(driverId, req.user!.tenant_id);

      res.json(history);
    } catch (error) {
      console.error('Get score history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/driver-scorecard/driver/:driverId/score - Add a new score
router.post(
  '/driver/:driverId/score',
  requirePermission('driver:edit:own', { validateScope: validateDriverScope }),
  csrfProtection,
  auditLog({ action: 'CREATE', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driverId } = req.params;
      const { score, date } = req.body;

      const newScore = await scorecardRepository.addScore(driverId, req.user!.tenant_id, score, new Date(date));

      res.status(201).json(newScore);
    } catch (error) {
      console.error('Add new score error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;