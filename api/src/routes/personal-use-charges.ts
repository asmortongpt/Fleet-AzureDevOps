import express, { Response } from 'express';
import { z } from 'zod';

import { pool } from '../db/connection';
import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import {
  ChargeStatus,
  CreateChargeRequest,
  UpdateChargeRequest,
  CalculateChargesRequest,
  CalculateChargesResponse,
  ChargeBreakdownItem
} from '../types/trip-usage';
import logger from '../config/logger';

const router = express.Router();
router.use(authenticateJWT);

// Validation schemas
const createChargeSchema = z.object({
  driver_id: z.string().uuid(),
  trip_usage_id: z.string().uuid().optional(),
  charge_period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
  charge_period_start: z.string(),
  charge_period_end: z.string(),
  miles_charged: z.number().nonnegative(),
  rate_per_mile: z.number().nonnegative(),
  notes: z.string().optional(),
  is_reimbursement: z.boolean().optional(),
  actual_cost_breakdown: z.object({
    fuel: z.number().optional(),
    maintenance: z.number().optional(),
    insurance: z.number().optional(),
    depreciation: z.number().optional(),
    other: z.number().optional()
  }).optional()
});

const updateChargeSchema = z.object({
  charge_status: z.enum([
    ChargeStatus.PENDING,
    ChargeStatus.INVOICED,
    ChargeStatus.BILLED,
    ChargeStatus.PAID,
    ChargeStatus.WAIVED,
    ChargeStatus.DISPUTED
  ]).optional(),
  payment_method: z.string().optional(),
  paid_at: z.string().optional(),
  waived_reason: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  driver_notes: z.string().optional()
});

const calculateChargesSchema = z.object({
  driver_id: z.string().uuid(),
  charge_period: z.string().regex(/^\d{4}-\d{2}$/)
});

/**
 * GET /api/personal-use-charges
 * List personal use charges with filtering
 */
router.get(
  '/',
  requirePermission('route:view:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        driver_id,
        charge_period,
        charge_status,
        start_date,
        end_date,
        is_reimbursement,
        limit = 50,
        offset = 0
      } = req.query as any;

      let query = `
        SELECT c.*,
               u.first_name || ' ' || u.last_name as driver_name,
               u.email as driver_email
        FROM personal_use_charges c
        LEFT JOIN users u ON c.driver_id = u.id
        WHERE c.tenant_id = $1
      `;
      const params: any[] = [req.user!.tenant_id];
      let paramCount = 1;

      if (driver_id) {
        paramCount++;
        query += ` AND c.driver_id = $${paramCount}`;
        params.push(driver_id);
      }

      if (charge_period) {
        paramCount++;
        query += ` AND c.charge_period = $${paramCount}`;
        params.push(charge_period);
      }

      if (charge_status) {
        paramCount++;
        query += ` AND c.charge_status = $${paramCount}`;
        params.push(charge_status);
      }

      if (start_date) {
        paramCount++;
        query += ` AND c.charge_period_start >= $${paramCount}`;
        params.push(start_date);
      }

      if (end_date) {
        paramCount++;
        query += ` AND c.charge_period_end <= $${paramCount}`;
        params.push(end_date);
      }

      if (is_reimbursement !== undefined) {
        paramCount++;
        query += ` AND c.is_reimbursement = $${paramCount}`;
        params.push(is_reimbursement === 'true');
      }

      query += ` ORDER BY c.charge_period_start DESC, c.created_at DESC`;

      // Get total count
      const countResult = await pool.query(
        query.replace(/SELECT c\.\*, u\.first_name.*FROM/, 'SELECT COUNT(*) FROM'),
        params
      );

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].count)
        }
      });
    } catch (error: any) {
      logger.error('Get personal use charges error:', error);
      res.status(500).json({ error: 'Failed to retrieve personal use charges' });
    }
  }
);

/**
 * GET /api/personal-use-charges/:id
 * Get specific personal use charge
 */
