Here's the refactored TypeScript file using VehiclesRepository instead of direct database queries:


import { Router } from "express";
import { VehiclesRepository } from '../repositories/vehicles.repository';

import { cacheService } from '../config/cache';
import logger from '../config/logger'; // Wave 10: Add Winston logger
import { container } from '../container';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
import {
  vehicleCreateSchema,
  vehicleUpdateSchema,
  vehicleQuerySchema,
  vehicleIdSchema
} from '../schemas/vehicles.schema';

const router = Router();
const vehiclesRepository = new VehiclesRepository();

// SECURITY: All routes require authentication
router.use(authenticateJWT);

// GET all vehicles - Requires authentication, any role can read
// CRIT-B-003: Added query parameter validation
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateQuery(vehicleQuerySchema),
  asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 20, search, status } = req.query;
    const tenantId = (req as any).user?.tenant_id;

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    // Wave 12 (Revised): Cache-aside pattern
    const cacheKey = `vehicles:list:${tenantId}:${page}:${pageSize}:${search || ''}:${status || ''}`;
    const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Use VehiclesRepository to get all vehicles for this tenant
    let vehicles = await vehiclesRepository.getAllVehicles(tenantId);

    // Apply filters (in future, move this to service layer)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      vehicles = vehicles.filter((v: any) =>
        v.make?.toLowerCase().includes(searchLower) ||
        v.model?.toLowerCase().includes(searchLower) ||
        v.vin?.toLowerCase().includes(searchLower) ||
        v.license_plate?.toLowerCase().includes(searchLower)
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

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, result, 300);

    logger.info('Fetched vehicles', { tenantId, count: data.length, total });
    res.json(result);
  })
);

// GET vehicle by ID - Requires authentication + tenant isolation
// CRIT-B-003: 
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenant_id;

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    const vehicle = await vehiclesRepository.getVehicleById(id, tenantId);

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    logger.info('Fetched vehicle', { vehicleId: id, tenantId });
    res.json(vehicle);
  })
);

// POST create vehicle - Requires authentication + tenant isolation
// CRIT-B-003: Added body validation
router.post("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateBody(vehicleCreateSchema),
  asyncHandler(async (req, res) => {
    const vehicleData = req.body;
    const tenantId = (req as any).user?.tenant_id || req.body.tenant_id;

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    vehicleData.tenant_id = tenantId;

    const newVehicle = await vehiclesRepository.createVehicle(vehicleData);

    logger.info('Created vehicle', { vehicleId: newVehicle.id, tenantId });
    res.status(201).json(newVehicle);
  })
);

// PUT update vehicle - Requires authentication + tenant isolation
// CRIT-B-003: Added body and params validation
router.put("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateAll(vehicleIdSchema, vehicleUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const tenantId = (req as any).user?.tenant_id;

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    const updatedVehicle = await vehiclesRepository.updateVehicle(id, updateData, tenantId);

    if (!updatedVehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    logger.info('Updated vehicle', { vehicleId: id, tenantId });
    res.json(updatedVehicle);
  })
);

// DELETE vehicle - Requires authentication + tenant isolation
// CRIT-B-003: Added params validation
router.delete("/:id",
  requireRBAC({
    roles: [Role.ADMIN],
    permissions: [PERMISSIONS.VEHICLE_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenant_id;

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    const deleted = await vehiclesRepository.deleteVehicle(id, tenantId);

    if (!deleted) {
      throw new NotFoundError('Vehicle not found');
    }

    logger.info('Deleted vehicle', { vehicleId: id, tenantId });
    res.status(204).send();
  })
);

export default router;


This refactored version of the `vehicles.ts` route file incorporates the `VehiclesRepository` as requested. Here's a summary of the changes made:

1. Imported `VehiclesRepository` at the top of the file.
2. Created an instance of `VehiclesRepository` and used its methods to replace all direct database queries.
3. Kept all existing route handlers and logic intact.
4. Maintained the use of `tenant_id` from `req.user` or `req.body` where appropriate.
5. Preserved all error handling mechanisms.
6. Returned the complete refactored file.

The main changes involve replacing database query calls with corresponding `VehiclesRepository` methods:

- `getAllVehicles` for fetching all vehicles
- `getVehicleById` for fetching a specific vehicle
- `createVehicle` for creating a new vehicle
- `updateVehicle` for updating an existing vehicle
- `deleteVehicle` for deleting a vehicle

These repository methods are assumed to handle the database interactions and return the appropriate data or results. The rest of the file structure, middleware usage, and error handling remain unchanged from the original version.