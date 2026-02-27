import fs from 'fs'
import path from 'path'

import { Router, Request, Response } from "express"
import multer from 'multer'

import { cacheService } from '../config/cache';
import logger from '../config/logger'; // Wave 10: Add Winston logger
import pool from '../config/database';
import { container } from '../container'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { authenticateJWT } from '../middleware/auth';
import { doubleCsrfProtection as csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { policyEnforcement } from '../middleware/policy-enforcement';
import { requirePermission } from '../middleware/permissions';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
import { VehicleService } from '../modules/fleet/services/vehicle.service'
import { createTelemetrySchema } from '../schemas/telemetry.schema';
import {
  vehicleCreateSchema,
  vehicleUpdateSchema,
  vehicleQuerySchema,
  vehicleIdSchema
} from '../schemas/vehicles.schema';
import { buildInsertClause } from '../utils/sql-safety';
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
    // Support both `limit` (current API schema) and `pageSize` (legacy UI).
    const page = Number(req.query.page ?? 1)
    const rawLimit = req.query.pageSize ?? req.query.limit ?? 20
    const limit = Math.min(Number(rawLimit) || 20, 200)
    const search = req.query.search as string | undefined
    const status = req.query.status as string | undefined
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Wave 12 (Revised): Cache-aside pattern
    // Version cache keys so response shape changes don't serve stale payloads.
    // v3: vehicles now include `location` and `locationAddress` fields (avoid serving stale v2 payloads)
    const cacheKey = `vehicles:v3:list:${tenantId}:${page}:${limit}:${search || ''}:${status || ''}`
    const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey)

    if (cached) {
      return res.json(cached)
    }

    // Use DI-resolved VehicleService
    const vehicleService = container.get<VehicleService>(TYPES.VehicleService)
    const result = await vehicleService.listVehicles(tenantId, { page, limit, search, status })

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, result, 300)

    logger.info('Fetched vehicles', { tenantId, count: result.data.length, total: result.total })
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
      const tenantId = req.user?.tenant_id
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
    } catch (error: unknown) {
      // Handle specific database errors
      if ((error as Record<string, unknown>).code === '22P02') {
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
    const tenantId = req.user?.tenant_id
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

    const tripsResult = await pool.query(
      `SELECT
        mt.id,
        mt.status,
        mt.start_time,
        mt.end_time,
        mt.duration_minutes,
        mt.start_location,
        mt.end_location,
        mt.distance_miles,
        mt.metadata,
        d.first_name,
        d.last_name
      FROM mobile_trips mt
      LEFT JOIN drivers d ON mt.driver_id = d.id
      WHERE mt.tenant_id = $1 AND mt.vehicle_id = $2
      ORDER BY mt.start_time DESC
      LIMIT 200`,
      [tenantId, vehicleId]
    )

    interface TripRow {
      id: string
      status: string
      start_time: string
      end_time: string | null
      duration_minutes: string | null
      start_location: string | null
      end_location: string | null
      distance_miles: string | null
      metadata: Record<string, unknown> | string | null
      first_name: string | null
      last_name: string | null
    }

    const trips = (tripsResult.rows as TripRow[]).map((row) => {
      const metadata: Record<string, unknown> = row.metadata && typeof row.metadata === 'object'
        ? row.metadata
        : row.metadata
          ? (() => {
              try {
                return JSON.parse(row.metadata) as Record<string, unknown>
              } catch {
                return {}
              }
            })()
          : {}
      const durationMinutes = row.duration_minutes ? Number(row.duration_minutes) : null
      const distanceMiles = row.distance_miles ? Number(row.distance_miles) : null
      const avgSpeed = durationMinutes && distanceMiles
        ? distanceMiles / (durationMinutes / 60)
        : null
      const fuelUsed = (metadata?.fuelUsed ?? metadata?.fuel_used ?? null) as number | null

      const durationString = durationMinutes !== null
        ? `${Math.floor(durationMinutes / 60)}h ${Math.round(durationMinutes % 60)}m`
        : null

      return {
        id: row.id,
        status: row.status,
        driver_name: row.first_name ? `${row.first_name} ${row.last_name || ''}`.trim() : undefined,
        start_time: row.start_time,
        end_time: row.end_time,
        duration: durationString || undefined,
        start_location: row.start_location,
        end_location: row.end_location,
        distance: distanceMiles ?? undefined,
        avg_speed: avgSpeed ?? undefined,
        fuel_used: fuelUsed ?? undefined
      }
    })

    // Cache for 5 minutes
    await cacheService.set(cacheKey, trips, 300)

    logger.info('Fetched vehicle trips', { vehicleId, tenantId, count: trips.length })
    res.json(trips)
  })
)

