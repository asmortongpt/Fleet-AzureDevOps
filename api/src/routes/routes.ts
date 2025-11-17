import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

// GET /routes
router.get(
  '/',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Row-level filtering: check if user is a driver
      const userResult = await pool.query(
        'SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id]
      )

      let query = 'SELECT * FROM routes WHERE tenant_id = $1'
      let countQuery = 'SELECT COUNT(*) FROM routes WHERE tenant_id = $1'
      const params: any[] = [req.user!.tenant_id]

      // If user is a driver, filter to only their routes
      if (userResult.rows.length > 0) {
        const driverId = userResult.rows[0].id
        query += ' AND driver_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4'
        countQuery += ' AND driver_id = $2'
        params.push(driverId, limit, offset)
      } else {
        query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3'
        params.push(limit, offset)
      }

      const result = await pool.query(query, params)

      const countParams = userResult.rows.length > 0
        ? [req.user!.tenant_id, userResult.rows[0].id]
        : [req.user!.tenant_id]
      const countResult = await pool.query(countQuery, countParams)

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
      console.error('Get routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/:id
router.get(
  '/:id',
  requirePermission('route:view:own', {
    customCheck: async (req: AuthRequest) => {
      // IDOR check: verify the route belongs to the user if they're a driver
      const driverResult = await pool.query(
        'SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id]
      )

      // If user is not a driver, allow access (fleet managers/admins)
      if (driverResult.rows.length === 0) {
        return true
      }

      // If user is a driver, verify the route belongs to them
      const routeResult = await pool.query(
        'SELECT id FROM routes WHERE id = $1 AND driver_id = $2 AND tenant_id = $3',
        [req.params.id, driverResult.rows[0].id, req.user!.tenant_id]
      )

      return routeResult.rows.length > 0
    }
  }),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM routes WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Routes not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /routes
router.post(
  '/',
  requirePermission('route:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const columns = Object.keys(data)
      const values = Object.values(data)

      const placeholders = values.map((_, i) => `$${i + 2}`).join(', ')
      const columnNames = ['tenant_id', ...columns].join(', ')

      const result = await pool.query(
        `INSERT INTO routes (${columnNames}) VALUES ($1, ${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /routes/:id
router.put(
  '/:id',
  requirePermission('route:update:fleet', {
    customCheck: async (req: AuthRequest) => {
      // Prevent modifying completed routes
      const routeResult = await pool.query(
        'SELECT status FROM routes WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (routeResult.rows.length === 0) {
        return false
      }

      // Block updates to completed routes
      const status = routeResult.rows[0].status
      if (status === 'completed') {
        return false
      }

      return true
    }
  }),
  auditLog({ action: 'UPDATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const fields = Object.keys(data).map((key, i) => `${key} = $${i + 3}`).join(', ')
      const values = Object.values(data)

      const result = await pool.query(
        `UPDATE routes SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Routes not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /routes/:id
router.delete(
  '/:id',
  requirePermission('route:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM routes WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Routes not found' })
      }

      res.json({ message: 'Routes deleted successfully' })
    } catch (error) {
      console.error('Delete routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
