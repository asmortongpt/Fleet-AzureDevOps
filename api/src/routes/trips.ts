import express, { Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import pool from '../config/database'
import logger from '../config/logger'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { setTenantContext } from '../middleware/tenant-context'

const router = express.Router()

router.use(helmet())
router.use(authenticateJWT)
router.use(setTenantContext)
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}))

// CSRF protection on mutations
router.post('/', csrfProtection)
router.put('/:id', csrfProtection)
router.delete('/:id', csrfProtection)

// Response transformer to convert DB fields to API contract
const transformTripResponse = (dbRow: any) => ({
  id: dbRow.id,
  tenantId: dbRow.tenant_id,
  vehicleId: dbRow.vehicle_id,
  driverId: dbRow.driver_id,
  status: dbRow.status,
  startTime: dbRow.start_time,
  endTime: dbRow.end_time,
  durationSeconds: dbRow.duration_seconds,
  startLocation: dbRow.start_location,
  endLocation: dbRow.end_location,
  startOdometerMiles: dbRow.start_odometer_miles,
  endOdometerMiles: dbRow.end_odometer_miles,
  distanceMiles: dbRow.distance_miles,
  avgSpeedMph: dbRow.avg_speed_mph,
  maxSpeedMph: dbRow.max_speed_mph,
  idleTimeSeconds: dbRow.idle_time_seconds,
  fuelConsumedGallons: dbRow.fuel_consumed_gallons,
  fuelEfficiencyMpg: dbRow.fuel_efficiency_mpg,
  fuelCost: dbRow.fuel_cost,
  driverScore: dbRow.driver_score,
  harshAccelerationCount: dbRow.harsh_acceleration_count,
  harshBrakingCount: dbRow.harsh_braking_count,
  harshCorneringCount: dbRow.harsh_cornering_count,
  speedingCount: dbRow.speeding_count,
  usageType: dbRow.usage_type,
  businessPurpose: dbRow.business_purpose,
  classificationStatus: dbRow.classification_status,
  metadata: dbRow.metadata,
  createdAt: dbRow.created_at,
  updatedAt: dbRow.updated_at,
  // Joined fields
  vehicleName: dbRow.vehicle_name,
  licensePlate: dbRow.license_plate,
  driverName: dbRow.driver_name
})

