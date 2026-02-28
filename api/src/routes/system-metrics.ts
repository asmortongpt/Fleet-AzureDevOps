import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /system/metrics
router.get(
  '/metrics',
  requirePermission('system:view:global'),
  auditLog({ action: 'READ', resourceType: 'system_metrics' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const metricsResult = await pool.query(
        `SELECT DISTINCT ON (metric_name)
          metric_name,
          value,
          unit,
          recorded_at
         FROM performance_metrics
         WHERE tenant_id = $1
         ORDER BY metric_name, recorded_at DESC`,
        [req.user!.tenant_id]
      )

      const metricsMap = metricsResult.rows.reduce((acc: Record<string, any>, row) => {
        acc[row.metric_name] = { value: Number(row.value), unit: row.unit, recorded_at: row.recorded_at }
        return acc
      }, {})

      const memoryUsage = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10

      res.json({
        data: {
          pageLoadTime: metricsMap.page_load_time?.value ?? null,
          apiResponseTime: metricsMap.api_response_time?.value ?? null,
          memoryUsage: metricsMap.memory_usage?.value ?? memoryUsage,
          activeConnections: metricsMap.active_connections?.value ?? null,
        }
      })
    } catch (error) {
      logger.error('Get system metrics error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /system/metrics/history
router.get(
  '/metrics/history',
  requirePermission('system:view:global'),
  auditLog({ action: 'READ', resourceType: 'system_metrics' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const hours = Math.min(Number(req.query.hours) || 24, 168)

      const result = await pool.query(
        `SELECT
           date_trunc('hour', recorded_at) as bucket,
           AVG(CASE WHEN metric_name = 'cpu_usage' THEN value END) as cpu,
           AVG(CASE WHEN metric_name = 'memory_usage' THEN value END) as memory,
           AVG(CASE WHEN metric_name = 'requests_per_minute' THEN value END) as requests,
           AVG(CASE WHEN metric_name = 'api_response_time' THEN value END) as response_time
         FROM performance_metrics
         WHERE tenant_id = $1
           AND recorded_at >= NOW() - ($2 || ' hours')::interval
         GROUP BY 1
         ORDER BY 1`,
        [req.user!.tenant_id, hours]
      )

      res.json({
        data: result.rows.map((row) => ({
          time: row.bucket,
          cpu: row.cpu !== null && row.cpu !== undefined ? Number(row.cpu) : null,
          memory: row.memory !== null && row.memory !== undefined ? Number(row.memory) : null,
          requests: row.requests !== null && row.requests !== undefined ? Number(row.requests) : null,
          responseTime: row.response_time !== null && row.response_time !== undefined ? Number(row.response_time) : null
        }))
      })
    } catch (error) {
      logger.error('Get system metrics history error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /system/db-stats — aggregate counts for admin dashboard
router.get(
  '/db-stats',
  requirePermission('system:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id
      const [vehicles, drivers, workOrders, fuelTx] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM vehicles WHERE tenant_id = $1', [tenantId]),
        pool.query('SELECT COUNT(*)::int AS count FROM drivers WHERE tenant_id = $1', [tenantId]),
        pool.query('SELECT COUNT(*)::int AS count FROM work_orders WHERE tenant_id = $1', [tenantId]),
        pool.query('SELECT COUNT(*)::int AS count FROM fuel_transactions WHERE tenant_id = $1', [tenantId]),
      ])

      res.json({
        data: {
          total_vehicles: vehicles.rows[0]?.count ?? 0,
          total_drivers: drivers.rows[0]?.count ?? 0,
          total_work_orders: workOrders.rows[0]?.count ?? 0,
          total_fuel_transactions: fuelTx.rows[0]?.count ?? 0,
        }
      })
    } catch (error) {
      logger.error('Get db-stats error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /system/pool-status — pg connection pool metrics
router.get(
  '/pool-status',
  requirePermission('system:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      res.json({
        data: {
          total: pool.totalCount,
          idle: pool.idleCount,
          busy: pool.totalCount - pool.idleCount,
          waiting: pool.waitingCount,
        }
      })
    } catch (error) {
      logger.error('Get pool-status error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
