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

      // Get user scope for row-level filtering
      const userResult = await tenantSafeQuery(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id],
        req.user!.tenant_id
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      const scopeParams: any[] = [req.user!.tenant_id]

      if (user.scope_level === `own` && user.driver_id) {
        // Drivers only see themselves
        scopeFilter = 'AND id = $2'
        scopeParams.push(user.driver_id)
      } else if (user.scope_level === 'team' && user.team_driver_ids && user.team_driver_ids.length > 0) {
        // Supervisors see drivers in their team
        scopeFilter = 'AND id = ANY($2::uuid[])'
        scopeParams.push(user.team_driver_ids)
      }
      // fleet/global scope sees all

      const result = await tenantSafeQuery(
        'SELECT id, tenant_id, email, first_name, last_name, phone, license_number, cdl, status, metadata, created_at, updated_at FROM drivers WHERE tenant_id = $1 ' + scopeFilter + ' ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [...scopeParams, limit, offset],
        req.user!.tenant_id
      )

      const countResult = await tenantSafeQuery(
        'SELECT COUNT(*) FROM drivers WHERE tenant_id = $1 ' + scopeFilter,
        scopeParams,
        req.user!.tenant_id
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
      // Get user scope for row-level filtering
      const userResult = await tenantSafeQuery(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id],
        req.user!.tenant_id
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      const scopeParams: any[] = [req.user!.tenant_id]

      if (user.scope_level === `own` && user.driver_id) {
        // Drivers only see themselves
        scopeFilter = 'AND id = $2'
        scopeParams.push(user.driver_id)
      } else if (user.scope_level === 'team' && user.team_driver_ids && user.team_driver_ids.length > 0) {
        // Supervisors see drivers in their team
        scopeFilter = 'AND id = ANY($2::uuid[])'
        scopeParams.push(user.team_driver_ids)
      }
      // fleet/global scope sees all

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
          COALESCE(
            (SELECT COUNT(*) FROM trips t WHERE t.driver_id = d.user_id AND t.status = 'in_progress' AND t.tenant_id = d.tenant_id),
            0
          ) as active_trips
        FROM drivers d
        WHERE d.tenant_id = $1
          AND d.status = 'active'
          ${scopeFilter}
        ORDER BY d.first_name, d.last_name`,
        scopeParams,
        req.user!.tenant_id
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
      // Get user scope for row-level filtering
      const userResult = await tenantSafeQuery(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id],
        req.user!.tenant_id
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      const scopeParams: any[] = [req.user!.tenant_id]

      if (user.scope_level === `own` && user.driver_id) {
        scopeFilter = 'AND d.id = $2'
        scopeParams.push(user.driver_id)
      } else if (user.scope_level === 'team' && user.team_driver_ids && user.team_driver_ids.length > 0) {
        scopeFilter = 'AND d.id = ANY($2::uuid[])'
        scopeParams.push(user.team_driver_ids)
      }

      // Get overall driver statistics
      const statsResult = await tenantSafeQuery(
        `SELECT
          COUNT(*) as total_drivers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_drivers,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_drivers,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_drivers,
          AVG(performance_score) as avg_performance_score
        FROM drivers d
        WHERE tenant_id = $1 ${scopeFilter}`,
        scopeParams,
        req.user!.tenant_id
      )

      // Get trip statistics for drivers
      const tripStatsResult = await tenantSafeQuery(
        `SELECT
          COUNT(DISTINCT t.driver_id) as drivers_with_trips,
          COUNT(*) as total_trips,
          SUM(t.distance_miles) as total_miles,
          AVG(t.driver_score) as avg_driver_score
        FROM trips t
        INNER JOIN drivers d ON t.driver_id = d.user_id AND t.tenant_id = d.tenant_id
        WHERE t.tenant_id = $1
          AND t.status = 'completed'
          AND t.end_time >= CURRENT_TIMESTAMP - INTERVAL '30 days'
          ${scopeFilter.replace('d.id', 'd.id')}`,
        scopeParams,
        req.user!.tenant_id
      )

      const stats = statsResult.rows[0]
      const tripStats = tripStatsResult.rows[0]

      res.json({
        data: {
          total_drivers: parseInt(stats.total_drivers) || 0,
          active_drivers: parseInt(stats.active_drivers) || 0,
          inactive_drivers: parseInt(stats.inactive_drivers) || 0,
          suspended_drivers: parseInt(stats.suspended_drivers) || 0,
          avg_performance_score: parseFloat(stats.avg_performance_score) || 0,
          drivers_with_trips_last_30_days: parseInt(tripStats.drivers_with_trips) || 0,
          total_trips_last_30_days: parseInt(tripStats.total_trips) || 0,
          total_miles_last_30_days: parseFloat(tripStats.total_miles) || 0,
          avg_driver_score_last_30_days: parseFloat(tripStats.avg_driver_score) || 0
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
        [req.params.id, req.user!.tenant_id],
        req.user!.tenant_id
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Driver not found` })
      }

      // IDOR protection: Check if user has access to this driver
      const userResult = await tenantSafeQuery(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id],
        req.user!.tenant_id
      )
      const user = userResult.rows[0]
      const driverId = req.params.id

      if (user.scope_level === `own` && user.driver_id !== driverId) {
        return res.status(403).json({ error: `Forbidden` })
      } else if (user.scope_level === 'team' && !user.team_driver_ids.includes(driverId)) {
        return res.status(403).json({ error: `Forbidden` })
      }

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

      // IDOR protection: Check if user has access to this driver
      const userResult = await tenantSafeQuery(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user!.id, tenantId],
        tenantId
      )
      const user = userResult.rows[0]

      if (user.scope_level === `own` && user.driver_id !== driverId) {
        return res.status(403).json({ error: `Forbidden` })
      } else if (user.scope_level === 'team' && !user.team_driver_ids.includes(driverId)) {
        return res.status(403).json({ error: `Forbidden` })
      }

      // TODO: Implement actual performance data fetching from database
      // For now, return demo data to match frontend expectations
      const performanceData = {
        last_updated: new Date().toISOString(),
        overall_score: 92,
        safety_score: 95,
        efficiency_score: 88,
        fuel_score: 90,
        punctuality_score: 94,
        hard_braking: 2,
        rapid_acceleration: 3,
        speeding: 1,
        distracted_driving: 0,
        seatbelt_violations: 0,
        avg_mpg: 24.5,
        idle_time: 3.2,
        route_adherence: 96,
        on_time_deliveries: 98,
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

      // IDOR protection: Check if user has access to this driver
      const userResult = await tenantSafeQuery(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user!.id, tenantId],
        tenantId
      )
      const user = userResult.rows[0]

      if (user.scope_level === `own` && user.driver_id !== driverId) {
        return res.status(403).json({ error: `Forbidden` })
      } else if (user.scope_level === 'team' && !user.team_driver_ids.includes(driverId)) {
        return res.status(403).json({ error: `Forbidden` })
      }

      // TODO: Implement actual trips fetching from database
      // For now, return demo data to match frontend expectations
      const trips = [
        {
          id: `trip-driver-${driverId}-1`,
          status: 'completed',
          vehicle_name: 'Fleet Van #42',
          start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          duration: '3h 15m',
          start_location: '100 Corporate Dr, City, State',
          end_location: '500 Industrial Blvd, City, State',
          distance: 52.3,
          avg_speed: 38.2,
          fuel_used: 3.8
        },
        {
          id: `trip-driver-${driverId}-2`,
          status: 'completed',
          vehicle_name: 'Fleet Van #42',
          start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration: '2h 45m',
          start_location: '200 Main St, City, State',
          end_location: '300 Oak Ave, City, State',
          distance: 41.5,
          avg_speed: 35.8,
          fuel_used: 2.9
        }
      ]

      res.json(trips)
    } catch (error) {
      console.error(`Get driver trips error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

export default router
