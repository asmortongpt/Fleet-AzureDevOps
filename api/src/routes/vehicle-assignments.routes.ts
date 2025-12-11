To refactor the code and replace `pool.query` or `db.query` with a repository pattern, we need to create a repository class that encapsulates the database operations. Here's the refactored version of the complete file:


/**
 * Vehicle Assignments API Routes
 * Supports BR-3 (Employee & Assignment Management) and BR-8 (Temporary Assignment Management)
 *
 * Handles:
 * - Designated Assigned Vehicles (ongoing)
 * - On-Call Vehicle Assignments
 * - Temporary Assigned Vehicles (up to 1 week)
 * - Assignment lifecycle management
 * - Approval workflows
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AssignmentNotificationService } from '../services/assignment-notification.service';
import { getErrorMessage } from '../utils/error-handler';
import { container } from '../container';
import { TYPES } from '../types';
import { csrfProtection } from '../middleware/csrf';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger'; // Wave 26: Add Winston logger
import { VehicleAssignmentRepository } from '../repositories/vehicle-assignment.repository';

const router = express.Router();

// Get repository from app context
let repository: VehicleAssignmentRepository;
let notificationService: AssignmentNotificationService;

export function setDatabasePool(dbPool: any) {
  repository = container.get<VehicleAssignmentRepository>(TYPES.VehicleAssignmentRepository);
  notificationService = container.get<AssignmentNotificationService>(TYPES.AssignmentNotificationService);
}

// =====================================================
// Validation Schemas
// =====================================================

const createAssignmentSchema = z.object({
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  assignment_type: z.enum(['designated', 'on_call', 'temporary']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_ongoing: z.boolean().default(false),
  authorized_use: z.string().optional(),
  commuting_authorized: z.boolean().default(false),
  on_call_only: z.boolean().default(false),
  geographic_constraints: z.record(z.any()).optional(),
  requires_secured_parking: z.boolean().default(false),
  secured_parking_location_id: z.string().uuid().optional(),
  recommendation_notes: z.string().optional(),
});

const updateAssignmentSchema = createAssignmentSchema.partial();

const assignmentLifecycleSchema = z.object({
  lifecycle_state: z.enum(['draft', 'submitted', 'approved', 'denied', 'active', 'suspended', 'terminated', 'pending_reauth']),
  notes: z.string().optional(),
});

const approvalActionSchema = z.object({
  action: z.enum(['approve', 'deny']),
  notes: z.string().optional(),
});

// =====================================================
// GET /vehicle-assignments
// List vehicle assignments with filtering
// =====================================================

/**
 * @route GET /api/vehicle-assignments
 * @desc Get list of vehicle assignments
 * @access Requires: vehicle_assignment:view:{scope}
 * @query page, limit, assignment_type, lifecycle_state, driver_id, vehicle_id, department_id
 */
router.get(
  '/',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        assignment_type,
        lifecycle_state,
        driver_id,
        vehicle_id,
        department_id,
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const tenant_id = req.user!.tenant_id;
      const user_scope = req.user!.scope_level;

      // Build filter object
      const filters: any = {
        tenant_id,
        offset,
        limit: parseInt(limit as string),
      };

      // Apply scope filtering
      if (user_scope === 'own') {
        filters.driver_id = req.user!.id;
      } else if (user_scope === 'team' && req.user!.team_driver_ids) {
        filters.team_driver_ids = req.user!.team_driver_ids;
      }

      // Add filters
      if (assignment_type) filters.assignment_type = assignment_type as string;
      if (lifecycle_state) filters.lifecycle_state = lifecycle_state as string;
      if (driver_id) filters.driver_id = driver_id as string;
      if (vehicle_id) filters.vehicle_id = vehicle_id as string;
      if (department_id) filters.department_id = department_id as string;

      // Get assignments
      const { assignments, total } = await repository.getAssignments(filters);

      res.json({
        assignments,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
    } catch (error) {
      logger.error(`Error fetching vehicle assignments: ${getErrorMessage(error)}`);
      res.status(500).json({ error: 'An error occurred while fetching vehicle assignments' });
    }
  }
);

// =====================================================
// GET /vehicle-assignments/:id
// Get a specific vehicle assignment
// =====================================================

/**
 * @route GET /api/vehicle-assignments/:id
 * @desc Get a specific vehicle assignment
 * @access Requires: vehicle_assignment:view:{scope}
 */
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const assignmentId = req.params.id;
      const tenant_id = req.user!.tenant_id;

      const assignment = await repository.getAssignmentById(assignmentId, tenant_id);

      if (!assignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      res.json(assignment);
    } catch (error) {
      logger.error(`Error fetching vehicle assignment: ${getErrorMessage(error)}`);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An error occurred while fetching the vehicle assignment' });
      }
    }
  }
);

// =====================================================
// POST /vehicle-assignments
// Create a new vehicle assignment
// =====================================================

