Here's the complete refactored `metrics.ts` file along with the new `VehicleRepository.ts` file:

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


This refactoring replaces all direct database queries and pool property accesses with calls to the `VehicleRepository` methods. The `VehicleRepository` class encapsulates the database operations, making the code more modular and easier to maintain.

Note that you'll need to ensure that the `pool` import in `VehicleRepository.ts` is correct and points to your database connection pool. If you're using a different method for database connections, you may need to adjust the `VehicleRepository` implementation accordingly.