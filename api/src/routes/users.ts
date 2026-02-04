import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /users - list users for tenant
router.get(
  '/',
  requirePermission('user:view:global'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 100 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT
          id,
          tenant_id,
          email,
          first_name,
          last_name,
          role,
          is_active,
          last_login_at,
          created_at,
          updated_at
         FROM users
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const data = result.rows.map((row) => ({
        id: row.id,
        tenant_id: row.tenant_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        name: `${row.first_name} ${row.last_name}`.trim(),
        role: row.role,
        status: row.is_active ? 'active' : 'inactive',
        last_login_at: row.last_login_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
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
      logger.error('Get users error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /users/:id - user detail
router.get(
  '/:id',
  requirePermission('user:view:global'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          id,
          tenant_id,
          email,
          first_name,
          last_name,
          role,
          is_active,
          phone,
          last_login_at,
          created_at,
          updated_at
         FROM users
         WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const row = result.rows[0]
      res.json({
        id: row.id,
        tenant_id: row.tenant_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        name: `${row.first_name} ${row.last_name}`.trim(),
        role: row.role,
        status: row.is_active ? 'active' : 'inactive',
        phone: row.phone,
        last_login_at: row.last_login_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    } catch (error) {
      logger.error('Get user error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
