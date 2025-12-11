To refactor the given code to use the repository pattern, we'll need to create and import the necessary repositories and replace all `pool.query` calls with repository methods. Here's the refactored version of the `driver-scorecard.routes.enhanced.ts` file:


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
      const history = await driverScorecardService.getDriverScoreHistory(
        driverId,
        req.user!.tenant_id
      );

      res.json(history);
    } catch (error) {
      console.error('Get driver score history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


In this refactored version:

1. We've imported the `DriverRepository` at the top of the file.

2. We've initialized the `driverRepository` using the `DriverRepository` class.

3. We've replaced the `pool.query` call in the `validateDriverScope` function with a call to the `getDriverByIdAndUserId` method of the `driverRepository`. This method should be implemented in the `DriverRepository` class to fetch a driver by ID and user ID.

4. All other parts of the code, including the route handlers, remain unchanged as they were already using the `driverScorecardService`.

5. We've added the `export default router;` statement at the end of the file to make it consistent with common TypeScript/Express practices.

Note that this refactoring assumes the existence of a `DriverRepository` class with a `getDriverByIdAndUserId` method. You'll need to create this repository class and implement the necessary database operations within it. The `DriverRepository` class should encapsulate the database logic that was previously handled by direct `pool.query` calls.