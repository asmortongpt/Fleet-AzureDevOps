import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /facilities
router.get(
  '/',
  requirePermission('facility:view:global'),
  auditLog({ action: 'READ', resourceType: 'facilities' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT 
      id,
      tenant_id,
      name,
      facility_type,
      address,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      location,
      phone,
      capacity,
      service_bays,
      is_active,
      notes,
      created_at,
      updated_at FROM facilities WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM facilities WHERE tenant_id = $1',
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
      console.error('Get facilities error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /facilities/:id
router.get(
  '/:id',
  requirePermission('facility:view:global'),
  auditLog({ action: 'READ', resourceType: 'facilities' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
      id,
      tenant_id,
      name,
      facility_type,
      address,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      location,
      phone,
      capacity,
      service_bays,
      is_active,
      notes,
      created_at,
      updated_at FROM facilities WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Facilities not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get facilities error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /facilities
router.post(
  '/',
  requirePermission('facility:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'facilities' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO facilities (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create facilities error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /facilities/:id
router.put(
  '/:id',
  requirePermission('facility:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'facilities' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE facilities SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Facilities not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update facilities error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /facilities/:id
router.delete(
  '/:id',
  requirePermission('facility:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'facilities' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM facilities WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Facilities not found' })
      }

      res.json({ message: 'Facilities deleted successfully' })
    } catch (error) {
      console.error('Delete facilities error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
