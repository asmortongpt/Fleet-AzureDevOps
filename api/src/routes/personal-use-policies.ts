import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import {
  ApprovalWorkflow,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  DriverUsageLimits
} from '../types/trip-usage'

const router = express.Router()
router.use(authenticateJWT)

// Validation schemas
const createPolicySchema = z.object({
  allow_personal_use: z.boolean(),
  require_approval: z.boolean(),
  max_personal_miles_per_month: z.number().int().positive().optional(),
  max_personal_miles_per_year: z.number().int().positive().optional(),
  charge_personal_use: z.boolean(),
  personal_use_rate_per_mile: z.number().nonnegative().optional(),
  reporting_required: z.boolean().optional(),
  approval_workflow: z.enum([
    ApprovalWorkflow.MANAGER,
    ApprovalWorkflow.FLEET_ADMIN,
    ApprovalWorkflow.BOTH,
    ApprovalWorkflow.NONE
  ]).optional(),
  notification_settings: z.object({
    notify_at_percentage: z.number().min(0).max(100).optional(),
    notify_manager_on_exceed: z.boolean().optional(),
    notify_driver_on_limit: z.boolean().optional(),
    email_notifications: z.boolean().optional()
  }).optional(),
  auto_approve_under_miles: z.number().int().positive().optional(),
  effective_date: z.string(),
  expiration_date: z.string().optional()
})

/**
 * GET /api/personal-use-policies
 * Get tenant's personal use policy configuration
 */
