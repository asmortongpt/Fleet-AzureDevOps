Here's the complete refactored version of the `annual-reauthorization.routes.enhanced.ts` file, replacing all `pool.query` calls with repository methods:


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import { csrfProtection } from '../middleware/csrf';
import { AnnualReauthorizationRepository } from '../repositories/annual-reauthorization.repository';

const router = express.Router();
router.use(helmet());
router.use(express.json());
router.use(csurf({ cookie: true }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);

// Import and initialize the repository
const annualReauthorizationRepository = new AnnualReauthorizationRepository();

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
  parameter_changes: z.record(z.any().optional()), // Consider refining this schema for better validation
  termination_reason: z.string().optional(),
  termination_effective_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = '1', limit = '50', year, status } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const tenant_id = req.user!.tenant_id;

      const result = await annualReauthorizationRepository.getReauthorizationCycles(
        tenant_id,
        parseInt(year as string) || undefined,
        status as string | undefined,
        parseInt(limit as string),
        offset
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }
);

// =====================================================
// GET /annual-reauthorization-cycles/:id
// Get a specific reauthorization cycle
// =====================================================

router.get(
  '/:id',
  authenticateJWT,
  requirePermission('reauthorization:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      const result = await annualReauthorizationRepository.getReauthorizationCycleById(
        tenant_id,
        id
      );

      if (!result) {
        throw new NotFoundError('Reauthorization cycle not found');
      }

      res.json(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  }
);

// =====================================================
// POST /annual-reauthorization-cycles
// Create a new reauthorization cycle
// =====================================================

router.post(
  '/',
  authenticateJWT,
  requirePermission('reauthorization:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = createReauthCycleSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const result = await annualReauthorizationRepository.createReauthorizationCycle(
        tenant_id,
        parsedData
      );

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: new ValidationError(error.errors).message });
      } else {
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  }
);

// =====================================================
// PUT /annual-reauthorization-cycles/:id
// Update a reauthorization cycle
// =====================================================

router.put(
  '/:id',
  authenticateJWT,
  requirePermission('reauthorization:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const parsedData = createReauthCycleSchema.partial().parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const result = await annualReauthorizationRepository.updateReauthorizationCycle(
        tenant_id,
        id,
        parsedData
      );

      if (!result) {
        throw new NotFoundError('Reauthorization cycle not found');
      }

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: new ValidationError(error.errors).message });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  }
);

// =====================================================
// POST /annual-reauthorization-decisions
// Create a new reauthorization decision
// =====================================================

router.post(
  '/decisions',
  authenticateJWT,
  requirePermission('reauthorization:create:decision'),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = createReauthDecisionSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const result = await annualReauthorizationRepository.createReauthorizationDecision(
        tenant_id,
        parsedData
      );

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: new ValidationError(error.errors).message });
      } else {
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  }
);

// =====================================================
// GET /annual-reauthorization-decisions
// List reauthorization decisions
// =====================================================

router.get(
  '/decisions',
  authenticateJWT,
  requirePermission('reauthorization:view:decision'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = '1', limit = '50', cycle_id, vehicle_assignment_id } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const tenant_id = req.user!.tenant_id;

      const result = await annualReauthorizationRepository.getReauthorizationDecisions(
        tenant_id,
        cycle_id as string | undefined,
        vehicle_assignment_id as string | undefined,
        parseInt(limit as string),
        offset
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }
);

export default router;


In this refactored version:

1. We've imported the `AnnualReauthorizationRepository` at the top of the file.

2. We've initialized the repository with `const annualReauthorizationRepository = new AnnualReauthorizationRepository();`.

3. We've replaced all `pool.query` calls with corresponding repository methods:
   - `getReauthorizationCycles`
   - `getReauthorizationCycleById`
   - `createReauthorizationCycle`
   - `updateReauthorizationCycle`
   - `createReauthorizationDecision`
   - `getReauthorizationDecisions`

4. The repository methods are expected to handle the database queries, including the construction of the SQL queries and their execution.

5. We've removed the `setDatabasePool` function as it's no longer needed with the repository pattern.

6. Error handling and validation remain the same, using the existing error classes and Zod schemas.

This refactored version encapsulates all database operations within the `AnnualReauthorizationRepository`, improving code organization and making it easier to maintain and test the database interactions separately from the route handlers.