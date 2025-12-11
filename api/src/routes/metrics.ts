To refactor the `metrics.ts` file and replace all `pool.query` or `db.query` with repository methods, we need to create a repository for handling database operations. Here's the refactored version of the file, assuming we have a `VehicleRepository` that encapsulates the database operations:


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


In this refactored version, we've made the following changes:

1. Removed the `pool` import and replaced it with an import for `VehicleRepository`.
2. Created an instance of `VehicleRepository` called `vehicleRepository`.
3. Replaced the `pool.query` call with a call to `vehicleRepository.getTotalVehicles()`.
4. Replaced the direct access to `pool.totalCount`, `pool.idleCount`, and `pool.waitingCount` with calls to corresponding methods on the `VehicleRepository`.

To complete this refactoring, you would need to create a `VehicleRepository` class in a separate file (`VehicleRepository.ts` in the `repositories` directory) that looks something like this:


import { pool } from '../db';

export class VehicleRepository {
  async getTotalVehicles(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as total FROM vehicles');
    return parseInt(result.rows[0].total);
  }

  getTotalConnections(): number {
    return pool.totalCount;
  }

  getIdleConnections(): number {
    return pool.idleCount;
  }

  getWaitingConnections(): number {
    return pool.waitingCount;
  }
}


This `VehicleRepository` class encapsulates the database operations and provides methods that can be used in the `metrics.ts` file. The repository pattern helps to separate the data access logic from the rest of the application, making it easier to maintain and test.