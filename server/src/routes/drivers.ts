import express, { Request, Response, Router } from 'express';

import { db } from '../services/database';
import { logger } from '../services/logger';

const router: Router = express.Router();

// GET /api/drivers - Get all drivers
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT
        d.id, d.employee_id, d.name, d.email, d.phone,
        d.license_number, d.license_expiry, d.status,
        d.assigned_vehicle_id,
        v.vehicle_number
      FROM drivers d
      LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
      ORDER BY d.name`
    );

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching drivers', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers'
    });
  }
});

// GET /api/drivers/:id - Get single driver
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT
        d.*,
        v.vehicle_number
      FROM drivers d
      LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
      WHERE d.id = $1`,
      [id]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching driver', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver'
    });
  }
});

export default router;