// GET /trips/active - Get all active trips (MUST be before /:id)
router.get(
  '/active',
  requirePermission('trip:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Row-level filtering: check if user is a driver
      const userResult = await pool.query(
        `SELECT u.id, d.id as driver_id FROM users u LEFT JOIN drivers d ON d.user_id = u.id WHERE u.id = $1 AND u.tenant_id = $2`,
        [req.user!.id, req.user!.tenant_id]
      )

      let query = `
        SELECT
          t.id,
          t.tenant_id,
          t.vehicle_id,
          t.driver_id,
          t.trip_number,
          t.started_at as start_time,
          t.ended_at as end_time,
          t.duration_minutes * 60 as duration_seconds,
          t.start_address as start_location,
          t.end_address as end_location,
          t.start_odometer as start_odometer_miles,
          t.end_odometer as end_odometer_miles,
          t.distance_km * 0.621371 as distance_miles,
          t.avg_speed_kph * 0.621371 as avg_speed_mph,
          t.max_speed_kph * 0.621371 as max_speed_mph,
          t.idle_time_minutes * 60 as idle_time_seconds,
          t.fuel_consumed_liters * 0.264172 as fuel_consumed_gallons,
          t.usage_type,
          t.business_purpose,
          t.metadata,
          t.created_at,
          CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_name,
          v.license_plate,
          CONCAT(u2.first_name, ' ', u2.last_name) as driver_name,
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.started_at)) / 60 as duration_minutes_live
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN drivers d ON t.driver_id = d.id
        LEFT JOIN users u2 ON d.user_id = u2.id
        WHERE t.tenant_id = $1
          AND t.ended_at IS NULL
      `

      const params: any[] = [req.user!.tenant_id]

      // If user is a driver, filter to only their trips
      if (userResult.rows.length > 0 && userResult.rows[0].driver_id) {
        query += ` AND t.driver_id = $2`
        params.push(userResult.rows[0].id)
      }

      query += ` ORDER BY t.started_at DESC`

      const result = await pool.query(query, params)

      res.json({
        data: result.rows.map(transformTripResponse),
        total: result.rows.length
      })
    } catch (error) {
      logger.error('Get active trips error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /trips - Get all trips with pagination and filters
router.get(
  '/',
  requirePermission('trip:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        pageSize = 50,
        status,
        driverId,
        vehicleId,
        startDate,
        endDate,
        usageType,
        classificationStatus
      } = req.query

      const offset = (Number(page) - 1) * Number(pageSize)

      // Row-level filtering: check if user is a driver
      const userResult = await pool.query(
        `SELECT u.id, d.id as driver_id FROM users u LEFT JOIN drivers d ON d.user_id = u.id WHERE u.id = $1 AND u.tenant_id = $2`,
        [req.user!.id, req.user!.tenant_id]
      )

      let query = `
        SELECT
          t.id,
          t.tenant_id,
          t.vehicle_id,
          t.driver_id,
          t.trip_number,
          t.started_at as start_time,
          t.ended_at as end_time,
          t.duration_minutes * 60 as duration_seconds,
          t.start_address as start_location,
          t.end_address as end_location,
          t.start_odometer as start_odometer_miles,
          t.end_odometer as end_odometer_miles,
          t.distance_km * 0.621371 as distance_miles,
          t.avg_speed_kph * 0.621371 as avg_speed_mph,
          t.max_speed_kph * 0.621371 as max_speed_mph,
          t.idle_time_minutes * 60 as idle_time_seconds,
          t.fuel_consumed_liters * 0.264172 as fuel_consumed_gallons,
          t.usage_type,
          t.business_purpose,
          t.metadata,
          t.created_at,
          CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_name,
          v.license_plate,
          CONCAT(u.first_name, ' ', u.last_name) as driver_name
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN drivers d ON t.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE t.tenant_id = $1
      `

      let countQuery = `SELECT COUNT(*) FROM trips t WHERE t.tenant_id = $1`
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      // If user is a driver, filter to only their trips
      if (userResult.rows.length > 0 && userResult.rows[0].driver_id) {
        query += ` AND t.driver_id = $${paramIndex}`
        countQuery += ` AND t.driver_id = $${paramIndex}`
        params.push(userResult.rows[0].id)
        paramIndex++
      }

      // Apply filters
      if (status) {
        // trips table has no status column; filter by ended_at presence
        if (status === 'completed') {
          query += ` AND t.ended_at IS NOT NULL`
          countQuery += ` AND t.ended_at IS NOT NULL`
        } else if (status === 'in_progress') {
          query += ` AND t.ended_at IS NULL`
          countQuery += ` AND t.ended_at IS NULL`
        }
      }

      if (driverId) {
        query += ` AND t.driver_id = $${paramIndex}`
        countQuery += ` AND t.driver_id = $${paramIndex}`
        params.push(driverId)
        paramIndex++
      }

      if (vehicleId) {
        query += ` AND t.vehicle_id = $${paramIndex}`
        countQuery += ` AND t.vehicle_id = $${paramIndex}`
        params.push(vehicleId)
        paramIndex++
      }

      if (startDate) {
        query += ` AND t.started_at >= $${paramIndex}`
        countQuery += ` AND t.started_at >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        query += ` AND t.started_at <= $${paramIndex}`
        countQuery += ` AND t.started_at <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      if (usageType) {
        query += ` AND t.usage_type = $${paramIndex}`
        countQuery += ` AND t.usage_type = $${paramIndex}`
        params.push(usageType)
        paramIndex++
      }

      // classification_status not in trips table - skip filter

      query += ` ORDER BY t.started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(pageSize, offset)

      const result = await pool.query(query, params)
      const countResult = await pool.query(countQuery, params.slice(0, -2))

      res.json({
        data: result.rows.map(transformTripResponse),
        pagination: {
          page: Number(page),
          limit: Number(pageSize),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(pageSize))
        }
      })
    } catch (error) {
      logger.error('Get trips error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /trips/my-personal - Recent personal or mixed-use trips for the current user
// MUST be before /:id
router.get(
  '/my-personal',
  requirePermission('trip:view:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100)
      const tenantId = req.user!.tenant_id
      const userId = req.user!.id
      const client = req.dbClient

      if (!client) {
        return res.status(500).json({ error: 'Tenant context not initialized' })
      }

      const policyRes = await client.query(
        `SELECT personal_use_rate
         FROM personal_use_policies
         WHERE tenant_id = $1 AND is_active = true
         ORDER BY effective_date DESC NULLS LAST, created_at DESC
         LIMIT 1`,
        [tenantId]
      )
      const rate = Number(policyRes.rows[0]?.personal_use_rate) || 0

      const tripsRes = await client.query(
        `
        SELECT
          t.id,
          t.trip_date,
          COALESCE(t.miles_personal, 0) AS miles_personal,
          COALESCE(t.miles_total, 0) AS miles_total,
          t.usage_type,
          t.approval_status,
          ROUND((COALESCE(t.miles_personal, 0) * $2)::numeric, 2) AS estimated_charge,
          v.make,
          v.model,
          v.license_plate
        FROM trip_usage_classification t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        WHERE t.tenant_id = $1
          AND t.driver_id = $3
          AND t.usage_type IN ('personal', 'mixed')
        ORDER BY t.trip_date DESC, t.created_at DESC
        LIMIT $4
        `,
        [tenantId, rate, userId, limit]
      )

      return res.json(tripsRes.rows)
    } catch (error) {
      logger.error('Get my personal trips error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /trips/:id - Get a single trip
router.get(
  '/:id',
  requirePermission('trip:view:own'),
  auditLog({ action: 'READ', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          t.id,
          t.tenant_id,
          t.vehicle_id,
          t.driver_id,
          t.trip_number,
          t.started_at as start_time,
          t.ended_at as end_time,
          t.duration_minutes * 60 as duration_seconds,
          t.start_address as start_location,
          t.end_address as end_location,
          t.start_odometer as start_odometer_miles,
          t.end_odometer as end_odometer_miles,
          t.distance_km * 0.621371 as distance_miles,
          t.avg_speed_kph * 0.621371 as avg_speed_mph,
          t.max_speed_kph * 0.621371 as max_speed_mph,
          t.idle_time_minutes * 60 as idle_time_seconds,
          t.fuel_consumed_liters * 0.264172 as fuel_consumed_gallons,
          t.usage_type,
          t.business_purpose,
          t.metadata,
          t.created_at,
          CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_name,
          v.license_plate,
          CONCAT(u2.first_name, ' ', u2.last_name) as driver_name
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN drivers dr ON t.driver_id = dr.id
        LEFT JOIN users u2 ON dr.user_id = u2.id
        WHERE t.id = $1 AND t.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' })
      }

      // IDOR protection: Check if user has access to this trip
      const userResult = await pool.query(
        `SELECT u.id, d.id as driver_id FROM users u LEFT JOIN drivers d ON d.user_id = u.id WHERE u.id = $1 AND u.tenant_id = $2`,
        [req.user!.id, req.user!.tenant_id]
      )

      const user = userResult.rows[0]
      const trip = result.rows[0]

      // If user is a driver, verify the trip belongs to them
      if (user?.driver_id && trip.driver_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      res.json({ data: transformTripResponse(trip) })
    } catch (error) {
      logger.error('Get trip error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
