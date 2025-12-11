To refactor the `annual-reauthorization.routes.ts` file to use the repository pattern, we'll need to create a repository for the annual reauthorization cycles and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


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

// Add other route handlers here, replacing pool.query calls with repository methods

export default router;


In this refactored version:

1. We've imported the `AnnualReauthorizationRepository` at the top of the file.

2. We've initialized the repository using the dependency injection container.

3. We've replaced the `pool.query` calls in the GET route handler with a call to the `getReauthorizationCycles` method of the repository.

4. We've assumed that the `getReauthorizationCycles` method in the repository returns an object with `data` and `total` properties, which correspond to the cycles and the total count, respectively.

5. We've wrapped the route handler in the `asyncHandler` middleware to handle any errors that might occur during the asynchronous operation.

6. We've removed the `setDatabasePool` function as it's no longer needed with the repository pattern.

To complete the refactoring, you'll need to:

1. Create the `AnnualReauthorizationRepository` class in a separate file (`annual-reauthorization.repository.ts`).

2. Implement the `getReauthorizationCycles` method in the repository, which should handle the database queries and return the required data structure.

3. Refactor any other route handlers in this file, replacing `pool.query` calls with appropriate repository methods.

4. Ensure that the dependency injection container is properly set up to resolve the `AnnualReauthorizationRepository`.

Here's an example of what the `AnnualReauthorizationRepository` might look like:


import { injectable } from 'inversify';
import { Pool } from 'pg';

@injectable()
export class AnnualReauthorizationRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getReauthorizationCycles(
    tenantId: string,
    page: number,
    limit: number,
    offset: number,
    year?: number,
    status?: string
  ) {
    let whereConditions = [`arc.tenant_id = $1`];
    let params: any[] = [tenantId];
    let paramIndex = 2;

    if (year) {
      whereConditions.push(`arc.year = $${paramIndex++}`);
      params.push(year);
    }
    if (status) {
      whereConditions.push(`arc.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT
        arc.*,
        u.first_name AS submitted_by_first_name,
        u.last_name AS submitted_by_last_name
      FROM annual_reauthorization_cycles arc
      LEFT JOIN users u ON arc.submitted_by_user_id = u.id
      WHERE ${whereClause}
      ORDER BY arc.year DESC, arc.start_date DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM annual_reauthorization_cycles arc
      WHERE ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    return {
      data: result.rows,
      total: total,
    };
  }

  // Implement other repository methods as needed
}


This repository class encapsulates the database operations and can be easily tested and maintained separately from the route handlers.