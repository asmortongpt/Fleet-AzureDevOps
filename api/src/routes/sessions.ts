import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /sessions - list auth sessions
router.get(
  '/',
  requirePermission('session:view:global'),
  auditLog({ action: 'READ', resourceType: 'auth_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 100 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT
          s.id,
          s.user_id,
          s.device_type,
          s.ip_address,
          s.user_agent,
          s.created_at,
          s.last_activity_at,
          s.expires_at,
          s.is_active,
          u.first_name,
          u.last_name
         FROM auth_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.tenant_id = $1
         ORDER BY s.last_activity_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM auth_sessions WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const now = Date.now()
      const data = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
        startTime: row.created_at,
        lastActivity: row.last_activity_at,
        ipAddress: row.ip_address,
        userAgent: row.user_agent || '',
        status: row.is_active && new Date(row.expires_at).getTime() > now ? 'active' : 'expired',
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
      logger.error('Get sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /sessions/:id - revoke session
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('session:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'auth_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE auth_sessions
         SET is_active = false,
             revoked_at = NOW(),
             revoked_by = $3
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [req.params.id, req.user!.tenant_id, req.user!.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' })
      }

      res.json({ success: true })
    } catch (error) {
      logger.error('Revoke session error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
