import { Request, Response } from 'express';

import logger from '../config/logger';
import { container } from '../container';
import { VehicleService } from '../modules/fleet/services/vehicle.service';
import { TYPES } from '../types';

const vehicleService = container.get<VehicleService>(TYPES.VehicleService);

// Wrap all endpoint handlers in try-catch
export async function getVehicleStatus(req: Request, res: Response): Promise<void> {
  try {
    const { vehicleId } = req.params;
    const status = await vehicleService.getStatus(vehicleId, req.user?.tenant_id);
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Error fetching vehicle status', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      vehicleId: req.params.vehicleId,
      tenantId: req.user?.tenant_id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle status',
      requestId: req.id
    });
  }
}
