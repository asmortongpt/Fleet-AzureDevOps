/**
 * Vehicle Assignments API Routes
 * Agent 51 - Refactored B3 - All direct database queries eliminated
 *
 * Supports BR-3 (Employee & Assignment Management) and BR-8 (Temporary Assignment Management)
 *
 * Handles:
 * - Designated Assigned Vehicles (ongoing)
 * - On-Call Vehicle Assignments
 * - Temporary Assigned Vehicles (up to 1 week)
 * - Assignment lifecycle management
 * - Approval workflows
 */

import express, { Response } from 'express';
import { z } from 'zod';

import logger from '../config/logger';
import { container } from '../container';
import { NotFoundError } from '../errors/app-error';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import { VehicleAssignmentsRepository } from '../repositories/vehicle-assignments.repository';
import { AssignmentNotificationService } from '../services/assignment-notification.service';
import { TYPES } from '../types';
import { getErrorMessage } from '../utils/error-handler';

const router = express.Router();

// Get repository from DI container
const vehicleAssignmentsRepo = container.get<VehicleAssignmentsRepository>(TYPES.VehicleAssignmentsRepository);
const notificationService = container.get<AssignmentNotificationService>(TYPES.AssignmentNotificationService);

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

      const tenant_id = req.user!.tenant_id;
      const user_scope = req.user!.scope_level;

      const filters = {
        assignment_type: assignment_type as string,
        lifecycle_state: lifecycle_state as string,
        driver_id: driver_id as string,
        vehicle_id: vehicle_id as string,
        department_id: department_id as string,
        user_scope: user_scope as 'own' | 'team' | 'fleet',
        user_id: user_scope === 'own' ? req.user!.id : undefined,
        team_driver_ids: user_scope === 'team' ? req.user!.team_driver_ids : undefined,
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      // Use repository methods instead of direct queries
      const assignments = await vehicleAssignmentsRepo.findAll(tenant_id, filters, pagination);
      const total = await vehicleAssignmentsRepo.count(tenant_id, filters);

      res.json({
        assignments,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit),
        },
      });
    } catch (error: any) {
      logger.error('Error fetching vehicle assignments:', error);
      res.status(500).json({
        error: 'Failed to fetch vehicle assignments',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /vehicle-assignments/:id
// Get single assignment by ID
// =====================================================

router.get(
  '/:id',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      // Use repository method instead of direct query
      const assignment = await vehicleAssignmentsRepo.findById(id, tenant_id);

      if (!assignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      res.json(assignment);
    } catch (error: any) {
      logger.error('Error fetching vehicle assignment:', error);
      res.status(500).json({
        error: 'Failed to fetch vehicle assignment',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /vehicle-assignments
// Create new vehicle assignment
// =====================================================

router.post(
  '/',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle_assignment:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createAssignmentSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      // Validate temporary assignment duration (max 1 week)
      if (data.assignment_type === 'temporary') {
        if (!data.end_date) {
          return res.status(400).json({
            error: 'Temporary assignments must have an end date',
          });
        }

        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff > 7) {
          return res.status(400).json({
            error: 'Temporary assignments cannot exceed 1 week (7 days)',
          });
        }
      }

      // Check if driver is in allowed region if commuting is authorized
      if (data.commuting_authorized) {
        // Use repository method instead of direct query
        const isAllowed = await vehicleAssignmentsRepo.isDriverInAllowedRegion(data.driver_id, tenant_id);

        if (!isAllowed && !data.secured_parking_location_id && !data.on_call_only) {
          return res.status(400).json({
            error: 'Driver residence is outside allowed region. Secured parking location required or assignment must be on-call only.',
          });
        }
      }

      // Use repository method instead of direct query
      const assignment = await vehicleAssignmentsRepo.create(tenant_id, user_id, data);

      res.status(201).json({
        message: 'Vehicle assignment created successfully',
        assignment,
      });
    } catch (error: any) {
      logger.error('Error creating vehicle assignment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
      }
      res.status(500).json({
        error: 'Failed to create vehicle assignment',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// PUT /vehicle-assignments/:id
// Update vehicle assignment
// =====================================================

router.put(
  '/:id',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle_assignment:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateAssignmentSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Use repository method instead of direct query
      const assignment = await vehicleAssignmentsRepo.update(id, tenant_id, data);

      if (!assignment) {
        return res.status(404).json({ error: 'Vehicle assignment not found' });
      }

      res.json({
        message: 'Vehicle assignment updated successfully',
        assignment,
      });
    } catch (error: any) {
      logger.error('Error updating vehicle assignment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
      }
      res.status(500).json({
        error: 'Failed to update vehicle assignment',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /vehicle-assignments/:id/lifecycle
// Update assignment lifecycle state
// =====================================================

router.post(
  '/:id/lifecycle',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle_assignment:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = assignmentLifecycleSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      // Use repository method instead of direct query
      const assignment = await vehicleAssignmentsRepo.updateLifecycleState(id, tenant_id, data.lifecycle_state);

      if (!assignment) {
        return res.status(404).json({ error: 'Vehicle assignment not found' });
      }

      res.json({
        message: `Assignment lifecycle updated to ${data.lifecycle_state}`,
        assignment,
      });
    } catch (error: any) {
      logger.error('Error updating lifecycle state:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
      }
      res.status(500).json({
        error: 'Failed to update lifecycle state',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /vehicle-assignments/:id/recommend
// Department Director recommends assignment
// =====================================================

router.post(
  '/:id/recommend',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle_assignment:recommend:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      // Use repository method instead of direct query
      const assignment = await vehicleAssignmentsRepo.recommend(id, tenant_id, user_id, notes);

      if (!assignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      // BR-6.4: Send notification to Executive Team
      await notificationService.notifyAssignmentRecommended(id, user_id, tenant_id, notes);

      res.json({
        message: 'Assignment recommended for approval',
        assignment,
      });
    } catch (error: any) {
      logger.error('Error recommending assignment:', error);
      res.status(500).json({
        error: 'Failed to recommend assignment',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /vehicle-assignments/:id/approve
// Executive Team approves or denies assignment
// =====================================================

router.post(
  '/:id/approve',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle_assignment:approve:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = approvalActionSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      let assignment;

      if (data.action === 'approve') {
        // Use repository method instead of direct query
        assignment = await vehicleAssignmentsRepo.approve(id, tenant_id, user_id, data.notes);
      } else {
        // Use repository method instead of direct query
        assignment = await vehicleAssignmentsRepo.deny(id, tenant_id, user_id, data.notes || 'Denied by executive team');
      }

      if (!assignment) {
        return res.status(404).json({
          error: 'Vehicle assignment not found or not in submitted state',
        });
      }

      // BR-6.4 & BR-11.5: Send notifications (mobile push + email + in-app)
      if (data.action === 'approve') {
        await notificationService.notifyAssignmentApproved(id, user_id, tenant_id, data.notes);
      } else {
        await notificationService.notifyAssignmentDenied(id, user_id, tenant_id, data.notes);
      }

      res.json({
        message: `Assignment ${data.action === 'approve' ? 'approved' : 'denied'} successfully`,
        assignment,
      });
    } catch (error: any) {
      logger.error('Error processing approval:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
      }
      res.status(500).json({
        error: 'Failed to process approval',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /vehicle-assignments/:id/activate
// Activate an approved assignment
// =====================================================

router.post(
  '/:id/activate',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle_assignment:approve:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      // Use repository method instead of direct query
      const assignment = await vehicleAssignmentsRepo.activate(id, tenant_id);

      if (!assignment) {
        return res.status(404).json({
          error: 'Vehicle assignment not found or not approved',
        });
      }

      // BR-6.4 & BR-11.5: Send activation notification to driver (mobile push + in-app)
      await notificationService.notifyAssignmentActivated(id, req.user!.id, tenant_id);

      res.json({
        message: 'Assignment activated successfully',
        assignment,
      });
    } catch (error: any) {
      logger.error('Error activating assignment:', error);
      res.status(500).json({
        error: 'Failed to activate assignment',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /vehicle-assignments/:id/terminate
// Terminate an active assignment
// =====================================================

router.post(
  '/:id/terminate',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle_assignment:terminate:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, effective_date } = req.body;
      const tenant_id = req.user!.tenant_id;

      const effectiveDate = effective_date || new Date().toISOString().split('T')[0];
      const terminationReason = reason || 'Terminated by fleet manager';

      // Use repository method instead of direct query
      const assignment = await vehicleAssignmentsRepo.terminate(id, tenant_id, terminationReason, effectiveDate);

      if (!assignment) {
        throw new NotFoundError('Vehicle assignment not found');
      }

      // BR-6.4: Send termination notification to all stakeholders
      await notificationService.notifyAssignmentTerminated(id, req.user!.id, tenant_id, reason);

      res.json({
        message: 'Assignment terminated successfully',
        assignment,
      });
    } catch (error: any) {
      logger.error('Error terminating assignment:', error);
      res.status(500).json({
        error: 'Failed to terminate assignment',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /vehicle-assignments/:id/history
// Get assignment change history
// =====================================================

router.get(
  '/:id/history',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      // Use repository method instead of direct query
      const history = await vehicleAssignmentsRepo.getHistory(id, tenant_id);

      res.json(history);
    } catch (error: any) {
      logger.error('Error fetching assignment history:', error);
      res.status(500).json({
        error: 'Failed to fetch assignment history',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// DELETE /vehicle-assignments/:id
// Delete a draft assignment (soft delete)
// =====================================================

router.delete(
  '/:id',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle_assignment:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      // Use repository method instead of direct query
      const deleted = await vehicleAssignmentsRepo.deleteDraft(id, tenant_id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Vehicle assignment not found or cannot be deleted (only draft assignments can be deleted)',
        });
      }

      res.json({
        message: 'Vehicle assignment deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting vehicle assignment:', error);
      res.status(500).json({
        error: 'Failed to delete vehicle assignment',
        details: getErrorMessage(error),
      });
    }
  }
);

export default router;
