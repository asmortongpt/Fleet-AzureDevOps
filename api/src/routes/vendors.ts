import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

// GET /vendors
router.get(
  '/',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT * FROM vendors WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM vendors WHERE tenant_id = $1',
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
      console.error('Get vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /vendors/:id
router.get(
  '/:id',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM vendors WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vendors not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /vendors
router.post(
  '/',
  requirePermission('vendor:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const columns = Object.keys(data)
      const values = Object.values(data)

      const placeholders = values.map((_, i) => `$${i + 2}`).join(', ')
      const columnNames = ['tenant_id', ...columns].join(', ')

      const result = await pool.query(
        `INSERT INTO vendors (${columnNames}) VALUES ($1, ${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /vendors/:id
router.put(
  '/:id',
  requirePermission('vendor:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const fields = Object.keys(data).map((key, i) => `${key} = $${i + 3}`).join(', ')
      const values = Object.values(data)

      const result = await pool.query(
        `UPDATE vendors SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vendors not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /vendors/:id
router.delete(
  '/:id',
  requirePermission('vendor:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM vendors WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vendors not found' })
      }

      res.json({ message: 'Vendors deleted successfully' })
    } catch (error) {
      console.error('Delete vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
