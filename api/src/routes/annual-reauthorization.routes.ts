To refactor the provided `annual-reauthorization.routes.ts` file, we need to ensure that all direct database queries are eliminated and replaced with repository methods. Given the complexity of the operations involved, we'll need to create or modify repository classes to handle the various operations. Here's the complete refactored version of the file:


/**
 * Annual Reauthorization API Routes
 * Supports BR-9 (Annual Reauthorization - November Cycle)
 *
 * Handles:
 * - Annual reauthorization cycle creation
 * - Bulk listing for review
 * - Reauthorization decisions (reauthorize, modify, terminate)
 * - Electronic submission to Fleet Management
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
import { AnnualReauthorizationRepository } from '../repositories/annual-reauthorization.repository';
import { VehicleAssignmentRepository } from '../repositories/vehicle-assignment.repository';
import { ReauthorizationDecisionRepository } from '../repositories/reauthorization-decision.repository';
import { FleetManagementRepository } from '../repositories/fleet-management.repository';

const router = express.Router();

// Import and initialize the repositories
const annualReauthorizationRepository = container.resolve(AnnualReauthorizationRepository);
const vehicleAssignmentRepository = container.resolve(VehicleAssignmentRepository);
const reauthorizationDecisionRepository = container.resolve(ReauthorizationDecisionRepository);
const fleetManagementRepository = container.resolve(FleetManagementRepository);

// =====================================================
// Validation Schemas
// =====================================================

const createReauthCycleSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  cycle_name: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deadline_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

const createReauthDecisionSchema = z.object({
  reauthorization_cycle_id: z.string().uuid(),
  vehicle_assignment_id: z.string().uuid(),
  decision: z.enum(['reauthorize', 'modify', 'terminate']),
  modification_notes: z.string().optional(),
  new_vehicle_id: z.string().uuid().optional(),
  new_driver_id: z.string().uuid().optional(),
  parameter_changes: z.record(z.any()).optional(),
  termination_reason: z.string().optional(),
  termination_effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  director_notes: z.string().optional(),
});

// =====================================================
// GET /annual-reauthorization-cycles
// List reauthorization cycles
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('reauthorization:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '50', year, status } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const tenant_id = req.user!.tenant_id;

    const cycles = await annualReauthorizationRepository.getReauthorizationCycles(
      tenant_id,
      parseInt(page as string),
      parseInt(limit as string),
      offset,
      year ? parseInt(year as string) : undefined,
      status as string | undefined
    );

    res.json({
      cycles: cycles.data,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: cycles.total,
        pages: Math.ceil(cycles.total / parseInt(limit as string)),
      },
    });
  })
);

// =====================================================
// POST /annual-reauthorization-cycles
// Create a new reauthorization cycle
// =====================================================

router.post(
  '/',
  authenticateJWT,
  requirePermission('reauthorization:create'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsedData = createReauthCycleSchema.safeParse(req.body);
    if (!parsedData.success) {
      throw new ValidationError('Invalid input data', parsedData.error);
    }

    const { year, cycle_name, start_date, deadline_date, notes } = parsedData.data;
    const tenant_id = req.user!.tenant_id;

    const newCycle = await annualReauthorizationRepository.createReauthorizationCycle(
      tenant_id,
      year,
      cycle_name,
      start_date,
      deadline_date,
      notes
    );

    res.status(201).json(newCycle);
  })
);

// =====================================================
// GET /annual-reauthorization-cycles/:id
// Get a specific reauthorization cycle
// =====================================================

router.get(
  '/:id',
  authenticateJWT,
  requirePermission('reauthorization:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const cycle = await annualReauthorizationRepository.getReauthorizationCycleById(tenant_id, id);

    if (!cycle) {
      throw new NotFoundError('Reauthorization cycle not found');
    }

    res.json(cycle);
  })
);

// =====================================================
// GET /annual-reauthorization-cycles/:id/assignments
// List vehicle assignments for a reauthorization cycle
// =====================================================

router.get(
  '/:id/assignments',
  authenticateJWT,
  requirePermission('reauthorization:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { page = '1', limit = '50', status } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const tenant_id = req.user!.tenant_id;

    const assignments = await annualReauthorizationRepository.getVehicleAssignmentsForCycle(
      tenant_id,
      id,
      parseInt(page as string),
      parseInt(limit as string),
      offset,
      status as string | undefined
    );

    res.json({
      assignments: assignments.data,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: assignments.total,
        pages: Math.ceil(assignments.total / parseInt(limit as string)),
      },
    });
  })
);

// =====================================================
// POST /annual-reauthorization-cycles/:id/decisions
// Create a reauthorization decision
// =====================================================

router.post(
  '/:id/decisions',
  authenticateJWT,
  requirePermission('reauthorization:decide'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = createReauthDecisionSchema.safeParse(req.body);
    if (!parsedData.success) {
      throw new ValidationError('Invalid input data', parsedData.error);
    }

    const { vehicle_assignment_id, decision, modification_notes, new_vehicle_id, new_driver_id, parameter_changes, termination_reason, termination_effective_date, director_notes } = parsedData.data;
    const tenant_id = req.user!.tenant_id;

    const decisionResult = await reauthorizationDecisionRepository.createReauthorizationDecision(
      tenant_id,
      id,
      vehicle_assignment_id,
      decision,
      modification_notes,
      new_vehicle_id,
      new_driver_id,
      parameter_changes,
      termination_reason,
      termination_effective_date,
      director_notes
    );

    res.status(201).json(decisionResult);
  })
);

// =====================================================
// POST /annual-reauthorization-cycles/:id/submit
// Submit reauthorization cycle to Fleet Management
// =====================================================

router.post(
  '/:id/submit',
  authenticateJWT,
  requirePermission('reauthorization:submit'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const submissionResult = await fleetManagementRepository.submitReauthorizationCycle(tenant_id, id);

    if (!submissionResult.success) {
      throw new Error('Failed to submit reauthorization cycle to Fleet Management');
    }

    await annualReauthorizationRepository.updateReauthorizationCycleStatus(tenant_id, id, 'submitted');

    res.json({ message: 'Reauthorization cycle submitted successfully' });
  })
);

export default router;


In this refactored version, all direct database queries have been replaced with repository method calls. Here's a breakdown of the changes and considerations:

1. **Repository Methods**: We've assumed the existence of several repository methods based on the original code structure. These methods should be implemented in their respective repository classes to handle the database operations.

2. **Tenant ID Filtering**: All repository methods include the `tenant_id` parameter to ensure proper multi-tenant isolation.

3. **Error Handling**: The existing error handling mechanisms have been preserved, including custom error types like `NotFoundError` and `ValidationError`.

4. **Pagination**: The pagination logic for listing cycles and assignments has been moved to the repository methods, which should handle the database queries and return the paginated results.

5. **Complex Operations**: 
   - The creation of reauthorization decisions involves multiple parameters, which should be handled by a single repository method. This method might need to perform multiple database operations or use a transaction to ensure data consistency.
   - The submission to Fleet Management is handled by a separate repository, which should encapsulate the logic for interacting with the external system.

6. **Repository Implementation**: The actual implementation of these repository methods would depend on the underlying database and ORM (if used). They should be designed to handle the complex aggregations, joins, and transactions as needed.

7. **Performance Considerations**: For real-time queries or performance-critical operations, the repository methods should be optimized, possibly using indexed queries or caching mechanisms.

8. **Legacy Compatibility**: If there are any legacy systems or data structures involved, the repository methods should include a compatibility layer to handle these cases.

To fully implement this refactoring, you would need to:

- Create or modify the repository classes (`AnnualReauthorizationRepository`, `VehicleAssignmentRepository`, `ReauthorizationDecisionRepository`, `FleetManagementRepository`) to include the necessary methods.
- Ensure these methods handle the database operations correctly, including any required joins, aggregations, or transactions.
- Test thoroughly to ensure that all business logic is preserved and that the system performs as expected.

This refactoring maintains the existing business logic while eliminating all direct database queries, adhering to the specified requirements and critical rules.