/**
 * @route POST /api/vehicle-assignments
 * @desc Create a new vehicle assignment
 * @access Requires: vehicle_assignment:create:{scope}
 */
router.post(
  '/',
  authenticateJWT,
  requirePermission('vehicle_assignment:create:team'),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = createAssignmentSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const newAssignment = await repository.createAssignment({
        ...parsedData,
        tenant_id,
        created_by: req.user!.id,
      });

      await notificationService.sendAssignmentCreatedNotification(newAssignment);

      res.status(201).json(newAssignment);
    } catch (error) {
      logger.error(`Error creating vehicle assignment: ${getErrorMessage(error)}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: error.errors });
      } else {
        res.status(500).json({ error: 'An error occurred while creating the vehicle assignment' });
      }
    }
  }
);

// =====================================================
// PUT /vehicle-assignments/:id
// Update an existing vehicle assignment
// =====================================================

/**
 * @route PUT /api/vehicle-assignments/:id
 * @desc Update an existing vehicle assignment
 * @access Requires: vehicle_assignment:update:{scope}
 */
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('vehicle_assignment:update:team'),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const assignmentId = req.params.id;
      const parsedData = updateAssignmentSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const updatedAssignment = await repository.updateAssignment(assignmentId, parsedData, tenant_id);

      if (!updatedAssignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      await notificationService.sendAssignmentUpdatedNotification(updatedAssignment);

      res.json(updatedAssignment);
    } catch (error) {
      logger.error(`Error updating vehicle assignment: ${getErrorMessage(error)}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: error.errors });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An error occurred while updating the vehicle assignment' });
      }
    }
  }
);

// =====================================================
// PATCH /vehicle-assignments/:id/lifecycle
// Update lifecycle state of a vehicle assignment
// =====================================================

/**
 * @route PATCH /api/vehicle-assignments/:id/lifecycle
 * @desc Update lifecycle state of a vehicle assignment
 * @access Requires: vehicle_assignment:update:{scope}
 */
router.patch(
  '/:id/lifecycle',
  authenticateJWT,
  requirePermission('vehicle_assignment:update:team'),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const assignmentId = req.params.id;
      const parsedData = assignmentLifecycleSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const updatedAssignment = await repository.updateAssignmentLifecycle(assignmentId, parsedData, tenant_id);

      if (!updatedAssignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      await notificationService.sendAssignmentLifecycleUpdatedNotification(updatedAssignment);

      res.json(updatedAssignment);
    } catch (error) {
      logger.error(`Error updating vehicle assignment lifecycle: ${getErrorMessage(error)}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: error.errors });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An error occurred while updating the vehicle assignment lifecycle' });
      }
    }
  }
);

// =====================================================
// POST /vehicle-assignments/:id/approval
// Approve or deny a vehicle assignment
// =====================================================

/**
 * @route POST /api/vehicle-assignments/:id/approval
 * @desc Approve or deny a vehicle assignment
 * @access Requires: vehicle_assignment:approve:{scope}
 */
router.post(
  '/:id/approval',
  authenticateJWT,
  requirePermission('vehicle_assignment:approve:team'),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const assignmentId = req.params.id;
      const parsedData = approvalActionSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const updatedAssignment = await repository.processAssignmentApproval(assignmentId, parsedData, tenant_id, req.user!.id);

      if (!updatedAssignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      await notificationService.sendAssignmentApprovalNotification(updatedAssignment, parsedData.action);

      res.json(updatedAssignment);
    } catch (error) {
      logger.error(`Error processing vehicle assignment approval: ${getErrorMessage(error)}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: error.errors });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An error occurred while processing the vehicle assignment approval' });
      }
    }
  }
);

export default router;


This refactored version replaces the direct database queries with calls to a `VehicleAssignmentRepository` class. Here are the key changes:

1. Removed the `Pool` import and replaced it with an import for `VehicleAssignmentRepository`.

2. Changed the `setDatabasePool` function to initialize the repository and notification service from the container.

3. Replaced all database query calls with corresponding repository method calls. The repository methods are assumed to be implemented in the `VehicleAssignmentRepository` class.

4. Modified the filtering logic in the GET route to use a filter object that is passed to the repository method.

5. Updated error handling to use the repository's error responses.

6. Assumed that the `VehicleAssignmentRepository` class handles the database connections and query execution internally.

To complete this refactoring, you would need to create the `VehicleAssignmentRepository` class with the following methods:

- `getAssignments(filters: any): Promise<{ assignments: any[], total: number }>`
- `getAssignmentById(assignmentId: string, tenant_id: string): Promise<any>`
- `createAssignment(data: any): Promise<any>`
- `updateAssignment(assignmentId: string, data: any, tenant_id: string): Promise<any>`
- `updateAssignmentLifecycle(assignmentId: string, data: any, tenant_id: string): Promise<any>`
- `processAssignmentApproval(assignmentId: string, data: any, tenant_id: string, userId: string): Promise<any>`

These methods should encapsulate the database operations that were previously done directly in the route handlers.