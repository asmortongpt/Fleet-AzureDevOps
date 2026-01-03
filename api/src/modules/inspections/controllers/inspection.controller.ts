import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { cacheService } from '../../../config/cache';
import logger from '../../../config/logger';
import { ValidationError, NotFoundError } from '../../../errors/app-error';
import { TYPES } from '../../../types';
import { InspectionService } from '../services/inspection.service';

@injectable()
export class InspectionController {
  constructor(
    @inject(TYPES.InspectionService)
    private inspectionService: InspectionService
  ) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, pageSize = 20, inspection_type, status, vehicle_id, driver_id, inspector_id, failed, start_date, end_date } = req.query;
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const cacheKey = `inspections:list:${tenantId}:${page}:${pageSize}:${inspection_type || ''}:${status || ''}:${failed || ''}`;
      const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      // Get inspections based on filters
      let inspections;
      if (start_date && end_date && typeof start_date === 'string' && typeof end_date === 'string') {
        inspections = await this.inspectionService.getByDateRange(start_date, end_date, tenantId);
      } else if (failed === 'true') {
        inspections = await this.inspectionService.getFailed(tenantId);
      } else if (inspection_type && typeof inspection_type === 'string') {
        inspections = await this.inspectionService.getByType(inspection_type, tenantId);
      } else if (status && typeof status === 'string') {
        inspections = await this.inspectionService.getByStatus(status, tenantId);
      } else if (vehicle_id && typeof vehicle_id === 'string') {
        inspections = await this.inspectionService.getByVehicle(vehicle_id, tenantId);
      } else if (driver_id && typeof driver_id === 'string') {
        inspections = await this.inspectionService.getByDriver(driver_id, tenantId);
      } else if (inspector_id && typeof inspector_id === 'string') {
        inspections = await this.inspectionService.getByInspector(inspector_id, tenantId);
      } else {
        inspections = await this.inspectionService.getAll(tenantId);
      }

      // Apply pagination
      const total = inspections.length;
      const offset = (Number(page) - 1) * Number(pageSize);
      const data = inspections.slice(offset, offset + Number(pageSize));

      const result = { data, total };
      await cacheService.set(cacheKey, result, 300);

      logger.info('Fetched inspections', { tenantId, count: data.length, total });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const id = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const cacheKey = `inspection:${tenantId}:${id}`;
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        res.json({ data: cached });
        return;
      }

      const inspection = await this.inspectionService.getById(id, tenantId);

      if (!inspection) {
        throw new NotFoundError(`Inspection ${id} not found`);
      }

      await cacheService.set(cacheKey, inspection, 600);
      res.json({ data: inspection });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const inspection = await this.inspectionService.create(req.body, tenantId);
      logger.info('Inspection created', { id: inspection.id, tenantId });
      res.status(201).json({ data: inspection });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const id = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const inspection = await this.inspectionService.update(id, req.body, tenantId);

      if (!inspection) {
        throw new NotFoundError(`Inspection ${id} not found`);
      }

      await cacheService.del(`inspection:${tenantId}:${id}`);
      logger.info('Inspection updated', { id, tenantId });
      res.json({ data: inspection });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const id = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const deleted = await this.inspectionService.delete(id, tenantId);

      if (!deleted) {
        throw new NotFoundError(`Inspection ${id} not found`);
      }

      await cacheService.del(`inspection:${tenantId}:${id}`);
      logger.info('Inspection deleted', { id, tenantId });
      res.json({ message: "Inspection deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
