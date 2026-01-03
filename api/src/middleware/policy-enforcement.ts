import { Response, NextFunction } from 'express'

import { pool } from '../config/database'
import logger from '../utils/logger'

import { AuthRequest } from './auth'

/**
 * Policy Enforcement Middleware
 *
 * Checks if operations comply with active policies before allowing them.
 * Logs all policy evaluations and returns violations in responses.
 *
 * Usage:
 *   router.post('/vehicles', policyEnforcement(['vehicle-inspection', 'vehicle-safety']), ...)
 */

interface PolicyViolation {
  policy_id: number
  policy_code: string
  policy_name: string
  violation_type: string
  severity: 'Minor' | 'Moderate' | 'Serious' | 'Critical'
  message: string
}

interface PolicyEvaluationResult {
  compliant: boolean
  violations: PolicyViolation[]
  checks_performed: number
  policies_evaluated: number
  timestamp: string
}

/**
 * Evaluate a single policy against the current context
 */
async function evaluatePolicy(
  policyCode: string,
  context: {
    user_id?: number
    tenant_id?: number
    resource_type?: string
    operation?: string
    data?: any
  }
): Promise<{ compliant: boolean; violations: PolicyViolation[] }> {
  try {
    // Get active policy by code
    const policyResult = await pool.query(
      `SELECT * FROM policy_templates
       WHERE policy_code = $1 AND status = 'Active'`,
      [policyCode]
    )

    if (policyResult.rows.length === 0) {
      logger.warn(`Policy not found or inactive: ${policyCode}`)
      return { compliant: true, violations: [] }
    }

    const policy = policyResult.rows[0]
    const violations: PolicyViolation[] = []

    // Check 1: Policy not expired
    if (policy.expiration_date && new Date(policy.expiration_date) < new Date()) {
      violations.push({
        policy_id: policy.id,
        policy_code: policy.policy_code,
        policy_name: policy.policy_name,
        violation_type: 'expired_policy',
        severity: 'Serious',
        message: `Policy ${policy.policy_code} has expired`
      })
    }

    // Check 2: User has acknowledged policy (if mandatory)
    if (policy.is_mandatory && context.user_id) {
      const ackResult = await pool.query(
        `SELECT * FROM policy_acknowledgments
         WHERE policy_id = $1 AND employee_id = $2 AND is_current = TRUE`,
        [policy.id, context.user_id]
      )

      if (ackResult.rows.length === 0) {
        violations.push({
          policy_id: policy.id,
          policy_code: policy.policy_code,
          policy_name: policy.policy_name,
          violation_type: 'missing_acknowledgment',
          severity: 'Moderate',
          message: `User has not acknowledged mandatory policy: ${policy.policy_name}`
        })
      }
    }

    // Check 3: Training completed (if required)
    if (policy.requires_training && context.user_id) {
      const trainingResult = await pool.query(
        `SELECT * FROM policy_acknowledgments
         WHERE policy_id = $1 AND employee_id = $2
         AND is_current = TRUE AND training_completed = TRUE`,
        [policy.id, context.user_id]
      )

      if (trainingResult.rows.length === 0) {
        violations.push({
          policy_id: policy.id,
          policy_code: policy.policy_code,
          policy_name: policy.policy_name,
          violation_type: 'training_not_completed',
          severity: 'Moderate',
          message: `Required training not completed for policy: ${policy.policy_name}`
        })
      }
    }

    // Check 4: Test passed (if required)
    if (policy.requires_test && context.user_id) {
      const testResult = await pool.query(
        `SELECT * FROM policy_acknowledgments
         WHERE policy_id = $1 AND employee_id = $2
         AND is_current = TRUE AND test_taken = TRUE AND test_passed = TRUE`,
        [policy.id, context.user_id]
      )

      if (testResult.rows.length === 0) {
        violations.push({
          policy_id: policy.id,
          policy_code: policy.policy_code,
          policy_name: policy.policy_name,
          violation_type: 'test_not_passed',
          severity: 'Moderate',
          message: `Required test not passed for policy: ${policy.policy_name}`
        })
      }
    }

    return {
      compliant: violations.length === 0,
      violations
    }
  } catch (error) {
    logger.error('Error evaluating policy:', error)
    // On error, allow operation to proceed but log the error
    return { compliant: true, violations: [] }
  }
}

/**
 * Middleware factory for policy enforcement
 *
 * @param policyCodes - Array of policy codes to enforce
 * @param options - Enforcement options
 */