// GET vehicle maintenance (work orders) - Requires authentication + tenant isolation
router.get("/:id/maintenance",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id
    const vehicleId = req.params.id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const cacheKey = `vehicle:${tenantId}:${vehicleId}:maintenance`
    const cached = await cacheService.get<any[]>(cacheKey)

    if (cached) {
      logger.debug('Vehicle maintenance cache hit', { vehicleId, tenantId })
      return res.json({ data: cached })
    }

    const result = await pool.query(
      `SELECT
        id,
        number,
        scheduled_start_date,
        type,
        work_type,
        description,
        total_cost,
        actual_cost,
        status,
        odometer_at_start
      FROM work_orders
      WHERE vehicle_id = $1 AND tenant_id = $2
      ORDER BY scheduled_start_date DESC NULLS LAST
      LIMIT 200`,
      [vehicleId, tenantId]
    )

    const records = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      work_order_number: row.number || '',
      date: row.scheduled_start_date || row.created_at || '',
      type: row.work_type || row.type || 'general',
      description: row.description || '',
      cost: row.total_cost != null ? Number(row.total_cost) : (row.actual_cost != null ? Number(row.actual_cost) : 0),
      status: row.status || 'unknown',
      mileage: row.odometer_at_start != null ? Number(row.odometer_at_start) : undefined,
    }))

    await cacheService.set(cacheKey, records, 300)

    logger.info('Fetched vehicle maintenance', { vehicleId, tenantId, count: records.length })
    res.json({ data: records })
  })
)

// GET vehicle incidents - Requires authentication + tenant isolation
router.get("/:id/incidents",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id
    const vehicleId = req.params.id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const cacheKey = `vehicle:${tenantId}:${vehicleId}:incidents`
    const cached = await cacheService.get<any[]>(cacheKey)

    if (cached) {
      logger.debug('Vehicle incidents cache hit', { vehicleId, tenantId })
      return res.json({ data: cached })
    }

    const result = await pool.query(
      `SELECT
        id,
        number,
        incident_date,
        type,
        severity,
        description,
        estimated_cost,
        actual_cost,
        status
      FROM incidents
      WHERE vehicle_id = $1 AND tenant_id = $2
      ORDER BY incident_date DESC NULLS LAST
      LIMIT 200`,
      [vehicleId, tenantId]
    )

    const records = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      incident_number: row.number || '',
      date: row.incident_date || '',
      type: row.type || 'unknown',
      severity: row.severity || 'unknown',
      description: row.description || '',
      cost: row.actual_cost != null ? Number(row.actual_cost) : (row.estimated_cost != null ? Number(row.estimated_cost) : undefined),
      status: row.status || 'unknown',
    }))

    await cacheService.set(cacheKey, records, 300)

    logger.info('Fetched vehicle incidents', { vehicleId, tenantId, count: records.length })
    res.json({ data: records })
  })
)

// GET vehicle inspections - Requires authentication + tenant isolation
router.get("/:id/inspections",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id
    const vehicleId = req.params.id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const cacheKey = `vehicle:${tenantId}:${vehicleId}:inspections`
    const cached = await cacheService.get<any[]>(cacheKey)

    if (cached) {
      logger.debug('Vehicle inspections cache hit', { vehicleId, tenantId })
      return res.json({ data: cached })
    }

    const result = await pool.query(
      `SELECT
        id,
        type,
        status,
        started_at,
        completed_at,
        inspector_name,
        passed_inspection,
        defects_found,
        notes,
        created_at
      FROM inspections
      WHERE vehicle_id = $1 AND tenant_id = $2
      ORDER BY started_at DESC NULLS LAST
      LIMIT 200`,
      [vehicleId, tenantId]
    )

    const records = result.rows.map((row: Record<string, unknown>) => {
      // Derive result from passed_inspection boolean and defects_found count
      let inspectionResult: 'passed' | 'failed' | 'warning' = 'passed'
      if (row.passed_inspection === false) {
        inspectionResult = 'failed'
      } else if (row.defects_found != null && Number(row.defects_found) > 0) {
        inspectionResult = 'warning'
      }

      return {
        id: row.id,
        inspection_number: `INS-${String(row.id).slice(0, 8).toUpperCase()}`,
        date: row.started_at || row.created_at || '',
        type: row.type || 'general',
        result: inspectionResult,
        inspector_name: row.inspector_name || undefined,
        notes: row.notes || undefined,
      }
    })

    await cacheService.set(cacheKey, records, 300)

    logger.info('Fetched vehicle inspections', { vehicleId, tenantId, count: records.length })
    res.json({ data: records })
  })
)

