import { Request, Response, NextFunction, Router } from 'express';
import { VehicleService } from '../services/vehicle.service';

export class VehicleController {
  private vehicleService: VehicleService;
  public router: Router;

  constructor(vehicleService: VehicleService) {
    this.vehicleService = vehicleService;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', this.create.bind(this));
    this.router.get('/', this.getAll.bind(this));
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || (req as any).tenantId || '1';
      const vehicle = await this.vehicleService.createVehicle(req.body, tenantId);
      res.status(201).json({ data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || (req as any).tenantId || '1';
      const vehicles = await this.vehicleService.getAllVehicles(tenantId);
      res.status(200).json({ data: vehicles });
    } catch (error) {
      next(error);
    }
  }
}
