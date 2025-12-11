To refactor the `driver-scorecard.routes.ts` file to use the repository pattern, we'll need to create and import the necessary repositories. We'll replace all `pool.query` calls with repository methods. Here's the refactored file:


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

// Import the DriverRepository
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

// GET /api/driver-scorecard/driver/:driverId/achievements - Get achievements
router.get(
  '/driver/:driverId/achievements',
  requirePermission('driver:view:own', { validateScope: validateDriverScope }),
  auditLog({ action: 'READ', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driverId } = req.params;

      const achievements = await driverScorecardService.getDriverAchievements(
        driverId,
        req.user!.tenant_id
      );

      res.json(achievements);
    } catch (error) {
      logger.error('Get achievements error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


In this refactored version:

1. We've imported the `DriverRepository` at the top of the file.
2. We've created an instance of the `DriverRepository` called `driverRepository`.
3. In the `validateDriverScope` function, we've replaced the `pool.query` call with a call to the `getDriverByIdAndUserId` method of the `driverRepository`. This method should be implemented in the `DriverRepository` class to fetch the driver data.

Note that the rest of the route handlers remain unchanged because they already use the `driverScorecardService`, which should be refactored separately to use the repository pattern.

To complete the refactoring, you'll need to:

1. Create a `driver.repository.ts` file with the `DriverRepository` class and implement the `getDriverByIdAndUserId` method.
2. Refactor the `driver-scorecard.service.ts` file to use the `DriverRepository` instead of direct database queries.

Here's an example of what the `driver.repository.ts` file might look like:


import { PoolClient } from 'pg';

export class DriverRepository {
  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  async getDriverByIdAndUserId(driverId: string, userId: string): Promise<any | null> {
    const result = await this.client.query(
      'SELECT id FROM drivers WHERE id = $1 AND user_id = $2',
      [driverId, userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Add other necessary methods here
}


Remember to update the dependency injection or instantiation of the `DriverRepository` in your application to provide it with a `PoolClient` instance.