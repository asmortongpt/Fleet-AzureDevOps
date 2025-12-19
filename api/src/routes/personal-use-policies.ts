import express, { Response } from 'express';
import { z } from 'zod';

import { container } from '../container';
import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import { QueryContext } from '../repositories/BaseRepository';
import { PersonalUsePoliciesRepository } from '../repositories/PersonalUsePoliciesRepository';
import { TYPES } from '../types';
import { ApprovalWorkflow, DriverUsageLimits } from '../types/trip-usage';

const router = express.Router();
router.use(authenticateJWT);

// Get repository from DI container
const repository = container.get<PersonalUsePoliciesRepository>(TYPES.PersonalUsePoliciesRepository);

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

/**
 * GET /api/personal-use-policies
 * Get tenant's personal use policy configuration
 * REFACTORED: No direct database queries
 */
router.get(
  '/',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      };

      const policy = await repository.getPolicyByTenant(context);

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
 * REFACTORED: No direct database queries
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

      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      };

      // Check if policy exists
      const exists = await repository.policyExists(context);

      let result;
      if (exists) {
        // Update existing policy
        result = await repository.updatePolicy(validated, context);
      } else {
        // Create new policy
        result = await repository.createPolicy(validated, context);
      }

      res.json({
        success: true,
        data: result,
        message: exists
          ? 'Personal use policy updated successfully'
          : 'Personal use policy created successfully'
      });
    } catch (error: any) {
      console.error('Update policy error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update personal use policy' });
    }
  }
);

/**
 * GET /api/personal-use-policies/limits/:driver_id
 * Get driver's current usage vs policy limits
 * REFACTORED: No direct database queries
 */
router.get(
  '/limits/:driver_id',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driver_id } = req.params;

      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      };

      // Verify driver belongs to tenant
      const driver = await repository.getDriverByIdAndTenant(driver_id, context);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Get policy
      const policy = await repository.getPolicyForLimits(context);

      // Calculate current month usage
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyPersonalMiles = await repository.getMonthlyUsage(driver_id, currentMonth, context);

      // Calculate current year usage
      const currentYear = new Date().getFullYear();
      const yearlyPersonalMiles = await repository.getYearlyUsage(driver_id, currentYear, context);

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
      };

      // Add warnings
      if (response.current_month.exceeds_limit) {
        response.warnings.push(
          `Monthly limit exceeded: ${monthlyPersonalMiles.toFixed(1)} / ${policy.max_personal_miles_per_month} miles`
        );
      } else if (response.current_month.percentage_used && response.current_month.percentage_used >= 80) {
        response.warnings.push(
          `Approaching monthly limit: ${monthlyPersonalMiles.toFixed(1)} / ${policy.max_personal_miles_per_month} miles (${response.current_month.percentage_used}%)`
        );
      }

      if (response.current_year.exceeds_limit) {
        response.warnings.push(
          `Annual limit exceeded: ${yearlyPersonalMiles.toFixed(1)} / ${policy.max_personal_miles_per_year} miles`
        );
      } else if (response.current_year.percentage_used && response.current_year.percentage_used >= 80) {
        response.warnings.push(
          `Approaching annual limit: ${yearlyPersonalMiles.toFixed(1)} / ${policy.max_personal_miles_per_year} miles (${response.current_year.percentage_used}%)`
        );
      }

      if (!policy?.allow_personal_use) {
        response.warnings.push('Personal use is not permitted per organization policy');
      }

      res.json({
        success: true,
        data: response
      });
    } catch (error: any) {
      console.error('Get usage limits error:', error);
      res.status(500).json({ error: 'Failed to calculate usage limits' });
    }
  }
);

/**
 * GET /api/personal-use-policies/drivers-at-limit
 * Get list of drivers approaching or exceeding limits (admin only)
 * REFACTORED: No direct database queries
 */
router.get(
  '/drivers-at-limit',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { threshold = 80 } = req.query; // Percentage threshold

      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      };

      // Get policy
      const policy = await repository.getPolicyWithLimits(context);

      if (!policy || !policy.max_personal_miles_per_month) {
        return res.json({
          success: true,
          data: [],
          message: 'No usage limits configured'
        });
      }

      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get drivers and their usage
      const drivers = await repository.getDriversAtLimit(
        policy.max_personal_miles_per_month,
        currentMonth,
        parseInt(threshold as string),
        context
      );

      res.json({
        success: true,
        data: drivers,
        metadata: {
          threshold_percentage: parseInt(threshold as string),
          month: currentMonth,
          monthly_limit: policy.max_personal_miles_per_month
        }
      });
    } catch (error: any) {
      console.error('Get drivers at limit error:', error);
      res.status(500).json({ error: 'Failed to retrieve drivers at limit' });
    }
  }
);

export default router;
