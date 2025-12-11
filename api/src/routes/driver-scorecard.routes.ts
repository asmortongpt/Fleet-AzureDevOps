Here's the complete refactored `driver-scorecard.routes.ts` file, replacing all `pool.query`/`db.query` calls with repository methods:


import express, { Response } from 'express';
import logger from '../config/logger';
import { ValidationError } from '../errors/app-error';
import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import driverScorecardService from '../services/driver-scorecard.service';
import { DriverRepository } from '../repositories/driver.repository';

const router = express.Router();
router.use(authenticateJWT);

// Initialize the DriverRepository
const driverRepository = new DriverRepository();

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
    logger.error('Driver scope validation error:', error);
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
      const { periodStart, periodEnd, limit = '50' } = req.query;

      const leaderboard = await driverScorecardService.getLeaderboard(
        req.user!.tenant_id,
        periodStart ? new Date(periodStart as string) : undefined,
        periodEnd ? new Date(periodEnd as string) : undefined,
        parseInt(limit as string)
      );

      res.json(leaderboard);
    } catch (error) {
      logger.error('Get leaderboard error:', error);
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
      const { periodStart, periodEnd } = req.query;

      // Calculate score if not exists
      if (periodStart && periodEnd) {
        const score = await driverScorecardService.calculateDriverScore(
          driverId,
          req.user!.tenant_id,
          new Date(periodStart as string),
          new Date(periodEnd as string)
        );

        res.json(score);
      } else {
        throw new ValidationError("periodStart and periodEnd are required");
      }
    } catch (error) {
      logger.error('Get driver scorecard error:', error);
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
      const { months = '6' } = req.query;

      const history = await driverScorecardService.getDriverScoreHistory(
        driverId,
        req.user!.tenant_id,
        parseInt(months as string)
      );

      res.json(history);
    } catch (error) {
      logger.error('Get score history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


In this refactored version:

1. We've imported the `DriverRepository` from the `../repositories/driver.repository` file.
2. We've initialized the `driverRepository` as a new instance of `DriverRepository`.
3. The `validateDriverScope` function now uses the `driverRepository.getDriverByIdAndUserId` method instead of a direct database query.
4. All other database operations are handled through the `driverScorecardService`, which should be using repository methods internally.

Note that this refactoring assumes that the `DriverRepository` and `driverScorecardService` have been properly implemented to handle the necessary database operations. You may need to review and update these files to ensure they correctly implement the required functionality using repository methods.