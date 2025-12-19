import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import driverScorecardService from '../services/driver-scorecard.service';
import pool from '../config/database';
import { z } from 'zod';

const router = express.Router();
router.use(authenticateJWT);
router.use(express.json());

const leaderboardQuerySchema = z.object({
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  limit: z.string().optional().default('50')
});

const scorecardQuerySchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string()
});

// Scope validator for driver-specific endpoints
// Allows access if user is viewing their own driver record
async function validateDriverScope(req: AuthRequest): Promise<boolean> {
  const driverId = req.params.driverId;
  const userId = req.user!.id;

  try {
    // Check if the requested driverId belongs to the authenticated user
    const result = await pool.query(
      'SELECT id FROM drivers WHERE id = $1 AND user_id = $2',
      [driverId, userId]
    );

    return result.rows.length > 0;
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
        return res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error });
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
        return res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error });
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
      const history = await driverScorecardService.getDriverScoreHistory(driverId, req.user!.tenant_id);

      res.json(history);
    } catch (error) {
      console.error('Get driver score history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;