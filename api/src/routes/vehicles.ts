import { Router, Request, Response } from "express"

import { cacheService } from '../config/cache';
import logger from '../config/logger'; // Wave 10: Add Winston logger
import { container } from '../container'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { authenticateJWT } from '../middleware/auth';
import { doubleCsrfProtection as csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { policyEnforcement } from '../middleware/policy-enforcement';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
import { VehicleService } from '../modules/fleet/services/vehicle.service'
import {
  vehicleCreateSchema,
  vehicleUpdateSchema,
  vehicleQuerySchema,
  vehicleIdSchema
} from '../schemas/vehicles.schema';
import { TYPES } from '../types'

const router = Router()

// SECURITY: All routes require authentication
router.use(authenticateJWT)

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
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, pageSize = 20, search, status } = req.query
    const tenantId = (req as any).user?.tenant_id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Wave 12 (Revised): Cache-aside pattern
    const cacheKey = `vehicles:list:${tenantId}:${page}:${pageSize}:${search || ''}:${status || ''}`
    const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey)

    if (cached) {
      return res.json(cached)
    }

    // Use DI-resolved VehicleService instead of emulator
    const vehicleService = container.get<VehicleService>(TYPES.VehicleService)

    // Get all vehicles for this tenant
    let vehicles = await vehicleService.getAllVehicles(tenantId)

    // Apply filters (in future, move this to service layer)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase()
      vehicles = vehicles.filter((v: any) =>
        v.make?.toLowerCase().includes(searchLower) ||
        v.model?.toLowerCase().includes(searchLower) ||
        v.vin?.toLowerCase().includes(searchLower) ||
        v.license_plate?.toLowerCase().includes(searchLower)
      )
    }

    if (status && typeof status === 'string') {
      vehicles = vehicles.filter((v: any) => v.status === status)
    }

    // Apply pagination
    const total = vehicles.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = vehicles.slice(offset, offset + Number(pageSize))

    const result = { data, total }

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, result, 300)

    logger.info('Fetched vehicles', { tenantId, count: data.length, total })
    res.json(result)
  })
)

// GET vehicle by ID - Requires authentication + tenant isolation
// CRIT-B-003: Added URL parameter validation
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user?.tenant_id
      const vehicleId = req.params.id // Keep as string (UUID)

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required')
      }

      // Validate UUID format (already done by validateParams, but add runtime check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(vehicleId)) {
        return res.status(400).json({
          error: 'Invalid vehicle ID format',
          message: 'Vehicle ID must be a valid UUID'
        })
      }

      // Wave 12 (Revised): Cache-aside pattern for single vehicle
      const cacheKey = `vehicle:${tenantId}:${vehicleId}`
      const cached = await cacheService.get<any>(cacheKey)

      if (cached) {
        logger.debug('Vehicle cache hit', { vehicleId, tenantId })
        return res.json({ data: cached })
      }

      // Use DI-resolved VehicleService
      const vehicleService = container.get<VehicleService>(TYPES.VehicleService)
      const vehicle = await vehicleService.getVehicleById(vehicleId, tenantId)

      if (!vehicle) {
        return res.status(404).json({
          error: 'Vehicle not found',
          message: `Vehicle with ID ${vehicleId} not found or does not belong to your organization`
        })
      }

      // Cache for 10 minutes (600 seconds)
      await cacheService.set(cacheKey, vehicle, 600)

      logger.info('Fetched vehicle', { vehicleId, tenantId })
      res.json({ data: vehicle })
    } catch (error: any) {
      // Handle specific database errors
      if (error.code === '22P02') {
        // PostgreSQL invalid UUID format
        return res.status(400).json({
          error: 'Invalid vehicle ID format',
          message: 'Vehicle ID must be a valid UUID'
        })
      }

      // Re-throw other errors to be handled by error middleware
      throw error
    }
  })
)

// GET vehicle trips - Requires authentication + tenant isolation
router.get("/:id/trips",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenant_id
    const vehicleId = req.params.id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Cache key for trips
    const cacheKey = `vehicle:${tenantId}:${vehicleId}:trips`
    const cached = await cacheService.get<any[]>(cacheKey)

    if (cached) {
      logger.debug('Vehicle trips cache hit', { vehicleId, tenantId })
      return res.json(cached)
    }

    // TODO: Implement actual trip fetching from database
    // For now, return empty array if no trips are found
    const trips: any[] = []

    // Cache for 5 minutes
    await cacheService.set(cacheKey, trips, 300)

    logger.info('Fetched vehicle trips', { vehicleId, tenantId, count: trips.length })
    res.json(trips)
  })
)

