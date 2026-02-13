import { Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { cacheService } from '../../../config/cache';
import logger from '../../../config/logger';
import { ValidationError, NotFoundError } from '../../../errors/app-error';
import { AuthRequest } from '../../../middleware/auth';
import { TYPES } from '../../../types';
import type { Driver } from '../../../types/driver';
import { DriverService } from '../services/driver.service';

@injectable()
export class DriverController {
  constructor(
    @inject(TYPES.DriverService)
    private driverService: DriverService
  ) {}

  async getAllDrivers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, pageSize = 20, search, status } = req.query;
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `drivers:list:${tenantId}:${page}:${pageSize}:${search || ''}:${status || ''}`;
      const cached = await cacheService.get<{ data: Driver[], total: number }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      // Get all drivers from service
      let drivers = await this.driverService.getAllDrivers(tenantId);

      // Apply filters (TODO: move to service layer)
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        drivers = drivers.filter((d: Driver) =>
          d.first_name?.toLowerCase().includes(searchLower) ||
          d.last_name?.toLowerCase().includes(searchLower) ||
          d.email?.toLowerCase().includes(searchLower) ||
          d.license_number?.toLowerCase().includes(searchLower)
        );
      }

      if (status && typeof status === 'string') {
        drivers = drivers.filter((d: Driver) => d.status === status);
      }

      // Apply pagination
      const total = drivers.length;
      const offset = (Number(page) - 1) * Number(pageSize);
      const data = drivers.slice(offset, offset + Number(pageSize));

      const result = { data, total };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      logger.info('Fetched drivers', { tenantId, count: data.length, total });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDriverById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenant_id;
      const driverId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      // Cache-aside pattern
      const cacheKey = `driver:${tenantId}:${driverId}`;
      const cached = await cacheService.get<Driver>(cacheKey);

      if (cached) {
        logger.debug('Driver cache hit', { driverId, tenantId });
        res.json({ data: cached });
        return;
      }

      const driver = await this.driverService.getDriverById(driverId, tenantId);

      if (!driver) {
        throw new NotFoundError(`Driver ${driverId} not found`);
      }

      // Cache for 10 minutes
      await cacheService.set(cacheKey, driver, 600);

      logger.info('Fetched driver', { driverId, tenantId });
      res.json({ data: driver });
    } catch (error) {
      next(error);
    }
  }

  async createDriver(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenant_id;

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const driver = await this.driverService.createDriver(req.body, tenantId);

      logger.info('Driver created', { driverId: driver.id, tenantId });
      res.status(201).json({ data: driver });
    } catch (error) {
      next(error);
    }
  }

  async updateDriver(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenant_id;
      const driverId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const driver = await this.driverService.updateDriver(driverId, req.body, tenantId);

      if (!driver) {
        throw new NotFoundError(`Driver ${driverId} not found`);
      }

      // Invalidate cache
      const cacheKey = `driver:${tenantId}:${driverId}`;
      await cacheService.del(cacheKey);

      logger.info('Driver updated', { driverId, tenantId });
      res.json({ data: driver });
    } catch (error) {
      next(error);
    }
  }

  async deleteDriver(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenant_id;
      const driverId = Number(req.params.id);

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const deleted = await this.driverService.deleteDriver(driverId, tenantId);

      if (!deleted) {
        throw new NotFoundError(`Driver ${driverId} not found`);
      }

      // Invalidate cache
      const cacheKey = `driver:${tenantId}:${driverId}`;
      await cacheService.del(cacheKey);

      logger.info('Driver deleted', { driverId, tenantId });
      res.json({ message: "Driver deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
