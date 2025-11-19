import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /inspections
router.get(
  '/',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, driver_id, inspection_type, status,
                passed, failed_items, odometer_reading, inspector_notes,
                signature_url, completed_at, created_at, updated_at
         FROM inspections WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM inspections WHERE tenant_id = $1',
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
      console.error('Get inspections error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /inspections/:id
router.get(
  '/:id',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, driver_id, inspection_type, status,
                passed, failed_items, checklist_data, odometer_reading,
                inspector_notes, signature_url, completed_at, created_at, updated_at
         FROM inspections WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Inspections not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get inspections error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /inspections
router.post(
  '/',
  requirePermission('inspection:create:own', {
    customCheck: async (req: AuthRequest) => {
      // Validate driver_id matches the authenticated user
      const driverId = req.body.driver_id
      if (!driverId) {
        return false
      }

      // Check if the driver_id belongs to the user
      const result = await pool.query(
        'SELECT id FROM drivers WHERE id = $1 AND user_id = $2 AND tenant_id = $3',
        [driverId, req.user!.id, req.user!.tenant_id]
      )

      return result.rows.length > 0
    }
  }),
  auditLog({ action: 'CREATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO inspections (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create inspections error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /inspections/:id
router.put(
  '/:id',
  requirePermission('inspection:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE inspections SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Inspections not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update inspections error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /inspections/:id
router.delete(
  '/:id',
  requirePermission('inspection:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM inspections WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Inspections not found' })
      }

      res.json({ message: 'Inspections deleted successfully' })
    } catch (error) {
      console.error('Delete inspections error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
