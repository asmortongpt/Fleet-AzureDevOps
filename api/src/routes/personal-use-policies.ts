To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a repository class that encapsulates the database operations. Here's the complete refactored file:


import express, { Response } from 'express'
import { z } from 'zod'

import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import {
  ApprovalWorkflow,
  DriverUsageLimits
} from '../types/trip-usage'

// Import the new repository
import { PersonalUsePolicyRepository } from '../repositories/PersonalUsePolicyRepository'

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

// Create an instance of the repository
const personalUsePolicyRepository = new PersonalUsePolicyRepository()

/**
 * GET /api/personal-use-policies
 * Get tenant's personal use policy configuration
 */
router.get(
  '/',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const policy = await personalUsePolicyRepository.getPolicyByTenantId(req.user!.tenant_id)

      if (!policy) {
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
        data: policy
      })
    } catch (error: any) {
      console.error('Get policy error:', error)
      res.status(500).json({ error: 'Failed to retrieve personal use policy' })
    }
  }
)

/**
 * PUT /api/personal-use-policies/:tenant_id
 * Create or update tenant's personal use policy (admin only)
 */
router.put(
  '/:tenant_id',
  csrfProtection,
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

      const policy = await personalUsePolicyRepository.upsertPolicy(req.user!.tenant_id, validated)

      res.json({
        success: true,
        data: policy,
        message: 'Personal use policy updated successfully'
      })
    } catch (error: any) {
      console.error('Update policy error:', error)
      res.status(500).json({ error: 'Failed to update personal use policy' })
    }
  }
)

export default router


Now, we need to create the `PersonalUsePolicyRepository` class. Here's an example implementation:


// File: src/repositories/PersonalUsePolicyRepository.ts

import { PoolClient } from 'pg'
import { ApprovalWorkflow } from '../types/trip-usage'

interface PersonalUsePolicy {
  id?: number
  tenant_id: string
  allow_personal_use: boolean
  require_approval: boolean
  max_personal_miles_per_month?: number
  max_personal_miles_per_year?: number
  charge_personal_use: boolean
  personal_use_rate_per_mile?: number
  reporting_required?: boolean
  approval_workflow?: ApprovalWorkflow
  notification_settings?: {
    notify_at_percentage?: number
    notify_manager_on_exceed?: boolean
    notify_driver_on_limit?: boolean
    email_notifications?: boolean
  }
  auto_approve_under_miles?: number
  effective_date: string
  expiration_date?: string
  created_by_user_id?: number
  created_by_name?: string
}

export class PersonalUsePolicyRepository {
  private client: PoolClient

  constructor(client: PoolClient = pool) {
    this.client = client
  }

  async getPolicyByTenantId(tenantId: string): Promise<PersonalUsePolicy | null> {
    const result = await this.client.query(
      `SELECT p.*,
              u.name as created_by_name
       FROM personal_use_policies p
       LEFT JOIN users u ON p.created_by_user_id = u.id
       WHERE p.tenant_id = $1`,
      [tenantId]
    )

    return result.rows[0] || null
  }

  async upsertPolicy(tenantId: string, policyData: Omit<PersonalUsePolicy, 'id' | 'tenant_id' | 'created_by_user_id' | 'created_by_name'>): Promise<PersonalUsePolicy> {
    const existingPolicy = await this.getPolicyByTenantId(tenantId)

    if (existingPolicy) {
      // Update existing policy
      const result = await this.client.query(
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
             expiration_date = $12
         WHERE tenant_id = $13
         RETURNING *`,
        [
          policyData.allow_personal_use,
          policyData.require_approval,
          policyData.max_personal_miles_per_month,
          policyData.max_personal_miles_per_year,
          policyData.charge_personal_use,
          policyData.personal_use_rate_per_mile,
          policyData.reporting_required,
          policyData.approval_workflow,
          JSON.stringify(policyData.notification_settings),
          policyData.auto_approve_under_miles,
          policyData.effective_date,
          policyData.expiration_date,
          tenantId
        ]
      )

      return result.rows[0]
    } else {
      // Create new policy
      const result = await this.client.query(
        `INSERT INTO personal_use_policies (
           tenant_id,
           allow_personal_use,
           require_approval,
           max_personal_miles_per_month,
           max_personal_miles_per_year,
           charge_personal_use,
           personal_use_rate_per_mile,
           reporting_required,
           approval_workflow,
           notification_settings,
           auto_approve_under_miles,
           effective_date,
           expiration_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          tenantId,
          policyData.allow_personal_use,
          policyData.require_approval,
          policyData.max_personal_miles_per_month,
          policyData.max_personal_miles_per_year,
          policyData.charge_personal_use,
          policyData.personal_use_rate_per_mile,
          policyData.reporting_required,
          policyData.approval_workflow,
          JSON.stringify(policyData.notification_settings),
          policyData.auto_approve_under_miles,
          policyData.effective_date,
          policyData.expiration_date
        ]
      )

      return result.rows[0]
    }
  }
}


This refactoring introduces a `PersonalUsePolicyRepository` class that encapsulates the database operations for personal use policies. The router now uses this repository instead of directly querying the database.

Key changes:

1. Created a `PersonalUsePolicyRepository` class with methods for getting and upserting policies.
2. Replaced `pool.query` calls with repository method calls.
3. Updated the router to use the repository instance.
4. Simplified the logic in the router by using the repository's `upsertPolicy` method, which handles both creating and updating policies.

This refactoring improves the separation of concerns, making the code more maintainable and easier to test. The repository can be easily mocked for unit testing the router, and database operations can be modified or optimized within the repository without affecting the router logic.