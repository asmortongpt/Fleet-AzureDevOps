import express, { Response } from 'express'

import { pool } from '../db/connection'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/compliance-records
router.get(
  '/',
  requirePermission('compliance:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, vehicle_id, driver_id, requirement_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT cr.id, cr.tenant_id, cr.requirement_id, cr.vehicle_id, cr.driver_id,
                          cr.due_date, cr.completion_date, cr.completed_by, cr.status,
                          cr.compliance_percentage, cr.notes, cr.attachments, cr.next_due_date,
                          cr.created_at, cr.updated_at,
                          creq.requirement_name, creq.regulatory_body, creq.category
                   FROM compliance_records cr
                   JOIN compliance_requirements creq ON cr.requirement_id = creq.id
                   WHERE cr.tenant_id = $1`
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (status) {
        query += ` AND cr.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      if (vehicle_id) {
        query += ` AND cr.vehicle_id = $${paramIndex}`
        params.push(vehicle_id)
        paramIndex++
      }

      if (driver_id) {
        query += ` AND cr.driver_id = $${paramIndex}`
        params.push(driver_id)
        paramIndex++
      }

      if (requirement_id) {
        query += ` AND cr.requirement_id = $${paramIndex}`
        params.push(requirement_id)
        paramIndex++
      }

      query += ` ORDER BY cr.due_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM compliance_records WHERE tenant_id = $1`,
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
      logger.error('Get compliance records error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/compliance-records/:id
router.get(
  '/:id',
  requirePermission('compliance:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT cr.id, cr.tenant_id, cr.requirement_id, cr.vehicle_id, cr.driver_id,
                cr.due_date, cr.completion_date, cr.completed_by, cr.status,
                cr.compliance_percentage, cr.notes, cr.attachments, cr.next_due_date,
                cr.created_at, cr.updated_at,
                creq.requirement_name, creq.regulatory_body, creq.category
         FROM compliance_records cr
         JOIN compliance_requirements creq ON cr.requirement_id = creq.id
         WHERE cr.id = $1 AND cr.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Compliance record not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get compliance record error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
