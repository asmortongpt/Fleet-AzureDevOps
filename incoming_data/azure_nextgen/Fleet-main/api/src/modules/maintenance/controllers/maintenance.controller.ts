import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { cacheService } from '../../../config/cache';
import logger from '../../../config/logger';
import { ValidationError, NotFoundError } from '../../../errors/app-error';
import { TYPES } from '../../../types';
import { MaintenanceService } from '../services/maintenance.service';

@injectable()
export class MaintenanceController {
  constructor(
    @inject(TYPES.MaintenanceService)
    private maintenanceService: MaintenanceService
  ) {}

  async getAllMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, pageSize = 20, search, serviceType, status, category, vehicleNumber, startDate, endDate } = req.query;
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `maintenance:list:${tenantId}:${page}:${pageSize}:${search || ''}:${serviceType || ''}:${status || ''}:${category || ''}:${vehicleNumber || ''}:${startDate || ''}:${endDate || ''}`;
      const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      // Get all maintenance records from service
      let records = await this.maintenanceService.getAllMaintenance(tenantId);

      // Apply filters (TODO: move to service layer)
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        records = records.filter((r: any) =>
          r.description?.toLowerCase().includes(searchLower) ||
          r.service_type?.toLowerCase().includes(searchLower) ||
          r.category?.toLowerCase().includes(searchLower)
        );
      }

      if (serviceType && typeof serviceType === 'string') {
        records = records.filter((r: any) => r.service_type === serviceType);
      }

      if (status && typeof status === 'string') {
        records = records.filter((r: any) => r.status === status);
      }

      if (category && typeof category === 'string') {
        records = records.filter((r: any) => r.category === category);
      }

      if (vehicleNumber && typeof vehicleNumber === 'string') {
        records = records.filter((r: any) => r.vehicle_number === vehicleNumber);
      }

      if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        records = records.filter((r: any) => {
          const serviceDate = new Date(r.service_date);
          return serviceDate >= start && serviceDate <= end;
        });
      }

      // Apply pagination
      const total = records.length;
      const offset = (Number(page) - 1) * Number(pageSize);
      const data = records.slice(offset, offset + Number(pageSize));

      const result = { data, total };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      logger.info('Fetched maintenance records', { tenantId, count: data.length, total });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMaintenanceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const maintenanceId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `maintenance:${tenantId}:${maintenanceId}`;
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        logger.debug('Maintenance cache hit', { maintenanceId, tenantId });
        res.json({ data: cached });
        return;
      }

      const record = await this.maintenanceService.getMaintenanceById(maintenanceId, tenantId);

      if (!record) {
        throw new NotFoundError(`Maintenance record ${maintenanceId} not found`);
      }

      // Cache for 10 minutes
      await cacheService.set(cacheKey, record, 600);

      logger.info('Fetched maintenance record', { maintenanceId, tenantId });
      res.json({ data: record });
    } catch (error) {
      next(error);
    }
  }

  async getMaintenanceByVehicleId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const vehicleId = Number(req.params.vehicleId);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `maintenance:vehicle:${tenantId}:${vehicleId}`;
      const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      const records = await this.maintenanceService.getMaintenanceByVehicleId(vehicleId, tenantId);
      const result = { data: records, total: records.length };

      // Cache for 10 minutes
      await cacheService.set(cacheKey, result, 600);

      logger.info('Fetched vehicle maintenance records', { vehicleId, tenantId, count: records.length });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const record = await this.maintenanceService.createMaintenance(req.body, tenantId);

      logger.info('Maintenance record created', { maintenanceId: record.id, tenantId });
      res.status(201).json({ data: record });
    } catch (error) {
      next(error);
    }
  }

  async updateMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const maintenanceId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const record = await this.maintenanceService.updateMaintenance(maintenanceId, req.body, tenantId);

      if (!record) {
        throw new NotFoundError(`Maintenance record ${maintenanceId} not found`);
      }

      // Invalidate cache
      const cacheKey = `maintenance:${tenantId}:${maintenanceId}`;
      await cacheService.del(cacheKey);

      logger.info('Maintenance record updated', { maintenanceId, tenantId });
      res.json({ data: record });
    } catch (error) {
      next(error);
    }
  }

  async deleteMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const maintenanceId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const deleted = await this.maintenanceService.deleteMaintenance(maintenanceId, tenantId);

      if (!deleted) {
        throw new NotFoundError(`Maintenance record ${maintenanceId} not found`);
      }

      // Invalidate cache
      const cacheKey = `maintenance:${tenantId}:${maintenanceId}`;
      await cacheService.del(cacheKey);

      logger.info('Maintenance record deleted', { maintenanceId, tenantId });
      res.json({ message: "Maintenance record deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
