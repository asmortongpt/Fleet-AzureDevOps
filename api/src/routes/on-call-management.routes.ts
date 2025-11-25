/**
 * On-Call Management API Routes
 * Supports BR-4 (On-Call Management)
 *
 * Handles:
 * - On-call period creation and management
 * - On-call vehicle assignments
 * - Callback trip tracking
 * - Mileage reimbursement for on-call
 * - Geographic constraints
 */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router();

let pool: Pool;
export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
}

// =====================================================
// Validation Schemas
// =====================================================

const createOnCallPeriodSchema = z.object({
  driver_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
  schedule_type: z.string().optional(),
  schedule_notes: z.string().optional(),
  on_call_vehicle_assignment_id: z.string().uuid().optional(),
  geographic_region: z.string().optional(),
  commuting_constraints: z.record(z.any()).optional(),
});

const updateOnCallPeriodSchema = createOnCallPeriodSchema.partial();

const acknowledgeOnCallSchema = z.object({
  acknowledged: z.boolean(),
});

const createCallbackTripSchema = z.object({
  on_call_period_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trip_start_time: z.string().datetime().optional(),
  trip_end_time: z.string().datetime().optional(),
  miles_driven: z.number().positive(),
  includes_commute_trip: z.boolean().default(false),
  commute_miles: z.number().nonnegative().optional(),
  used_assigned_vehicle: z.boolean().default(false),
  used_private_vehicle: z.boolean().default(false),
  vehicle_id: z.string().uuid().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  reimbursement_requested: z.boolean().default(false),
  reimbursement_amount: z.number().nonnegative().optional(),
});

