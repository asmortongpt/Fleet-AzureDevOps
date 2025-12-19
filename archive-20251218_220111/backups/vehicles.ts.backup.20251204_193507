import { Router } from "express"
import { cacheService } from '../config/cache';
import {
  vehicleCreateSchema,
  vehicleUpdateSchema,
  vehicleQuerySchema,
  vehicleIdSchema
} from '../schemas/vehicles.schema';
import { validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
import logger from '../config/logger'; // Wave 10: Add Winston logger
import { vehicleEmulator } from "../emulators/VehicleEmulator"
import { authenticateJWT } from '../middleware/auth';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';

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
  async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search, status } = req.query

    // Wave 12 (Revised): Cache-aside pattern
    const cacheKey = `vehicles:list:${page}:${pageSize}:${search || ''}:${status || ''}`
    const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey)

    if (cached) {
      return res.json(cached)
    }

    let vehicles = vehicleEmulator.getAll()

    // Apply search filter
    if (search && typeof search === 'string') {
      vehicles = vehicleEmulator.search(search)
    }

    // Apply status filter
    if (status && typeof status === 'string') {
      vehicles = vehicleEmulator.filterByStatus(status)
    }

    // Apply pagination
    const total = vehicles.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = vehicles.slice(offset, offset + Number(pageSize))

    const result = { data, total }

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, result, 300)

    res.json(result)
  } catch (error) {
    logger.error('Failed to fetch vehicles', { error }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to fetch vehicles" })
  }
})

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
  async (req, res) => {
  try {
    // Wave 12 (Revised): Cache-aside pattern for single vehicle
    const cacheKey = `vehicle:${req.params.id}`
    const cached = await cacheService.get<any>(cacheKey)

    if (cached) {
      return res.json({ data: cached })
    }

    const vehicle = vehicleEmulator.getById(Number(req.params.id))
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" })

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, vehicle, 600)

    res.json({ data: vehicle })
  } catch (error) {
    logger.error('Failed to fetch vehicle', { error, vehicleId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to fetch vehicle" })
  }
})

// POST create vehicle - Requires admin or manager role
// CRIT-B-003: Comprehensive input validation with sanitization
router.post("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateBody(vehicleCreateSchema),
  async (req, res) => {
  try {
    const vehicle = vehicleEmulator.create(req.body)

    // Wave 12 (Revised): Invalidate list cache on create
    // Delete all vehicles:list:* keys to ensure fresh data
    const pattern = 'vehicles:list:*'
    // Note: In production with Redis, use SCAN to find and delete matching keys
    // For now, we rely on TTL expiration

    res.status(201).json({ data: vehicle })
  } catch (error) {
    logger.error('Failed to create vehicle', { error }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to create vehicle" })
  }
})

// PUT update vehicle - Requires admin or manager role + tenant isolation
// CRIT-B-003: Validates both URL params and request body
router.put("/:id",
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
  async (req, res) => {
  try {
    const vehicle = vehicleEmulator.update(Number(req.params.id), req.body)
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" })

    // Wave 12 (Revised): Invalidate cache on update
    const cacheKey = `vehicle:${req.params.id}`
    await cacheService.del(cacheKey)

    res.json({ data: vehicle })
  } catch (error) {
    logger.error('Failed to update vehicle', { error, vehicleId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to update vehicle" })
  }
})

// DELETE vehicle
// CRIT-B-003: Added URL parameter validation
router.delete("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  async (req, res) => {
  try {
    const deleted = vehicleEmulator.delete(Number(req.params.id))
    if (!deleted) return res.status(404).json({ error: "Vehicle not found" })

    // Wave 12 (Revised): Invalidate cache on delete
    const cacheKey = `vehicle:${req.params.id}`
    await cacheService.del(cacheKey)

    res.json({ message: "Vehicle deleted successfully" })
  } catch (error) {
    logger.error('Failed to delete vehicle', { error, vehicleId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to delete vehicle" })
  }
})

export default router