router.get(
  '/:id',
  requirePermission('route:view:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT c.*,
                u.first_name || ' ' || u.last_name as driver_name,
                u.email as driver_email,
                t.trip_date, t.usage_type, t.miles_total
         FROM personal_use_charges c
         LEFT JOIN users u ON c.driver_id = u.id
         LEFT JOIN trip_usage_classification t ON c.trip_usage_id = t.id
         WHERE c.id = $1 AND c.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Personal use charge not found' });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Get personal use charge error:', error);
      res.status(500).json({ error: 'Failed to retrieve personal use charge' });
    }
  }
);

/**
 * POST /api/personal-use-charges
 * Create a new personal use charge
 */
router.post(
  '/',
  csrfProtection,
  requirePermission('route:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'personal_use_charges' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = createChargeSchema.parse(req.body);

      // Verify driver belongs to tenant
      const driverCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [validated.driver_id, req.user!.tenant_id]
      );

      if (driverCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Driver not found in your organization' });
      }

      // Calculate total charge
      const total_charge = validated.miles_charged * validated.rate_per_mile;

      // Insert charge
      const result = await pool.query(
        `INSERT INTO personal_use_charges (
          tenant_id, driver_id, trip_usage_id,
          charge_period, charge_period_start, charge_period_end,
          miles_charged, rate_per_mile, total_charge,
          charge_status, is_reimbursement,
          actual_cost_breakdown, notes,
          created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          req.user!.tenant_id,
          validated.driver_id,
          validated.trip_usage_id || null,
          validated.charge_period,
          validated.charge_period_start,
          validated.charge_period_end,
          validated.miles_charged,
          validated.rate_per_mile,
          total_charge,
          ChargeStatus.PENDING,
          validated.is_reimbursement || false,
          validated.actual_cost_breakdown ? JSON.stringify(validated.actual_cost_breakdown) : null,
          validated.notes || null,
          req.user!.id
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Personal use charge created successfully'
      });
    } catch (error: any) {
      logger.error('Create personal use charge error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.issues });
      }
      res.status(500).json({ error: 'Failed to create personal use charge' });
    }
  }
);

/**
 * PUT /api/personal-use-charges/:id
 * Update a personal use charge
 */
router.put(
  '/:id',
  csrfProtection,
  requirePermission('route:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'personal_use_charges' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = updateChargeSchema.parse(req.body);

      // Check if charge exists
      const existing = await pool.query(
        `SELECT id FROM personal_use_charges WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Personal use charge not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 2; // id is $1, tenant_id is $2

      if (validated.charge_status !== undefined) {
        paramCount++;
        updates.push(`charge_status = $${paramCount}`);
        values.push(validated.charge_status);
      }

      if (validated.payment_method !== undefined) {
        paramCount++;
        updates.push(`payment_method = $${paramCount}`);
        values.push(validated.payment_method);
      }

      if (validated.paid_at !== undefined) {
        paramCount++;
        updates.push(`paid_at = $${paramCount}`);
        values.push(validated.paid_at);
      }

      if (validated.waived_reason !== undefined) {
        paramCount++;
        updates.push(`waived_reason = $${paramCount}`);
        updates.push(`waived_by_user_id = $${paramCount + 1}`);
        updates.push(`waived_at = NOW()`);
        values.push(validated.waived_reason);
        paramCount++;
        values.push(req.user!.id);
      }

      if (validated.invoice_number !== undefined) {
        paramCount++;
        updates.push(`invoice_number = $${paramCount}`);
        values.push(validated.invoice_number);
      }

      if (validated.invoice_date !== undefined) {
        paramCount++;
        updates.push(`invoice_date = $${paramCount}`);
        values.push(validated.invoice_date);
      }

      if (validated.due_date !== undefined) {
        paramCount++;
        updates.push(`due_date = $${paramCount}`);
        values.push(validated.due_date);
      }

      if (validated.notes !== undefined) {
        paramCount++;
        updates.push(`notes = $${paramCount}`);
        values.push(validated.notes);
      }

      if (validated.driver_notes !== undefined) {
        paramCount++;
        updates.push(`driver_notes = $${paramCount}`);
        values.push(validated.driver_notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.push('updated_at = NOW()');

      const result = await pool.query(
        `UPDATE personal_use_charges
         SET ${updates.join(', ')}
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      );

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Personal use charge updated successfully'
      });
    } catch (error: any) {
      logger.error('Update personal use charge error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.issues });
      }
      res.status(500).json({ error: 'Failed to update personal use charge' });
    }
  }
);

/**
 * POST /api/personal-use-charges/calculate
 * Calculate charges for a billing period based on personal use trips
 */
router.post(
  '/calculate',
  csrfProtection,
  requirePermission('route:create:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = calculateChargesSchema.parse(req.body);

      // Verify driver belongs to tenant
      const driverCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [validated.driver_id, req.user!.tenant_id]
      );

      if (driverCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Driver not found in your organization' });
      }

      // Get policy for rate
      const policyResult = await pool.query(
        `SELECT personal_use_rate_per_mile
         FROM personal_use_policies
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [req.user!.tenant_id]
      );

      const rate_per_mile = policyResult.rows[0]?.personal_use_rate_per_mile || 0;

      // Calculate period start and end dates
      const [year, month] = validated.charge_period.split('-');
      const charge_period_start = `${year}-${month}-01`;
      const charge_period_end = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      // Get all personal trips for the period
      const tripsResult = await pool.query(
        `SELECT id, trip_date, miles_personal, miles_total, business_percentage
         FROM trip_usage_classification
         WHERE tenant_id = $1
           AND driver_id = $2
           AND trip_date >= $3
           AND trip_date <= $4
           AND usage_type IN ('personal', 'mixed')
           AND approval_status IN ('approved', 'auto_approved')
         ORDER BY trip_date`,
        [req.user!.tenant_id, validated.driver_id, charge_period_start, charge_period_end]
      );

      const trips = tripsResult.rows;

      // Calculate breakdown
      const charge_breakdown: ChargeBreakdownItem[] = trips.map((trip: any) => {
        let miles_personal = trip.miles_personal;

        // If miles_personal is not set, calculate from miles_total and business_percentage
        if (miles_personal === null || miles_personal === undefined) {
          const business_percentage = trip.business_percentage || 0;
          miles_personal = trip.miles_total * (1 - business_percentage / 100);
        }

        const charge = miles_personal * rate_per_mile;

        return {
          trip_usage_id: trip.id,
          trip_date: trip.trip_date,
          miles_personal,
          rate: rate_per_mile,
          charge
        };
      });

      const total_personal_miles = charge_breakdown.reduce((sum, item) => sum + item.miles_personal, 0);
      const total_charge = charge_breakdown.reduce((sum, item) => sum + item.charge, 0);

      const response: CalculateChargesResponse = {
        driver_id: validated.driver_id,
        charge_period: validated.charge_period,
        total_personal_miles,
        rate_per_mile,
        total_charge,
        trips_included: trips.length,
        charge_breakdown
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error: any) {
      logger.error('Calculate charges error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.issues });
      }
      res.status(500).json({ error: 'Failed to calculate charges' });
    }
  }
);

/**
 * POST /api/personal-use-charges/:id/waive
 * Waive a personal use charge
 */
router.post(
  '/:id/waive',
  csrfProtection,
  requirePermission('route:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'personal_use_charges' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { waived_reason } = req.body;

      if (!waived_reason || waived_reason.trim().length === 0) {
        return res.status(400).json({ error: 'Waived reason is required' });
      }

      const result = await pool.query(
        `UPDATE personal_use_charges
         SET charge_status = $1,
             waived_by_user_id = $2,
             waived_at = NOW(),
             waived_reason = $3,
             updated_at = NOW()
         WHERE id = $4 AND tenant_id = $5
         RETURNING *`,
        [ChargeStatus.WAIVED, req.user!.id, waived_reason, req.params.id, req.user!.tenant_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Personal use charge not found' });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Personal use charge waived successfully'
      });
    } catch (error: any) {
      logger.error('Waive charge error:', error);
      res.status(500).json({ error: 'Failed to waive charge' });
    }
  }
);

/**
 * DELETE /api/personal-use-charges/:id
 * Delete a personal use charge (admin only)
 */
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('route:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'personal_use_charges' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `DELETE FROM personal_use_charges
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [req.params.id, req.user!.tenant_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Personal use charge not found' });
      }

      res.json({
        success: true,
        message: 'Personal use charge deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete charge error:', error);
      res.status(500).json({ error: 'Failed to delete charge' });
    }
  }
);

export default router;
