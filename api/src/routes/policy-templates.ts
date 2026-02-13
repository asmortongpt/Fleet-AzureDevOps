import express, { Response } from 'express'

import { pool } from '../config/database';
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'
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
      logger.error('Get policy templates error:', error)
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
        `SELECT 
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
      approved_by FROM policy_templates WHERE id = $1`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy template not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get policy template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates
router.post(
  '/',
  csrfProtection, requirePermission('policy:create:global'),
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
      logger.error('Create policy template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /policy-templates/:id
router.put(
  '/:id',
  csrfProtection,
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
      logger.error('Update policy template error:', error)
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
      logger.error('Get policy acknowledgments error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/:id/acknowledge
router.post(
  '/:id/acknowledge',
  csrfProtection, requirePermission('policy:create:global'),
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
      logger.error('Create policy acknowledgment error:', error)
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
        throw new NotFoundError("Employee not found")
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get employee compliance error:', error)
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
      logger.error('Get policy violations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/violations
router.post(
  '/violations',
  csrfProtection, requirePermission('policy:delete:global'),
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
      logger.error('Create policy violation error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /policy-templates/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('policy:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if policy has acknowledgments or violations
      const usageCheck = await pool.query(
        `SELECT
          (SELECT COUNT(*) FROM policy_acknowledgments WHERE policy_id = $1) as acknowledgment_count,
          (SELECT COUNT(*) FROM policy_violations WHERE policy_id = $1) as violation_count`,
        [req.params.id]
      )

      const { acknowledgment_count, violation_count } = usageCheck.rows[0]

      // If policy is in use, archive it instead of deleting
      if (parseInt(acknowledgment_count) > 0 || parseInt(violation_count) > 0) {
        const result = await pool.query(
          `UPDATE policy_templates
           SET status = 'Archived', updated_at = NOW(), updated_by = $2
           WHERE id = $1
           RETURNING *`,
          [req.params.id, req.user!.id]
        )

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Policy template not found' })
        }

        return res.json({
          message: 'Policy archived (cannot delete due to existing acknowledgments or violations)',
          policy: result.rows[0]
        })
      }

      // Safe to delete
      const result = await pool.query(
        `DELETE FROM policy_templates WHERE id = $1 RETURNING *`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy template not found' })
      }

      res.json({ message: 'Policy template deleted successfully', policy: result.rows[0] })
    } catch (error) {
      logger.error('Delete policy template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/:id/activate
router.post(
  '/:id/activate',
  csrfProtection,
  requirePermission('policy:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE policy_templates
         SET status = 'Active',
             effective_date = COALESCE(effective_date, CURRENT_DATE),
             next_review_date = COALESCE(next_review_date, CURRENT_DATE + INTERVAL '1 year' * review_cycle_months / 12),
             updated_at = NOW(),
             updated_by = $2,
             approved_at = NOW(),
             approved_by = $2
         WHERE id = $1
         RETURNING *`,
        [req.params.id, req.user!.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy template not found' })
      }

      res.json({
        message: 'Policy template activated successfully',
        policy: result.rows[0]
      })
    } catch (error) {
      logger.error('Activate policy template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/:id/deactivate
router.post(
  '/:id/deactivate',
  csrfProtection,
  requirePermission('policy:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE policy_templates
         SET status = 'Archived',
             updated_at = NOW(),
             updated_by = $2
         WHERE id = $1
         RETURNING *`,
        [req.params.id, req.user!.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy template not found' })
      }

      res.json({
        message: 'Policy template deactivated successfully',
        policy: result.rows[0]
      })
    } catch (error) {
      logger.error('Deactivate policy template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /policy-templates/:id/violations
router.get(
  '/:id/violations',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_violations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT pv.*,
                d.first_name || ' ' || d.last_name as employee_name,
                d.employee_id as employee_number
         FROM policy_violations pv
         JOIN drivers d ON pv.employee_id = d.id
         WHERE pv.policy_id = $1 AND d.tenant_id = $2
         ORDER BY pv.violation_date DESC
         LIMIT $3 OFFSET $4`,
        [req.params.id, req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*)
         FROM policy_violations pv
         JOIN drivers d ON pv.employee_id = d.id
         WHERE pv.policy_id = $1 AND d.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
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
      logger.error('Get policy violations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/:id/execute
router.post(
  '/:id/execute',
  csrfProtection,
  requirePermission('policy:view:global'),
  auditLog({ action: 'EXECUTE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { context = {} } = req.body

      // Get the policy template
      const policyResult = await pool.query(
        `SELECT * FROM policy_templates WHERE id = $1`,
        [req.params.id]
      )

      if (policyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Policy template not found' })
      }

      const policy = policyResult.rows[0]

      // Evaluate policy against provided context
      const evaluationResult = {
        policy_id: policy.id,
        policy_code: policy.policy_code,
        policy_name: policy.policy_name,
        evaluated_at: new Date().toISOString(),
        context,
        checks: [] as any[],
        compliant: true,
        violations: [] as any[]
      }

      // Example policy checks (customize based on your needs)

      // Check 1: Is policy active?
      evaluationResult.checks.push({
        check: 'policy_active',
        passed: policy.status === 'Active',
        message: policy.status === 'Active' ? 'Policy is active' : `Policy status is ${policy.status}`
      })

      // Check 2: Has employee acknowledged policy?
      if (context.employee_id) {
        const ackResult = await pool.query(
          `SELECT * FROM policy_acknowledgments
           WHERE policy_id = $1 AND employee_id = $2 AND is_current = TRUE`,
          [req.params.id, context.employee_id]
        )

        const hasAcknowledged = ackResult.rows.length > 0
        evaluationResult.checks.push({
          check: 'employee_acknowledged',
          passed: hasAcknowledged,
          message: hasAcknowledged
            ? `Employee acknowledged policy on ${ackResult.rows[0].acknowledged_at}`
            : 'Employee has not acknowledged policy',
          data: hasAcknowledged ? ackResult.rows[0] : null
        })

        if (!hasAcknowledged && policy.is_mandatory) {
          evaluationResult.compliant = false
          evaluationResult.violations.push({
            violation_type: 'missing_acknowledgment',
            severity: 'Moderate',
            message: 'Mandatory policy not acknowledged by employee'
          })
        }
      }

      // Check 3: Policy not expired
      if (policy.expiration_date) {
        const expired = new Date(policy.expiration_date) < new Date()
        evaluationResult.checks.push({
          check: 'policy_not_expired',
          passed: !expired,
          message: expired
            ? `Policy expired on ${policy.expiration_date}`
            : `Policy valid until ${policy.expiration_date}`
        })

        if (expired) {
          evaluationResult.compliant = false
          evaluationResult.violations.push({
            violation_type: 'expired_policy',
            severity: 'Serious',
            message: 'Policy has expired'
          })
        }
      }

      // Check 4: Role applicability
      if (policy.applies_to_roles && context.employee_role) {
        const roleApplies = policy.applies_to_roles.includes(context.employee_role)
        evaluationResult.checks.push({
          check: 'role_applicability',
          passed: true,
          message: roleApplies
            ? `Policy applies to role: ${context.employee_role}`
            : `Policy does not apply to role: ${context.employee_role}`,
          applies: roleApplies
        })
      }

      res.json({
        message: 'Policy evaluation completed',
        evaluation: evaluationResult
      })
    } catch (error) {
      logger.error('Execute policy template error:', error)
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
      logger.error('Get policy compliance audits error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policy-templates/audits
router.post(
  '/audits',
  csrfProtection,
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
      logger.error('Create policy compliance audit error:', error)
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
      logger.error('Get policy templates dashboard error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
