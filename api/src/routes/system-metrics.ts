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
          cpu: row.cpu != null ? Number(row.cpu) : null,
          memory: row.memory != null ? Number(row.memory) : null,
          requests: row.requests != null ? Number(row.requests) : null,
          responseTime: row.response_time != null ? Number(row.response_time) : null
        }))
      })
    } catch (error) {
      logger.error('Get system metrics history error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
