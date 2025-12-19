import { Request, Response, NextFunction } from 'express';

import { container } from '../../../container';
import { TYPES } from '../../../types';
import { VehicleService } from '../services/vehicle.service';

export class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = container.get<VehicleService>(TYPES.VehicleService);
  }

  async getAllVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user?.tenant_id || 1;
      const vehicles = await this.vehicleService.getAllVehicles(tenantId);
      res.json(vehicles);
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user?.tenant_id || 1;
      const vehicle = await this.vehicleService.createVehicle(req.body, tenantId);
      res.status(201).json(vehicle);
    } catch (error) {
      next(error);
    }
  }
}
