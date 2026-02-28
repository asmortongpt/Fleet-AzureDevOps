import express, { Response } from 'express'

import { pool } from '../db/connection'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/policy-acknowledgments
router.get(
  '/',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_acknowledgments')`
      )
      if (!tableCheck.rows[0].exists) {
        return res.json({
          data: [],
          pagination: { page: 1, limit: 50, total: 0, pages: 0 }
        })
      }

      const { page = 1, limit = 50, policy_id, employee_number, is_current } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT pa.id, pa.policy_id, pa.employee_number, pa.acknowledged_at,
                          pa.acknowledgment_method, pa.signature_data, pa.ip_address, pa.device_info,
                          pa.test_taken, pa.test_score, pa.test_passed,
                          pa.training_completed, pa.training_completed_at, pa.training_duration_minutes,
                          pa.is_current, pa.superseded_by_acknowledgment_id,
                          pt.policy_name, pt.policy_code,
                          d.first_name || ' ' || d.last_name as employee_name
                   FROM policy_acknowledgments pa
                   JOIN policy_templates pt ON pa.policy_id = pt.id
                   LEFT JOIN drivers d ON pa.employee_number = d.id
                   WHERE 1=1`
      const params: unknown[] = []
      let paramIndex = 1

      if (policy_id) {
        query += ` AND pa.policy_id = $${paramIndex}`
        params.push(policy_id)
        paramIndex++
      }

      if (employee_number) {
        query += ` AND pa.employee_number = $${paramIndex}`
        params.push(employee_number)
        paramIndex++
      }

      if (is_current !== undefined) {
        query += ` AND pa.is_current = $${paramIndex}`
        params.push(is_current === 'true')
        paramIndex++
      }

      query += ` ORDER BY pa.acknowledged_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(`SELECT COUNT(*) FROM policy_acknowledgments`)

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
      logger.error('Get policy acknowledgments error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/policy-acknowledgments/:id
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_acknowledgments')`
      )
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Policy acknowledgment not found' })
      }

      const result = await pool.query(
        `SELECT pa.id, pa.policy_id, pa.employee_number, pa.acknowledged_at,
                pa.acknowledgment_method, pa.signature_data, pa.ip_address, pa.device_info,
                pa.test_taken, pa.test_score, pa.test_passed,
                pa.training_completed, pa.training_completed_at, pa.training_duration_minutes,
                pa.is_current, pa.superseded_by_acknowledgment_id,
                pt.policy_name, pt.policy_code,
                d.first_name || ' ' || d.last_name as employee_name
         FROM policy_acknowledgments pa
         JOIN policy_templates pt ON pa.policy_id = pt.id
         LEFT JOIN drivers d ON pa.employee_number = d.id
         WHERE pa.id = $1`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy acknowledgment not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get policy acknowledgment error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
