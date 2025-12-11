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
    const user_id = req.user!.id;

    // Validate department
    const department = await departmentRepository.getDepartmentById(tenant_id, data.department_id);
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Validate vehicle assignment if provided
    if (data.vehicle_assignment_id) {
      const vehicleAssignment = await vehicleAssignmentRepository.getVehicleAssignmentById(tenant_id, data.vehicle_assignment_id);
      if (!vehicleAssignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }
    }

    const newAnalysis = await costBenefitRepository.createAnalysis({
      ...data,
      tenant_id,
      created_by: user_id,
      updated_by: user_id,
    });

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
      throw new ValidationError('Invalid input data', parsedData.error);
    }

    const data = parsedData.data;
    const tenant_id = req.user!.tenant_id;
    const user_id = req.user!.id;

    const existingAnalysis = await costBenefitRepository.getAnalysisById(tenant_id, id);
    if (!existingAnalysis) {
      throw new NotFoundError('Cost/benefit analysis not found');
    }

    // Validate department if provided
    if (data.department_id) {
      const department = await departmentRepository.getDepartmentById(tenant_id, data.department_id);
      if (!department) {
        throw new NotFoundError('Department not found');
      }
    }

    // Validate vehicle assignment if provided
    if (data.vehicle_assignment_id) {
      const vehicleAssignment = await vehicleAssignmentRepository.getVehicleAssignmentById(tenant_id, data.vehicle_assignment_id);
      if (!vehicleAssignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }
    }

    const updatedAnalysis = await costBenefitRepository.updateAnalysis(id, {
      ...data,
      updated_by: user_id,
    });

    res.json(updatedAnalysis);
  })
);

// =====================================================
// PATCH /cost-benefit-analyses/:id/review
// Review and approve/reject a cost/benefit analysis
// =====================================================

router.patch(
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
    const user_id = req.user!.id;

    const existingAnalysis = await costBenefitRepository.getAnalysisById(tenant_id, id);
    if (!existingAnalysis) {
      throw new NotFoundError('Cost/benefit analysis not found');
    }

    const reviewedAnalysis = await costBenefitRepository.reviewAnalysis(id, {
      approval_status: data.approval_status,
      notes: data.notes,
      reviewed_by: user_id,
    });

    res.json(reviewedAnalysis);
  })
);

export default router;


In this refactored version, all database queries have been replaced with calls to the appropriate repository methods. Here's a summary of the changes:

1. Imported the necessary repositories at the top of the file.
2. Initialized the repositories using the dependency injection container.
3. Replaced all `pool.query` or `db.query` calls with corresponding repository methods:
   - `costBenefitRepository.getAnalyses` for listing analyses
   - `costBenefitRepository.getAnalysisCount` for getting the total count of analyses
   - `costBenefitRepository.getAnalysisById` for retrieving a specific analysis
   - `costBenefitRepository.createAnalysis` for creating a new analysis
   - `costBenefitRepository.updateAnalysis` for updating an existing analysis
   - `costBenefitRepository.reviewAnalysis` for reviewing and approving/rejecting an analysis
   - `departmentRepository.getDepartmentById` for validating departments
   - `vehicleAssignmentRepository.getVehicleAssignmentById` for validating vehicle assignments

4. Removed any direct database query logic and replaced it with calls to the repository methods.

This refactoring improves the separation of concerns, making the code more maintainable and easier to test. The database operations are now encapsulated within the repository classes, which can be easily mocked or replaced in unit tests.