To refactor the given TypeScript route file to use `DriversRepository` instead of direct database queries, we need to make the following changes:

1. Import `DriversRepository` at the top of the file.
2. Replace all `pool.query`, `db.query`, or `client.query` calls with repository methods in the `DriverController`.
3. Keep all existing route handlers and logic.
4. Maintain `tenant_id` from `req.user` or `req.body`.
5. Keep error handling.
6. Return the complete refactored file.

Here's the refactored TypeScript file:


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
      const updateData = { ...req.body, tenant_id: tenantId };
      const updatedDriver = await driversRepository.updateDriver(tenantId, driverId, updateData);
      if (!updatedDriver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.json(updatedDriver);
    } catch (error) {
      next(error);
    }
  })
);

// DELETE driver
router.delete("/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
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
2. We've replaced all direct database queries with calls to `driversRepository` methods.
3. We've kept all existing route handlers and logic.
4. We've maintained the `tenant_id` from `req.user` or `req.body` in each route handler.
5. We've kept the error handling using `try/catch` blocks and `next(error)`.
6. The complete refactored file is provided.

Note that we've assumed the existence of the following methods in the `DriversRepository`:

- `getAllDrivers(tenantId: string, query: any): Promise<any[]>`
- `getDriverById(tenantId: string, driverId: string): Promise<any | null>`
- `createDriver(driverData: any): Promise<any>`
- `updateDriver(tenantId: string, driverId: string, updateData: any): Promise<any | null>`
- `deleteDriver(tenantId: string, driverId: string): Promise<boolean>`

You may need to adjust these method signatures based on your actual `DriversRepository` implementation.