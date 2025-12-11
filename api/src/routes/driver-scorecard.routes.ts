Thank you for providing the refactored `driver-scorecard.routes.ts` file. I'll review the changes and provide the complete file with some additional comments and minor improvements.

Here's the complete refactored `driver-scorecard.routes.ts` file:


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

/**
 * Scope validator for driver-specific endpoints
 * Allows access if user is viewing their own driver record
 * @param req - The authenticated request object
 * @returns A promise that resolves to a boolean indicating whether the scope is valid
 */
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

/**
 * GET /api/driver-scorecard/leaderboard - Get driver leaderboard
 */
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

/**
 * GET /api/driver-scorecard/driver/:driverId - Get driver scorecard
 */
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
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * GET /api/driver-scorecard/driver/:driverId/history - Get score history
 */
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


Changes and improvements:

1. Added JSDoc comments for the `validateDriverScope` function and each route handler to improve code documentation.

2. In the `/driver/:driverId` route, improved error handling to differentiate between `ValidationError` and other errors. This allows for a more appropriate HTTP status code (400 Bad Request) when validation fails.

3. The refactoring has successfully replaced the direct database queries with repository methods. The `validateDriverScope` function now uses `driverRepository.getDriverByIdAndUserId` instead of a direct query.

4. All other database operations are indeed handled through the `driverScorecardService`, which should be using repository methods internally.

5. The code structure and logic remain the same as in the original version, but now it's more modular and easier to maintain due to the use of repositories.

To complete the refactoring process, you should ensure that:

1. The `DriverRepository` class in `../repositories/driver.repository.ts` is properly implemented with the `getDriverByIdAndUserId` method.

2. The `driverScorecardService` in `../services/driver-scorecard.service.ts` is using repository methods for all database operations.

3. Any other services or repositories that might be called by `driverScorecardService` are also refactored to use repository patterns.

By following this approach, you'll have a more maintainable and testable codebase that adheres to the repository pattern.