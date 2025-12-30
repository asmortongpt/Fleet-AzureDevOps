import express from 'express';

import { apiResponseMiddleware } from '../middleware/apiResponseMiddleware';
import { ApiResponse } from '../utils/apiResponse';

// Mock function for fetching vehicles - replace with actual implementation
const getVehicles = async (): Promise<any[]> => {
  return []; // Replace with actual data fetching logic
};

const router = express.Router();

// Apply the API response middleware
router.use(apiResponseMiddleware);

// Example route
router.get('/vehicles', async (_req: express.Request, res: express.Response) => {
  try {
    const vehicles = await getVehicles();
    return ApiResponse.success(res, vehicles, 'Vehicles retrieved successfully');
  } catch (error: unknown) {
    return ApiResponse.failure?.(res, 'Failed to retrieve vehicles') ?? res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve vehicles',
    });
  }
});

export default router;