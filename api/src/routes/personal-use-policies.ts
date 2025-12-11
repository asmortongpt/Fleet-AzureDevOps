To complete the refactoring process, we need to create the `PersonalUsePolicyRepository` class. Here's the complete implementation of the repository and the refactored file:

First, let's create the `PersonalUsePolicyRepository` class:


// repositories/PersonalUsePolicyRepository.ts

import { PoolClient } from 'pg';
import { pool } from '../database';
import { ApprovalWorkflow, DriverUsageLimits } from '../types/trip-usage';

export interface PersonalUsePolicy {
  tenant_id: string;
  allow_personal_use: boolean;
  require_approval: boolean;
  max_personal_miles_per_month?: number;
  max_personal_miles_per_year?: number;
  charge_personal_use: boolean;
  personal_use_rate_per_mile?: number;
  reporting_required?: boolean;
  approval_workflow?: ApprovalWorkflow;
  notification_settings?: {
    notify_at_percentage?: number;
    notify_manager_on_exceed?: boolean;
    notify_driver_on_limit?: boolean;
    email_notifications?: boolean;
  };
  auto_approve_under_miles?: number;
  effective_date: string;
  expiration_date?: string;
}

export class PersonalUsePolicyRepository {
  private client: PoolClient;

  constructor(client?: PoolClient) {
    this.client = client || pool;
  }

  async getPolicyByTenantId(tenantId: string): Promise<PersonalUsePolicy | null> {
    const query = `
      SELECT * FROM personal_use_policies
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.client.query(query, [tenantId]);
    return result.rows[0] || null;
  }

  async upsertPolicy(tenantId: string, policy: PersonalUsePolicy): Promise<PersonalUsePolicy> {
    const query = `
      INSERT INTO personal_use_policies (
        tenant_id, allow_personal_use, require_approval, max_personal_miles_per_month,
        max_personal_miles_per_year, charge_personal_use, personal_use_rate_per_mile,
        reporting_required, approval_workflow, notification_settings, auto_approve_under_miles,
        effective_date, expiration_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (tenant_id) DO UPDATE SET
        allow_personal_use = EXCLUDED.allow_personal_use,
        require_approval = EXCLUDED.require_approval,
        max_personal_miles_per_month = EXCLUDED.max_personal_miles_per_month,
        max_personal_miles_per_year = EXCLUDED.max_personal_miles_per_year,
        charge_personal_use = EXCLUDED.charge_personal_use,
        personal_use_rate_per_mile = EXCLUDED.personal_use_rate_per_mile,
        reporting_required = EXCLUDED.reporting_required,
        approval_workflow = EXCLUDED.approval_workflow,
        notification_settings = EXCLUDED.notification_settings,
        auto_approve_under_miles = EXCLUDED.auto_approve_under_miles,
        effective_date = EXCLUDED.effective_date,
        expiration_date = EXCLUDED.expiration_date
      RETURNING *
    `;

    const values = [
      tenantId,
      policy.allow_personal_use,
      policy.require_approval,
      policy.max_personal_miles_per_month,
      policy.max_personal_miles_per_year,
      policy.charge_personal_use,
      policy.personal_use_rate_per_mile,
      policy.reporting_required,
      policy.approval_workflow,
      JSON.stringify(policy.notification_settings),
      policy.auto_approve_under_miles,
      policy.effective_date,
      policy.expiration_date
    ];

    const result = await this.client.query(query, values);
    return result.rows[0];
  }
}


Now, here's the complete refactored file with the repository pattern implemented:


// routes/personalUsePolicies.ts

import express, { Response } from 'express';
import { z } from 'zod';

import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import {
  ApprovalWorkflow,
  DriverUsageLimits
} from '../types/trip-usage';

// Import the new repository
import { PersonalUsePolicyRepository } from '../repositories/PersonalUsePolicyRepository';

const router = express.Router();
router.use(authenticateJWT);

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
});

// Create an instance of the repository
const personalUsePolicyRepository = new PersonalUsePolicyRepository();

/**
 * GET /api/personal-use-policies
 * Get tenant's personal use policy configuration
 */
router.get(
  '/',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const policy = await personalUsePolicyRepository.getPolicyByTenantId(req.user!.tenant_id);

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
        });
      }

      res.json({
        success: true,
        data: policy
      });
    } catch (error: any) {
      console.error('Get policy error:', error);
      res.status(500).json({ error: 'Failed to retrieve personal use policy' });
    }
  }
);

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
        return res.status(403).json({ error: 'Cannot modify policy for another tenant' });
      }

      const validated = createPolicySchema.parse(req.body);

      // Validation: if charging for personal use, rate must be provided
      if (validated.charge_personal_use && !validated.personal_use_rate_per_mile) {
        return res.status(400).json({
          error: 'Personal use rate per mile is required when charge_personal_use is enabled'
        });
      }

      // Validation: yearly limit should exceed monthly limit
      if (validated.max_personal_miles_per_year &&
          validated.max_personal_miles_per_month &&
          validated.max_personal_miles_per_year < validated.max_personal_miles_per_month) {
        return res.status(400).json({
          error: 'Annual limit must be greater than or equal to monthly limit'
        });
      }

      const policy = await personalUsePolicyRepository.upsertPolicy(req.user!.tenant_id, validated);

      res.json({
        success: true,
        data: policy,
        message: 'Personal use policy updated successfully'
      });
    } catch (error: any) {
      console.error('Update policy error:', error);
      res.status(500).json({ error: 'Failed to update personal use policy' });
    }
  }
);

export default router;


This refactored version replaces all `pool.query` calls with methods from the `PersonalUsePolicyRepository` class. The repository encapsulates the database operations, making the code more modular and easier to maintain. The main route file now focuses on business logic and validation, while the database operations are handled by the repository.