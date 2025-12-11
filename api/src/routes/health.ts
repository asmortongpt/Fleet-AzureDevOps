To refactor the `health.ts` file and replace all `pool.query` calls with repository methods, we need to create a repository class that encapsulates the database operations. Here's the refactored version of the file, including the new repository class:


import { Router, Request, Response } from 'express'

import { cacheService } from '../config/cache'
import { HealthRepository } from './health.repository'

const router = Router()
const healthRepository = new HealthRepository()

router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      cache: 'unknown',
      memory: 'unknown',
    },
  }

  try {
    await healthRepository.checkDatabaseConnection()
    health.checks.database = 'healthy'
  } catch (err) {
    health.checks.database = 'unhealthy'
    health.status = 'degraded'
  }

  try {
    await cacheService.get('health-check')
    health.checks.cache = 'healthy'
  } catch (err) {
    health.checks.cache = 'unhealthy'
  }

  const used = process.memoryUsage()
  health.checks.memory = used.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning'

  res.status(health.status === 'healthy' ? 200 : 503).json(health)
})

router.get('/ready', async (req: Request, res: Response) => {
  try {
    await healthRepository.checkDatabaseConnection()
    res.status(200).json({ ready: true })
  } catch (err) {
    res.status(503).json({ ready: false })
  }
})

export default router


Now, let's create the `health.repository.ts` file to define the `HealthRepository` class:


import { pool } from '../db'

export class HealthRepository {
  /**
   * Checks the database connection by executing a simple query.
   * @throws Error if the database connection fails
   */
  async checkDatabaseConnection(): Promise<void> {
    try {
      await pool.query('SELECT 1')
    } catch (error) {
      throw new Error('Database connection check failed')
    }
  }
}


This refactoring achieves the following:

1. We've created a new `HealthRepository` class in a separate file (`health.repository.ts`).
2. The `HealthRepository` class contains a single method `checkDatabaseConnection()` that encapsulates the database query logic.
3. In the `health.ts` file, we've replaced all `pool.query('SELECT 1')` calls with `healthRepository.checkDatabaseConnection()`.
4. We've instantiated the `HealthRepository` at the top of the `health.ts` file and use it throughout the router.

This approach provides several benefits:

- It separates the database logic from the route handlers, improving code organization.
- It makes the code more testable, as we can now mock the repository in unit tests.
- It allows for easier maintenance and potential future expansion of database-related operations.

To use this refactored version, make sure to create the `health.repository.ts` file in the same directory as `health.ts` and import it as shown in the refactored `health.ts` file.