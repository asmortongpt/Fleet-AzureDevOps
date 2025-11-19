import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /drivers
router.get(
  '/',
  requirePermission('driver:view:team'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Get user scope for row-level filtering
      const userResult = await pool.query(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      let scopeParams: any[] = [req.user!.tenant_id]

      if (user.scope_level === 'own' && user.driver_id) {
        // Drivers only see themselves
        scopeFilter = 'AND id = $2'
        scopeParams.push(user.driver_id)
      } else if (user.scope_level === 'team' && user.team_driver_ids && user.team_driver_ids.length > 0) {
        // Supervisors see drivers in their team
        scopeFilter = 'AND id = ANY($2::uuid[])'
        scopeParams.push(user.team_driver_ids)
      }
      // fleet/global scope sees all

      const result = await pool.query(
        `SELECT * FROM users WHERE tenant_id = $1 ${scopeFilter} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [...scopeParams, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users WHERE tenant_id = $1 ${scopeFilter}`,
        scopeParams
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
      console.error('Get drivers error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /drivers/:id
router.get(
  '/:id',
  requirePermission('driver:view:own'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Drivers not found' })
      }

      // IDOR protection: Check if user has access to this driver
      const userResult = await pool.query(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )
      const user = userResult.rows[0]
      const driverId = req.params.id

      if (user.scope_level === 'own' && user.driver_id !== driverId) {
        return res.status(403).json({ error: 'Access denied: You can only view your own driver record' })
      } else if (user.scope_level === 'team' && user.team_driver_ids) {
        if (!user.team_driver_ids.includes(driverId)) {
          return res.status(403).json({ error: 'Access denied: Driver not in your team' })
        }
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get drivers error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /drivers
router.post(
  '/',
  requirePermission('driver:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // Input validation: Ensure required fields are present
      if (!data.email || !data.first_name || !data.last_name) {
        return res.status(400).json({
          error: 'Validation failed: email, first_name, and last_name are required'
        })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({ error: 'Invalid email format' })
      }

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO users (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create drivers error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /drivers/:id
router.put(
  '/:id',
  requirePermission('driver:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Drivers not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update drivers error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /drivers/:id/certify
router.put(
  '/:id/certify',
  requirePermission('driver:certify:global'),
  auditLog({ action: 'CERTIFY', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { certification_type, expiry_date } = req.body

      // Prevent self-certification (SoD)
      if (req.params.id === req.user!.id) {
        return res.status(403).json({
          error: 'Separation of Duties violation: You cannot certify yourself'
        })
      }

      const result = await pool.query(
        `UPDATE users SET
           certification_status = 'certified',
           certification_type = $3,
           certification_expiry = $4,
           certified_by = $5,
           certified_at = NOW(),
           updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, certification_type, expiry_date, req.user!.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Certify driver error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /drivers/:id
router.delete(
  '/:id',
  requirePermission('driver:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Drivers not found' })
      }

      res.json({ message: 'Drivers deleted successfully' })
    } catch (error) {
      console.error('Delete drivers error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
