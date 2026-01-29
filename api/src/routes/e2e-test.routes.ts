/**
 * E2E TEST ROUTES - UNAUTHENTICATED ENDPOINTS FOR TESTING
 *
 * WARNING: These routes bypass authentication for testing purposes.
 * DO NOT deploy to production. Only use for local E2E testing.
 *
 * These endpoints prove the complete workflow:
 * Form → API → Database → UI Display
 */

import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/connection'
import { asyncHandler } from '../middleware/errorHandler'
import { validateBody } from '../middleware/validate'
import logger from '../utils/logger'

const router = Router()

// Schema for creating a user
const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['Admin', 'Manager', 'Driver', 'Viewer']).default('Driver')
})

// Schema for creating maintenance schedule
const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['preventive', 'repair', 'inspection', 'other']).default('preventive'),
  intervalMiles: z.number().int().positive().optional(),
  intervalDays: z.number().int().positive().optional(),
  nextServiceDate: z.string().datetime().optional(),
  estimatedCost: z.number().optional(),
  estimatedDuration: z.number().int().positive().optional()
})

// GET /api/e2e-test/users - Get all users
router.get('/users', asyncHandler(async (req, res) => {
  logger.info('[E2E-TEST] GET /users')

  const result = await pool.query(`
    SELECT
      id,
      tenant_id,
      email,
      first_name,
      last_name,
      phone,
      role,
      is_active,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 100
  `)

  res.json({
    success: true,
    data: result.rows,
    count: result.rowCount,
    timestamp: new Date().toISOString()
  })
}))

// POST /api/e2e-test/users - Create a user
router.post('/users',
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName, phone, role } = req.body

    logger.info('[E2E-TEST] POST /users', { email, firstName, lastName, role })

    // Get first tenant (for testing)
    const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1')
    const tenantId = tenantResult.rows[0]?.id

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'No tenant found in database. Please create a tenant first.'
      })
    }

    // Create user with bcrypt password hash (password: "test123")
    const passwordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWU8u5jO'

    const result = await pool.query(`
      INSERT INTO users (
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        is_active,
        created_at,
        updated_at
    `, [tenantId, email, passwordHash, firstName, lastName, phone || null, role])

    logger.info('[E2E-TEST] User created', { userId: result.rows[0].id })

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// GET /api/e2e-test/maintenance-schedules - Get all maintenance schedules
router.get('/maintenance-schedules', asyncHandler(async (req, res) => {
  logger.info('[E2E-TEST] GET /maintenance-schedules')

  const result = await pool.query(`
    SELECT
      ms.*,
      v.vin,
      v.make,
      v.model,
      v.year
    FROM maintenance_schedules ms
    LEFT JOIN vehicles v ON ms.vehicle_id = v.id
    ORDER BY ms.created_at DESC
    LIMIT 100
  `)

  res.json({
    success: true,
    data: result.rows,
    count: result.rowCount,
    timestamp: new Date().toISOString()
  })
}))

// POST /api/e2e-test/maintenance-schedules - Create a maintenance schedule
router.post('/maintenance-schedules',
  validateBody(createMaintenanceSchema),
  asyncHandler(async (req, res) => {
    const {
      vehicleId,
      name,
      description,
      type,
      intervalMiles,
      intervalDays,
      nextServiceDate,
      estimatedCost,
      estimatedDuration
    } = req.body

    logger.info('[E2E-TEST] POST /maintenance-schedules', { vehicleId, name, type })

    // Get tenant_id from vehicle
    const vehicleResult = await pool.query('SELECT tenant_id FROM vehicles WHERE id = $1', [vehicleId])

    if (vehicleResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found. Please select a valid vehicle.'
      })
    }

    const tenantId = vehicleResult.rows[0].tenant_id

    const result = await pool.query(`
      INSERT INTO maintenance_schedules (
        tenant_id,
        vehicle_id,
        name,
        description,
        type,
        interval_miles,
        interval_days,
        next_service_date,
        estimated_cost,
        estimated_duration,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      RETURNING *
    `, [
      tenantId,
      vehicleId,
      name,
      description || null,
      type,
      intervalMiles || null,
      intervalDays || null,
      nextServiceDate || null,
      estimatedCost || null,
      estimatedDuration || null
    ])

    logger.info('[E2E-TEST] Maintenance schedule created', { scheduleId: result.rows[0].id })

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Maintenance schedule created successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// GET /api/e2e-test/vehicles - Get all vehicles for dropdown
router.get('/vehicles', asyncHandler(async (req, res) => {
  logger.info('[E2E-TEST] GET /vehicles')

  const result = await pool.query(`
    SELECT
      id,
      vin,
      make,
      model,
      year,
      status
    FROM vehicles
    ORDER BY make, model
    LIMIT 100
  `)

  res.json({
    success: true,
    data: result.rows,
    count: result.rowCount,
    timestamp: new Date().toISOString()
  })
}))

// GET /api/e2e-test/health - Health check
router.get('/health', asyncHandler(async (req, res) => {
  const dbResult = await pool.query('SELECT NOW() as db_time, COUNT(*) as user_count FROM users')

  res.json({
    success: true,
    status: 'healthy',
    database: 'connected',
    dbTime: dbResult.rows[0].db_time,
    userCount: dbResult.rows[0].user_count,
    timestamp: new Date().toISOString()
  })
}))

export default router
