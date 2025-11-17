import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

// GET /charging-sessions
router.get(
  '/',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT * FROM charging_sessions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM charging_sessions WHERE tenant_id = $1',
        [req.user!.tenant_id]
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
      console.error('Get charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /charging-sessions/:id
router.get(
  '/:id',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM charging_sessions WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'ChargingSessions not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /charging-sessions
router.post(
  '/',
  requirePermission('charging_session:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const columns = Object.keys(data)
      const values = Object.values(data)

      const placeholders = values.map((_, i) => `$${i + 2}`).join(', ')
      const columnNames = ['tenant_id', ...columns].join(', ')

      const result = await pool.query(
        `INSERT INTO charging_sessions (${columnNames}) VALUES ($1, ${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /charging-sessions/:id
router.put(
  '/:id',
  requirePermission('charging_session:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const fields = Object.keys(data).map((key, i) => `${key} = $${i + 3}`).join(', ')
      const values = Object.values(data)

      const result = await pool.query(
        `UPDATE charging_sessions SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'ChargingSessions not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /charging-sessions/:id
router.delete(
  '/:id',
  requirePermission('charging_session:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM charging_sessions WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'ChargingSessions not found' })
      }

      res.json({ message: 'ChargingSessions deleted successfully' })
    } catch (error) {
      console.error('Delete charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
