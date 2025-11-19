import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { SqlParams } from '../types'

const router = express.Router()
router.use(authenticateJWT)

const damageReportSchema = z.object({
  vehicle_id: z.string().uuid(),
  reported_by: z.string().uuid().optional(),
  damage_description: z.string(),
  damage_severity: z.enum(['minor', 'moderate', 'severe']),
  damage_location: z.string().optional(),
  photos: z.array(z.string()).optional(),
  triposr_task_id: z.string().optional(),
  triposr_status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  triposr_model_url: z.string().optional(),
  linked_work_order_id: z.string().uuid().optional(),
  inspection_id: z.string().uuid().optional(),
})

// GET /damage-reports
router.get(
  '/',
  requirePermission('damage_report:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, vehicle_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = 'SELECT * FROM damage_reports WHERE tenant_id = $1'
      const params: SqlParams = [req.user!.tenant_id]

      if (vehicle_id) {
        query += ' AND vehicle_id = $2'
        params.push(vehicle_id)
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = vehicle_id
        ? 'SELECT COUNT(*) FROM damage_reports WHERE tenant_id = $1 AND vehicle_id = $2'
        : 'SELECT COUNT(*) FROM damage_reports WHERE tenant_id = $1'
      const countParams = vehicle_id ? [req.user!.tenant_id, vehicle_id] : [req.user!.tenant_id]
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
      console.error('Get damage reports error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /damage-reports/:id
router.get(
  '/:id',
  requirePermission('damage_report:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM damage_reports WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Damage report not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /damage-reports
router.post(
  '/',
  requirePermission('damage_report:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = damageReportSchema.parse(req.body)

      const result = await pool.query(
        `INSERT INTO damage_reports (
          tenant_id, vehicle_id, reported_by, damage_description,
          damage_severity, damage_location, photos, triposr_task_id,
          triposr_status, triposr_model_url, linked_work_order_id, inspection_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          req.user!.tenant_id,
          validatedData.vehicle_id,
          validatedData.reported_by || req.user!.id,
          validatedData.damage_description,
          validatedData.damage_severity,
          validatedData.damage_location || null,
          validatedData.photos || [],
          validatedData.triposr_task_id || null,
          validatedData.triposr_status || 'pending',
          validatedData.triposr_model_url || null,
          validatedData.linked_work_order_id || null,
          validatedData.inspection_id || null
        ]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Create damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /damage-reports/:id
router.put(
  '/:id',
  requirePermission('damage_report:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = damageReportSchema.partial().parse(req.body)

      const fields: string[] = []
      const values: SqlParams = []
      let paramIndex = 3

      Object.entries(validatedData).forEach(([key, value]) => {
        fields.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      })

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      const result = await pool.query(
        `UPDATE damage_reports SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Damage report not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Update damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PATCH /damage-reports/:id/triposr-status
// Update TripoSR processing status
router.patch(
  '/:id/triposr-status',
  requirePermission('damage_report:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { triposr_status, triposr_model_url } = req.body

      if (!triposr_status) {
        return res.status(400).json({ error: 'triposr_status is required' })
      }

      const result = await pool.query(
        `UPDATE damage_reports
         SET triposr_status = $1, triposr_model_url = $2, updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4 RETURNING *`,
        [triposr_status, triposr_model_url || null, req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Damage report not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update TripoSR status error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /damage-reports/:id
router.delete(
  '/:id',
  requirePermission('damage_report:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM damage_reports WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Damage report not found' })
      }

      res.json({ message: 'Damage report deleted successfully' })
    } catch (error) {
      console.error('Delete damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
