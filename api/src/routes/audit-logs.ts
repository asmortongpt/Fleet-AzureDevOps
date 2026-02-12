import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /audit-logs
router.get(
  '/',
  requirePermission('audit:view:global'),
  auditLog({ action: 'READ', resourceType: 'audit_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 100 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT
          al.id,
          al.user_id,
          al.action,
          al.entity_type,
          al.created_at,
          al.ip_address,
          al.metadata,
          u.first_name,
          u.last_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE al.tenant_id = $1
         ORDER BY al.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM audit_logs WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const data = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_id
          ? `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown'
          : 'System',
        action: row.action,
        resource: row.entity_type,
        timestamp: row.created_at,
        status: row.metadata?.outcome || 'success',
        ipAddress: row.ip_address,
        metadata: row.metadata || {}
      }))

      res.json({
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit)),
        },
      })
    } catch (error) {
      logger.error('Get audit logs error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