export function policyEnforcement(
  policyCodes: string[],
  options: {
    mode?: 'strict' | 'warn' // strict = block request, warn = allow but log
    logViolations?: boolean
    includeInResponse?: boolean
  } = {}
) {
  const { mode = 'warn', logViolations = true, includeInResponse = true } = options

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const evaluationResult: PolicyEvaluationResult = {
        compliant: true,
        violations: [],
        checks_performed: 0,
        policies_evaluated: policyCodes.length,
        timestamp: new Date().toISOString()
      }

      // Build context from request
      const context = {
        user_id: req.user?.id,
        tenant_id: req.user?.tenant_id,
        resource_type: req.baseUrl.split('/').pop(),
        operation: req.method,
        data: req.body
      }

      // Evaluate each policy
      for (const policyCode of policyCodes) {
        const result = await evaluatePolicy(policyCode, context)
        evaluationResult.checks_performed++

        if (!result.compliant) {
          evaluationResult.compliant = false
          evaluationResult.violations.push(...result.violations)
        }
      }

      // Log policy evaluation
      if (logViolations && !evaluationResult.compliant) {
        logger.warn('Policy violations detected', {
          user_id: context.user_id,
          tenant_id: context.tenant_id,
          resource_type: context.resource_type,
          operation: context.operation,
          violations: evaluationResult.violations,
          url: req.originalUrl,
          ip: req.ip
        })

        // Store violation in database (for serious violations)
        const seriousViolations = evaluationResult.violations.filter(
          v => v.severity === 'Serious' || v.severity === 'Critical'
        )

        for (const violation of seriousViolations) {
          try {
            await pool.query(
              `INSERT INTO policy_violations (
                policy_id, employee_id, violation_date, violation_description,
                severity, created_by
              ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)`,
              [
                violation.policy_id,
                context.user_id,
                `${violation.violation_type}: ${violation.message}`,
                violation.severity,
                context.user_id
              ]
            )
          } catch (dbError) {
            logger.error('Failed to log policy violation to database:', dbError)
          }
        }
      }

      // Include evaluation result in response (if requested)
      if (includeInResponse) {
        res.locals.policyEvaluation = evaluationResult
      }

      // Handle strict mode
      if (mode === 'strict' && !evaluationResult.compliant) {
        return res.status(403).json({
          error: 'Policy violation detected',
          message: 'Operation blocked due to policy non-compliance',
          policy_evaluation: evaluationResult
        })
      }

      // Continue to next middleware
      next()
    } catch (error) {
      logger.error('Policy enforcement middleware error:', error)
      // On error, allow request to proceed
      next()
    }
  }
}

/**
 * Check if user has acknowledged specific policy
 */
export async function hasAcknowledgedPolicy(
  userId: number,
  policyCode: string
): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT pa.* FROM policy_acknowledgments pa
       JOIN policy_templates pt ON pa.policy_id = pt.id
       WHERE pt.policy_code = $1 AND pa.employee_id = $2 AND pa.is_current = TRUE`,
      [policyCode, userId]
    )
    return result.rows.length > 0
  } catch (error) {
    logger.error('Error checking policy acknowledgment:', error)
    return false
  }
}

/**
 * Get all active policies applicable to a user
 */
export async function getUserApplicablePolicies(
  userId: number,
  userRole?: string
): Promise<any[]> {
  try {
    let query = `
      SELECT * FROM policy_templates
      WHERE status = 'Active'
    `
    const params: any[] = []

    if (userRole) {
      query += ` AND (applies_to_roles IS NULL OR $1 = ANY(applies_to_roles))`
      params.push(userRole)
    }

    query += ` ORDER BY policy_category, policy_name`

    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    logger.error('Error fetching user applicable policies:', error)
    return []
  }
}

/**
 * Get user's policy compliance status
 */
export async function getUserComplianceStatus(userId: number): Promise<{
  total_policies: number
  acknowledged_policies: number
  pending_acknowledgments: number
  compliance_rate: number
  violations_count: number
}> {
  try {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM policy_templates WHERE status = 'Active' AND is_mandatory = TRUE) as total_policies,
        (SELECT COUNT(*) FROM policy_acknowledgments pa
         JOIN policy_templates pt ON pa.policy_id = pt.id
         WHERE pa.employee_id = $1 AND pa.is_current = TRUE AND pt.status = 'Active' AND pt.is_mandatory = TRUE) as acknowledged_policies,
        (SELECT COUNT(*) FROM policy_violations WHERE employee_id = $1) as violations_count`,
      [userId]
    )

    const data = result.rows[0]
    const total = parseInt(data.total_policies) || 0
    const acknowledged = parseInt(data.acknowledged_policies) || 0
    const pending = total - acknowledged
    const compliance_rate = total > 0 ? (acknowledged / total) * 100 : 100

    return {
      total_policies: total,
      acknowledged_policies: acknowledged,
      pending_acknowledgments: pending,
      compliance_rate: Math.round(compliance_rate * 100) / 100,
      violations_count: parseInt(data.violations_count) || 0
    }
  } catch (error) {
    logger.error('Error getting user compliance status:', error)
    return {
      total_policies: 0,
      acknowledged_policies: 0,
      pending_acknowledgments: 0,
      compliance_rate: 0,
      violations_count: 0
    }
  }
}

export default policyEnforcement