// GET vehicle fuel records - Requires authentication + tenant isolation
router.get("/:id/fuel",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id
    const vehicleId = req.params.id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const cacheKey = `vehicle:${tenantId}:${vehicleId}:fuel`
    const cached = await cacheService.get<any[]>(cacheKey)

    if (cached) {
      logger.debug('Vehicle fuel cache hit', { vehicleId, tenantId })
      return res.json({ data: cached })
    }

    const result = await pool.query(
      `SELECT
        id,
        transaction_date,
        gallons,
        quantity_gallons,
        total_cost,
        location,
        location_name,
        odometer
      FROM fuel_transactions
      WHERE vehicle_id = $1 AND tenant_id = $2
      ORDER BY transaction_date DESC NULLS LAST
      LIMIT 200`,
      [vehicleId, tenantId]
    )

    const records = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      date: row.transaction_date || '',
      gallons: row.gallons != null ? Number(row.gallons) : (row.quantity_gallons != null ? Number(row.quantity_gallons) : 0),
      cost: row.total_cost != null ? Number(row.total_cost) : 0,
      location: row.location_name || row.location || undefined,
      odometer: row.odometer != null ? Number(row.odometer) : undefined,
    }))

    await cacheService.set(cacheKey, records, 300)

    logger.info('Fetched vehicle fuel records', { vehicleId, tenantId, count: records.length })
    res.json({ data: records })
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
    const tenantId = req.user?.tenant_id

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
      const tenantId = req.user?.tenant_id
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
    } catch (error: unknown) {
      if ((error as Record<string, unknown>).code === '22P02') {
        return res.status(400).json({
          error: 'Invalid vehicle ID format',
          message: 'Vehicle ID must be a valid UUID'
        })
      }
      throw error
    }
  })
)

// POST vehicle telemetry - Lightweight ingestion endpoint
router.post(
  "/:id/telemetry",
  csrfProtection,
  requirePermission('telemetry:create:fleet'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const payload = {
      ...req.body,
      vehicle_id: req.params.id,
      timestamp: req.body.timestamp || new Date().toISOString()
    }

    const validation = createTelemetrySchema.safeParse(payload)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid telemetry data',
        details: validation.error.issues
      })
    }

    const { columnNames, placeholders, values } = buildInsertClause(
      validation.data,
      ['tenant_id'],
      1
    )

    const result = await pool.query(
      `INSERT INTO telemetry_data (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      [tenantId, ...values]
    )

    res.status(201).json({ data: result.rows[0] })
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
      const tenantId = req.user?.tenant_id
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
      res.json({ success: true, message: "Vehicle deleted successfully" })
    } catch (error: unknown) {
      if ((error as Record<string, unknown>).code === '22P02') {
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
    const tenantId = req.user?.tenant_id

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
        active: vehicles.filter((v: Record<string, unknown>) => v.status === 'active').length,
        inactive: vehicles.filter((v: Record<string, unknown>) => v.status === 'inactive').length,
        maintenance: vehicles.filter((v: Record<string, unknown>) => v.status === 'maintenance').length,
        retired: vehicles.filter((v: Record<string, unknown>) => v.status === 'retired').length
      }
    }

    // Cache for 10 minutes
    await cacheService.set(cacheKey, statistics, 600)

    logger.info('Fetched vehicle statistics', { tenantId })
    res.json(statistics)
  })
)

// Configure multer for vehicle photo uploads (disk storage)
const photoStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const vehicleId = req.params.id
    const uploadDir = path.resolve(process.cwd(), 'uploads', 'vehicles', vehicleId)
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueSuffix}${ext}`)
  }
})

const photoUpload = multer({
  storage: photoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }
    cb(null, true)
  }
})

