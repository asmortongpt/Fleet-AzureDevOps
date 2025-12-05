import { Router } from "express"
import { csrfProtection } from '../middleware/csrf'
import { container } from '../container'
import { TYPES } from '../types'
import { DriverController } from '../modules/drivers/controllers/driver.controller'
import { asyncHandler } from '../middleware/errorHandler'
import {
  driverCreateSchema,
  driverUpdateSchema,
  driverQuerySchema,
  driverIdSchema
} from '../schemas/drivers.schema';
import { validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
import { authenticateJWT } from '../middleware/auth';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';

const router = Router()
const driverController = container.get<DriverController>(TYPES.DriverController)

// SECURITY: All routes require authentication
router.use(authenticateJWT)

// GET all drivers - Requires authentication, any role can read
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.DRIVER_READ],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateQuery(driverQuerySchema),
  asyncHandler((req, res, next) => driverController.getAllDrivers(req, res, next))
)

// GET driver by ID - Requires authentication + tenant isolation
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.DRIVER_READ],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateParams(driverIdSchema),
  asyncHandler((req, res, next) => driverController.getDriverById(req, res, next))
)

// POST create driver - Requires admin or manager role
router.post("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.DRIVER_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateBody(driverCreateSchema),
  asyncHandler((req, res, next) => driverController.createDriver(req, res, next))
)

// PUT update driver - Requires admin or manager role + tenant isolation
router.put("/:id",
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
  asyncHandler((req, res, next) => driverController.updateDriver(req, res, next))
)

// DELETE driver
router.delete("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.DRIVER_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateParams(driverIdSchema),
  asyncHandler((req, res, next) => driverController.deleteDriver(req, res, next))
)

export default router
