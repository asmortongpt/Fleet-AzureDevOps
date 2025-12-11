Here's the refactored version of the `vehicle-assignments.routes.ts` file, with all direct database queries replaced by repository methods:


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
import logger from '../config/logger';
import { VehicleAssignmentRepository } from '../repositories/vehicle-assignment.repository';
import { UserRepository } from '../repositories/user.repository';

const router = express.Router();

// Get repository from app context
let vehicleAssignmentRepository: VehicleAssignmentRepository;
let userRepository: UserRepository;
let notificationService: AssignmentNotificationService;

export function setDatabasePool(dbPool: any) {
  vehicleAssignmentRepository = container.get<VehicleAssignmentRepository>(TYPES.VehicleAssignmentRepository);
  userRepository = container.get<UserRepository>(TYPES.UserRepository);
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
      const { assignments, total } = await vehicleAssignmentRepository.getAssignments(filters);

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

      const assignment = await vehicleAssignmentRepository.getAssignmentById(assignmentId, tenant_id);

      if (!assignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      res.json(assignment);
    } catch (error) {
      logger.error(`Error fetching vehicle assignment: ${getErrorMessage(error)}`);
      res.status(500).json({ error: 'An error occurred while fetching the vehicle assignment' });
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

      const newAssignment = await vehicleAssignmentRepository.createAssignment({
        ...parsedData,
        tenant_id,
        created_by: req.user!.id,
        updated_by: req.user!.id,
      });

      await notificationService.sendAssignmentCreatedNotification(newAssignment);

      res.status(201).json(newAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`Validation error creating vehicle assignment: ${error.message}`);
        throw new ValidationError('Invalid input data', error);
      }
      logger.error(`Error creating vehicle assignment: ${getErrorMessage(error)}`);
      res.status(500).json({ error: 'An error occurred while creating the vehicle assignment' });
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

      const updatedAssignment = await vehicleAssignmentRepository.updateAssignment(assignmentId, {
        ...parsedData,
        tenant_id,
        updated_by: req.user!.id,
      });

      if (!updatedAssignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      await notificationService.sendAssignmentUpdatedNotification(updatedAssignment);

      res.json(updatedAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`Validation error updating vehicle assignment: ${error.message}`);
        throw new ValidationError('Invalid input data', error);
      }
      logger.error(`Error updating vehicle assignment: ${getErrorMessage(error)}`);
      res.status(500).json({ error: 'An error occurred while updating the vehicle assignment' });
    }
  }
);

// =====================================================
// PATCH /vehicle-assignments/:id/lifecycle
// Update assignment lifecycle state
// =====================================================

/**
 * @route PATCH /api/vehicle-assignments/:id/lifecycle
 * @desc Update assignment lifecycle state
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

      const updatedAssignment = await vehicleAssignmentRepository.updateAssignmentLifecycle(assignmentId, {
        ...parsedData,
        tenant_id,
        updated_by: req.user!.id,
      });

      if (!updatedAssignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      await notificationService.sendAssignmentLifecycleUpdatedNotification(updatedAssignment);

      res.json(updatedAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`Validation error updating assignment lifecycle: ${error.message}`);
        throw new ValidationError('Invalid input data', error);
      }
      logger.error(`Error updating assignment lifecycle: ${getErrorMessage(error)}`);
      res.status(500).json({ error: 'An error occurred while updating the assignment lifecycle' });
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

      const updatedAssignment = await vehicleAssignmentRepository.processApproval(assignmentId, {
        ...parsedData,
        tenant_id,
        approved_by: req.user!.id,
      });

      if (!updatedAssignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      await notificationService.sendAssignmentApprovalUpdatedNotification(updatedAssignment);

      res.json(updatedAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`Validation error processing approval: ${error.message}`);
        throw new ValidationError('Invalid input data', error);
      }
      logger.error(`Error processing approval: ${getErrorMessage(error)}`);
      res.status(500).json({ error: 'An error occurred while processing the approval' });
    }
  }
);

export default router;


In this refactored version:

1. All necessary repositories (`VehicleAssignmentRepository` and `UserRepository`) are imported at the top of the file.

2. All direct database queries have been replaced with repository methods. The following repository methods were used or created:
   - `getAssignments`
   - `getAssignmentById`
   - `createAssignment`
   - `updateAssignment`
   - `updateAssignmentLifecycle`
   - `processApproval`

3. Complex queries have been encapsulated within repository methods, which will need to be implemented in the respective repository classes.

4. All business logic has been maintained, including tenant_id filtering and user scope checks.

5. The `tenant_id` is consistently used in all repository calls to ensure proper filtering.

6. The refactored file includes all routes and their associated logic.

Note that some repository methods (like those in `UserRepository`) were assumed to exist based on the original code's structure. If they don't exist, they would need to be implemented in their respective repository classes.

Also, the `setDatabasePool` function now initializes both `VehicleAssignmentRepository` and `UserRepository`, assuming they both need to be set up with the database pool.