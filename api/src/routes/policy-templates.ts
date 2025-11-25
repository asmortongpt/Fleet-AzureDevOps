import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// ============================================================================
// Policy Templates - Industry-standard policy library
// ============================================================================

// GET /policy-templates
router.get(
  '/',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, category, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT 
      id,
      policy_code,
      policy_name,
      policy_category,
      sub_category,
      policy_objective,
      policy_scope,
      policy_content,
      procedures,
      regulatory_references,
      industry_standards,
      responsible_roles,
      approval_required_from,
      version,
      effective_date,
      review_cycle_months,
      next_review_date,
      expiration_date,
      supersedes_policy_id,
      status,
      is_mandatory,
      applies_to_roles,
      requires_training,
      requires_test,
      test_questions,
      related_forms,
      attachments,
      times_acknowledged,
      last_acknowledged_at,
      created_at,
      created_by,
      updated_at,
      updated_by,
      approved_at,
      approved_by FROM policy_templates WHERE 1=1`
      const params: any[] = []
      let paramIndex = 1

      if (category) {
        query += ` AND policy_category = $${paramIndex}`
        params.push(category)
        paramIndex++
      }

      if (status) {
        query += ` AND status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      query += ` ORDER BY policy_category, policy_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `SELECT COUNT(*) FROM policy_templates WHERE 1=1`
      const countResult = await pool.query(countQuery)

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
      console.error('Get policy templates error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /policy-templates/:id
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT 
      id,
      policy_code,
      policy_name,
      policy_category,
      sub_category,
      policy_objective,
      policy_scope,
      policy_content,
      procedures,
      regulatory_references,
      industry_standards,
      responsible_roles,
      approval_required_from,
      version,
      effective_date,
      review_cycle_months,
      next_review_date,
      expiration_date,
      supersedes_policy_id,
      status,
      is_mandatory,
      applies_to_roles,
      requires_training,
      requires_test,
      test_questions,
      related_forms,
      attachments,
      times_acknowledged,
      last_acknowledged_at,
      created_at,
      created_by,
      updated_at,
      updated_by,
      approved_at,
      approved_by FROM policy_templates WHERE id = $1',
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy template not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get policy template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates
router.post(
  '/',
  requirePermission('policy:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['created_by'],
        1
      )

      const result = await pool.query(
        `INSERT INTO policy_templates (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create policy template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /policy-templates/:id
router.put(
  '/:id',
  requirePermission('policy:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE policy_templates
         SET ${fields}, updated_at = NOW(), updated_by = $2
         WHERE id = $1
         RETURNING *`,
        [req.params.id, req.user!.id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy template not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update policy template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Policy Acknowledgments - Employee acknowledgments and digital signatures
// ============================================================================

// GET /policy-templates/:id/acknowledgments
router.get(
  '/:id/acknowledgments',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_acknowledgments' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT pa.*,
                d.first_name || ' ' || d.last_name as employee_name,
                d.employee_id
         FROM policy_acknowledgments pa
         JOIN drivers d ON pa.employee_id = d.id
         WHERE pa.policy_id = $1 AND d.tenant_id = $2
         ORDER BY pa.acknowledged_at DESC`,
        [req.params.id, req.user!.tenant_id]
      )

      res.json({ data: result.rows })
    } catch (error) {
      console.error('Get policy acknowledgments error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/:id/acknowledge
router.post(
  '/:id/acknowledge',
  requirePermission('policy:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'policy_acknowledgments' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        signature_data,
        ip_address,
        device_info,
        test_taken = false,
        test_score,
        test_passed = false
      } = req.body

      // Mark previous acknowledgments as not current
      await pool.query(
        `UPDATE policy_acknowledgments
         SET is_current = FALSE
         WHERE policy_id = $1 AND employee_id = $2`,
        [req.params.id, req.user!.id]
      )

      // Create new acknowledgment
      const result = await pool.query(
        `INSERT INTO policy_acknowledgments (
          policy_id, employee_id, signature_data, ip_address, device_info,
          test_taken, test_score, test_passed, is_current
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        RETURNING *`,
        [
          req.params.id,
          req.user!.id,
          signature_data,
          ip_address,
          device_info,
          test_taken,
          test_score,
          test_passed
        ]
      )

      // Update policy acknowledgment count
      await pool.query(
        `UPDATE policy_templates
         SET times_acknowledged = times_acknowledged + 1,
             last_acknowledged_at = NOW()
         WHERE id = $1`,
        [req.params.id]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create policy acknowledgment error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Employee Compliance Dashboard
// ============================================================================

// GET /policy-templates/compliance/employee/:employee_id
router.get(
  '/compliance/employee/:employee_id',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_compliance' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          d.id AS employee_id,
          d.first_name || ' ' || d.last_name AS employee_name,
          COUNT(DISTINCT pt.id) AS total_policies,
          COUNT(DISTINCT pa.policy_id) AS acknowledged_policies,
          COUNT(DISTINCT pt.id) - COUNT(DISTINCT pa.policy_id) AS pending_acknowledgments,
          MAX(pa.acknowledged_at) AS last_acknowledgment_date
         FROM drivers d
         CROSS JOIN policy_templates pt
         LEFT JOIN policy_acknowledgments pa ON d.id = pa.employee_id AND pt.id = pa.policy_id AND pa.is_current = TRUE
         WHERE d.id = $1
           AND d.tenant_id = $2
           AND pt.status = 'Active'
           AND (pt.applies_to_roles IS NULL OR d.role = ANY(pt.applies_to_roles))
         GROUP BY d.id, d.first_name, d.last_name`,
        [req.params.employee_id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get employee compliance error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Policy Violations
// ============================================================================

// GET /policy-templates/violations
router.get(
  '/violations',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_violations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, employee_id, policy_id, severity } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT pv.*,
               pt.policy_name,
               d.first_name || ' ' || d.last_name as employee_name,
               d.employee_id as employee_number
        FROM policy_violations pv
        JOIN policy_templates pt ON pv.policy_id = pt.id
        JOIN drivers d ON pv.employee_id = d.id
        WHERE d.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (employee_id) {
        query += ` AND pv.employee_id = $${paramIndex}`
        params.push(employee_id)
        paramIndex++
      }

      if (policy_id) {
        query += ` AND pv.policy_id = $${paramIndex}`
        params.push(policy_id)
        paramIndex++
      }

      if (severity) {
        query += ` AND pv.severity = $${paramIndex}`
        params.push(severity)
        paramIndex++
      }

      query += ` ORDER BY pv.violation_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM policy_violations pv
        JOIN drivers d ON pv.employee_id = d.id
        WHERE d.tenant_id = $1
      `
      const countResult = await pool.query(countQuery, [req.user!.tenant_id])

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
      console.error('Get policy violations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/violations
router.post(
  '/violations',
  requirePermission('policy:delete:global'),
  auditLog({ action: 'CREATE', resourceType: 'policy_violations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['created_by'],
        1
      )

      const result = await pool.query(
        `INSERT INTO policy_violations (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create policy violation error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Policy Compliance Audits
// ============================================================================

// GET /policy-templates/audits
router.get(
  '/audits',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_compliance_audits' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, policy_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT pca.*,
               pt.policy_name
        FROM policy_compliance_audits pca
        JOIN policy_templates pt ON pca.policy_id = pt.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      if (policy_id) {
        query += ` AND pca.policy_id = $${paramIndex}`
        params.push(policy_id)
        paramIndex++
      }

      query += ` ORDER BY pca.audit_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `SELECT COUNT(*) FROM policy_compliance_audits`
      const countResult = await pool.query(countQuery)

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
      console.error('Get policy compliance audits error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/audits
router.post(
  '/audits',
  requirePermission('policy:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'policy_compliance_audits' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['created_by'],
        1
      )

      const result = await pool.query(
        `INSERT INTO policy_compliance_audits (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create policy compliance audit error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Dashboard & Analytics
// ============================================================================

// GET /policy-templates/dashboard
router.get(
  '/dashboard',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_templates_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Total active policies
      const policiesResult = await pool.query(
        `SELECT COUNT(*) as active_policies,
                COUNT(CASE WHEN next_review_date < CURRENT_DATE THEN 1 END) as overdue_reviews,
                COUNT(CASE WHEN next_review_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as upcoming_reviews
         FROM policy_templates
         WHERE status = 'Active'`
      )

      // Compliance rate
      const complianceResult = await pool.query(
        `SELECT
          COUNT(DISTINCT d.id) as total_employees,
          COUNT(DISTINCT CASE WHEN pa.id IS NOT NULL THEN d.id END) as compliant_employees
         FROM drivers d
         CROSS JOIN policy_templates pt
         LEFT JOIN policy_acknowledgments pa ON d.id = pa.employee_id AND pt.id = pa.policy_id AND pa.is_current = TRUE
         WHERE d.tenant_id = $1
         AND pt.status = 'Active'
         AND pt.is_mandatory = TRUE`,
        [req.user!.tenant_id]
      )

      // Violations this month
      const violationsResult = await pool.query(
        `SELECT severity, COUNT(*) as count
         FROM policy_violations pv
         JOIN drivers d ON pv.employee_id = d.id
         WHERE d.tenant_id = $1
         AND pv.violation_date >= DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY severity
         ORDER BY count DESC`,
        [req.user!.tenant_id]
      )

      res.json({
        policies: policiesResult.rows[0],
        compliance: complianceResult.rows[0],
        violations: violationsResult.rows
      })
    } catch (error) {
      console.error('Get policy templates dashboard error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
