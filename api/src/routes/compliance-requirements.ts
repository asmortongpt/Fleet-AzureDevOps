import express, { Response } from 'express'

import { pool } from '../db/connection'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/compliance-requirements
router.get(
  '/',
  requirePermission('compliance:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_requirements')`
      )
      if (!tableCheck.rows[0].exists) {
        return res.json({
          data: [],
          pagination: { page: 1, limit: 50, total: 0, pages: 0 }
        })
      }

      const { page = 1, limit = 50, category, regulatory_body, applies_to } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT id, tenant_id, requirement_code, requirement_name, regulatory_body,
                          category, description, frequency, applies_to, penalty_for_non_compliance,
                          document_url, is_active, effective_date, created_at, updated_at
                   FROM compliance_requirements
                   WHERE tenant_id = $1`
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (category) {
        query += ` AND category = $${paramIndex}`
        params.push(category)
        paramIndex++
      }

      if (regulatory_body) {
        query += ` AND regulatory_body = $${paramIndex}`
        params.push(regulatory_body)
        paramIndex++
      }

      if (applies_to) {
        query += ` AND applies_to = $${paramIndex}`
        params.push(applies_to)
        paramIndex++
      }

      query += ` ORDER BY requirement_code ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM compliance_requirements WHERE tenant_id = $1`,
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
      logger.error('Get compliance requirements error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/compliance-requirements/:id
router.get(
  '/:id',
  requirePermission('compliance:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_requirements')`
      )
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Compliance requirement not found' })
      }

      const result = await pool.query(
        `SELECT id, tenant_id, requirement_code, requirement_name, regulatory_body,
                category, description, frequency, applies_to, penalty_for_non_compliance,
                document_url, is_active, effective_date, created_at, updated_at
         FROM compliance_requirements
         WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Compliance requirement not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get compliance requirement error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