// GET vehicle condition data for HealthScoreBreakdown (real telemetry from DB)
router.get("/:id/condition",
  requirePermission('vehicle:view:own'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id
    const vehicleId = req.params.id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // Verify vehicle belongs to tenant
    const vehicleCheck = await pool.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2`,
      [vehicleId, tenantId]
    )

    if (vehicleCheck.rows.length === 0) {
      throw new NotFoundError('Vehicle not found')
    }

    // Get the latest telemetry record for this vehicle
    const telemetryResult = await pool.query(
      `SELECT
        oil_life_percent,
        battery_percent,
        battery_voltage_12v,
        tire_pressure_fl,
        tire_pressure_fr,
        tire_pressure_rl,
        tire_pressure_rr,
        fuel_percent,
        coolant_temp_f,
        raw_data,
        timestamp
      FROM vehicle_telemetry
      WHERE vehicle_id = $1 AND tenant_id = $2
      ORDER BY timestamp DESC
      LIMIT 1`,
      [vehicleId, tenantId]
    )

    if (telemetryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No telemetry data found for this vehicle',
      })
    }

    const row = telemetryResult.rows[0]
    const rawData = row.raw_data || {}

    // Map battery_voltage_12v to health %: 12V+ = 100%, 11V = 50%, 10V- = 0%
    const mapBatteryVoltage = (v: number | null): number => {
      if (v === null || v === undefined) return 0
      if (v >= 12) return 100
      if (v <= 10) return 0
      return Math.round(((v - 10) / 2) * 100)
    }

    const batteryHealth =
      row.battery_percent != null
        ? Number(row.battery_percent)
        : mapBatteryVoltage(row.battery_voltage_12v != null ? Number(row.battery_voltage_12v) : null)

    const FRONT_RECOMMENDED_PSI = 32
    const REAR_RECOMMENDED_PSI = 35

    const conditionData = {
      engine: {
        oilLife: row.oil_life_percent != null ? Number(row.oil_life_percent) : 0,
      },
      battery: {
        health: batteryHealth,
      },
      brakes: {
        frontPadLife: rawData.brake_pad_front_percent != null ? Number(rawData.brake_pad_front_percent) : 0,
        rearPadLife: rawData.brake_pad_rear_percent != null ? Number(rawData.brake_pad_rear_percent) : 0,
      },
      tires: {
        frontLeft: {
          pressure: row.tire_pressure_fl != null ? Number(row.tire_pressure_fl) : 0,
          recommendedPressure: FRONT_RECOMMENDED_PSI,
        },
        frontRight: {
          pressure: row.tire_pressure_fr != null ? Number(row.tire_pressure_fr) : 0,
          recommendedPressure: FRONT_RECOMMENDED_PSI,
        },
        rearLeft: {
          pressure: row.tire_pressure_rl != null ? Number(row.tire_pressure_rl) : 0,
          recommendedPressure: REAR_RECOMMENDED_PSI,
        },
        rearRight: {
          pressure: row.tire_pressure_rr != null ? Number(row.tire_pressure_rr) : 0,
          recommendedPressure: REAR_RECOMMENDED_PSI,
        },
      },
    }

    res.json({
      success: true,
      data: conditionData,
      meta: {
        vehicleId,
        telemetryTimestamp: row.timestamp,
      },
    })
  })
)

// POST vehicle photos - Upload photos for a vehicle
router.post("/:id/photos",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'vehicle'
  }),
  validateParams(vehicleIdSchema),
  photoUpload.array('photos', 20),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id
    const vehicleId = req.params.id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        error: 'No photo files provided',
        message: 'At least one image file is required in the "photos" field'
      })
    }

    // Verify the vehicle exists and belongs to this tenant
    const vehicleService = container.get<VehicleService>(TYPES.VehicleService)
    const vehicle = await vehicleService.getVehicleById(vehicleId, tenantId)

    if (!vehicle) {
      // Clean up uploaded files if vehicle not found
      for (const file of req.files) {
        fs.unlink(file.path, () => {})
      }
      return res.status(404).json({
        error: 'Vehicle not found',
        message: `Vehicle with ID ${vehicleId} not found or does not belong to your organization`
      })
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      path: `/uploads/vehicles/${vehicleId}/${file.filename}`
    }))

    logger.info('Vehicle photos uploaded', {
      vehicleId,
      tenantId,
      count: uploadedFiles.length,
      totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0)
    })

    res.status(201).json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} photo(s) uploaded successfully`
    })
  })
)

export default router
