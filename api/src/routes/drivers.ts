import express, { Response } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { doubleCsrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { tenantSafeQuery } from '../utils/dbHelpers'
import { applyFieldMasking } from '../utils/fieldMasking'
import { logger } from '../utils/logger'


const router = express.Router()

router.use(helmet())
router.use(authenticateJWT)
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}))

const createDriverSchema = z.object({
  name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(7),
  user_id: z.string().uuid().optional(),
  license_number: z.string().min(1),
  license_state: z.string().length(2).optional(),
  license_expiration: z.string(),
  cdl_class: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'terminated', 'on_leave', 'training']).optional()
})

const updateDriverSchema = createDriverSchema.partial()

const splitDriverName = (name?: string) => {
  if (!name) {
return { firstName: '', lastName: '' }
}
  const parts = name.trim().split(/\s+/)
  const firstName = parts.shift() || ''
  const lastName = parts.join(' ')
  return { firstName, lastName }
}

// GET /drivers
router.get(
  '/',
  requirePermission('driver:view:team'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Query drivers with user info from JOIN
      const result = await tenantSafeQuery(
        `SELECT
          d.id,
          d.tenant_id,
          d.user_id,
          d.license_number,
          d.license_state,
          d.license_expiration,
          d.cdl_class,
          d.cdl_endorsements,
          d.hire_date,
          d.termination_date,
          d.status,
          d.safety_score,
          d.emergency_contact_name,
          d.emergency_contact_phone,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.role,
          d.created_at,
          d.updated_at,
          d.employment_classification,
          d.last_drug_test_date,
          d.last_drug_test_result,
          d.last_alcohol_test_date,
          d.last_alcohol_test_result,
          d.background_check_date,
          d.background_check_status,
          d.mvr_check_date,
          d.mvr_status,
          d.medical_card_expiration,
          d.address,
          d.city,
          d.state,
          d.zip_code
        FROM drivers d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.tenant_id = $1
        ORDER BY d.created_at DESC
        LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id!, limit, offset],
        req.user!.tenant_id!
      )

      const countResult = await tenantSafeQuery(
        'SELECT COUNT(*) FROM drivers WHERE tenant_id = $1',
        [req.user!.tenant_id!],
        req.user!.tenant_id!
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      logger.error(`Get drivers error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// GET /drivers/active - Get all active drivers (MUST be before /:id)
router.get(
  '/active',
  requirePermission('driver:view:team'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'drivers' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Query active drivers with user info from JOIN
      const result = await tenantSafeQuery(
        `SELECT
          d.id,
          d.tenant_id,
          d.user_id,
          d.license_number,
          d.license_state,
          d.license_expiration,
          d.cdl_class,
          d.status,
          d.safety_score,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.role,
          d.created_at,
          d.updated_at,
          0 as active_trips
        FROM drivers d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.tenant_id = $1
          AND d.status = 'active'
        ORDER BY u.first_name, u.last_name`,
        [req.user!.tenant_id!],
        req.user!.tenant_id!
      )

      res.json({
        data: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      logger.error(`Get active drivers error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// GET /drivers/statistics - Get driver statistics (MUST be before /:id)
router.get(
  '/statistics',
  requirePermission('driver:view:team'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'drivers' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Get overall driver statistics
      const statsResult = await tenantSafeQuery(
        `SELECT
          COUNT(*) as total_drivers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_drivers,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_drivers,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_drivers,
          AVG(safety_score) as avg_performance_score
        FROM drivers d
        WHERE tenant_id = $1`,
        [req.user!.tenant_id!],
        req.user!.tenant_id!
      )

      const stats = statsResult.rows[0]

      if (!stats) {
        return res.json({
          data: {
            total_drivers: 0,
            active_drivers: 0,
            inactive_drivers: 0,
            suspended_drivers: 0,
            avg_performance_score: 0,
            drivers_with_trips_last_30_days: 0,
            total_trips_last_30_days: 0,
            total_miles_last_30_days: 0,
            avg_driver_score_last_30_days: 0
          }
        })
      }

      // Get trip statistics from the trips table
      const tripStatsResult = await tenantSafeQuery(
        `SELECT
          COUNT(DISTINCT driver_id) as drivers_with_trips,
          COUNT(*) as total_trips,
          COALESCE(SUM(distance_miles), 0) as total_miles,
          COALESCE(AVG(driver_score), 0) as avg_driver_score
        FROM trips
        WHERE tenant_id = $1
          AND start_time >= NOW() - INTERVAL '30 days'`,
        [req.user!.tenant_id!],
        req.user!.tenant_id!
      )

      const tripStats = tripStatsResult.rows[0] || {}

      res.json({
        data: {
          total_drivers: parseInt(stats.total_drivers) || 0,
          active_drivers: parseInt(stats.active_drivers) || 0,
          inactive_drivers: parseInt(stats.inactive_drivers) || 0,
          suspended_drivers: parseInt(stats.suspended_drivers) || 0,
          avg_performance_score: stats.avg_performance_score !== null && stats.avg_performance_score !== undefined ? parseFloat(stats.avg_performance_score) : 0,
          drivers_with_trips_last_30_days: parseInt(tripStats.drivers_with_trips) || 0,
          total_trips_last_30_days: parseInt(tripStats.total_trips) || 0,
          total_miles_last_30_days: parseFloat(tripStats.total_miles) || 0,
          avg_driver_score_last_30_days: parseFloat(tripStats.avg_driver_score) || 0
        }
      })
    } catch (error) {
      logger.error(`Get driver statistics error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// GET /drivers/performance-trend - Monthly driver performance trend data (MUST be before /:id)
router.get(
  '/performance-trend',
  requirePermission('driver:view:team'),
  auditLog({ action: 'READ', resourceType: 'driver_scores_history' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id!

      const result = await tenantSafeQuery(
        `SELECT
          TO_CHAR(DATE_TRUNC('month', date), 'Mon YY') as month_label,
          DATE_TRUNC('month', date) as month,
          ROUND(AVG(safety_score)) as avg_score,
          SUM(harsh_events_count + speeding_events_count) as violations
        FROM driver_scores_history
        WHERE tenant_id = $1
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month`,
        [tenantId],
        tenantId
      )

      const data = result.rows.map((row: any) => ({
        date: row.month_label,
        avgScore: row.avg_score !== null ? Number(row.avg_score) : 0,
        violations: row.violations !== null ? Number(row.violations) : 0
      }))

      res.json({ success: true, data })
    } catch (error) {
      logger.error('Get driver performance trend error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /drivers/:id
router.get(
  '/:id',
  requirePermission('driver:view:own'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await tenantSafeQuery(
        `SELECT
          d.id,
          d.tenant_id,
          d.user_id,
          d.license_number,
          d.license_state,
          d.license_expiration,
          d.cdl_class,
          d.cdl_endorsements,
          d.hire_date,
          d.termination_date,
          d.status,
          d.safety_score,
          d.total_miles_driven,
          d.total_hours_driven,
          d.incidents_count,
          d.violations_count,
          d.emergency_contact_name,
          d.emergency_contact_phone,
          d.notes,
          d.address,
          d.city,
          d.state,
          d.zip_code,
          d.medical_card_expiration,
          d.employment_classification,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.role,
          d.created_at,
          d.updated_at
        FROM drivers d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.id = $1 AND d.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id!],
        req.user!.tenant_id!
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Driver not found` })
      }

      // IDOR protection: Basic tenant isolation provided by tenantSafeQuery
      // TODO: Add role-based access control when user permission system is expanded

      res.json(result.rows[0])
    } catch (error) {
      logger.error(`Get driver error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// GET /drivers/:id/performance
router.get(
  '/:id/performance',
  requirePermission('driver:view:own'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'driver_performance' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const driverId = req.params.id
      const tenantId = req.user!.tenant_id

      // Verify driver exists and belongs to tenant
      const driverResult = await tenantSafeQuery(
        'SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2',
        [driverId, tenantId],
        tenantId!
      )

      if (driverResult.rows.length === 0) {
        return res.status(404).json({ error: `Driver not found` })
      }

      const scorecardResult = await tenantSafeQuery(
        `SELECT
          safety_score,
          overall_score,
          incidents_count,
          violations_count,
          harsh_braking_count,
          harsh_acceleration_count,
          speeding_violations,
          mpg_average,
          idling_hours,
          total_miles,
          fuel_consumption_gallons,
          inspections_completed,
          training_completed,
          metadata,
          updated_at
        FROM driver_scorecards
        WHERE driver_id = $1 AND tenant_id = $2
        ORDER BY period_end DESC
        LIMIT 1`,
        [driverId, tenantId],
        tenantId!
      )

      const row = scorecardResult.rows[0]
      const metadata = row?.metadata && typeof row.metadata === 'object'
        ? row.metadata
        : row?.metadata
          ? (() => {
              try {
                return JSON.parse(row.metadata)
              } catch {
                return {}
              }
            })()
          : {}

      const efficiencyScore = metadata?.efficiency_score ?? metadata?.efficiencyScore ?? null
      const fuelScore = metadata?.fuel_score ?? metadata?.fuelScore ?? null
      const punctualityScore = metadata?.punctuality_score ?? metadata?.punctualityScore ?? null

      const performanceData = {
        last_updated: row?.updated_at || new Date().toISOString(),
        overall_score: row?.overall_score ? Number(row.overall_score) : 0,
        safety_score: row?.safety_score ? Number(row.safety_score) : 0,
        efficiency_score: efficiencyScore ?? 0,
        fuel_score: fuelScore ?? 0,
        punctuality_score: punctualityScore ?? 0,
        hard_braking: row?.harsh_braking_count ? Number(row.harsh_braking_count) : 0,
        rapid_acceleration: row?.harsh_acceleration_count ? Number(row.harsh_acceleration_count) : 0,
        speeding: row?.speeding_violations ? Number(row.speeding_violations) : 0,
        distracted_driving: metadata?.distracted_driving ?? 0,
        seatbelt_violations: metadata?.seatbelt_violations ?? 0,
        avg_mpg: row?.mpg_average ? Number(row.mpg_average) : 0,
        idle_time: row?.idling_hours ? Number(row.idling_hours) : 0,
        route_adherence: metadata?.route_adherence ?? 0,
        on_time_deliveries: metadata?.on_time_deliveries ?? 0,
        violations: metadata?.violations ?? []
      }

      res.json(performanceData)
    } catch (error) {
      logger.error(`Get driver performance error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// GET /drivers/:id/trips
router.get(
  '/:id/trips',
  requirePermission('driver:view:own'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'driver_trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const driverId = req.params.id
      const tenantId = req.user!.tenant_id

      // Verify driver exists and belongs to tenant
      const driverResult = await tenantSafeQuery(
        'SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2',
        [driverId, tenantId],
        tenantId!
      )

      if (driverResult.rows.length === 0) {
        return res.status(404).json({ error: `Driver not found` })
      }

      const tripsResult = await tenantSafeQuery(
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
          v.name as vehicle_name
        FROM mobile_trips mt
        LEFT JOIN vehicles v ON mt.vehicle_id = v.id
        WHERE mt.tenant_id = $1 AND mt.driver_id = $2
        ORDER BY mt.start_time DESC
        LIMIT 200`,
        [tenantId, driverId],
        tenantId!
      )

      const trips = tripsResult.rows.map((row: any) => {
        const metadata = row.metadata && typeof row.metadata === 'object'
          ? row.metadata
          : row.metadata
            ? (() => {
                try {
                  return JSON.parse(row.metadata)
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
        const fuelUsed = metadata?.fuelUsed ?? metadata?.fuel_used ?? null

        const durationString = durationMinutes !== null
          ? `${Math.floor(durationMinutes / 60)}h ${Math.round(durationMinutes % 60)}m`
          : null

        return {
          id: row.id,
          status: row.status,
          vehicle_name: row.vehicle_name,
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

      res.json(trips)
    } catch (error) {
      logger.error(`Get driver trips error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// POST /drivers
router.post(
  '/',
  doubleCsrfProtection,
  requirePermission('driver:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'drivers' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const payload = createDriverSchema.parse(req.body)
      const nameParts = splitDriverName(payload.name)
      const firstName = payload.first_name || nameParts.firstName
      const lastName = payload.last_name || nameParts.lastName

      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'first_name and last_name are required' })
      }

      const licenseExpiry = new Date(payload.license_expiration)
      if (Number.isNaN(licenseExpiry.getTime())) {
        return res.status(400).json({ error: 'license_expiration must be a valid date' })
      }

      let userId = payload.user_id || null

      // If no user_id provided, find or create a user record
      if (!userId) {
        const existingUser = await tenantSafeQuery(
          `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
          [payload.email.toLowerCase(), req.user!.tenant_id!],
          req.user!.tenant_id!
        )

        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id
        } else {
          const newUser = await tenantSafeQuery(
            `INSERT INTO users (tenant_id, first_name, last_name, email, phone, role)
             VALUES ($1, $2, $3, $4, $5, 'User')
             RETURNING id`,
            [req.user!.tenant_id!, firstName, lastName, payload.email.toLowerCase(), payload.phone],
            req.user!.tenant_id!
          )
          userId = newUser.rows[0].id
        }
      }

      const result = await tenantSafeQuery(
        `INSERT INTO drivers (
          tenant_id,
          user_id,
          license_number,
          license_state,
          license_expiration,
          cdl_class,
          status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING
          id,
          tenant_id,
          user_id,
          license_number,
          license_state,
          license_expiration,
          cdl_class,
          safety_score,
          status,
          created_at,
          updated_at`,
        [
          req.user!.tenant_id!,
          userId,
          payload.license_number,
          payload.license_state || null,
          licenseExpiry.toISOString(),
          payload.cdl_class || null,
          payload.status || 'active'
        ],
        req.user!.tenant_id!
      )

      res.status(201).json(result.rows[0])
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid driver data', details: error.issues })
      }
      logger.error('Create driver error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /drivers/:id
router.put(
  '/:id',
  doubleCsrfProtection,
  requirePermission('driver:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'drivers' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const payload = updateDriverSchema.parse(req.body)
      const nameParts = splitDriverName(payload.name)
      const firstName = payload.first_name || nameParts.firstName
      const lastName = payload.last_name || nameParts.lastName

      // Update user fields (first_name, last_name, email, phone) on the users table
      const userFields: string[] = []
      const userValues: any[] = []
      let userIndex = 1

      if (payload.email) {
        userFields.push(`email = $${userIndex++}`)
        userValues.push(payload.email.toLowerCase())
      }
      if (firstName) {
        userFields.push(`first_name = $${userIndex++}`)
        userValues.push(firstName)
      }
      if (lastName) {
        userFields.push(`last_name = $${userIndex++}`)
        userValues.push(lastName)
      }
      if (payload.phone) {
        userFields.push(`phone = $${userIndex++}`)
        userValues.push(payload.phone)
      }

      if (userFields.length > 0) {
        // Get user_id from the driver record
        const driverLookup = await tenantSafeQuery(
          `SELECT user_id FROM drivers WHERE id = $1 AND tenant_id = $2`,
          [req.params.id, req.user!.tenant_id!],
          req.user!.tenant_id!
        )
        if (driverLookup.rows.length > 0 && driverLookup.rows[0].user_id) {
          const userWhereId = userIndex++
          userValues.push(driverLookup.rows[0].user_id)
          await tenantSafeQuery(
            `UPDATE users SET ${userFields.join(', ')} WHERE id = $${userWhereId}`,
            userValues,
            req.user!.tenant_id!
          )
        }
      }

      // Update driver fields on the drivers table
      const fields: string[] = []
      const values: any[] = []
      let index = 1

      if (payload.license_number) {
        fields.push(`license_number = $${index++}`)
        values.push(payload.license_number)
      }

      if (payload.license_state !== undefined) {
        fields.push(`license_state = $${index++}`)
        values.push(payload.license_state)
      }

      if (payload.license_expiration) {
        const licenseExpiry = new Date(payload.license_expiration)
        if (Number.isNaN(licenseExpiry.getTime())) {
          return res.status(400).json({ error: 'license_expiration must be a valid date' })
        }
        fields.push(`license_expiration = $${index++}`)
        values.push(licenseExpiry.toISOString())
      }

      if (payload.cdl_class !== undefined) {
        fields.push(`cdl_class = $${index++}`)
        values.push(payload.cdl_class)
      }

      if (payload.status) {
        fields.push(`status = $${index++}`)
        values.push(payload.status)
      }

      if (fields.length === 0 && userFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' })
      }

      // If no driver-specific fields to update, just return the current record
      if (fields.length === 0) {
        const currentResult = await tenantSafeQuery(
          `SELECT d.id, d.tenant_id, d.user_id, d.license_number, d.license_state,
                  d.license_expiration, d.cdl_class, d.safety_score, d.status,
                  d.created_at, d.updated_at,
                  u.first_name, u.last_name, u.email, u.phone
           FROM drivers d
           LEFT JOIN users u ON d.user_id = u.id
           WHERE d.id = $1 AND d.tenant_id = $2`,
          [req.params.id, req.user!.tenant_id!],
          req.user!.tenant_id!
        )
        if (currentResult.rows.length === 0) {
          return res.status(404).json({ error: 'Driver not found' })
        }
        return res.json(currentResult.rows[0])
      }

      const whereIdIndex = index++
      const whereTenantIndex = index++
      values.push(req.params.id, req.user!.tenant_id!)

      const result = await tenantSafeQuery(
        `UPDATE drivers
         SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${whereIdIndex} AND tenant_id = $${whereTenantIndex}
         RETURNING
          id,
          tenant_id,
          user_id,
          license_number,
          license_state,
          license_expiration,
          cdl_class,
          safety_score,
          status,
          created_at,
          updated_at`,
        values,
        req.user!.tenant_id!
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' })
      }

      res.json(result.rows[0])
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid driver data', details: error.issues })
      }
      logger.error('Update driver error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /drivers/:id
router.delete(
  '/:id',
  doubleCsrfProtection,
  requirePermission('driver:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'drivers' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await tenantSafeQuery(
        `DELETE FROM drivers WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.user!.tenant_id!],
        req.user!.tenant_id!
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' })
      }

      res.json({ success: true, message: 'Driver deleted successfully' })
    } catch (error) {
      logger.error('Delete driver error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
