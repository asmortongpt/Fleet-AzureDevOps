import express, { Response } from 'express'
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

// SECURITY: Using csrf-csrf (double-submit cookie) instead of vulnerable csurf
// Enhanced with CSRF protection on mutations
router.post('/', doubleCsrfProtection)
router.put('/:id', doubleCsrfProtection)
router.delete('/:id', doubleCsrfProtection)

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

      // Simplified: Return all drivers for the tenant
      // TODO: Implement role-based filtering when user role/permission system is expanded
      const result = await tenantSafeQuery(
        'SELECT id, tenant_id, email, first_name, last_name, phone, license_number, cdl, status, metadata, created_at, updated_at FROM drivers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
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
      // Simplified: Return all active drivers for the tenant
      // TODO: Add active_trips count when trips table is implemented
      const result = await tenantSafeQuery(
        `SELECT
          d.id,
          d.tenant_id,
          d.email,
          d.first_name,
          d.last_name,
          d.phone,
          d.license_number,
          d.cdl,
          d.status,
          d.metadata,
          d.created_at,
          d.updated_at,
          0 as active_trips
        FROM drivers d
        WHERE d.tenant_id = $1
          AND d.status = 'active'
        ORDER BY d.first_name, d.last_name`,
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
        'SELECT id, tenant_id, email, first_name, last_name, phone, license_number, cdl, status, metadata, created_at, updated_at FROM drivers WHERE id = $1 AND tenant_id = $2',
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

      // TODO: Implement actual performance data fetching from database
      // For now, return zeroed data if no performance records found
      const performanceData = {
        last_updated: new Date().toISOString(),
        overall_score: 0,
        safety_score: 0,
        efficiency_score: 0,
        fuel_score: 0,
        punctuality_score: 0,
        hard_braking: 0,
        rapid_acceleration: 0,
        speeding: 0,
        distracted_driving: 0,
        seatbelt_violations: 0,
        avg_mpg: 0,
        idle_time: 0,
        route_adherence: 0,
        on_time_deliveries: 0,
        violations: []
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

      // TODO: Implement actual trips fetching from database
      // For now, return empty array if no trips are found
      const trips: any[] = []

      res.json(trips)
    } catch (error) {
      console.error(`Get driver trips error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

export default router
