import { Router } from "express"
import { cacheService } from '../config/cache'; // Wave 12 (Revised): Add Redis caching
import {
  driverCreateSchema,
  driverUpdateSchema,
  driverQuerySchema,
  driverIdSchema
} from '../schemas/drivers.schema';
import { validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
import logger from '../config/logger'; // Wave 10: Add Winston logger
import { driverEmulator } from "../emulators/DriverEmulator"
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
  async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search, status } = req.query

    // Wave 12 (Revised): Cache-aside pattern
    const cacheKey = `drivers:list:${page}:${pageSize}:${search || ''}:${status || ''}`
    const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey)

    if (cached) {
      return res.json(cached)
    }

    let drivers = driverEmulator.getAll()

    // Apply search filter
    if (search && typeof search === 'string') {
      drivers = driverEmulator.search(search)
    }

    // Apply status filter
    if (status && typeof status === 'string') {
      drivers = drivers.filter(d => d.status === status)
    }

    // Apply pagination
    const total = drivers.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = drivers.slice(offset, offset + Number(pageSize))

    const result = { data, total }

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, result, 300)

    res.json(result)
  } catch (error) {
    logger.error('Failed to fetch drivers', { error }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to fetch drivers" })
  }
})

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
  async (req, res) => {
  try {
    // Wave 12 (Revised): Cache-aside pattern for single driver
    const cacheKey = `driver:${req.params.id}`
    const cached = await cacheService.get<any>(cacheKey)

    if (cached) {
      return res.json({ data: cached })
    }

    const driver = driverEmulator.getById(Number(req.params.id))
    if (!driver) return res.status(404).json({ error: "Driver not found" })

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, driver, 600)

    res.json({ data: driver })
  } catch (error) {
    logger.error('Failed to fetch driver', { error, driverId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to fetch driver" })
  }
})

// POST create driver - Requires admin or manager role
router.post("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.DRIVER_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validate(driverCreateSchema),
  async (req, res) => { // Wave 9: Add Zod validation
  try {
    const driver = driverEmulator.create(req.body)
    res.status(201).json({ data: driver })
  } catch (error) {
    logger.error('Failed to create driver', { error }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to create driver" })
  }
})

// PUT update driver - Requires admin or manager role + tenant isolation
router.put("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.DRIVER_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'driver'
  }),
  validate(driverUpdateSchema),
  async (req, res) => { // Wave 9: Add Zod validation
  try {
    const driver = driverEmulator.update(Number(req.params.id), req.body)
    if (!driver) return res.status(404).json({ error: "Driver not found" })

    // Wave 12 (Revised): Invalidate cache on update
    const cacheKey = `driver:${req.params.id}`
    await cacheService.del(cacheKey)

    res.json({ data: driver })
  } catch (error) {
    logger.error('Failed to update driver', { error, driverId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to update driver" })
  }
})

// DELETE driver
router.delete("/:id", async (req, res) => {
  try {
    const deleted = driverEmulator.delete(Number(req.params.id))
    if (!deleted) return res.status(404).json({ error: "Driver not found" })

    // Wave 12 (Revised): Invalidate cache on delete
    const cacheKey = `driver:${req.params.id}`
    await cacheService.del(cacheKey)

    res.json({ message: "Driver deleted successfully" })
  } catch (error) {
    logger.error('Failed to delete driver', { error, driverId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to delete driver" })
  }
})

export default router
