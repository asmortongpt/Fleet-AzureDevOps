/**
 * EXAMPLE: Dashboard Statistics Endpoint with Query Result Caching
 *
 * This demonstrates caching expensive aggregation queries that power dashboards.
 * These queries are often slow and run frequently, making them ideal for caching.
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import pool from '../config/database'
import { cache } from '../utils/cache'
import { slowQueryLogger } from '../utils/performance'

const router = express.Router()
router.use(authenticateJWT)

/**
 * GET /api/dashboard/stats
 *
 * Returns dashboard statistics:
 * - Total vehicles, drivers, work orders
 * - Active vs inactive counts
 * - Upcoming maintenance
 * - Recent fuel transactions
 *
 * This endpoint uses MANUAL caching (not middleware) because:
 * 1. The query is expensive (joins multiple tables)
 * 2. Results are tenant-specific (different cache per tenant)
 * 3. We want to cache the raw query result, not the formatted response
 */
router.get('/stats',
  requirePermission('dashboard:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id

      // Generate cache key specific to this tenant
      const cacheKey = cache.getCacheKey(tenantId, 'dashboard:stats')

      // Try to get from cache first
      const cached = await cache.get(cacheKey)
      if (cached) {
        console.log(`✅ Cache HIT: dashboard stats for tenant ${tenantId}`)
        return res.json({
          success: true,
          data: cached,
          cached: true
        })
      }

      console.log(`❌ Cache MISS: dashboard stats for tenant ${tenantId}`)

      // Expensive aggregation query with slow query logging
      const stats = await slowQueryLogger(
        async () => await pool.query(`
          SELECT
            -- Vehicle statistics
            COUNT(DISTINCT v.id) as total_vehicles,
            COUNT(DISTINCT CASE WHEN v.status = 'active' THEN v.id END) as active_vehicles,
            COUNT(DISTINCT CASE WHEN v.status = 'maintenance' THEN v.id END) as vehicles_in_maintenance,
            COUNT(DISTINCT CASE WHEN v.status = 'retired' THEN v.id END) as retired_vehicles,

            -- Driver statistics
            COUNT(DISTINCT d.id) as total_drivers,
            COUNT(DISTINCT CASE WHEN d.status = 'active' THEN d.id END) as active_drivers,
            COUNT(DISTINCT CASE WHEN d.certification_status = 'certified' THEN d.id END) as certified_drivers,

            -- Work order statistics
            COUNT(DISTINCT wo.id) as total_work_orders,
            COUNT(DISTINCT CASE WHEN wo.status = 'open' THEN wo.id END) as open_work_orders,
            COUNT(DISTINCT CASE WHEN wo.status = 'in_progress' THEN wo.id END) as in_progress_work_orders,
            COUNT(DISTINCT CASE WHEN wo.priority = 'critical' THEN wo.id END) as critical_work_orders,

            -- Maintenance statistics
            COUNT(DISTINCT ms.id) as total_maintenance_schedules,
            COUNT(DISTINCT CASE
              WHEN ms.next_due_date <= CURRENT_DATE + INTERVAL '7 days'
              THEN ms.id
            END) as upcoming_maintenance_week,
            COUNT(DISTINCT CASE
              WHEN ms.next_due_date <= CURRENT_DATE + INTERVAL '30 days'
              THEN ms.id
            END) as upcoming_maintenance_month,

            -- Fuel transaction statistics (last 30 days)
            COUNT(DISTINCT CASE
              WHEN ft.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
              THEN ft.id
            END) as fuel_transactions_month,
            SUM(CASE
              WHEN ft.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
              THEN ft.total_cost
              ELSE 0
            END) as fuel_cost_month,
            SUM(CASE
              WHEN ft.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
              THEN ft.gallons
              ELSE 0
            END) as fuel_gallons_month

          FROM vehicles v
          LEFT JOIN users d ON d.tenant_id = v.tenant_id AND d.role = 'driver'
          LEFT JOIN work_orders wo ON wo.tenant_id = v.tenant_id
          LEFT JOIN maintenance_schedules ms ON ms.vehicle_id = v.id
          LEFT JOIN fuel_transactions ft ON ft.vehicle_id = v.id
          WHERE v.tenant_id = $1
        `, [tenantId]),
        'dashboard-stats-query',
        200 // Log if query takes > 200ms
      )

      const result = stats.rows[0]

      // Cache the result for 10 minutes (600 seconds)
      // Dashboard stats are relatively stable and expensive to compute
      await cache.set(cacheKey, result, 600)

      return res.json({
        success: true,
        data: result,
        cached: false
      })

    } catch (error) {
      console.error('Dashboard stats error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard statistics'
      })
    }
  }
)

