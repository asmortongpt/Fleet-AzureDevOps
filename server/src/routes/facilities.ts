import express, { Request, Response, Router } from 'express';

import { db } from '../services/database';
import { logger } from '../services/logger';

const router: Router = express.Router();

// GET /api/facilities - Get all facilities
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT * FROM facilities ORDER BY name`
    );

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching facilities', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch facilities'
    });
  }
});

// GET /api/facilities/:id - Get single facility
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM facilities WHERE id = $1`,
      [id]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Facility not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching facility', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch facility'
    });
  }
});

export default router;
