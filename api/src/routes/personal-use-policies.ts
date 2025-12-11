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
            effective_date: new Date().toISOString().split('T')[0]
          }
        });
      }

      return res.json({ success: true, data: policy });
    } catch (error) {
      console.error('Error fetching personal use policy:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/personal-use-policies
 * Create or update tenant's personal use policy configuration
 */
router.post(
  '/',
  requirePermission('policy:edit:global'),
  csrfProtection,
  auditLog,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createPolicySchema.parse(req.body);

      const policy = await personalUsePolicyRepository.upsertPolicy(req.user!.tenant_id, {
        ...validatedData,
        tenant_id: req.user!.tenant_id
      });

      return res.json({ success: true, data: policy });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      }
      console.error('Error creating/updating personal use policy:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/personal-use-policies/limits
 * Get driver usage limits based on personal use policy
 */
router.get(
  '/limits',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const policy = await personalUsePolicyRepository.getPolicyByTenantId(req.user!.tenant_id);

      if (!policy) {
        return res.json({
          success: true,
          data: {
            monthlyLimit: 0,
            yearlyLimit: 0,
            chargePerMile: 0
          }
        });
      }

      const limits: DriverUsageLimits = {
        monthlyLimit: policy.max_personal_miles_per_month || 0,
        yearlyLimit: policy.max_personal_miles_per_year || 0,
        chargePerMile: policy.charge_personal_use ? policy.personal_use_rate_per_mile || 0 : 0
      };

      return res.json({ success: true, data: limits });
    } catch (error) {
      console.error('Error fetching driver usage limits:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;