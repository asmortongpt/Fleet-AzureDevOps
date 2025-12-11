Here's the complete refactored version of the `cost-benefit-analysis.routes.ts` file, replacing all `pool.query` or `db.query` calls with repository methods:


/**
 * Cost/Benefit Analysis API Routes
 * Supports BR-5 (Cost/Benefit Analysis Management)
 *
 * Handles:
 * - Cost/benefit analysis creation and management
 * - Quantifiable cost tracking
 * - Non-quantifiable factor assessment
 * - Analysis approval workflow
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';

// Import repositories
import { CostBenefitRepository } from '../repositories/cost-benefit.repository';
import { DepartmentRepository } from '../repositories/department.repository';
import { VehicleAssignmentRepository } from '../repositories/vehicle-assignment.repository';
import { UserRepository } from '../repositories/user.repository';

const router = express.Router();

// Initialize repositories
const costBenefitRepository = container.resolve(CostBenefitRepository);
const departmentRepository = container.resolve(DepartmentRepository);
const vehicleAssignmentRepository = container.resolve(VehicleAssignmentRepository);
const userRepository = container.resolve(UserRepository);

// =====================================================
// Validation Schemas
// =====================================================

const createCostBenefitSchema = z.object({
  vehicle_assignment_id: z.string().uuid().optional(),
  department_id: z.string().uuid(),
  requesting_position: z.string(),

  // Quantifiable costs
  annual_fuel_cost: z.number().nonnegative().default(0),
  annual_maintenance_cost: z.number().nonnegative().default(0),
  annual_insurance_cost: z.number().nonnegative().default(0),
  annual_parking_cost: z.number().nonnegative().default(0),
  vehicle_elimination_savings: z.number().nonnegative().default(0),

  // Quantifiable benefits
  productivity_impact_hours: z.number().nonnegative().default(0),
  productivity_impact_dollars: z.number().nonnegative().default(0),
  on_call_expense_reduction: z.number().nonnegative().default(0),
  mileage_reimbursement_reduction: z.number().nonnegative().default(0),
  labor_cost_savings: z.number().nonnegative().default(0),

  // Non-quantifiable factors
  public_safety_impact: z.string().optional(),
  visibility_requirement: z.string().optional(),
  response_time_impact: z.string().optional(),
  employee_identification_need: z.string().optional(),
  specialty_equipment_need: z.string().optional(),
  other_non_quantifiable_factors: z.string().optional(),

  // Overall
  recommendation: z.string().optional(),
});

const updateCostBenefitSchema = createCostBenefitSchema.partial();

const reviewCostBenefitSchema = z.object({
  approval_status: z.enum(['pending', 'approved', 'rejected']),
  notes: z.string().optional(),
});

// =====================================================
// GET /cost-benefit-analyses
// List cost/benefit analyses
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('cost_benefit:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '50', department_id, approval_status } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const tenant_id = req.user!.tenant_id;

    const analyses = await costBenefitRepository.getAnalyses(
      tenant_id,
      department_id as string | undefined,
      approval_status as string | undefined,
      parseInt(limit as string),
      offset
    );

    const totalCount = await costBenefitRepository.getAnalysisCount(
      tenant_id,
      department_id as string | undefined,
      approval_status as string | undefined
    );

    res.json({
      analyses,
      totalCount,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  })
);

// =====================================================
// GET /cost-benefit-analyses/:id
// Get a specific cost/benefit analysis
// =====================================================

router.get(
  '/:id',
  authenticateJWT,
  requirePermission('cost_benefit:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const analysis = await costBenefitRepository.getAnalysisById(tenant_id, id);

    if (!analysis) {
      throw new NotFoundError('Cost/benefit analysis not found');
    }

    res.json(analysis);
  })
);

// =====================================================
// POST /cost-benefit-analyses
// Create a new cost/benefit analysis
// =====================================================

router.post(
  '/',
  authenticateJWT,
  requirePermission('cost_benefit:create'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsedData = createCostBenefitSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError('Invalid input data', parsedData.error);
    }

    const data = parsedData.data;
    const tenant_id = req.user!.tenant_id;
    const created_by = req.user!.id;

    const analysis = await costBenefitRepository.createAnalysis({
      ...data,
      tenant_id,
      created_by,
      approval_status: 'pending',
    });

    res.status(201).json(analysis);
  })
);

// =====================================================
// PUT /cost-benefit-analyses/:id
// Update a cost/benefit analysis
// =====================================================

router.put(
  '/:id',
  authenticateJWT,
  requirePermission('cost_benefit:update'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = updateCostBenefitSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError('Invalid input data', parsedData.error);
    }

    const data = parsedData.data;
    const tenant_id = req.user!.tenant_id;

    const updatedAnalysis = await costBenefitRepository.updateAnalysis(tenant_id, id, data);

    if (!updatedAnalysis) {
      throw new NotFoundError('Cost/benefit analysis not found');
    }

    res.json(updatedAnalysis);
  })
);

// =====================================================
// POST /cost-benefit-analyses/:id/review
// Review and approve/reject a cost/benefit analysis
// =====================================================

router.post(
  '/:id/review',
  authenticateJWT,
  requirePermission('cost_benefit:review'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = reviewCostBenefitSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError('Invalid input data', parsedData.error);
    }

    const data = parsedData.data;
    const tenant_id = req.user!.tenant_id;
    const reviewed_by = req.user!.id;

    const updatedAnalysis = await costBenefitRepository.reviewAnalysis(tenant_id, id, {
      ...data,
      reviewed_by,
    });

    if (!updatedAnalysis) {
      throw new NotFoundError('Cost/benefit analysis not found');
    }

    res.json(updatedAnalysis);
  })
);

// =====================================================
// DELETE /cost-benefit-analyses/:id
// Delete a cost/benefit analysis
// =====================================================

router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('cost_benefit:delete'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const deleted = await costBenefitRepository.deleteAnalysis(tenant_id, id);

    if (!deleted) {
      throw new NotFoundError('Cost/benefit analysis not found');
    }

    res.status(204).send();
  })
);

export default router;


This refactored version replaces all database query calls with corresponding repository methods. The `CostBenefitRepository` is used for all operations related to cost/benefit analyses. The repository methods are assumed to handle the database interactions internally.

Note that this refactoring assumes the existence of the following methods in the `CostBenefitRepository`:

- `getAnalyses`
- `getAnalysisCount`
- `getAnalysisById`
- `createAnalysis`
- `updateAnalysis`
- `reviewAnalysis`
- `deleteAnalysis`

These methods should be implemented in the `cost-benefit.repository.ts` file to handle the actual database operations. The implementation of these repository methods would replace the previous `pool.query` or `db.query` calls.