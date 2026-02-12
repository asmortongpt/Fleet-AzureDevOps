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
  employee_number: z.string().optional(),
  license_number: z.string().min(1),
  license_state: z.string().length(2).optional(),
  license_expiry_date: z.string(),
  status: z.enum(['active', 'inactive', 'suspended', 'terminated', 'on_leave', 'training']).optional(),
  department: z.string().optional()
})

const updateDriverSchema = createDriverSchema.partial()

const splitDriverName = (name?: string) => {
  if (!name) return { firstName: '', lastName: '' }
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
          d.license_expiry_date,
          d.cdl,
          d.cdl_class,
          d.hire_date,
          d.termination_date,
          d.status,
          d.performance_score,
          d.emergency_contact_name,
          d.emergency_contact_phone,
          d.metadata,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.role,
          d.created_at,
          d.updated_at,
          d.department,
          d.region,
          d.position_title,
          d.employment_type,
          d.safety_score,
          d.drug_test_date,
          d.drug_test_result,
          d.alcohol_test_date,
          d.alcohol_test_result,
          d.background_check_date,
          d.background_check_status,
          d.mvr_check_date,
          d.mvr_check_status,
          d.medical_card_expiry,
          d.endorsements,
          d.avatar_url,
          d.address_line1,
          d.city,
          d.state,
          d.zip_code,
          d.hos_status,
          d.hours_available,
          d.cycle_hours_used,
          d.assigned_vehicle_id,
          d.supervisor_id,
          d.cost_center,
          d.facility_id
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
      console.error(`Get drivers error:`, error)
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
          d.license_expiry_date,
          d.cdl,
          d.cdl_class,
          d.status,
          d.performance_score,
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
      console.error(`Get active drivers error:`, error)
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
          AVG(performance_score) as avg_performance_score
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

      // TODO: Get trip statistics when trips table is implemented
      res.json({
        data: {
          total_drivers: parseInt(stats.total_drivers) || 0,
          active_drivers: parseInt(stats.active_drivers) || 0,
          inactive_drivers: parseInt(stats.inactive_drivers) || 0,
          suspended_drivers: parseInt(stats.suspended_drivers) || 0,
          avg_performance_score: stats.avg_performance_score != null ? parseFloat(stats.avg_performance_score) : 0,
          drivers_with_trips_last_30_days: 0,
          total_trips_last_30_days: 0,
          total_miles_last_30_days: 0,
          avg_driver_score_last_30_days: 0
        }
      })
    } catch (error) {
      console.error(`Get driver statistics error:`, error)
      res.status(500).json({ error: `Internal server error` })
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
          d.license_expiry_date,
          d.cdl,
          d.cdl_class,
          d.hire_date,
          d.termination_date,
          d.status,
          d.performance_score,
          d.emergency_contact_name,
          d.emergency_contact_phone,
          d.metadata,
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
      console.error(`Get driver error:`, error)
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
      console.error(`Get driver performance error:`, error)
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
      console.error(`Get driver trips error:`, error)
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

      const licenseExpiry = new Date(payload.license_expiry_date)
      if (Number.isNaN(licenseExpiry.getTime())) {
        return res.status(400).json({ error: 'license_expiry_date must be a valid date' })
      }

      const metadata: Record<string, any> = {}
      if (payload.department) {
        metadata.department = payload.department
      }

      const result = await tenantSafeQuery(
        `INSERT INTO drivers (
          tenant_id,
          first_name,
          last_name,
          email,
          phone,
          employee_number,
          license_number,
          license_state,
          license_expiry_date,
          status,
          metadata
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING
          id,
          tenant_id,
          email,
          first_name,
          last_name,
          phone,
          employee_number,
          license_number,
          license_state,
          license_expiry_date,
          performance_score,
          cdl,
          status,
          metadata,
          created_at,
          updated_at`,
        [
          req.user!.tenant_id!,
          firstName,
          lastName,
          payload.email.toLowerCase(),
          payload.phone,
          payload.employee_number || null,
          payload.license_number,
          payload.license_state || null,
          licenseExpiry.toISOString(),
          payload.status || 'active',
          metadata
        ],
        req.user!.tenant_id!
      )

      res.status(201).json(result.rows[0])
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid driver data', details: error.issues })
      }
      console.error('Create driver error:', error)
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

      const fields: string[] = []
      const values: any[] = []
      let index = 1

      if (payload.email) {
        fields.push(`email = $${index++}`)
        values.push(payload.email.toLowerCase())
      }

      if (firstName) {
        fields.push(`first_name = $${index++}`)
        values.push(firstName)
      }

      if (lastName) {
        fields.push(`last_name = $${index++}`)
        values.push(lastName)
      }

      if (payload.phone) {
        fields.push(`phone = $${index++}`)
        values.push(payload.phone)
      }

      if (payload.employee_number !== undefined) {
        fields.push(`employee_number = $${index++}`)
        values.push(payload.employee_number)
      }

      if (payload.license_number) {
        fields.push(`license_number = $${index++}`)
        values.push(payload.license_number)
      }

      if (payload.license_state !== undefined) {
        fields.push(`license_state = $${index++}`)
        values.push(payload.license_state)
      }

      if (payload.license_expiry_date) {
        const licenseExpiry = new Date(payload.license_expiry_date)
        if (Number.isNaN(licenseExpiry.getTime())) {
          return res.status(400).json({ error: 'license_expiry_date must be a valid date' })
        }
        fields.push(`license_expiry_date = $${index++}`)
        values.push(licenseExpiry.toISOString())
      }

      if (payload.status) {
        fields.push(`status = $${index++}`)
        values.push(payload.status)
      }

      const metadataPatch: Record<string, any> = {}
      if (payload.department !== undefined) {
        metadataPatch.department = payload.department
      }
      if (Object.keys(metadataPatch).length > 0) {
        fields.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${index++}::jsonb`)
        values.push(JSON.stringify(metadataPatch))
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' })
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
          email,
          first_name,
          last_name,
          phone,
          employee_number,
          license_number,
          license_state,
          license_expiry_date,
          performance_score,
          cdl,
          status,
          metadata,
          created_at,
          updated_at`,
        values,
        req.user!.tenant_id!
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' })
      }

      res.json(result.rows[0])
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid driver data', details: error.issues })
      }
      console.error('Update driver error:', error)
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

      res.json({ message: 'Driver deleted successfully' })
    } catch (error) {
      console.error('Delete driver error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
