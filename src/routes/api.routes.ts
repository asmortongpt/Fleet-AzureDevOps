import express from 'express';

import { apiResponseMiddleware } from '../middleware/apiResponseMiddleware';
import { ApiResponse } from '../utils/apiResponse';

const router = express.Router();

// Apply the API response middleware
router.use(apiResponseMiddleware);

// Example route
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await getVehicles(); // Assume this function fetches vehicles
    return ApiResponse.success(res, vehicles, 'Vehicles retrieved successfully');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to retrieve vehicles');
  }
});

export default router;