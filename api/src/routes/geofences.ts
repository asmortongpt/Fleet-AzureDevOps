import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /geofences
router.get(
  '/',
  requirePermission('geofence:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT * FROM geofences WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM geofences WHERE tenant_id = $1',
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
      console.error('Get geofences error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /geofences/:id
router.get(
  '/:id',
  requirePermission('geofence:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM geofences WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Geofences not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get geofences error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /geofences
router.post(
  '/',
  requirePermission('geofence:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO geofences (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create geofences error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /geofences/:id
router.put(
  '/:id',
  requirePermission('geofence:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE geofences SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Geofences not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update geofences error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /geofences/:id
router.delete(
  '/:id',
  requirePermission('geofence:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM geofences WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Geofences not found' })
      }

      res.json({ message: 'Geofences deleted successfully' })
    } catch (error) {
      console.error('Delete geofences error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