router.get(
  '/',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
              u.name as created_by_name
       FROM personal_use_policies p
       LEFT JOIN users u ON p.created_by_user_id = u.id
       WHERE p.tenant_id = $1`,
      [req.user!.tenant_id]
    )

    if (result.rows.length === 0) {
      // Return default policy if none exists
      return res.json({
        success: true,
        data: {
          tenant_id: req.user!.tenant_id,
          allow_personal_use: false,
          require_approval: true,
          charge_personal_use: false,
          reporting_required: true,
          approval_workflow: ApprovalWorkflow.MANAGER,
          notification_settings: {
            notify_at_percentage: 80,
            notify_manager_on_exceed: true,
            notify_driver_on_limit: true,
            email_notifications: true
          },
          effective_date: new Date().toISOString().split('T')[0],
          is_default: true
        },
        message: 'No policy configured - using defaults. Create a policy to customize.'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: any) {
    console.error('Get policy error:', error)
    res.status(500).json({ error: 'Failed to retrieve personal use policy' })
  }
})

/**
 * PUT /api/personal-use-policies/:tenant_id
 * Create or update tenant's personal use policy (admin only)
 */
router.put(
  '/:tenant_id',
  requirePermission('policy:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'personal_use_policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Verify tenant_id matches user's tenant
      if (req.params.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Cannot modify policy for another tenant' })
      }

      const validated = createPolicySchema.parse(req.body)

      // Validation: if charging for personal use, rate must be provided
      if (validated.charge_personal_use && !validated.personal_use_rate_per_mile) {
        return res.status(400).json({
          error: 'Personal use rate per mile is required when charge_personal_use is enabled'
        })
      }

      // Validation: yearly limit should exceed monthly limit
      if (validated.max_personal_miles_per_year &&
          validated.max_personal_miles_per_month &&
          validated.max_personal_miles_per_year < validated.max_personal_miles_per_month) {
        return res.status(400).json({
          error: 'Annual limit must be greater than or equal to monthly limit'
        })
      }

      // Check if policy exists
      const existingResult = await pool.query(
        'SELECT id FROM personal_use_policies WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      let result

      if (existingResult.rows.length > 0) {
        // Update existing policy
        result = await pool.query(
          `UPDATE personal_use_policies
           SET allow_personal_use = $1,
               require_approval = $2,
               max_personal_miles_per_month = $3,
               max_personal_miles_per_year = $4,
               charge_personal_use = $5,
               personal_use_rate_per_mile = $6,
               reporting_required = $7,
               approval_workflow = $8,
               notification_settings = $9,
               auto_approve_under_miles = $10,
               effective_date = $11,
               expiration_date = $12,
               updated_at = NOW()
           WHERE tenant_id = $13
           RETURNING *`,
          [
            validated.allow_personal_use,
            validated.require_approval,
            validated.max_personal_miles_per_month || null,
            validated.max_personal_miles_per_year || null,
            validated.charge_personal_use,
            validated.personal_use_rate_per_mile || null,
            validated.reporting_required ?? true,
            validated.approval_workflow || ApprovalWorkflow.MANAGER,
            JSON.stringify(validated.notification_settings || {}),
            validated.auto_approve_under_miles || null,
            validated.effective_date,
            validated.expiration_date || null,
            req.user!.tenant_id
          ]
        )
      } else {
        // Create new policy
        result = await pool.query(
          `INSERT INTO personal_use_policies (
            tenant_id, allow_personal_use, require_approval,
            max_personal_miles_per_month, max_personal_miles_per_year,
            charge_personal_use, personal_use_rate_per_mile,
            reporting_required, approval_workflow, notification_settings,
            auto_approve_under_miles, effective_date, expiration_date,
            created_by_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING *`,
          [
            req.user!.tenant_id,
            validated.allow_personal_use,
            validated.require_approval,
            validated.max_personal_miles_per_month || null,
            validated.max_personal_miles_per_year || null,
            validated.charge_personal_use,
            validated.personal_use_rate_per_mile || null,
            validated.reporting_required ?? true,
            validated.approval_workflow || ApprovalWorkflow.MANAGER,
            JSON.stringify(validated.notification_settings || {}),
            validated.auto_approve_under_miles || null,
            validated.effective_date,
            validated.expiration_date || null,
            req.user!.id
          ]
        )
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: existingResult.rows.length > 0
          ? 'Personal use policy updated successfully'
          : 'Personal use policy created successfully'
      })
    } catch (error: any) {
      console.error('Update policy error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors })
      }
      res.status(500).json({ error: 'Failed to update personal use policy' })
    }
  }
)

/**
 * GET /api/personal-use-policies/limits/:driver_id
 * Get driver's current usage vs policy limits
 */
router.get(
  '/limits/:driver_id',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { driver_id } = req.params

    // Verify driver belongs to tenant
    const driverCheck = await pool.query(
      'SELECT id, name FROM users WHERE id = $1 AND tenant_id = $2',
      [driver_id, req.user!.tenant_id]
    )

    if (driverCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    // Get policy
    const policyResult = await pool.query(
      'SELECT 
      id,
      tenant_id,
      name,
      description,
      rate_per_mile,
      rate_type,
      effective_date,
      expiry_date,
      is_active,
      created_at,
      updated_at FROM personal_use_policies WHERE tenant_id = $1',
      [req.user!.tenant_id]
    )

    const policy = policyResult.rows[0]

    // Calculate current month usage
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthUsageResult = await pool.query(
      `SELECT COALESCE(SUM(miles_personal), 0) as personal_miles
       FROM trip_usage_classification
       WHERE driver_id = $1
         AND tenant_id = $2
         AND TO_CHAR(trip_date, 'YYYY-MM') = $3
         AND approval_status != 'rejected'`,
      [driver_id, req.user!.tenant_id, currentMonth]
    )

    const monthlyPersonalMiles = parseFloat(monthUsageResult.rows[0].personal_miles)

    // Calculate current year usage
    const currentYear = new Date().getFullYear()
    const yearUsageResult = await pool.query(
      `SELECT COALESCE(SUM(miles_personal), 0) as personal_miles
       FROM trip_usage_classification
       WHERE driver_id = $1
         AND tenant_id = $2
         AND EXTRACT(YEAR FROM trip_date) = $3
         AND approval_status != 'rejected'`,
      [driver_id, req.user!.tenant_id, currentYear]
    )

    const yearlyPersonalMiles = parseFloat(yearUsageResult.rows[0].personal_miles)

    // Build response
    const response: DriverUsageLimits = {
      driver_id,
      tenant_id: req.user!.tenant_id,
      current_month: {
        period: currentMonth,
        personal_miles: monthlyPersonalMiles,
        limit: policy?.max_personal_miles_per_month || undefined,
        percentage_used: policy?.max_personal_miles_per_month
          ? Math.round((monthlyPersonalMiles / policy.max_personal_miles_per_month) * 100)
          : undefined,
        exceeds_limit: policy?.max_personal_miles_per_month
          ? monthlyPersonalMiles > policy.max_personal_miles_per_month
          : false
      },
      current_year: {
        year: currentYear,
        personal_miles: yearlyPersonalMiles,
        limit: policy?.max_personal_miles_per_year || undefined,
        percentage_used: policy?.max_personal_miles_per_year
          ? Math.round((yearlyPersonalMiles / policy.max_personal_miles_per_year) * 100)
          : undefined,
        exceeds_limit: policy?.max_personal_miles_per_year
          ? yearlyPersonalMiles > policy.max_personal_miles_per_year
          : false
      },
      warnings: [],
      policy: {
        allow_personal_use: policy?.allow_personal_use ?? false,
        require_approval: policy?.require_approval ?? true,
        charge_personal_use: policy?.charge_personal_use ?? false
      }
    }

    // Add warnings
    if (response.current_month.exceeds_limit) {
      response.warnings.push(
        `Monthly limit exceeded: ${monthlyPersonalMiles.toFixed(1)} / ${policy.max_personal_miles_per_month} miles`
      )
    } else if (response.current_month.percentage_used && response.current_month.percentage_used >= 80) {
      response.warnings.push(
        `Approaching monthly limit: ${monthlyPersonalMiles.toFixed(1)} / ${policy.max_personal_miles_per_month} miles (${response.current_month.percentage_used}%)`
      )
    }

    if (response.current_year.exceeds_limit) {
      response.warnings.push(
        `Annual limit exceeded: ${yearlyPersonalMiles.toFixed(1)} / ${policy.max_personal_miles_per_year} miles`
      )
    } else if (response.current_year.percentage_used && response.current_year.percentage_used >= 80) {
      response.warnings.push(
        `Approaching annual limit: ${yearlyPersonalMiles.toFixed(1)} / ${policy.max_personal_miles_per_year} miles (${response.current_year.percentage_used}%)`
      )
    }

    if (!policy?.allow_personal_use) {
      response.warnings.push('Personal use is not permitted per organization policy')
    }

    res.json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('Get usage limits error:', error)
    res.status(500).json({ error: 'Failed to calculate usage limits' })
  }
})

/**
 * GET /api/personal-use-policies/drivers-at-limit
 * Get list of drivers approaching or exceeding limits (admin only)
 */
router.get(
  '/drivers-at-limit',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { threshold = 80 } = req.query // Percentage threshold

      // Get policy
      const policyResult = await pool.query(
        'SELECT 
      id,
      tenant_id,
      name,
      description,
      rate_per_mile,
      rate_type,
      effective_date,
      expiry_date,
      is_active,
      created_at,
      updated_at FROM personal_use_policies WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      if (policyResult.rows.length === 0 || !policyResult.rows[0].max_personal_miles_per_month) {
        return res.json({
          success: true,
          data: [],
          message: 'No usage limits configured'
        })
      }

      const policy = policyResult.rows[0]
      const currentMonth = new Date().toISOString().slice(0, 7)

      // Get drivers and their usage
      const result = await pool.query(
        `SELECT
           u.id as driver_id,
           u.name as driver_name,
           u.email as driver_email,
           COALESCE(SUM(t.miles_personal), 0) as personal_miles,
           $1 as monthly_limit,
           ROUND((COALESCE(SUM(t.miles_personal), 0) / $1 * 100)::numeric, 2) as percentage_used,
           CASE
             WHEN COALESCE(SUM(t.miles_personal), 0) > $1 THEN true
             ELSE false
           END as exceeds_limit
         FROM users u
         LEFT JOIN trip_usage_classification t ON u.id = t.driver_id
           AND TO_CHAR(t.trip_date, 'YYYY-MM') = $2
           AND t.approval_status != 'rejected'
         WHERE u.tenant_id = $3
         GROUP BY u.id, u.name, u.email
         HAVING COALESCE(SUM(t.miles_personal), 0) / $1 * 100 >= $4
         ORDER BY percentage_used DESC`,
        [
          policy.max_personal_miles_per_month,
          currentMonth,
          req.user!.tenant_id,
          threshold
        ]
      )

      res.json({
        success: true,
        data: result.rows,
        metadata: {
          threshold_percentage: parseInt(threshold as string),
          month: currentMonth,
          monthly_limit: policy.max_personal_miles_per_month
        }
      })
    } catch (error: any) {
      console.error('Get drivers at limit error:', error)
      res.status(500).json({ error: 'Failed to retrieve drivers at limit' })
    }
  }
)

export default router
