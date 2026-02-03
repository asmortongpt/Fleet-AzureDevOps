import express, { Response } from 'express'

import logger from '../config/logger'; // Wave 16: Add Winston logger
import { pool } from '../db/connection';
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'


const router = express.Router()
router.use(authenticateJWT)

const parsePolicyContent = (content: any) => {
  if (!content) return {}
  if (typeof content === 'string') {
    try {
      return JSON.parse(content)
    } catch {
      return {}
    }
  }
  if (typeof content === 'object') return content
  return {}
}

const evaluateCondition = (actual: any, operator: string, expected: any): boolean => {
  const op = operator?.toLowerCase()
  switch (op) {
    case 'equals':
    case '==':
    case 'eq':
      return actual === expected
    case 'not_equals':
    case '!=':
    case 'neq':
      return actual !== expected
    case 'gt':
    case '>':
      return Number(actual) > Number(expected)
    case 'gte':
    case '>=':
      return Number(actual) >= Number(expected)
    case 'lt':
    case '<':
      return Number(actual) < Number(expected)
    case 'lte':
    case '<=':
      return Number(actual) <= Number(expected)
    case 'in':
      return Array.isArray(expected) ? expected.includes(actual) : false
    case 'contains':
      if (Array.isArray(actual)) return actual.includes(expected)
      if (typeof actual === 'string') return actual.includes(String(expected))
      return false
    default:
      return false
  }
}

// GET /policies
router.get(
  '/',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT 
      id,
      tenant_id,
      name,
      description,
      category,
      content,
      version,
      is_active,
      effective_date,
      created_by,
      created_at,
      updated_at FROM policies WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM policies WHERE tenant_id = $1`,
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
      logger.error(`Get policies error:`, error) // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /policies/:id
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
      id,
      tenant_id,
      name,
      description,
      category,
      content,
      version,
      is_active,
      effective_date,
      created_by,
      created_at,
      updated_at FROM policies WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Policies not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get policies error:', error) // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policies/:id/execute
router.post(
  '/:id/execute',
  csrfProtection, requirePermission('policy:view:global'),
  auditLog({ action: 'EXECUTE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { context = {} } = req.body || {}

      const result = await pool.query(
        `SELECT * FROM policies WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Policies not found` })
      }

      const policy = result.rows[0]
      const content = parsePolicyContent(policy.content)
      const status = String(content.status ?? (policy.is_active ? 'active' : 'draft')).toLowerCase()
      const isActive = status === 'active' || policy.is_active === true

      const evaluation = {
        policy_id: policy.id,
        policy_name: policy.name,
        evaluated_at: new Date().toISOString(),
        context,
        checks: [] as any[],
        compliant: true,
        violations: [] as any[]
      }

      evaluation.checks.push({
        check: 'policy_active',
        passed: isActive,
        message: isActive ? 'Policy is active' : `Policy status is ${status}`
      })

      if (!isActive) {
        evaluation.compliant = false
        evaluation.violations.push({
          violation_type: 'inactive_policy',
          severity: 'Low',
          message: 'Policy is not active'
        })
      }

      const applicableRoles = content.appliesToRoles || content.roles
      if (Array.isArray(applicableRoles) && context.employee_role) {
        const applies = applicableRoles.includes(context.employee_role)
        evaluation.checks.push({
          check: 'role_applicability',
          passed: true,
          applies,
          message: applies
            ? `Policy applies to role: ${context.employee_role}`
            : `Policy does not apply to role: ${context.employee_role}`
        })
      }

      const conditions = Array.isArray(content.conditions) ? content.conditions : []
      if (conditions.length > 0) {
        const failedConditions: any[] = []

        conditions.forEach((condition: any, index: number) => {
          const field = condition.field ?? condition.key ?? condition.attribute
          const operator = condition.operator ?? condition.op ?? 'equals'
          const expected = condition.value
          const actual = field ? context[field] : undefined
          const passed = evaluateCondition(actual, operator, expected)

          evaluation.checks.push({
            check: `condition_${index + 1}`,
            field,
            operator,
            expected,
            actual,
            passed,
            message: passed ? 'Condition satisfied' : 'Condition failed'
          })

          if (!passed) {
            failedConditions.push({ field, operator, expected, actual })
          }
        })

        if (failedConditions.length > 0) {
          evaluation.compliant = false
          evaluation.violations.push({
            violation_type: 'condition_failed',
            severity: 'Moderate',
            message: 'Policy conditions not met',
            details: failedConditions
          })
        }
      }

      res.json({
        message: 'Policy evaluation completed',
        evaluation
      })
    } catch (error) {
      logger.error('Execute policies error:', error) // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policies (SafetyOfficer can create)
router.post(
  '/',
 csrfProtection, requirePermission('policy:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        [`tenant_id`],
        1
      )

      const result = await pool.query(
        `INSERT INTO policies (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      logger.error(`Create policies error:`, error) // Wave 16: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /policies/:id (FleetAdmin only for deployment)
router.put(
  `/:id`,
  csrfProtection, requirePermission('policy:deploy:global'),
  auditLog({ action: 'UPDATE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE policies SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Policies not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error(`Update policies error:`, error) // Wave 16: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// DELETE /policies/:id
router.delete(
  '/:id',
 csrfProtection, requirePermission('policy:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM policies WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("Policies not found")
      }

      res.json({ message: 'Policies deleted successfully' })
    } catch (error) {
      logger.error('Delete policies error:', error) // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
