import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /predictive-maintenance
router.get(
  '/',
  requirePermission('maintenance:view:global'),
  auditLog({ action: 'READ', resourceType: 'predictive_maintenance' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT
          pm.*,
          v.unit_number as vehicle_unit,
          v.name as vehicle_name,
          a.name as asset_name
        FROM predictive_maintenance pm
        LEFT JOIN vehicles v ON pm.vehicle_id = v.id
        LEFT JOIN assets a ON pm.asset_id = a.id
        WHERE pm.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (status) {
        query += ` AND pm.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      query += ` ORDER BY pm.predicted_failure_date ASC NULLS LAST, pm.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM predictive_maintenance WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit)),
        },
      })
    } catch (error) {
      logger.error('Get predictive maintenance error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