/**
 * GET /api/dashboard/fleet-health
 *
 * Returns fleet health metrics:
 * - Average vehicle age
 * - Average odometer reading
 * - Maintenance compliance rate
 * - Upcoming inspections
 *
 * Cached for 30 minutes (1800 seconds) as this data changes slowly
 */
router.get('/fleet-health',
  requirePermission('dashboard:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id
      const cacheKey = cache.getCacheKey(tenantId, 'dashboard:fleet-health')

      // Check cache
      const cached = await cache.get(cacheKey)
      if (cached) {
        return res.json({ success: true, data: cached, cached: true })
      }

      // Complex aggregation query
      const health = await slowQueryLogger(
        async () => await pool.query(`
          WITH vehicle_stats AS (
            SELECT
              v.id,
              v.year,
              v.odometer,
              EXTRACT(YEAR FROM AGE(CURRENT_DATE, TO_DATE(v.year::text, 'YYYY'))) as vehicle_age,
              COUNT(DISTINCT ms.id) as scheduled_maintenance,
              COUNT(DISTINCT CASE WHEN ms.status = 'completed' THEN ms.id END) as completed_maintenance
            FROM vehicles v
            LEFT JOIN maintenance_schedules ms ON ms.vehicle_id = v.id
            WHERE v.tenant_id = $1
            GROUP BY v.id
          ),
          inspection_stats AS (
            SELECT
              COUNT(*) as total_inspections,
              COUNT(CASE WHEN status = 'passed' THEN 1 END) as passed_inspections,
              COUNT(CASE
                WHEN next_inspection_date <= CURRENT_DATE + INTERVAL '30 days'
                THEN 1
              END) as upcoming_inspections
            FROM inspections
            WHERE tenant_id = $1
          )
          SELECT
            AVG(vs.vehicle_age) as avg_vehicle_age,
            AVG(vs.odometer) as avg_odometer,
            SUM(vs.scheduled_maintenance) as total_scheduled_maintenance,
            SUM(vs.completed_maintenance) as total_completed_maintenance,
            CASE
              WHEN SUM(vs.scheduled_maintenance) > 0
              THEN (SUM(vs.completed_maintenance)::float / SUM(vs.scheduled_maintenance)::float) * 100
              ELSE 0
            END as maintenance_compliance_rate,
            (SELECT total_inspections FROM inspection_stats) as total_inspections,
            (SELECT passed_inspections FROM inspection_stats) as passed_inspections,
            (SELECT upcoming_inspections FROM inspection_stats) as upcoming_inspections,
            CASE
              WHEN (SELECT total_inspections FROM inspection_stats) > 0
              THEN ((SELECT passed_inspections FROM inspection_stats)::float / (SELECT total_inspections FROM inspection_stats)::float) * 100
              ELSE 0
            END as inspection_pass_rate
          FROM vehicle_stats vs
        `, [tenantId]),
        'fleet-health-query',
        300 // Log if query takes > 300ms
      )

      const result = health.rows[0]

      // Cache for 30 minutes (fleet health changes slowly)
      await cache.set(cacheKey, result, 1800)

      return res.json({ success: true, data: result, cached: false })

    } catch (error) {
      console.error('Fleet health error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve fleet health metrics'
      })
    }
  }
)

/**
 * POST /api/dashboard/invalidate-cache
 *
 * Manually invalidate dashboard caches
 * Useful after bulk data imports or major system updates
 */
router.post('/invalidate-cache',
  requirePermission('dashboard:admin:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id

      // Invalidate all dashboard caches for this tenant
      await cache.del(cache.getCacheKey(tenantId, 'dashboard:stats'))
      await cache.del(cache.getCacheKey(tenantId, 'dashboard:fleet-health'))

      // Could also invalidate route caches if needed
      // await cache.delPattern(`route:/api/dashboard*`)

      return res.json({
        success: true,
        message: 'Dashboard caches invalidated successfully'
      })

    } catch (error) {
      console.error('Cache invalidation error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to invalidate caches'
      })
    }
  }
)

/**
 * Cache Invalidation Strategy for Dashboard
 *
 * Dashboard caches should be invalidated when:
 * 1. Vehicles are created, updated, or deleted
 * 2. Work orders change status
 * 3. Maintenance is completed
 * 4. Major data imports occur
 *
 * Add to relevant routes:
 *
 * // After creating/updating/deleting vehicles
 * await cache.del(cache.getCacheKey(req.user.tenant_id, 'dashboard:stats'))
 * await cache.del(cache.getCacheKey(req.user.tenant_id, 'dashboard:fleet-health'))
 *
 * // After work order status changes
 * await cache.del(cache.getCacheKey(req.user.tenant_id, 'dashboard:stats'))
 *
 * // After maintenance completion
 * await cache.del(cache.getCacheKey(req.user.tenant_id, 'dashboard:stats'))
 * await cache.del(cache.getCacheKey(req.user.tenant_id, 'dashboard:fleet-health'))
 */

export default router
