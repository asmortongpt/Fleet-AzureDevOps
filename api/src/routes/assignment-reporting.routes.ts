Here's the complete refactored `assignment-reporting.routes.ts` file using repository methods:


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

// =====================================================
// GET /reports/policy-compliance
// Policy compliance report (BR-10.2)
// =====================================================

router.get(
  '/policy-compliance',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const { department_id, policy_id, format = 'json' } = req.query;

      const result = await assignmentReportRepository.getPolicyComplianceReport(
        tenant_id,
        department_id as string | undefined,
        policy_id as string | undefined
      );

      res.json({
        report_name: 'Policy Compliance Report',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        filters: { department_id, policy_id },
        total_assignments: result.length,
        assignments: result,
      });
    } catch (error: any) {
      logger.error('Error generating policy compliance report:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// =====================================================
// GET /reports/exceptions
// Exception report (BR-10.3)
// =====================================================

router.get(
  '/exceptions',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const { department_id, exception_type, format = 'json' } = req.query;

      const result = await assignmentReportRepository.getExceptionReport(
        tenant_id,
        department_id as string | undefined,
        exception_type as string | undefined
      );

      res.json({
        report_name: 'Exception Report',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        filters: { department_id, exception_type },
        total_exceptions: result.length,
        exceptions: result,
      });
    } catch (error: any) {
      logger.error('Error generating exception report:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// =====================================================
// GET /reports/change-history
// Change history/audit trail report (BR-10.4)
// =====================================================

router.get(
  '/change-history',
  authenticateJWT,
  requirePermission('compliance_report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const { department_id, user_id, start_date, end_date, format = 'json' } = req.query;

      const result = await assignmentReportRepository.getChangeHistoryReport(
        tenant_id,
        department_id as string | undefined,
        user_id as string | undefined,
        start_date as string | undefined,
        end_date as string | undefined
      );

      res.json({
        report_name: 'Change History/Audit Trail Report',
        generated_at: new Date().toISOString(),
        generated_by: req.user!.email,
        filters: { department_id, user_id, start_date, end_date },
        total_changes: result.length,
        changes: result,
      });
    } catch (error: any) {
      logger.error('Error generating change history report:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;


This refactored version of the `assignment-reporting.routes.ts` file replaces all `pool.query` or `db.query` calls with corresponding repository methods from the `AssignmentReportRepository`. The repository methods are called using the `assignmentReportRepository` instance, which is resolved from the dependency injection container.

The main changes include:

1. Importing and initializing the `AssignmentReportRepository`:
   
   import { AssignmentReportRepository } from '../repositories/assignment-report.repository';
   const assignmentReportRepository = container.resolve(AssignmentReportRepository);
   

2. Replacing database query calls with repository method calls in each route handler. For example:
   
   const result = await assignmentReportRepository.getAssignmentInventory(
     tenant_id,
     department_id as string | undefined,
     assignment_type as string | undefined
   );
   

3. The repository methods are assumed to be implemented in the `AssignmentReportRepository` class, handling the underlying database queries.

4. Error handling and logging remain the same, catching any errors that might occur during the repository method calls.

5. The structure and functionality of the routes remain unchanged, maintaining the same API endpoints and response formats.

This refactoring improves the separation of concerns by moving the data access logic into a dedicated repository, making the code more maintainable and easier to test.