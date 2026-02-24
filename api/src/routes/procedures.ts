import express, { Response } from 'express'

import { pool } from '../db/connection'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/procedures
router.get(
  '/',
  requirePermission('compliance:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, procedure_type, related_policy_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT id, tenant_id, procedure_code, procedure_name, procedure_type,
                          description, steps, related_policy_id, frequency,
                          estimated_duration_minutes, requires_certification, document_url,
                          status, version, created_at, updated_at
                   FROM procedures
                   WHERE tenant_id = $1`
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (status) {
        query += ` AND status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      if (procedure_type) {
        query += ` AND procedure_type = $${paramIndex}`
        params.push(procedure_type)
        paramIndex++
      }

      if (related_policy_id) {
        query += ` AND related_policy_id = $${paramIndex}`
        params.push(related_policy_id)
        paramIndex++
      }

      query += ` ORDER BY procedure_code ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM procedures WHERE tenant_id = $1`,
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
      logger.error('Get procedures error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/procedures/:id
router.get(
  '/:id',
  requirePermission('compliance:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, procedure_code, procedure_name, procedure_type,
                description, steps, related_policy_id, frequency,
                estimated_duration_minutes, requires_certification, document_url,
                status, version, created_at, updated_at
         FROM procedures
         WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Procedure not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get procedure error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
