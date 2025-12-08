import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { cacheService } from '../../../config/cache';
import logger from '../../../config/logger';
import { ValidationError, NotFoundError } from '../../../errors/app-error';
import { TYPES } from '../../../types';
import { FacilityService } from '../services/facility.service';

@injectable()
export class FacilityController {
  constructor(
    @inject(TYPES.FacilityService)
    private facilityService: FacilityService
  ) {}

  async getAllFacilities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 50, facilityType, active } = req.query;
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `facilities:list:${tenantId}:${page}:${limit}:${facilityType || ''}:${active || ''}`;
      const cached = await cacheService.get<{ data: any[], pagination: any }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      // Get all facilities from service
      let facilities = await this.facilityService.getAllFacilities(tenantId);

      // Apply filters
      if (facilityType && typeof facilityType === 'string') {
        facilities = facilities.filter((f: any) => f.facility_type === facilityType);
      }

      if (active === 'true') {
        facilities = facilities.filter((f: any) => f.is_active === true);
      }

      // Apply pagination
      const total = facilities.length;
      const offset = (Number(page) - 1) * Number(limit);
      const data = facilities.slice(offset, offset + Number(limit));

      const result = {
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      logger.info('Fetched facilities', { tenantId, count: data.length, total });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFacilityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const facilityId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `facility:${tenantId}:${facilityId}`;
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        logger.debug('Facility cache hit', { facilityId, tenantId });
        res.json(cached);
        return;
      }

      const facility = await this.facilityService.getFacilityById(facilityId, tenantId);

      if (!facility) {
        throw new NotFoundError(`Facility ${facilityId} not found`);
      }

      // Cache for 10 minutes
      await cacheService.set(cacheKey, facility, 600);

      logger.info('Fetched facility', { facilityId, tenantId });
      res.json(facility);
    } catch (error) {
      next(error);
    }
  }

  async createFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const facility = await this.facilityService.createFacility(req.body, tenantId);

      logger.info('Facility created', { facilityId: facility.id, tenantId });
      res.status(201).json(facility);
    } catch (error) {
      next(error);
    }
  }

  async updateFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const facilityId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const facility = await this.facilityService.updateFacility(facilityId, req.body, tenantId);

      if (!facility) {
        throw new NotFoundError(`Facility ${facilityId} not found`);
      }

      // Invalidate cache
      const cacheKey = `facility:${tenantId}:${facilityId}`;
      await cacheService.del(cacheKey);

      logger.info('Facility updated', { facilityId, tenantId });
      res.json(facility);
    } catch (error) {
      next(error);
    }
  }

  async deleteFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenant_id;
      const facilityId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const deleted = await this.facilityService.deleteFacility(facilityId, tenantId);

      if (!deleted) {
        throw new NotFoundError(`Facility ${facilityId} not found`);
      }

      // Invalidate cache
      const cacheKey = `facility:${tenantId}:${facilityId}`;
      await cacheService.del(cacheKey);

      logger.info('Facility deleted', { facilityId, tenantId });
      res.json({ message: 'Facility deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
