Here's the refactored TypeScript file using `PolicyTemplatesRepository` instead of direct database queries:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { PolicyTemplatesRepository } from '../repositories/policy-templates-repository';
import { csrfProtection } from '../middleware/csrf';

const router = express.Router();
router.use(authenticateJWT);

// Initialize the PolicyTemplatesRepository
const policyTemplatesRepository = container.resolve(PolicyTemplatesRepository);

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
      const { page = 1, limit = 50, category, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [data, total] = await policyTemplatesRepository.getPolicyTemplates({
        category: category as string,
        status: status as string,
        limit: Number(limit),
        offset,
      });

      res.json({
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error(`Get policy templates error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /policy-templates/:id
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const policyTemplate = await policyTemplatesRepository.getPolicyTemplateById(id);

      if (!policyTemplate) {
        throw new NotFoundError('Policy template not found');
      }

      res.json(policyTemplate);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        console.error(`Get policy template error:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /policy-templates
router.post(
  '/',
  requirePermission('policy:create:global'),
  csrfProtection,
  auditLog({ action: 'CREATE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        policy_code: z.string().min(1),
        policy_name: z.string().min(1),
        policy_category: z.string().min(1),
        sub_category: z.string().optional(),
        policy_objective: z.string().min(1),
        policy_scope: z.string().min(1),
        policy_content: z.string().min(1),
        procedures: z.string().optional(),
        regulatory_references: z.string().optional(),
        industry_standards: z.string().optional(),
        responsible_roles: z.string().optional(),
        approval_required_from: z.string().optional(),
        version: z.string().min(1),
        effective_date: z.string().min(1),
        review_cycle_months: z.number().int().positive(),
        next_review_date: z.string().optional(),
        expiration_date: z.string().optional(),
        supersedes_policy_id: z.string().optional(),
        status: z.string().min(1),
        is_mandatory: z.boolean(),
        applies_to_roles: z.string().optional(),
        requires_training: z.boolean(),
        requires_test: z.boolean(),
        test_questions: z.string().optional(),
        related_forms: z.string().optional(),
        attachments: z.string().optional(),
        created_by: z.string().min(1),
      });

      const validatedData = schema.parse(req.body);

      const newPolicyTemplate = await policyTemplatesRepository.createPolicyTemplate({
        ...validatedData,
        tenant_id: req.user?.tenant_id || req.body.tenant_id,
      });

      res.status(201).json(newPolicyTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        console.error(`Create policy template error:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// PUT /policy-templates/:id
router.put(
  '/:id',
  requirePermission('policy:update:global'),
  csrfProtection,
  auditLog({ action: 'UPDATE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const schema = z.object({
        policy_code: z.string().min(1).optional(),
        policy_name: z.string().min(1).optional(),
        policy_category: z.string().min(1).optional(),
        sub_category: z.string().optional(),
        policy_objective: z.string().min(1).optional(),
        policy_scope: z.string().min(1).optional(),
        policy_content: z.string().min(1).optional(),
        procedures: z.string().optional(),
        regulatory_references: z.string().optional(),
        industry_standards: z.string().optional(),
        responsible_roles: z.string().optional(),
        approval_required_from: z.string().optional(),
        version: z.string().min(1).optional(),
        effective_date: z.string().min(1).optional(),
        review_cycle_months: z.number().int().positive().optional(),
        next_review_date: z.string().optional(),
        expiration_date: z.string().optional(),
        supersedes_policy_id: z.string().optional(),
        status: z.string().min(1).optional(),
        is_mandatory: z.boolean().optional(),
        applies_to_roles: z.string().optional(),
        requires_training: z.boolean().optional(),
        requires_test: z.boolean().optional(),
        test_questions: z.string().optional(),
        related_forms: z.string().optional(),
        attachments: z.string().optional(),
        updated_by: z.string().min(1),
      });

      const validatedData = schema.parse(req.body);

      const updatedPolicyTemplate = await policyTemplatesRepository.updatePolicyTemplate(id, {
        ...validatedData,
        tenant_id: req.user?.tenant_id || req.body.tenant_id,
      });

      if (!updatedPolicyTemplate) {
        throw new NotFoundError('Policy template not found');
      }

      res.json(updatedPolicyTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        console.error(`Update policy template error:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// DELETE /policy-templates/:id
router.delete(
  '/:id',
  requirePermission('policy:delete:global'),
  csrfProtection,
  auditLog({ action: 'DELETE', resourceType: 'policy_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await policyTemplatesRepository.deletePolicyTemplate(id);

      if (!deleted) {
        throw new NotFoundError('Policy template not found');
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        console.error(`Delete policy template error:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

export default router;


This refactored version of the file implements the following changes:

1. Imported `PolicyTemplatesRepository` at the top of the file.
2. Replaced all `pool.query` calls with corresponding methods from `PolicyTemplatesRepository`.
3. Kept all existing route handlers and logic.
4. Maintained `tenant_id` from `req.user` or `req.body` where necessary.
5. Kept error handling intact.
6. Returned the complete refactored file.

The main changes include:

- Initializing the `PolicyTemplatesRepository` using the dependency injection container.
- Replacing database query logic with calls to repository methods:
  - `getPolicyTemplates` for the GET /policy-templates route
  - `getPolicyTemplateById` for the GET /policy-templates/:id route
  - `createPolicyTemplate` for the POST /policy-templates route
  - `updatePolicyTemplate` for the PUT /policy-templates/:id route
  - `deletePolicyTemplate` for the DELETE /policy-templates/:id route

- Passing the `tenant_id` to repository methods where necessary, using `req.user?.tenant_id || req.body.tenant_id`.

The structure and error handling of the routes remain the same, but now they use the repository pattern for data access, which improves maintainability and allows for easier testing and potential future changes in the data access layer.