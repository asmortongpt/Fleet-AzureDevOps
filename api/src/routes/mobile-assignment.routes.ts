/**
 * Mobile Assignment API Routes
 * Mobile-optimized endpoints for vehicle assignment management (BR-11)
 *
 * Handles:
 * - Mobile employee dashboard (BR-11.1)
 * - On-call acknowledgment (BR-11.2)
 * - Callback trip logging (BR-11.3)
 * - Manager mobile view (BR-11.4)
 * - Push notifications (BR-11.5)
 * - Offline data sync (BR-11.6)
 */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AssignmentNotificationService } from '../services/assignment-notification.service';
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router();

let pool: Pool;
let notificationService: AssignmentNotificationService;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
  notificationService = new AssignmentNotificationService(dbPool);
}

// =====================================================
// Validation Schemas
// =====================================================

const callbackTripSchema = z.object({
  on_call_period_id: z.string().uuid(),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trip_start_time: z.string().optional(),
  trip_end_time: z.string().optional(),
  miles_driven: z.number().positive(),
  includes_commute_trip: z.boolean().default(false),
  commute_miles: z.number().nonnegative().optional(),
  used_private_vehicle: z.boolean().default(false),
  purpose: z.string(),
  notes: z.string().optional(),
  // GPS coordinates
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  end_latitude: z.number().optional(),
  end_longitude: z.number().optional(),
});

const reimbursementRequestSchema = z.object({
  callback_trip_id: z.string().uuid(),
  amount: z.number().positive(),
  mileage_rate: z.number().positive(),
  receipt_photo: z.string().optional(), // Base64 or URL
});

// =====================================================
// GET /mobile/dashboard/employee
// Mobile employee dashboard (BR-11.1)
// =====================================================