// POST create vehicle - Requires admin or manager role
// CRIT-B-003: Comprehensive input validation with sanitization
router.post("/",
  csrfProtection,
  policyEnforcement(['FLT-SAF-001'], { mode: 'warn', includeInResponse: true }),
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateBody(vehicleCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenant_id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Validate required fields
    if (!req.body.make || !req.body.model || !req.body.year) {
      throw new ValidationError('Make, model, and year are required')
    }

    // Use DI-resolved VehicleService
    const vehicleService = container.get<VehicleService>(TYPES.VehicleService)
    const vehicle = await vehicleService.createVehicle(req.body, tenantId)

    // Wave 12 (Revised): Invalidate list cache on create
    // In production with Redis, use SCAN to find and delete matching keys
    // For now, we rely on TTL expiration
    logger.info('Vehicle created', { vehicleId: vehicle.id, tenantId })

    res.status(201).json({ data: vehicle })
  })
)

// PUT update vehicle - Requires admin or manager role + tenant isolation
// CRIT-B-003: Validates both URL params and request body
router.put("/:id",
  csrfProtection,
  policyEnforcement(['FLT-SAF-001'], { mode: 'warn', includeInResponse: true }),
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateAll({
    params: vehicleIdSchema,
    body: vehicleUpdateSchema
  }),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user?.tenant_id
      const vehicleId = req.params.id // Keep as string (UUID)

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required')
      }

      // Use DI-resolved VehicleService
      const vehicleService = container.get<VehicleService>(TYPES.VehicleService)

      // VehicleService.updateVehicle will throw error if vehicle not found or access denied
      const vehicle = await vehicleService.updateVehicle(vehicleId, req.body, tenantId)

      if (!vehicle) {
        return res.status(404).json({
          error: 'Vehicle not found',
          message: `Vehicle with ID ${vehicleId} not found or does not belong to your organization`
        })
      }

      // Wave 12 (Revised): Invalidate cache on update
      const cacheKey = `vehicle:${tenantId}:${vehicleId}`
      await cacheService.del(cacheKey)

      logger.info('Vehicle updated', { vehicleId, tenantId })
      res.json({ data: vehicle })
    } catch (error: any) {
      if (error.code === '22P02') {
        return res.status(400).json({
          error: 'Invalid vehicle ID format',
          message: 'Vehicle ID must be a valid UUID'
        })
      }
      throw error
    }
  })
)

// DELETE vehicle
// CRIT-B-003: Added URL parameter validation
router.delete("/:id",
  csrfProtection,
  policyEnforcement(['FLT-SAF-001'], { mode: 'warn', includeInResponse: true }),
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user?.tenant_id
      const vehicleId = req.params.id // Keep as string (UUID)

      if (!tenantId) {
        throw new ValidationError('Tenant ID is required')
      }

      // Use DI-resolved VehicleService
      const vehicleService = container.get<VehicleService>(TYPES.VehicleService)
      const deleted = await vehicleService.deleteVehicle(vehicleId, tenantId)

      if (!deleted) {
        return res.status(404).json({
          error: 'Vehicle not found',
          message: `Vehicle with ID ${vehicleId} not found or does not belong to your organization`
        })
      }

      // Wave 12 (Revised): Invalidate cache on delete
      const cacheKey = `vehicle:${tenantId}:${vehicleId}`
      await cacheService.del(cacheKey)

      logger.info('Vehicle deleted', { vehicleId, tenantId })
      res.json({ message: "Vehicle deleted successfully" })
    } catch (error: any) {
      if (error.code === '22P02') {
        return res.status(400).json({
          error: 'Invalid vehicle ID format',
          message: 'Vehicle ID must be a valid UUID'
        })
      }
      throw error
    }
  })
)

// GET vehicle statistics - Requires authentication + tenant isolation
router.get("/statistics",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenant_id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Cache key for statistics
    const cacheKey = `vehicle:statistics:${tenantId}`
    const cached = await cacheService.get<any>(cacheKey)

    if (cached) {
      logger.debug('Vehicle statistics cache hit', { tenantId })
      return res.json(cached)
    }

    // Use DI-resolved VehicleService
    const vehicleService = container.get<VehicleService>(TYPES.VehicleService)
    const vehicles = await vehicleService.getAllVehicles(tenantId)

    // Calculate statistics
    const statistics = {
      total: vehicles.length,
      byStatus: {
        active: vehicles.filter((v: any) => v.status === 'active').length,
        inactive: vehicles.filter((v: any) => v.status === 'inactive').length,
        maintenance: vehicles.filter((v: any) => v.status === 'maintenance').length,
        retired: vehicles.filter((v: any) => v.status === 'retired').length
      }
    }

    // Cache for 10 minutes
    await cacheService.set(cacheKey, statistics, 600)

    logger.info('Fetched vehicle statistics', { tenantId })
    res.json(statistics)
  })
)

export default router