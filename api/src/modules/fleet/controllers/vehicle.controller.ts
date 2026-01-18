import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { cacheService } from '../../../config/cache';
import logger from '../../../config/logger';
import { ValidationError, NotFoundError } from '../../../errors/app-error';
import { TYPES } from '../../../types';
import { VehicleService } from '../services/vehicle.service';

@injectable()
export class VehicleController {
  constructor(
    @inject(TYPES.VehicleService)
    private vehicleService: VehicleService
  ) {}

  async getAllVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, pageSize = 20, search, status } = req.query;
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `vehicles:list:${tenantId}:${page}:${pageSize}:${search || ''}:${status || ''}`;
      const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      // Get all vehicles from service
      let vehicles = await this.vehicleService.getAllVehicles(tenantId);

      // Apply filters (TODO: move to service layer)
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        vehicles = vehicles.filter((v: any) =>
          v.vin?.toLowerCase().includes(searchLower) ||
          v.license_plate?.toLowerCase().includes(searchLower) ||
          v.make?.toLowerCase().includes(searchLower) ||
          v.model?.toLowerCase().includes(searchLower)
        );
      }

      if (status && typeof status === 'string') {
        vehicles = vehicles.filter((v: any) => v.status === status);
      }

      // Apply pagination
      const total = vehicles.length;
      const offset = (Number(page) - 1) * Number(pageSize);
      const data = vehicles.slice(offset, offset + Number(pageSize));

      const result = { data, total };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      logger.info('Fetched vehicles', { tenantId, count: data.length, total });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getVehicleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const vehicleId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `vehicle:${tenantId}:${vehicleId}`;
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        logger.debug('Vehicle cache hit', { vehicleId, tenantId });
        res.json({ data: cached });
        return;
      }

      const vehicle = await this.vehicleService.getVehicleById(vehicleId, tenantId);

      if (!vehicle) {
        throw new NotFoundError(`Vehicle ${vehicleId} not found`);
      }

      // Cache for 10 minutes
      await cacheService.set(cacheKey, vehicle, 600);

      logger.info('Fetched vehicle', { vehicleId, tenantId });
      res.json({ data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const vehicle = await this.vehicleService.createVehicle(req.body, tenantId);

      logger.info('Vehicle created', { vehicleId: vehicle.id, tenantId });
      res.status(201).json({ data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const vehicleId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const vehicle = await this.vehicleService.updateVehicle(vehicleId, req.body, tenantId);

      if (!vehicle) {
        throw new NotFoundError(`Vehicle ${vehicleId} not found`);
      }

      // Invalidate cache
      const cacheKey = `vehicle:${tenantId}:${vehicleId}`;
      await cacheService.del(cacheKey);

      logger.info('Vehicle updated', { vehicleId, tenantId });
      res.json({ data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const vehicleId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const deleted = await this.vehicleService.deleteVehicle(vehicleId, tenantId);

      if (!deleted) {
        throw new NotFoundError(`Vehicle ${vehicleId} not found`);
      }

      // Invalidate cache
      const cacheKey = `vehicle:${tenantId}:${vehicleId}`;
      await cacheService.del(cacheKey);

      logger.info('Vehicle deleted', { vehicleId, tenantId });
      res.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
