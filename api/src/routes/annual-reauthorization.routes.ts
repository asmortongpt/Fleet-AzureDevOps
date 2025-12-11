Here's the complete refactored version of the `annual-reauthorization.routes.ts` file, replacing all `pool.query` calls with repository methods:


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

const router = express.Router();

// Import and initialize the repository
const annualReauthorizationRepository = container.resolve(AnnualReauthorizationRepository);

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
// POST /annual-reauthorization-decisions
// Create a reauthorization decision
// =====================================================

router.post(
  '/decisions',
  authenticateJWT,
  requirePermission('reauthorization:decide'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsedData = createReauthDecisionSchema.safeParse(req.body);
    if (!parsedData.success) {
      throw new ValidationError('Invalid input data', parsedData.error);
    }

    const decisionData = parsedData.data;
    const tenant_id = req.user!.tenant_id;

    const newDecision = await annualReauthorizationRepository.createReauthorizationDecision(
      tenant_id,
      decisionData
    );

    res.status(201).json(newDecision);
  })
);

// =====================================================
// POST /annual-reauthorization-cycles/:id/submit
// Submit a reauthorization cycle to Fleet Management
// =====================================================

router.post(
  '/:id/submit',
  authenticateJWT,
  requirePermission('reauthorization:submit'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const result = await annualReauthorizationRepository.submitReauthorizationCycle(tenant_id, id);

    if (!result) {
      throw new NotFoundError('Reauthorization cycle not found or already submitted');
    }

    res.json({ message: 'Reauthorization cycle submitted successfully', cycle_id: id });
  })
);

export default router;


This refactored version replaces all `pool.query` calls with corresponding methods from the `AnnualReauthorizationRepository`. The repository methods are assumed to be implemented in the `annual-reauthorization.repository.ts` file, which should handle the database operations.

Key changes:

1. Imported and initialized the `AnnualReauthorizationRepository`.
2. Replaced all `pool.query` calls with repository methods:
   - `getReauthorizationCycles`
   - `createReauthorizationCycle`
   - `getReauthorizationCycleById`
   - `getVehicleAssignmentsForCycle`
   - `createReauthorizationDecision`
   - `submitReauthorizationCycle`

3. Adjusted the method signatures to match the repository interface.

4. Removed any direct SQL queries and replaced them with calls to the repository methods.

5. Kept the existing error handling and validation logic intact.

Note that this refactoring assumes that the `AnnualReauthorizationRepository` class has been implemented with the necessary methods. You may need to create or update this repository file to include the implementations of these methods, which would encapsulate the database operations previously handled by `pool.query`.