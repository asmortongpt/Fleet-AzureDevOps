import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission, rateLimit } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

// GET /telemetry
router.get(
  '/',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT * FROM telemetry_data WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM telemetry_data WHERE tenant_id = $1',
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
      console.error('Get telemetry error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /telemetry/:id
router.get(
  '/:id',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM telemetry_data WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Telemetry not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get telemetry error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /telemetry
router.post(
  '/',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'CREATE', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const columns = Object.keys(data)
      const values = Object.values(data)

      const placeholders = values.map((_, i) => `$${i + 2}`).join(', ')
      const columnNames = ['tenant_id', ...columns].join(', ')

      const result = await pool.query(
        `INSERT INTO telemetry_data (${columnNames}) VALUES ($1, ${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create telemetry error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /telemetry/:id
router.put(
  '/:id',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'UPDATE', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const fields = Object.keys(data).map((key, i) => `${key} = $${i + 3}`).join(', ')
      const values = Object.values(data)

      const result = await pool.query(
        `UPDATE telemetry_data SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Telemetry not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update telemetry error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /telemetry/:id
router.delete(
  '/:id',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'DELETE', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM telemetry_data WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Telemetry not found' })
      }

      res.json({ message: 'Telemetry deleted successfully' })
    } catch (error) {
      console.error('Delete telemetry error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