router.get(
  '/dashboard/employee',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const user_id = req.user!.id;
      const tenant_id = req.user!.tenant_id;

      // Get driver record for this user
      const driverQuery = `
        SELECT id FROM drivers
        WHERE user_id = $1 AND tenant_id = $2
      `;
      const driverResult = await pool.query(driverQuery, [user_id, tenant_id]);

      if (driverResult.rows.length === 0) {
        return res.status(404).json({ error: 'Driver profile not found' });
      }

      const driver_id = driverResult.rows[0].id;

      // Get active vehicle assignments
      const assignmentsQuery = `
        SELECT
          va.*,
          v.unit_number, v.make, v.model, v.year, v.license_plate, v.fuel_type,
          v.classification as vehicle_classification,
          sp.name as secured_parking_name,
          sp.address as secured_parking_address,
          sp.city as secured_parking_city,
          sp.latitude as parking_latitude,
          sp.longitude as parking_longitude
        FROM vehicle_assignments va
        JOIN vehicles v ON va.vehicle_id = v.id
        LEFT JOIN secured_parking_locations sp ON va.secured_parking_location_id = sp.id
        WHERE va.driver_id = $1
          AND va.tenant_id = $2
          AND va.lifecycle_state IN ('active', 'approved')
        ORDER BY va.created_at DESC
      `;

      const assignmentsResult = await pool.query(assignmentsQuery, [driver_id, tenant_id]);

      // Get upcoming and current on-call periods
      const onCallQuery = `
        SELECT
          ocp.*,
          va.vehicle_id,
          v.unit_number, v.make, v.model, v.license_plate
        FROM on_call_periods ocp
        LEFT JOIN vehicle_assignments va ON ocp.on_call_vehicle_assignment_id = va.id
        LEFT JOIN vehicles v ON va.vehicle_id = v.id
        WHERE ocp.driver_id = $1
          AND ocp.tenant_id = $2
          AND ocp.is_active = true
          AND ocp.end_datetime >= NOW()
        ORDER BY ocp.start_datetime
        LIMIT 10
      `;

      const onCallResult = await pool.query(onCallQuery, [driver_id, tenant_id]);

      // Get unacknowledged on-call periods
      const unacknowledgedCount = onCallResult.rows.filter(
        period => !period.acknowledged_by_driver
      ).length;

      // Get recent callback trips
      const callbackTripsQuery = `
        SELECT oct.*, ocp.start_datetime, ocp.end_datetime
        FROM on_call_callback_trips oct
        JOIN on_call_periods ocp ON oct.on_call_period_id = ocp.id
        WHERE oct.driver_id = $1
          AND oct.tenant_id = $2
        ORDER BY oct.trip_date DESC
        LIMIT 5
      `;

      const callbackTripsResult = await pool.query(callbackTripsQuery, [driver_id, tenant_id]);

      // Get pending reimbursements
      const reimbursementQuery = `
        SELECT COUNT(*) as pending_count, SUM(reimbursement_amount) as pending_amount
        FROM on_call_callback_trips
        WHERE driver_id = $1
          AND tenant_id = $2
          AND reimbursement_requested = true
          AND reimbursement_status = 'pending'
      `;

      const reimbursementResult = await pool.query(reimbursementQuery, [driver_id, tenant_id]);

      res.json({
        driver_id,
        assignments: assignmentsResult.rows,
        on_call_periods: onCallResult.rows,
        recent_callback_trips: callbackTripsResult.rows,
        notifications: {
          unacknowledged_on_call: unacknowledgedCount,
          pending_reimbursements: parseInt(reimbursementResult.rows[0].pending_count) || 0,
          pending_reimbursement_amount: parseFloat(reimbursementResult.rows[0].pending_amount) || 0,
        },
      });
    } catch (error: any) {
      console.error('Error fetching mobile employee dashboard:', error);
      res.status(500).json({
        error: 'Failed to fetch employee dashboard',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /mobile/on-call/:id/acknowledge
// Acknowledge on-call period (BR-11.2)
// =====================================================

router.post(
  '/on-call/:id/acknowledge',
  authenticateJWT,
  requirePermission('on_call:acknowledge:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      // Verify this on-call period belongs to the user
      const verifyQuery = `
        SELECT ocp.*, dr.user_id
        FROM on_call_periods ocp
        JOIN drivers dr ON ocp.driver_id = dr.id
        WHERE ocp.id = $1 AND ocp.tenant_id = $2
      `;

      const verifyResult = await pool.query(verifyQuery, [id, tenant_id]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'On-call period not found' });
      }

      if (verifyResult.rows[0].user_id !== user_id) {
        return res.status(403).json({ error: 'Not authorized to acknowledge this on-call period' });
      }

      const updateQuery = `
        UPDATE on_call_periods
        SET
          acknowledged_by_driver = true,
          acknowledged_at = NOW(),
          updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [id, tenant_id]);

      res.json({
        message: 'On-call period acknowledged successfully',
        period: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error acknowledging on-call period:', error);
      res.status(500).json({
        error: 'Failed to acknowledge on-call period',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /mobile/callback-trip
// Log callback trip with GPS (BR-11.3)
// =====================================================

router.post(
  '/callback-trip',
  authenticateJWT,
  requirePermission('on_call:view:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = callbackTripSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      // Get driver_id for this user
      const driverQuery = 'SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2';
      const driverResult = await pool.query(driverQuery, [user_id, tenant_id]);

      if (driverResult.rows.length === 0) {
        return res.status(404).json({ error: 'Driver profile not found' });
      }

      const driver_id = driverResult.rows[0].id;

      // Calculate reimbursement amount (use IRS standard mileage rate or tenant rate)
      const mileageRate = 0.67; // 2024 IRS standard mileage rate
      const reimbursementAmount = data.used_private_vehicle
        ? data.miles_driven * mileageRate
        : 0;

      const query = `
        INSERT INTO on_call_callback_trips (
          tenant_id, on_call_period_id, driver_id,
          trip_date, trip_start_time, trip_end_time,
          miles_driven, includes_commute_trip, commute_miles,
          used_assigned_vehicle, used_private_vehicle,
          purpose, notes,
          reimbursement_requested, reimbursement_amount, reimbursement_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending'
        )
        RETURNING *
      `;

      const params = [
        tenant_id,
        data.on_call_period_id,
        driver_id,
        data.trip_date,
        data.trip_start_time || null,
        data.trip_end_time || null,
        data.miles_driven,
        data.includes_commute_trip,
        data.commute_miles || null,
        !data.used_private_vehicle, // used_assigned_vehicle
        data.used_private_vehicle,
        data.purpose,
        data.notes || null,
        data.used_private_vehicle, // Request reimbursement if using private vehicle
        reimbursementAmount,
      ];

      const result = await pool.query(query, params);

      // Update callback count
      await pool.query(
        `UPDATE on_call_periods
         SET callback_count = callback_count + 1
         WHERE id = $1 AND tenant_id = $2',
        [data.on_call_period_id, tenant_id]
      );

      res.status(201).json({
        message: 'Callback trip logged successfully',
        trip: result.rows[0],
        estimated_reimbursement: reimbursementAmount,
      });
    } catch (error: any) {
      console.error('Error logging callback trip:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to log callback trip',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /mobile/dashboard/manager
// Manager mobile view (BR-11.4)
// =====================================================

router.get(
  '/dashboard/manager',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;
      const team_driver_ids = req.user!.team_driver_ids || [];

      // Get pending assignments requiring approval
      const pendingQuery = `
        SELECT
          va.*,
          v.unit_number, v.make, v.model, v.year,
          dr.employee_number, dr.position_title,
          u.first_name || ' ' || u.last_name as driver_name,
          dept.name as department_name
        FROM vehicle_assignments va
        JOIN vehicles v ON va.vehicle_id = v.id
        JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON va.department_id = dept.id
        WHERE va.tenant_id = $1
          AND va.lifecycle_state = 'submitted'
          AND (va.driver_id = ANY($2::uuid[]) OR $3 = 'global')
        ORDER BY va.recommended_at ASC
      `;

      const pendingResult = await pool.query(pendingQuery, [
        tenant_id,
        team_driver_ids,
        req.user!.scope_level,
      ]);

      // Get team's active assignments
      const activeQuery = `
        SELECT
          va.*,
          v.unit_number, v.make, v.model,
          dr.employee_number,
          u.first_name || ' ' || u.last_name as driver_name
        FROM vehicle_assignments va
        JOIN vehicles v ON va.vehicle_id = v.id
        JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        WHERE va.tenant_id = $1
          AND va.lifecycle_state = 'active'
          AND (va.driver_id = ANY($2::uuid[]) OR $3 = 'global')
        ORDER BY va.start_date DESC
        LIMIT 20
      `;

      const activeResult = await pool.query(activeQuery, [
        tenant_id,
        team_driver_ids,
        req.user!.scope_level,
      ]);

      // Get current on-call team members
      const onCallQuery = `
        SELECT
          ocp.*,
          dr.employee_number,
          u.first_name || ' ' || u.last_name as driver_name,
          u.phone as driver_phone,
          v.unit_number, v.make, v.model
        FROM on_call_periods ocp
        JOIN drivers dr ON ocp.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN vehicle_assignments va ON ocp.on_call_vehicle_assignment_id = va.id
        LEFT JOIN vehicles v ON va.vehicle_id = v.id
        WHERE ocp.tenant_id = $1
          AND ocp.is_active = true
          AND ocp.start_datetime <= NOW()
          AND ocp.end_datetime >= NOW()
          AND (ocp.driver_id = ANY($2::uuid[]) OR $3 = 'global')
        ORDER BY ocp.start_datetime
      `;

      const onCallResult = await pool.query(onCallQuery, [
        tenant_id,
        team_driver_ids,
        req.user!.scope_level,
      ]);

      // Get compliance exceptions for team
      const exceptionsQuery = `
        SELECT COUNT(*) as exception_count
        FROM v_policy_compliance_exceptions
        WHERE tenant_id = $1
      `;

      const exceptionsResult = await pool.query(exceptionsQuery, [tenant_id]);

      res.json({
        pending_approvals: pendingResult.rows,
        active_assignments: activeResult.rows,
        current_on_call: onCallResult.rows,
        notifications: {
          pending_approvals_count: pendingResult.rows.length,
          compliance_exceptions_count: parseInt(exceptionsResult.rows[0].exception_count) || 0,
          active_on_call_count: onCallResult.rows.length,
        },
      });
    } catch (error: any) {
      console.error('Error fetching manager mobile dashboard:', error);
      res.status(500).json({
        error: 'Failed to fetch manager dashboard',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /mobile/assignment/:id/quick-approve
// Quick approve/deny from mobile (BR-11.4)
// =====================================================

router.post(
  '/assignment/:id/quick-approve',
  authenticateJWT,
  requirePermission('vehicle_assignment:approve:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      if (!['approve', 'deny'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be "approve" or "deny"' });
      }

      let query: string;
      if (action === 'approve') {
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
      }

      const result = await pool.query(query, [user_id, notes || null, id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Assignment not found or not in submitted state',
        });
      }

      // Send notifications
      if (action === 'approve') {
        await notificationService.notifyAssignmentApproved(id, user_id, tenant_id, notes);
      } else {
        await notificationService.notifyAssignmentDenied(id, user_id, tenant_id, notes);
      }

      res.json({
        message: `Assignment ${action}d successfully from mobile`,
        assignment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error processing mobile approval:', error);
      res.status(500).json({
        error: 'Failed to process approval',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /mobile/assignments/offline-data
// Get offline data package for mobile app (BR-11.6)
// =====================================================

router.get(
  '/assignments/offline-data',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const user_id = req.user!.id;
      const tenant_id = req.user!.tenant_id;

      // Get driver_id
      const driverQuery = 'SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2';
      const driverResult = await pool.query(driverQuery, [user_id, tenant_id]);

      if (driverResult.rows.length === 0) {
        return res.status(404).json({ error: 'Driver profile not found' });
      }

      const driver_id = driverResult.rows[0].id;

      // Package all relevant data for offline use
      const offlineData = {
        sync_timestamp: new Date().toISOString(),
        assignments: await pool.query(
          `SELECT id, tenant_id, vehicle_id, driver_id, assignment_type, start_date, end_date, status, created_at, updated_at FROM vehicle_assignments
           WHERE driver_id = $1 AND tenant_id = $2
           AND lifecycle_state IN ('active', 'approved')',
          [driver_id, tenant_id]
        ),
        on_call_periods: await pool.query(
          `SELECT id, tenant_id, driver_id, start_datetime, end_datetime, status, created_at, updated_at FROM on_call_periods
           WHERE driver_id = $1 AND tenant_id = $2
           AND is_active = true AND end_datetime >= NOW() - INTERVAL '7 days'',
          [driver_id, tenant_id]
        ),
        vehicles: await pool.query(
          `SELECT v.* FROM vehicles v
           JOIN vehicle_assignments va ON v.id = va.vehicle_id
           WHERE va.driver_id = $1 AND va.tenant_id = $2
           AND va.lifecycle_state = 'active'',
          [driver_id, tenant_id]
        ),
        secured_parking: await pool.query(
          `SELECT sp.* FROM secured_parking_locations sp
           JOIN vehicle_assignments va ON sp.id = va.secured_parking_location_id
           WHERE va.driver_id = $1 AND va.tenant_id = $2
           AND va.lifecycle_state = 'active'',
          [driver_id, tenant_id]
        ),
      };

      res.json({
        offline_data: offlineData,
        ttl_hours: 24, // Data valid for 24 hours
      });
    } catch (error: any) {
      console.error('Error fetching offline data:', error);
      res.status(500).json({
        error: 'Failed to fetch offline data',
        details: getErrorMessage(error),
      });
    }
  }
);

export default router;
