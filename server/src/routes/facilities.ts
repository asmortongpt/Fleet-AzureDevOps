import express, { Request, Response, Router } from 'express';
import { db } from '../../../api/src/db';
import { facilities } from '../../../api/src/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger';

const router: Router = express.Router();

// GET /api/facilities - Get all facilities
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Drizzle query - select all facilities ordered by name
    const result = await db
      .select()
      .from(facilities)
      .orderBy(facilities.name);

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
    const facilityId = parseInt(id, 10);

    if (isNaN(facilityId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid facility ID'
      });
      return;
    }

    // Drizzle query - select single facility by ID
    const result = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, facilityId))
      .limit(1);

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
