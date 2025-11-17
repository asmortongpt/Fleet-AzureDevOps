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
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AssignmentNotificationService } from '../services/assignment-notification.service';

const router = express.Router();

// Get database pool from app context
let pool: Pool;
let notificationService: AssignmentNotificationService;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
  notificationService = new AssignmentNotificationService(dbPool);
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

      // Build WHERE clause based on scope and filters
      let whereConditions = ['va.tenant_id = $1'];
      let params: any[] = [tenant_id];
      let paramIndex = 2;

      // Apply scope filtering
      if (user_scope === 'own') {
        whereConditions.push(`dr.user_id = $${paramIndex++}`);
        params.push(req.user!.id);
      } else if (user_scope === 'team' && req.user!.team_driver_ids) {
        whereConditions.push(`va.driver_id = ANY($${paramIndex++}::uuid[])`);
        params.push(req.user!.team_driver_ids);
      }

      // Add filters
      if (assignment_type) {
        whereConditions.push(`va.assignment_type = $${paramIndex++}`);
        params.push(assignment_type);
      }
      if (lifecycle_state) {
        whereConditions.push(`va.lifecycle_state = $${paramIndex++}`);
        params.push(lifecycle_state);
      }
      if (driver_id) {
        whereConditions.push(`va.driver_id = $${paramIndex++}`);
        params.push(driver_id);
      }
      if (vehicle_id) {
        whereConditions.push(`va.vehicle_id = $${paramIndex++}`);
        params.push(vehicle_id);
      }
      if (department_id) {
        whereConditions.push(`va.department_id = $${paramIndex++}`);
        params.push(department_id);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get assignments
      const query = `
        SELECT
          va.*,
          v.unit_number, v.make, v.model, v.year, v.vin,
          v.classification AS vehicle_classification,
          dr.employee_number, dr.position_title, dr.home_county, dr.on_call_eligible,
          u.first_name AS driver_first_name, u.last_name AS driver_last_name, u.email AS driver_email,
          dept.name AS department_name, dept.code AS department_code,
          sp.name AS secured_parking_name, sp.address AS secured_parking_address,
          rec_user.first_name AS recommended_by_first_name, rec_user.last_name AS recommended_by_last_name,
          app_user.first_name AS approved_by_first_name, app_user.last_name AS approved_by_last_name,
          cba.id AS cost_benefit_id, cba.net_benefit
        FROM vehicle_assignments va
        JOIN vehicles v ON va.vehicle_id = v.id
        JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON va.department_id = dept.id
        LEFT JOIN secured_parking_locations sp ON va.secured_parking_location_id = sp.id
        LEFT JOIN users rec_user ON va.recommended_by_user_id = rec_user.id
        LEFT JOIN users app_user ON va.approved_by_user_id = app_user.id
        LEFT JOIN cost_benefit_analyses cba ON va.cost_benefit_analysis_id = cba.id
        WHERE ${whereClause}
        ORDER BY va.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      params.push(parseInt(limit as string), offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM vehicle_assignments va
        JOIN drivers dr ON va.driver_id = dr.id
        WHERE ${whereClause}
      `;

      const countResult = await pool.query(countQuery, params.slice(0, -2)); // Remove limit and offset
      const total = parseInt(countResult.rows[0].total);

      res.json({
        assignments: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error('Error fetching vehicle assignments:', error);
      res.status(500).json({
        error: 'Failed to fetch vehicle assignments',
        details: error.message,
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

      const query = `
        SELECT
          va.*,
          v.unit_number, v.make, v.model, v.year, v.vin, v.license_plate,
          v.classification AS vehicle_classification, v.ownership_type,
          dr.employee_number, dr.position_title, dr.home_county, dr.home_city,
          dr.home_state, dr.residence_region, dr.on_call_eligible,
          u.first_name AS driver_first_name, u.last_name AS driver_last_name,
          u.email AS driver_email, u.phone AS driver_phone,
          dept.name AS department_name, dept.code AS department_code,
          sp.name AS secured_parking_name, sp.address AS secured_parking_address,
          sp.city AS secured_parking_city, sp.state AS secured_parking_state,
          rec_user.first_name AS recommended_by_first_name, rec_user.last_name AS recommended_by_last_name,
          app_user.first_name AS approved_by_first_name, app_user.last_name AS approved_by_last_name,
          den_user.first_name AS denied_by_first_name, den_user.last_name AS denied_by_last_name,
          cba.id AS cost_benefit_id, cba.net_benefit, cba.total_annual_costs,
          cba.total_annual_benefits
        FROM vehicle_assignments va
        JOIN vehicles v ON va.vehicle_id = v.id
        JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON va.department_id = dept.id
        LEFT JOIN secured_parking_locations sp ON va.secured_parking_location_id = sp.id
        LEFT JOIN users rec_user ON va.recommended_by_user_id = rec_user.id
        LEFT JOIN users app_user ON va.approved_by_user_id = app_user.id
        LEFT JOIN users den_user ON va.denied_by_user_id = den_user.id
        LEFT JOIN cost_benefit_analyses cba ON va.cost_benefit_analysis_id = cba.id
        WHERE va.id = $1 AND va.tenant_id = $2
      `;

      const result = await pool.query(query, [id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle assignment not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error fetching vehicle assignment:', error);
      res.status(500).json({
        error: 'Failed to fetch vehicle assignment',
        details: error.message,
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
        const regionCheckQuery = `
          SELECT is_driver_in_allowed_region($1, $2) as is_allowed
        `;
        const regionCheck = await pool.query(regionCheckQuery, [data.driver_id, tenant_id]);

        if (!regionCheck.rows[0].is_allowed && !data.secured_parking_location_id && !data.on_call_only) {
          return res.status(400).json({
            error: 'Driver residence is outside allowed region. Secured parking location required or assignment must be on-call only.',
          });
        }
      }

      const query = `
        INSERT INTO vehicle_assignments (
          tenant_id, vehicle_id, driver_id, department_id,
          assignment_type, start_date, end_date, is_ongoing,
          authorized_use, commuting_authorized, on_call_only,
          geographic_constraints, requires_secured_parking, secured_parking_location_id,
          recommendation_notes, created_by_user_id, lifecycle_state
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft'
        )
        RETURNING *
      `;

      const params = [
        tenant_id,
        data.vehicle_id,
        data.driver_id,
        data.department_id || null,
        data.assignment_type,
        data.start_date,
        data.end_date || null,
        data.is_ongoing,
        data.authorized_use || null,
        data.commuting_authorized,
        data.on_call_only,
        JSON.stringify(data.geographic_constraints || {}),
        data.requires_secured_parking,
        data.secured_parking_location_id || null,
        data.recommendation_notes || null,
        user_id,
      ];

      const result = await pool.query(query, params);

      res.status(201).json({
        message: 'Vehicle assignment created successfully',
        assignment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error creating vehicle assignment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to create vehicle assignment',
        details: error.message,
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
  authenticateJWT,
  requirePermission('vehicle_assignment:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateAssignmentSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      // Build update fields
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex++}`);
          params.push(key === 'geographic_constraints' ? JSON.stringify(value) : value);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      params.push(id, tenant_id);

      const query = `
        UPDATE vehicle_assignments
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle assignment not found' });
      }

      res.json({
        message: 'Vehicle assignment updated successfully',
        assignment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error updating vehicle assignment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to update vehicle assignment',
        details: error.message,
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
  authenticateJWT,
  requirePermission('vehicle_assignment:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = assignmentLifecycleSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      const query = `
        UPDATE vehicle_assignments
        SET lifecycle_state = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [data.lifecycle_state, id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle assignment not found' });
      }

      res.json({
        message: `Assignment lifecycle updated to ${data.lifecycle_state}`,
        assignment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error updating lifecycle state:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to update lifecycle state',
        details: error.message,
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
  authenticateJWT,
  requirePermission('vehicle_assignment:recommend:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      const query = `
        UPDATE vehicle_assignments
        SET
          lifecycle_state = 'submitted',
          recommended_by_user_id = $1,
          recommended_at = NOW(),
          recommendation_notes = $2,
          updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `;

      const result = await pool.query(query, [user_id, notes || null, id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle assignment not found' });
      }

      // BR-6.4: Send notification to Executive Team
      await notificationService.notifyAssignmentRecommended(id, user_id, tenant_id, notes);

      res.json({
        message: 'Assignment recommended for approval',
        assignment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error recommending assignment:', error);
      res.status(500).json({
        error: 'Failed to recommend assignment',
        details: error.message,
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
  authenticateJWT,
  requirePermission('vehicle_assignment:approve:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = approvalActionSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      let query: string;
      let params: any[];

      if (data.action === 'approve') {
        query = `
          UPDATE vehicle_assignments
          SET
            lifecycle_state = 'approved',
            approval_status = 'approved',
            approved_by_user_id = $1,
            approved_at = NOW(),
            approval_notes = $2,
            updated_at = NOW()
          WHERE id = $3 AND tenant_id = $4 AND lifecycle_state = 'submitted'
          RETURNING *
        `;
        params = [user_id, data.notes || null, id, tenant_id];
      } else {
        query = `
          UPDATE vehicle_assignments
          SET
            lifecycle_state = 'denied',
            approval_status = 'denied',
            denied_by_user_id = $1,
            denied_at = NOW(),
            denial_reason = $2,
            updated_at = NOW()
          WHERE id = $3 AND tenant_id = $4 AND lifecycle_state = 'submitted'
          RETURNING *
        `;
        params = [user_id, data.notes || 'Denied by executive team', id, tenant_id];
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
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
        assignment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error processing approval:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to process approval',
        details: error.message,
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
  authenticateJWT,
  requirePermission('vehicle_assignment:approve:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      const query = `
        UPDATE vehicle_assignments
        SET lifecycle_state = 'active', updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND approval_status = 'approved'
        RETURNING *
      `;

      const result = await pool.query(query, [id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Vehicle assignment not found or not approved',
        });
      }

      // BR-6.4 & BR-11.5: Send activation notification to driver (mobile push + in-app)
      await notificationService.notifyAssignmentActivated(id, req.user!.id, tenant_id);

      res.json({
        message: 'Assignment activated successfully',
        assignment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error activating assignment:', error);
      res.status(500).json({
        error: 'Failed to activate assignment',
        details: error.message,
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
  authenticateJWT,
  requirePermission('vehicle_assignment:terminate:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, effective_date } = req.body;
      const tenant_id = req.user!.tenant_id;

      const query = `
        UPDATE vehicle_assignments
        SET
          lifecycle_state = 'terminated',
          end_date = $1,
          approval_notes = COALESCE(approval_notes, '') || E'\n\nTermination reason: ' || $2,
          updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `;

      const result = await pool.query(query, [
        effective_date || new Date().toISOString().split('T')[0],
        reason || 'Terminated by fleet manager',
        id,
        tenant_id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle assignment not found' });
      }

      // BR-6.4: Send termination notification to all stakeholders
      await notificationService.notifyAssignmentTerminated(id, req.user!.id, tenant_id, reason);

      res.json({
        message: 'Assignment terminated successfully',
        assignment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error terminating assignment:', error);
      res.status(500).json({
        error: 'Failed to terminate assignment',
        details: error.message,
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

      const query = `
        SELECT
          vah.*,
          u.first_name, u.last_name, u.email
        FROM vehicle_assignment_history vah
        LEFT JOIN users u ON vah.changed_by_user_id = u.id
        WHERE vah.vehicle_assignment_id = $1 AND vah.tenant_id = $2
        ORDER BY vah.change_timestamp DESC
      `;

      const result = await pool.query(query, [id, tenant_id]);

      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching assignment history:', error);
      res.status(500).json({
        error: 'Failed to fetch assignment history',
        details: error.message,
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
  authenticateJWT,
  requirePermission('vehicle_assignment:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      // Only allow deletion of draft assignments
      const query = `
        DELETE FROM vehicle_assignments
        WHERE id = $1 AND tenant_id = $2 AND lifecycle_state = 'draft'
        RETURNING *
      `;

      const result = await pool.query(query, [id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Vehicle assignment not found or cannot be deleted (only draft assignments can be deleted)',
        });
      }

      res.json({
        message: 'Vehicle assignment deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting vehicle assignment:', error);
      res.status(500).json({
        error: 'Failed to delete vehicle assignment',
        details: error.message,
      });
    }
  }
);

export default router;