// =====================================================
// GET /on-call-periods
// List on-call periods with filtering
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        driver_id,
        department_id,
        is_active,
        start_date,
        end_date,
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const tenant_id = req.user!.tenant_id;
      const user_scope = req.user!.scope_level;

      let whereConditions = ['ocp.tenant_id = $1'];
      let params: any[] = [tenant_id];
      let paramIndex = 2;

      // Apply scope filtering
      if (user_scope === 'own') {
        whereConditions.push(`dr.user_id = $${paramIndex++}`);
        params.push(req.user!.id);
      } else if (user_scope === 'team' && req.user!.team_driver_ids) {
        whereConditions.push(`ocp.driver_id = ANY($${paramIndex++}::uuid[])`);
        params.push(req.user!.team_driver_ids);
      }

      if (driver_id) {
        whereConditions.push(`ocp.driver_id = $${paramIndex++}`);
        params.push(driver_id);
      }
      if (department_id) {
        whereConditions.push(`ocp.department_id = $${paramIndex++}`);
        params.push(department_id);
      }
      if (is_active !== undefined) {
        whereConditions.push(`ocp.is_active = $${paramIndex++}`);
        params.push(is_active === 'true');
      }
      if (start_date) {
        whereConditions.push(`ocp.start_datetime >= $${paramIndex++}`);
        params.push(start_date);
      }
      if (end_date) {
        whereConditions.push(`ocp.end_datetime <= $${paramIndex++}`);
        params.push(end_date);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          ocp.*,
          dr.employee_number, dr.position_title,
          u.first_name AS driver_first_name, u.last_name AS driver_last_name,
          u.email AS driver_email, u.phone AS driver_phone,
          dept.name AS department_name,
          va.id AS assignment_id, va.vehicle_id,
          v.unit_number, v.make, v.model, v.year
        FROM on_call_periods ocp
        JOIN drivers dr ON ocp.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON ocp.department_id = dept.id
        LEFT JOIN vehicle_assignments va ON ocp.on_call_vehicle_assignment_id = va.id
        LEFT JOIN vehicles v ON va.vehicle_id = v.id
        WHERE ${whereClause}
        ORDER BY ocp.start_datetime DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      params.push(parseInt(limit as string), offset);

      const result = await pool.query(query, params);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM on_call_periods ocp
        JOIN drivers dr ON ocp.driver_id = dr.id
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        periods: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error('Error fetching on-call periods:', error);
      res.status(500).json({
        error: 'Failed to fetch on-call periods',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /on-call-periods/:id
// Get single on-call period by ID
// =====================================================

router.get(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      const query = `
        SELECT
          ocp.*,
          dr.employee_number, dr.position_title, dr.home_county, dr.residence_region,
          u.first_name AS driver_first_name, u.last_name AS driver_last_name,
          u.email AS driver_email, u.phone AS driver_phone,
          dept.name AS department_name, dept.code AS department_code,
          va.id AS assignment_id, va.vehicle_id, va.lifecycle_state AS assignment_state,
          v.unit_number, v.make, v.model, v.year, v.license_plate
        FROM on_call_periods ocp
        JOIN drivers dr ON ocp.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON ocp.department_id = dept.id
        LEFT JOIN vehicle_assignments va ON ocp.on_call_vehicle_assignment_id = va.id
        LEFT JOIN vehicles v ON va.vehicle_id = v.id
        WHERE ocp.id = $1 AND ocp.tenant_id = $2
      `;

      const result = await pool.query(query, [id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'On-call period not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error fetching on-call period:', error);
      res.status(500).json({
        error: 'Failed to fetch on-call period',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /on-call-periods
// Create new on-call period
// =====================================================

router.post(
  '/',
  authenticateJWT,
  requirePermission('on_call:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createOnCallPeriodSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      // Validate dates
      const startDate = new Date(data.start_datetime);
      const endDate = new Date(data.end_datetime);

      if (endDate <= startDate) {
        return res.status(400).json({
          error: 'End datetime must be after start datetime',
        });
      }

      const query = `
        INSERT INTO on_call_periods (
          tenant_id, driver_id, department_id,
          start_datetime, end_datetime,
          schedule_type, schedule_notes,
          on_call_vehicle_assignment_id,
          geographic_region, commuting_constraints,
          created_by_user_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING *
      `;

      const params = [
        tenant_id,
        data.driver_id,
        data.department_id || null,
        data.start_datetime,
        data.end_datetime,
        data.schedule_type || null,
        data.schedule_notes || null,
        data.on_call_vehicle_assignment_id || null,
        data.geographic_region || null,
        JSON.stringify(data.commuting_constraints || {}),
        user_id,
      ];

      const result = await pool.query(query, params);

      res.status(201).json({
        message: 'On-call period created successfully',
        period: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error creating on-call period:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to create on-call period',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// PUT /on-call-periods/:id
// Update on-call period
// =====================================================

router.put(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateOnCallPeriodSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex++}`);
          params.push(key === 'commuting_constraints' ? JSON.stringify(value) : value);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      params.push(id, tenant_id);

      const query = `
        UPDATE on_call_periods
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'On-call period not found' });
      }

      res.json({
        message: 'On-call period updated successfully',
        period: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error updating on-call period:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to update on-call period',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /on-call-periods/:id/acknowledge
// Driver acknowledges on-call period
// =====================================================

router.post(
  '/:id/acknowledge',
  authenticateJWT,
  requirePermission('on_call:acknowledge:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = acknowledgeOnCallSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const query = `
        UPDATE on_call_periods
        SET
          acknowledged_by_driver = $1,
          acknowledged_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
          updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [data.acknowledged, id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'On-call period not found' });
      }

      res.json({
        message: data.acknowledged
          ? 'On-call period acknowledged'
          : 'On-call acknowledgement removed',
        period: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error acknowledging on-call period:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to acknowledge on-call period',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /on-call-periods/active/current
// Get currently active on-call periods
// =====================================================

router.get(
  '/active/current',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;
      const { driver_id, department_id } = req.query;

      let whereConditions = [
        'ocp.tenant_id = $1',
        'ocp.is_active = true',
        'ocp.start_datetime <= NOW()',
        'ocp.end_datetime >= NOW()',
      ];
      let params: any[] = [tenant_id];
      let paramIndex = 2;

      if (driver_id) {
        whereConditions.push(`ocp.driver_id = $${paramIndex++}`);
        params.push(driver_id);
      }
      if (department_id) {
        whereConditions.push(`ocp.department_id = $${paramIndex++}`);
        params.push(department_id);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          ocp.*,
          dr.employee_number, dr.position_title,
          u.first_name AS driver_first_name, u.last_name AS driver_last_name,
          u.phone AS driver_phone,
          dept.name AS department_name,
          va.vehicle_id, v.unit_number, v.make, v.model
        FROM on_call_periods ocp
        JOIN drivers dr ON ocp.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON ocp.department_id = dept.id
        LEFT JOIN vehicle_assignments va ON ocp.on_call_vehicle_assignment_id = va.id
        LEFT JOIN vehicles v ON va.vehicle_id = v.id
        WHERE ${whereClause}
        ORDER BY ocp.start_datetime
      `;

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching current on-call periods:', error);
      res.status(500).json({
        error: 'Failed to fetch current on-call periods',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// Callback Trips Management
// =====================================================

// GET /on-call-periods/:id/callback-trips
router.get(
  '/:id/callback-trips',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      const query = `
        SELECT
          oct.*,
          v.unit_number, v.make, v.model
        FROM on_call_callback_trips oct
        LEFT JOIN vehicles v ON oct.vehicle_id = v.id
        WHERE oct.on_call_period_id = $1 AND oct.tenant_id = $2
        ORDER BY oct.trip_date DESC, oct.trip_start_time DESC
      `;

      const result = await pool.query(query, [id, tenant_id]);

      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching callback trips:', error);
      res.status(500).json({
        error: 'Failed to fetch callback trips',
        details: getErrorMessage(error),
      });
    }
  }
);

// POST /callback-trips
router.post(
  '/callback-trips',
  authenticateJWT,
  requirePermission('on_call:view:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createCallbackTripSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const query = `
        INSERT INTO on_call_callback_trips (
          tenant_id, on_call_period_id, driver_id,
          trip_date, trip_start_time, trip_end_time,
          miles_driven, includes_commute_trip, commute_miles,
          used_assigned_vehicle, used_private_vehicle, vehicle_id,
          purpose, notes, reimbursement_requested, reimbursement_amount,
          reimbursement_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending'
        )
        RETURNING *
      `;

      const params = [
        tenant_id,
        data.on_call_period_id,
        data.driver_id,
        data.trip_date,
        data.trip_start_time || null,
        data.trip_end_time || null,
        data.miles_driven,
        data.includes_commute_trip,
        data.commute_miles || null,
        data.used_assigned_vehicle,
        data.used_private_vehicle,
        data.vehicle_id || null,
        data.purpose || null,
        data.notes || null,
        data.reimbursement_requested,
        data.reimbursement_amount || null,
      ];

      const result = await pool.query(query, params);

      // Update callback count on on-call period
      await pool.query(
        `UPDATE on_call_periods
         SET callback_count = callback_count + 1
         WHERE id = $1 AND tenant_id = $2',
        [data.on_call_period_id, tenant_id]
      );

      res.status(201).json({
        message: 'Callback trip logged successfully',
        trip: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error creating callback trip:', error);
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

// DELETE /on-call-periods/:id
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      const query = `
        DELETE FROM on_call_periods
        WHERE id = $1 AND tenant_id = $2 AND is_active = true
        RETURNING *
      `;

      const result = await pool.query(query, [id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'On-call period not found or already inactive',
        });
      }

      res.json({
        message: 'On-call period deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting on-call period:', error);
      res.status(500).json({
        error: 'Failed to delete on-call period',
        details: getErrorMessage(error),
      });
    }
  }
);

export default router;
