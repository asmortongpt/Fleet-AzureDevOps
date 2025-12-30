import { Router } from 'express';

import { PAGINATION } from '../config/constants';
import logger from '../config/logger';

const router = Router();

router.get('/vehicles', (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || PAGINATION.DEFAULT_PAGE_SIZE;

    if (pageSize > PAGINATION.MAX_PAGE_SIZE) {
      throw new Error('Page size too large');
    }

    // Simulating fetching data
    const vehicles = Array(pageSize).fill({ id: 'vehicle_id', name: 'Vehicle Name' });

    res.json({
      page,
      pageSize,
      total: 1000, // Example total
      vehicles
    });
  } catch (error) {
    logger.error(`Error in pagination route: ${(error as Error).message}`);
    res.status(400).json({ error: 'Invalid request', message: (error as Error).message });
  }
});

export default router;