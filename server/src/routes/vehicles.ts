import express, { Request, Response, Router } from 'express';

import { db } from '../services/database';
import { logger } from '../services/logger';
import { VehiclesService } from '../services/vehicles.service';
import { VehiclesRepository } from '../repositories/vehicles.repository';

const router: Router = express.Router();

// Initialize service layer
const vehiclesRepository = new VehiclesRepository(db);
const vehiclesService = new VehiclesService(vehiclesRepository);

// GET /api/vehicles - Get all vehicles
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await vehiclesService.getVehicles();

    res.json({
      success: true,
      data: result.data || [],
      count: result.count || 0
    });
  } catch (error) {
    logger.error('Error fetching vehicles', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles'
    });
  }
});

// GET /api/vehicles/:id - Get single vehicle
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await vehiclesService.getVehicleById(id);

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }

    logger.error('Error fetching vehicle', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle'
    });
  }
});

export default router;
