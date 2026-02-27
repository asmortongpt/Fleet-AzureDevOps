import express, { Response } from 'express'

import { pool } from '../db/connection'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/policy-compliance-audits
router.get(
  '/',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, policy_id, audit_type } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT pca.id, pca.policy_id, pca.audit_date, pca.auditor_name,
                          pca.audit_type, pca.location, pca.department,
                          pca.compliance_score, pca.compliant_items, pca.non_compliant_items,
                          pca.findings, pca.corrective_actions_required, pca.follow_up_required,
                          pca.created_by, pca.created_at,
                          pt.policy_name, pt.policy_code
                   FROM policy_compliance_audits pca
                   JOIN policy_templates pt ON pca.policy_id = pt.id
                   WHERE 1=1`
      const params: unknown[] = []
      let paramIndex = 1

      if (policy_id) {
        query += ` AND pca.policy_id = $${paramIndex}`
        params.push(policy_id)
        paramIndex++
      }

      if (audit_type) {
        query += ` AND pca.audit_type = $${paramIndex}`
        params.push(audit_type)
        paramIndex++
      }

      query += ` ORDER BY pca.audit_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(`SELECT COUNT(*) FROM policy_compliance_audits`)

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
      logger.error('Get policy compliance audits error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/policy-compliance-audits/:id
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT pca.id, pca.policy_id, pca.audit_date, pca.auditor_name,
                pca.audit_type, pca.location, pca.department,
                pca.employees_audited, pca.vehicles_audited,
                pca.compliance_score, pca.compliant_items, pca.non_compliant_items,
                pca.findings, pca.corrective_actions_required, pca.corrective_actions,
                pca.corrective_actions_completed, pca.corrective_actions_due_date,
                pca.follow_up_required, pca.follow_up_date, pca.follow_up_completed,
                pca.audit_report_url, pca.photos_urls,
                pca.created_by, pca.created_at,
                pt.policy_name, pt.policy_code
         FROM policy_compliance_audits pca
         JOIN policy_templates pt ON pca.policy_id = pt.id
         WHERE pca.id = $1`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy compliance audit not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get policy compliance audit error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
