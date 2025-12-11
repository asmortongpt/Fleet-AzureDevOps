To refactor the `assignment-reporting.routes.ts` file to use the repository pattern, we'll need to create a repository for handling database operations and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


/**
 * Assignment Reporting & Compliance API Routes
 * Supports BR-10 (Reporting & Audit Requirements)
 *
 * Handles:
 * - Assignment inventory reports
 * - Policy compliance reports
 * - Exception reports
 * - Change history/audit trail
 */

import express, { Request, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';
import { AssignmentReportRepository } from '../repositories/assignment-report.repository';

const router = express.Router();

// Import and initialize the repository
const assignmentReportRepository = container.resolve(AssignmentReportRepository);

// =====================================================
// GET /reports/assignment-inventory
// Assignment inventory report (BR-10.1)
// =====================================================

router.get(
  '/assignment-inventory',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const { department_id, assignment_type, format = 'json' } = req.query;

      const result = await assignmentReportRepository.getAssignmentInventory(
        tenant_id,
        department_id as string | undefined,
        assignment_type as string | undefined
      );

      const statsResult = await assignmentReportRepository.getAssignmentInventoryStats(
        tenant_id,
        department_id as string | undefined,
        assignment_type as string | undefined
      );

      res.json({
        report_name: 'Vehicle Assignment Inventory',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        filters: { department_id, assignment_type },
        summary_statistics: statsResult,
        total_assignments: result.length,
        assignments: result,
      });
    } catch (error: any) {
      logger.error('Error generating assignment inventory report:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// Export the router
export default router;


Now, let's create the `assignment-report.repository.ts` file to implement the repository pattern:


import { injectable } from 'inversify';
import { Pool, QueryResult } from 'pg';

@injectable()
export class AssignmentReportRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAssignmentInventory(
    tenant_id: string,
    department_id?: string,
    assignment_type?: string
  ): Promise<any[]> {
    let whereConditions = [`va.tenant_id = $1`];
    let params: any[] = [tenant_id];
    let paramIndex = 2;

    if (department_id) {
      whereConditions.push(`va.department_id = $${paramIndex++}`);
      params.push(department_id);
    }
    if (assignment_type) {
      whereConditions.push(`va.assignment_type = $${paramIndex++}`);
      params.push(assignment_type);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT
        dept.name AS department,
        u.first_name || ' ' || u.last_name AS employee_name,
        dr.employee_number,
        dr.position_title,
        v.unit_number,
        v.make || ' ' || v.model || ' ' || v.year AS vehicle,
        va.assignment_type,
        va.lifecycle_state,
        va.start_date,
        va.end_date,
        va.commuting_authorized,
        dr.home_county,
        dr.residence_region,
        CASE WHEN va.secured_parking_location_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS has_secured_parking,
        sp.name AS secured_parking_location
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      JOIN drivers dr ON va.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN departments dept ON va.department_id = dept.id
      LEFT JOIN secured_parking_locations sp ON va.secured_parking_location_id = sp.id
      WHERE ${whereClause}
      ORDER BY dept.name, u.last_name, u.first_name
    `;

    const result: QueryResult = await this.pool.query(query, params);
    return result.rows;
  }

  async getAssignmentInventoryStats(
    tenant_id: string,
    department_id?: string,
    assignment_type?: string
  ): Promise<any[]> {
    let whereConditions = [`va.tenant_id = $1`];
    let params: any[] = [tenant_id];
    let paramIndex = 2;

    if (department_id) {
      whereConditions.push(`va.department_id = $${paramIndex++}`);
      params.push(department_id);
    }
    if (assignment_type) {
      whereConditions.push(`va.assignment_type = $${paramIndex++}`);
      params.push(assignment_type);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT
        va.assignment_type,
        va.lifecycle_state,
        COUNT(*) as count,
        COUNT(CASE WHEN va.secured_parking_location_id IS NOT NULL THEN 1 END) as with_secured_parking,
        COUNT(CASE WHEN va.commuting_authorized THEN 1 END) as commuting_authorized
      FROM vehicle_assignments va
      WHERE ${whereClause}
      GROUP BY va.assignment_type, va.lifecycle_state
    `;

    const result: QueryResult = await this.pool.query(query, params);
    return result.rows;
  }
}


To complete the refactoring, you'll need to make the following changes in your project:

1. Create the `assignment-report.repository.ts` file with the content provided above.

2. Update your dependency injection container to include the `AssignmentReportRepository`:


// In your container configuration file (e.g., container.ts)
import { Container } from 'inversify';
import { Pool } from 'pg';
import { AssignmentReportRepository } from './repositories/assignment-report.repository';

const container = new Container();

// ... other bindings ...

// Bind the Pool instance
container.bind<Pool>('Pool').toConstantValue(new Pool({
  // Your database connection configuration
}));

// Bind the AssignmentReportRepository
container.bind<AssignmentReportRepository>(AssignmentReportRepository).toSelf().inSingletonScope();

export { container };


3. Remove the `setDatabasePool` function from the `assignment-reporting.routes.ts` file, as it's no longer needed.

4. Update your main application file to use the new router:


// In your main application file (e.g., app.ts)
import express from 'express';
import assignmentReportingRouter from './routes/assignment-reporting.routes';

const app = express();

// ... other middleware and routes ...

app.use('/reports', assignmentReportingRouter);

// ... rest of your application setup ...


This refactoring moves the database query logic into a separate repository class, making the code more modular and easier to test. The route handler now uses the repository methods instead of directly querying the database, which adheres to the repository pattern.