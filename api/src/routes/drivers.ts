import { Router } from "express"
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { cacheService } from '../config/cache'; // Wave 12 (Revised): Add Redis caching
import {
  driverCreateSchema,
  driverUpdateSchema,
  driverQuerySchema,
  driverIdSchema
} from '../schemas/drivers.schema';
import { validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
import logger from '../config/logger'; // Wave 10: Add Winston logger
import { authenticateJWT } from '../middleware/auth';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';

const router = Router()

// SECURITY: All routes require authentication
router.use(authenticateJWT)

// GET all drivers - Requires authentication, any role can read
// CRIT-B-003: Added query parameter validation
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.DRIVER_READ],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateQuery(driverQuerySchema),
  asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 20, search, status } = req.query
    const tenantId = (req as any).user?.tenant_id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Wave 12 (Revised): Cache-aside pattern
    const cacheKey = `drivers:list:${tenantId}:${page}:${pageSize}:${search || ''}:${status || ''}`
    const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey)

    if (cached) {
      return res.json(cached)
    }

    // Use DI-resolved DriverService
    const driverService = container.resolve('driverService')
    let drivers = await driverService.getAllDrivers(tenantId)

    // Apply filters (future: move to service layer)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase()
      drivers = drivers.filter((d: any) =>
        d.first_name?.toLowerCase().includes(searchLower) ||
        d.last_name?.toLowerCase().includes(searchLower) ||
        d.email?.toLowerCase().includes(searchLower) ||
        d.license_number?.toLowerCase().includes(searchLower)
      )
    }

    if (status && typeof status === 'string') {
      drivers = drivers.filter((d: any) => d.status === status)
    }

    // Apply pagination
    const total = drivers.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = drivers.slice(offset, offset + Number(pageSize))

    const result = { data, total }

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, result, 300)

    logger.info('Fetched drivers', { tenantId, count: data.length, total })
    res.json(result)
  })
)

// GET driver by ID - Requires authentication + tenant isolation
// CRIT-B-003: Added URL parameter validation
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.DRIVER_READ],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validateParams(driverIdSchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const driverId = Number(req.params.id)

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Wave 12 (Revised): Cache-aside pattern for single driver
    const cacheKey = `driver:${tenantId}:${driverId}`
    const cached = await cacheService.get<any>(cacheKey)

    if (cached) {
      logger.debug('Driver cache hit', { driverId, tenantId })
      return res.json({ data: cached })
    }

    // Use DI-resolved DriverService
    const driverService = container.resolve('driverService')
    const driver = await driverService.getDriverById(driverId, tenantId)

    if (!driver) {
      throw new NotFoundError(`Driver ${driverId} not found`)
    }

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, driver, 600)

    logger.info('Fetched driver', { driverId, tenantId })
    res.json({ data: driver })
  })
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
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Validate required fields
    if (!req.body.first_name || !req.body.last_name || !req.body.email) {
      throw new ValidationError('First name, last name, and email are required')
    }

    // Use DI-resolved DriverService
    const driverService = container.resolve('driverService')
    const driver = await driverService.createDriver(req.body, tenantId)

    logger.info('Driver created', { driverId: driver.id, tenantId })
    res.status(201).json({ data: driver })
  })
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
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const driverId = Number(req.params.id)

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Use DI-resolved DriverService
    const driverService = container.resolve('driverService')
    const driver = await driverService.updateDriver(driverId, req.body, tenantId)

    if (!driver) {
      throw new NotFoundError(`Driver ${driverId} not found`)
    }

    // Wave 12 (Revised): Invalidate cache on update
    const cacheKey = `driver:${tenantId}:${driverId}`
    await cacheService.del(cacheKey)

    logger.info('Driver updated', { driverId, tenantId })
    res.json({ data: driver })
  })
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
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const driverId = Number(req.params.id)

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Use DI-resolved DriverService
    const driverService = container.resolve('driverService')
    const deleted = await driverService.deleteDriver(driverId, tenantId)

    if (!deleted) {
      throw new NotFoundError(`Driver ${driverId} not found`)
    }

    // Wave 12 (Revised): Invalidate cache on delete
    const cacheKey = `driver:${tenantId}:${driverId}`
    await cacheService.del(cacheKey)

    logger.info('Driver deleted', { driverId, tenantId })
    res.json({ message: "Driver deleted successfully" })
  })
)

export default router
