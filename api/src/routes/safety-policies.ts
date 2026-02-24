import express, { Response } from 'express'

import { pool } from '../db/connection'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/safety-policies
router.get(
  '/',
  requirePermission('compliance:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, policy_category } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT id, tenant_id, policy_number, policy_name, policy_category,
                          description, effective_date, review_date, status, document_url,
                          created_by, approved_by, approval_date, version,
                          created_at, updated_at
                   FROM safety_policies
                   WHERE tenant_id = $1`
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (status) {
        query += ` AND status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      if (policy_category) {
        query += ` AND policy_category = $${paramIndex}`
        params.push(policy_category)
        paramIndex++
      }

      query += ` ORDER BY policy_number ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM safety_policies WHERE tenant_id = $1`,
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
      logger.error('Get safety policies error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/safety-policies/:id
router.get(
  '/:id',
  requirePermission('compliance:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, policy_number, policy_name, policy_category,
                description, effective_date, review_date, status, document_url,
                created_by, approved_by, approval_date, version,
                created_at, updated_at
         FROM safety_policies
         WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Safety policy not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get safety policy error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
