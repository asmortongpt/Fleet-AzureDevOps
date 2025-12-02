server/src/controllers/vehicle.controller.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { controller, httpPost, httpGet, request, response, next } from 'inversify-express-utils';
import { VehicleService } from '../services/vehicle.service';
import { validateBody } from '../middleware/validation.middleware';
import { createVehicleSchema } from '../validation/vehicle.validation';
import { inject } from 'inversify';
import { TYPES } from '../types';

@controller('/api/vehicles')
export class VehicleController {
  constructor(@inject(TYPES.VehicleService) private vehicleService: VehicleService) {}

  @httpPost('/')
  @validateBody(createVehicleSchema)
  async create(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
    try {
      const vehicle = await this.vehicleService.createVehicle(req.body, req.user.tenantId);
      res.status(201).json({ data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  @httpGet('/')
  async getAll(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
    try {
      const vehicles = await this.vehicleService.getAllVehicles(req.user.tenantId);
      res.status(200).json({ data: vehicles });
    } catch (error) {
      next(error);
    }
  }
}
```

server/src/controllers/driver.controller.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { controller, httpPost, httpGet, request, response, next } from 'inversify-express-utils';
import { DriverService } from '../services/driver.service';
import { validateBody } from '../middleware/validation.middleware';
import { createDriverSchema } from '../validation/driver.validation';
import { inject } from 'inversify';
import { TYPES } from '../types';

@controller('/api/drivers')
export class DriverController {
  constructor(@inject(TYPES.DriverService) private driverService: DriverService) {}

  @httpPost('/')
  @validateBody(createDriverSchema)
  async create(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
    try {
      const driver = await this.driverService.createDriver(req.body, req.user.tenantId);
      res.status(201).json({ data: driver });
    } catch (error) {
      next(error);
    }
  }

  @httpGet('/')
  async getAll(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
    try {
      const drivers = await this.driverService.getAllDrivers(req.user.tenantId);
      res.status(200).json({ data: drivers });
    } catch (error) {
      next(error);
    }
  }
}
```

server/src/controllers/maintenance.controller.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { controller, httpPost, httpGet, request, response, next } from 'inversify-express-utils';
import { MaintenanceService } from '../services/maintenance.service';
import { validateBody } from '../middleware/validation.middleware';
import { createMaintenanceSchema } from '../validation/maintenance.validation';
import { inject } from 'inversify';
import { TYPES } from '../types';

@controller('/api/maintenance')
export class MaintenanceController {
  constructor(@inject(TYPES.MaintenanceService) private maintenanceService: MaintenanceService) {}

  @httpPost('/')
  @validateBody(createMaintenanceSchema)
  async create(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
    try {
      const maintenance = await this.maintenanceService.createMaintenance(req.body, req.user.tenantId);
      res.status(201).json({ data: maintenance });
    } catch (error) {
      next(error);
    }
  }

  @httpGet('/')
  async getAll(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
    try {
      const maintenanceRecords = await this.maintenanceService.getAllMaintenance(req.user.tenantId);
      res.status(200).json({ data: maintenanceRecords });
    } catch (error) {
      next(error);
    }
  }
}
```