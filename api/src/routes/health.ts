Here's the complete refactored `health.ts` file with the `HealthRepository` class included:


import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { cacheService } from '../config/cache';

const router = Router();

// HealthRepository class
class HealthRepository {
  /**
   * Checks the database connection by executing a simple query.
   * @throws Error if the database connection fails
   */
  async checkDatabaseConnection(): Promise<void> {
    try {
      await pool.query('SELECT 1');
    } catch (error) {
      throw new Error('Database connection check failed');
    }
  }
}

const healthRepository = new HealthRepository();

router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      cache: 'unknown',
      memory: 'unknown',
    },
  };

  try {
    await healthRepository.checkDatabaseConnection();
    health.checks.database = 'healthy';
  } catch (err) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    await cacheService.get('health-check');
    health.checks.cache = 'healthy';
  } catch (err) {
    health.checks.cache = 'unhealthy';
  }

  const used = process.memoryUsage();
  health.checks.memory = used.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning';

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    await healthRepository.checkDatabaseConnection();
    res.status(200).json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false });
  }
});

export default router;


This refactored version includes the `HealthRepository` class directly in the `health.ts` file, as requested. The `HealthRepository` class encapsulates the database query logic, and all instances of `pool.query('SELECT 1')` have been replaced with calls to `healthRepository.checkDatabaseConnection()`.

The benefits of this refactoring include:

1. Separation of database logic from route handlers, improving code organization.
2. Improved testability, as the repository can be mocked in unit tests.
3. Easier maintenance and potential for future expansion of database-related operations.

Note that in a larger application, it would be preferable to keep the `HealthRepository` in a separate file (`health.repository.ts`) for better organization and reusability. However, this complete file includes everything as requested.