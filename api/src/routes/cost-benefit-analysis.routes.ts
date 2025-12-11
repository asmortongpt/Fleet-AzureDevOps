To refactor the `cost-benefit-analysis.routes.ts` file to use the repository pattern, we need to replace all `pool.query` or `db.query` calls with repository methods. We'll import the necessary repositories at the top of the file and modify the route handlers to use these repositories instead of direct database queries.

Here's the refactored version of the file:


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

    const analyses = await costBenefitRepository.listAnalyses(
      tenant_id,
      parseInt(limit as string),
      offset,
      department_id as string | undefined,
      approval_status as string | undefined
    );

    res.json(analyses);
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

    const analysis = await costBenefitRepository.getAnalysisById(id, tenant_id);

    if (!analysis) {
      throw new NotFoundError('Cost/Benefit Analysis not found');
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
      throw new ValidationError('Invalid input', parsedData.error);
    }

    const analysisData = {
      ...parsedData.data,
      tenant_id: req.user!.tenant_id,
      prepared_by: req.user!.id,
    };

    const newAnalysis = await costBenefitRepository.createAnalysis(analysisData);

    res.status(201).json(newAnalysis);
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
      throw new ValidationError('Invalid input', parsedData.error);
    }

    const tenant_id = req.user!.tenant_id;

    const updatedAnalysis = await costBenefitRepository.updateAnalysis(
      id,
      parsedData.data,
      tenant_id
    );

    if (!updatedAnalysis) {
      throw new NotFoundError('Cost/Benefit Analysis not found');
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

    const deleted = await costBenefitRepository.deleteAnalysis(id, tenant_id);

    if (!deleted) {
      throw new NotFoundError('Cost/Benefit Analysis not found');
    }

    res.status(204).send();
  })
);

// =====================================================
// POST /cost-benefit-analyses/:id/review
// Review a cost/benefit analysis
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
      throw new ValidationError('Invalid input', parsedData.error);
    }

    const tenant_id = req.user!.tenant_id;

    const reviewedAnalysis = await costBenefitRepository.reviewAnalysis(
      id,
      parsedData.data,
      req.user!.id,
      tenant_id
    );

    if (!reviewedAnalysis) {
      throw new NotFoundError('Cost/Benefit Analysis not found');
    }

    res.json(reviewedAnalysis);
  })
);

export default router;


In this refactored version:

1. We've imported the necessary repositories at the top of the file.
2. We've initialized the repositories using the container.
3. All `pool.query` or `db.query` calls have been replaced with corresponding repository methods.
4. The route handlers remain the same, but now they use the repository methods instead of direct database queries.
5. We've assumed that the repository methods have been implemented to handle the database operations previously done by the queries.

Note that you'll need to implement the corresponding methods in the `CostBenefitRepository` class to handle the database operations. The method signatures in the repository should match the calls made in this refactored code.

Also, make sure to create the other repository classes (`DepartmentRepository`, `VehicleAssignmentRepository`, `UserRepository`) if they don't exist yet, and implement any necessary methods in those classes as well.