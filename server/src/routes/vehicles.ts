import express, { Request, Response, Router } from 'express';

import { db } from '../services/database';
import { logger } from '../services/logger';

const router: Router = express.Router();

// GET /api/vehicles - Get all vehicles
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT
        v.id, v.vehicle_number, v.make, v.model, v.year,
        v.vin, v.license_plate, v.status, v.mileage,
        v.fuel_type, v.last_service_date, v.next_service_date,
        v.assigned_driver_id, v.facility_id,
        d.name as driver_name,
        f.name as facility_name
      FROM vehicles v
      LEFT JOIN drivers d ON v.assigned_driver_id = d.id
      LEFT JOIN facilities f ON v.facility_id = f.id
      ORDER BY v.vehicle_number`
    );

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
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
    const result = await db.query(
      `SELECT
        v.*,
        d.name as driver_name,
        f.name as facility_name
      FROM vehicles v
      LEFT JOIN drivers d ON v.assigned_driver_id = d.id
      LEFT JOIN facilities f ON v.facility_id = f.id
      WHERE v.id = $1`,
      [id]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching vehicle', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle'
    });
  }
});

export default router;
