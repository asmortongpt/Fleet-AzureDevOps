Thank you for providing the refactored code. I'll review it and make any necessary adjustments or improvements. Here's the complete refactored `metrics.ts` file along with the new `VehicleRepository.ts` file:

**metrics.ts:**


import { Router, Request, Response } from 'express';
import { VehicleRepository } from '../repositories/VehicleRepository';

const router = Router();
let requestCount = 0;
const errorCount = 0;

// Initialize the VehicleRepository
const vehicleRepository = new VehicleRepository();

router.use((req, res, next) => {
  requestCount++;
  next();
});

router.get('/metrics', async (req: Request, res: Response) => {
  // Use the repository method to get the total number of vehicles
  const totalVehicles = await vehicleRepository.getTotalVehicles();

  const metrics = {
    requests: {
      total: requestCount,
      errors: errorCount,
    },
    database: {
      vehicles: totalVehicles,
      connections: {
        total: vehicleRepository.getTotalConnections(),
        idle: vehicleRepository.getIdleConnections(),
        waiting: vehicleRepository.getWaitingConnections(),
      },
    },
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  };

  res.json(metrics);
});

export { requestCount, errorCount };
export default router;


**VehicleRepository.ts (in the repositories directory):**


import { pool } from '../db';

export class VehicleRepository {
  /**
   * Get the total number of vehicles in the database
   * @returns {Promise<number>} The total number of vehicles
   */
  async getTotalVehicles(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as total FROM vehicles');
    return parseInt(result.rows[0].total);
  }

  /**
   * Get the total number of database connections
   * @returns {number} The total number of connections
   */
  getTotalConnections(): number {
    return pool.totalCount;
  }

  /**
   * Get the number of idle database connections
   * @returns {number} The number of idle connections
   */
  getIdleConnections(): number {
    return pool.idleCount;
  }

  /**
   * Get the number of waiting database connections
   * @returns {number} The number of waiting connections
   */
  getWaitingConnections(): number {
    return pool.waitingCount;
  }
}


This refactoring successfully replaces all direct database queries and pool property accesses with calls to the `VehicleRepository` methods. The `VehicleRepository` class encapsulates the database operations, making the code more modular and easier to maintain.

A few notes on the refactoring:

1. The `metrics.ts` file now imports and uses the `VehicleRepository` class instead of directly accessing the database pool.

2. The `VehicleRepository` class is created in a separate file, following the Repository pattern. This allows for better organization and easier testing of database operations.

3. All database-related operations in `metrics.ts` are now handled through the `vehicleRepository` instance, improving separation of concerns.

4. The `VehicleRepository` class methods directly correspond to the database operations previously performed in `metrics.ts`, ensuring that all functionality is preserved.

5. The `pool` import in `VehicleRepository.ts` assumes that there's a `db.ts` file in the parent directory that exports the `pool` object. Make sure this is set up correctly in your project.

This refactored version should work as expected, providing the same functionality as before but with improved code structure and maintainability.