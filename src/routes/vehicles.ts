import express from 'express';

import { cacheMiddleware } from '../middleware/cacheMiddleware';
import { CacheService } from '../utils/cache';

const router = express.Router();
const cacheService = new CacheService(process.env.REDIS_URL || 'redis://localhost:6379');

cacheService.connect();

router.get('/vehicles', cacheMiddleware(cacheService), async (req, res) => {
  // Fetch data from database
  const vehicles = await fetchVehiclesFromDatabase();
  res.json(vehicles);
});

async function fetchVehiclesFromDatabase() {
  // Simulate database fetch
  return [{ id: 1, name: 'Vehicle 1' }, { id: 2, name: 'Vehicle 2' }];
}

export default router;