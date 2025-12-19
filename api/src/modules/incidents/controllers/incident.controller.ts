import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { cacheService } from '../../../config/cache';
import logger from '../../../config/logger';
import { ValidationError, NotFoundError } from '../../../errors/app-error';
import { TYPES } from '../../../types';
import { IncidentService } from '../services/incident.service';

@injectable()
export class IncidentController {
  constructor(
    @inject(TYPES.IncidentService)
    private incidentService: IncidentService
  ) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, pageSize = 20, incident_type, severity, status, vehicle_id, driver_id, start_date, end_date } = req.query;
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const cacheKey = `incidents:list:${tenantId}:${page}:${pageSize}:${incident_type || ''}:${severity || ''}:${status || ''}`;
      const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      // Get incidents based on filters
      let incidents;
      if (start_date && end_date && typeof start_date === 'string' && typeof end_date === 'string') {
        incidents = await this.incidentService.getByDateRange(start_date, end_date, tenantId);
      } else if (incident_type && typeof incident_type === 'string') {
        incidents = await this.incidentService.getByType(incident_type, tenantId);
      } else if (severity && typeof severity === 'string') {
        incidents = await this.incidentService.getBySeverity(severity, tenantId);
      } else if (status && typeof status === 'string') {
        incidents = await this.incidentService.getByStatus(status, tenantId);
      } else if (vehicle_id && typeof vehicle_id === 'string') {
        incidents = await this.incidentService.getByVehicle(vehicle_id, tenantId);
      } else if (driver_id && typeof driver_id === 'string') {
        incidents = await this.incidentService.getByDriver(driver_id, tenantId);
      } else {
        incidents = await this.incidentService.getAll(tenantId);
      }

      // Apply pagination
      const total = incidents.length;
      const offset = (Number(page) - 1) * Number(pageSize);
      const data = incidents.slice(offset, offset + Number(pageSize));

      const result = { data, total };
      await cacheService.set(cacheKey, result, 300);

      logger.info('Fetched incidents', { tenantId, count: data.length, total });
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

      const cacheKey = `incident:${tenantId}:${id}`;
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        res.json({ data: cached });
        return;
      }

      const incident = await this.incidentService.getById(id, tenantId);

      if (!incident) {
        throw new NotFoundError(`Incident ${id} not found`);
      }

      await cacheService.set(cacheKey, incident, 600);
      res.json({ data: incident });
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

      // Add reported_by from authenticated user if not provided
      const dataWithUser = {
        ...req.body,
        reported_by: req.body.reported_by || userId
      };

      const incident = await this.incidentService.create(dataWithUser, tenantId);
      logger.info('Incident created', { id: incident.id, tenantId });
      res.status(201).json({ data: incident });
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

      const incident = await this.incidentService.update(id, req.body, tenantId);

      if (!incident) {
        throw new NotFoundError(`Incident ${id} not found`);
      }

      await cacheService.del(`incident:${tenantId}:${id}`);
      logger.info('Incident updated', { id, tenantId });
      res.json({ data: incident });
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

      const deleted = await this.incidentService.delete(id, tenantId);

      if (!deleted) {
        throw new NotFoundError(`Incident ${id} not found`);
      }

      await cacheService.del(`incident:${tenantId}:${id}`);
      logger.info('Incident deleted', { id, tenantId });
      res.json({ message: "Incident deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
