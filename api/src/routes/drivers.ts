Here's the complete refactored `drivers.ts` file using the repository pattern:


import { Router } from "express";
import { DriversRepository } from '../repositories/drivers.repository';

import { container } from '../container';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
import { DriverController } from '../modules/drivers/controllers/driver.controller';
import {
  driverCreateSchema,
  driverUpdateSchema,
  driverQuerySchema,
  driverIdSchema
} from '../schemas/drivers.schema';
import { TYPES } from '../types';

const router = Router();
const driverController = container.get<DriverController>(TYPES.DriverController);
const driversRepository = container.get<DriversRepository>(TYPES.DriversRepository);

// SECURITY: All routes require authentication
router.use(authenticateJWT);

// GET all drivers - Requires authentication, any role can read
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.DRIVER_READ],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateQuery(driverQuerySchema),
  asyncHandler(async (req, res, next) => {
    try {
      const tenantId = req.user?.tenant_id || req.body.tenant_id;
      const query = req.query;
      const drivers = await driversRepository.getAllDrivers(tenantId, query);
      res.json(drivers);
    } catch (error) {
      next(error);
    }
  })
);

// GET driver by ID - Requires authentication + tenant isolation
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.DRIVER_READ],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateParams(driverIdSchema),
  asyncHandler(async (req, res, next) => {
    try {
      const tenantId = req.user?.tenant_id || req.body.tenant_id;
      const driverId = req.params.id;
      const driver = await driversRepository.getDriverById(tenantId, driverId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.json(driver);
    } catch (error) {
      next(error);
    }
  })
);

// POST create driver - Requires admin or manager role
router.post("/",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.DRIVER_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateBody(driverCreateSchema),
  asyncHandler(async (req, res, next) => {
    try {
      const tenantId = req.user?.tenant_id || req.body.tenant_id;
      const driverData = { ...req.body, tenant_id: tenantId };
      const newDriver = await driversRepository.createDriver(driverData);
      res.status(201).json(newDriver);
    } catch (error) {
      next(error);
    }
  })
);

// PUT update driver - Requires admin or manager role + tenant isolation
router.put("/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.DRIVER_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateAll({
    params: driverIdSchema,
    body: driverUpdateSchema
  }),
  asyncHandler(async (req, res, next) => {
    try {
      const tenantId = req.user?.tenant_id || req.body.tenant_id;
      const driverId = req.params.id;
      const driverData = { ...req.body, tenant_id: tenantId };
      const updatedDriver = await driversRepository.updateDriver(tenantId, driverId, driverData);
      if (!updatedDriver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.json(updatedDriver);
    } catch (error) {
      next(error);
    }
  })
);

// DELETE driver - Requires admin role + tenant isolation
router.delete("/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN],
    permissions: [PERMISSIONS.DRIVER_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateParams(driverIdSchema),
  asyncHandler(async (req, res, next) => {
    try {
      const tenantId = req.user?.tenant_id || req.body.tenant_id;
      const driverId = req.params.id;
      const deleted = await driversRepository.deleteDriver(tenantId, driverId);
      if (!deleted) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  })
);

export default router;


In this refactored version:

1. We've imported `DriversRepository` at the top of the file.
2. We've replaced all direct database query calls with corresponding methods from `DriversRepository`:
   - `getAllDrivers` for GET all drivers
   - `getDriverById` for GET driver by ID
   - `createDriver` for POST create driver
   - `updateDriver` for PUT update driver
   - `deleteDriver` for DELETE driver
3. All existing route handlers and logic have been kept intact.
4. The `tenant_id` is still obtained from `req.user?.tenant_id` or `req.body.tenant_id`.
5. Error handling remains the same, using `try/catch` blocks and passing errors to `next()`.
6. The complete refactored file is returned.

This refactoring improves the separation of concerns by moving database operations to the repository layer, making the route handlers cleaner and more focused on business logic.