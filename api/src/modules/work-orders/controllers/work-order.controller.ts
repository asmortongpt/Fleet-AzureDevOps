import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { cacheService } from '../../../config/cache';
import logger from '../../../config/logger';
import { ValidationError, NotFoundError } from '../../../errors/app-error';
import { TYPES } from '../../../types';
import { WorkOrderService } from '../services/work-order.service';

@injectable()
export class WorkOrderController {
  constructor(
    @inject(TYPES.WorkOrderService)
    private workOrderService: WorkOrderService
  ) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, pageSize = 20, status, priority, facility_id, vehicle_id, technician_id } = req.query;
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const cacheKey = `work-orders:list:${tenantId}:${page}:${pageSize}:${status || ''}:${priority || ''}:${facility_id || ''}:${vehicle_id || ''}`;
      const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      // Get work orders based on filters
      let workOrders;
      if (status && typeof status === 'string') {
        workOrders = await this.workOrderService.getByStatus(status, tenantId);
      } else if (priority && typeof priority === 'string') {
        workOrders = await this.workOrderService.getByPriority(priority, tenantId);
      } else if (facility_id && typeof facility_id === 'string') {
        workOrders = await this.workOrderService.getByFacility(facility_id, tenantId);
      } else if (vehicle_id && typeof vehicle_id === 'string') {
        workOrders = await this.workOrderService.getByVehicle(vehicle_id, tenantId);
      } else if (technician_id && typeof technician_id === 'string') {
        workOrders = await this.workOrderService.getByTechnician(technician_id, tenantId);
      } else {
        workOrders = await this.workOrderService.getAll(tenantId);
      }

      // Apply pagination
      const total = workOrders.length;
      const offset = (Number(page) - 1) * Number(pageSize);
      const data = workOrders.slice(offset, offset + Number(pageSize));

      const result = { data, total };
      await cacheService.set(cacheKey, result, 300);

      logger.info('Fetched work orders', { tenantId, count: data.length, total });
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

      const cacheKey = `work-order:${tenantId}:${id}`;
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        res.json({ data: cached });
        return;
      }

      const workOrder = await this.workOrderService.getById(id, tenantId);

      if (!workOrder) {
        throw new NotFoundError(`Work order ${id} not found`);
      }

      await cacheService.set(cacheKey, workOrder, 600);
      res.json({ data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const userId = (req as any).user?.id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Add created_by from authenticated user
      const dataWithUser = {
        ...req.body,
        created_by: userId
      };

      const workOrder = await this.workOrderService.create(dataWithUser, tenantId);
      logger.info('Work order created', { id: workOrder.id, tenantId });
      res.status(201).json({ data: workOrder });
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

      const workOrder = await this.workOrderService.update(id, req.body, tenantId);

      if (!workOrder) {
        throw new NotFoundError(`Work order ${id} not found`);
      }

      await cacheService.del(`work-order:${tenantId}:${id}`);
      logger.info('Work order updated', { id, tenantId });
      res.json({ data: workOrder });
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

      const deleted = await this.workOrderService.delete(id, tenantId);

      if (!deleted) {
        throw new NotFoundError(`Work order ${id} not found`);
      }

      await cacheService.del(`work-order:${tenantId}:${id}`);
      logger.info('Work order deleted', { id, tenantId });
      res.json({ message: "Work order deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
