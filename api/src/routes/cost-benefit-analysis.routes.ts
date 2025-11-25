/**
 * Cost/Benefit Analysis API Routes
 * Supports BR-5 (Cost/Benefit Analysis Management)
 *
 * Handles:
 * - Cost/benefit analysis creation and management
 * - Quantifiable cost tracking
 * - Non-quantifiable factor assessment
 * - Analysis approval workflow
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

const createCostBenefitSchema = z.object({
  vehicle_assignment_id: z.string().uuid().optional(),
  department_id: z.string().uuid(),
  requesting_position: z.string(),

  // Quantifiable costs
  annual_fuel_cost: z.number().nonnegative().default(0),
  annual_maintenance_cost: z.number().nonnegative().default(0),
  annual_insurance_cost: z.number().nonnegative().default(0),
  annual_parking_cost: z.number().nonnegative().default(0),
  vehicle_elimination_savings: z.number().nonnegative().default(0),

  // Quantifiable benefits
  productivity_impact_hours: z.number().nonnegative().default(0),
  productivity_impact_dollars: z.number().nonnegative().default(0),
  on_call_expense_reduction: z.number().nonnegative().default(0),
  mileage_reimbursement_reduction: z.number().nonnegative().default(0),
  labor_cost_savings: z.number().nonnegative().default(0),

  // Non-quantifiable factors
  public_safety_impact: z.string().optional(),
  visibility_requirement: z.string().optional(),
  response_time_impact: z.string().optional(),
  employee_identification_need: z.string().optional(),
  specialty_equipment_need: z.string().optional(),
  other_non_quantifiable_factors: z.string().optional(),

  // Overall
  recommendation: z.string().optional(),
});

const updateCostBenefitSchema = createCostBenefitSchema.partial();

const reviewCostBenefitSchema = z.object({
  approval_status: z.enum(['pending', 'approved', 'rejected']),
  notes: z.string().optional(),
});

// =====================================================
// GET /cost-benefit-analyses
// List cost/benefit analyses
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('cost_benefit:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        department_id,
        approval_status,
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const tenant_id = req.user!.tenant_id;

      let whereConditions = ['cba.tenant_id = $1'];
      let params: any[] = [tenant_id];
      let paramIndex = 2;

      if (department_id) {
        whereConditions.push(`cba.department_id = $${paramIndex++}`);
        params.push(department_id);
      }
      if (approval_status) {
        whereConditions.push(`cba.approval_status = $${paramIndex++}`);
        params.push(approval_status);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          cba.*,
          dept.name AS department_name,
          va.id AS assignment_id, va.assignment_type,
          v.unit_number, v.make, v.model,
          prep_user.first_name AS prepared_by_first_name,
          prep_user.last_name AS prepared_by_last_name,
          rev_user.first_name AS reviewed_by_first_name,
          rev_user.last_name AS reviewed_by_last_name
        FROM cost_benefit_analyses cba
        LEFT JOIN departments dept ON cba.department_id = dept.id
        LEFT JOIN vehicle_assignments va ON cba.vehicle_assignment_id = va.id
        LEFT JOIN vehicles v ON va.vehicle_id = v.id
        LEFT JOIN users prep_user ON cba.prepared_by_user_id = prep_user.id
        LEFT JOIN users rev_user ON cba.reviewed_by_user_id = rev_user.id
        WHERE ${whereClause}
        ORDER BY cba.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      params.push(parseInt(limit as string), offset);

      const result = await pool.query(query, params);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM cost_benefit_analyses cba
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        analyses: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error('Error fetching cost/benefit analyses:', error);
      res.status(500).json({
        error: 'Failed to fetch cost/benefit analyses',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// GET /cost-benefit-analyses/:id
// Get single cost/benefit analysis
// =====================================================

router.get(
  '/:id',
  authenticateJWT,
  requirePermission('cost_benefit:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      const query = `
        SELECT
          cba.*,
          dept.name AS department_name,
          va.id AS assignment_id, va.assignment_type, va.lifecycle_state,
          v.unit_number, v.make, v.model, v.year,
          dr.employee_number, dr.position_title,
          u.first_name AS driver_first_name, u.last_name AS driver_last_name,
          prep_user.first_name AS prepared_by_first_name,
          prep_user.last_name AS prepared_by_last_name,
          prep_user.email AS prepared_by_email,
          rev_user.first_name AS reviewed_by_first_name,
          rev_user.last_name AS reviewed_by_last_name
        FROM cost_benefit_analyses cba
        LEFT JOIN departments dept ON cba.department_id = dept.id
        LEFT JOIN vehicle_assignments va ON cba.vehicle_assignment_id = va.id
        LEFT JOIN vehicles v ON va.vehicle_id = v.id
        LEFT JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN users prep_user ON cba.prepared_by_user_id = prep_user.id
        LEFT JOIN users rev_user ON cba.reviewed_by_user_id = rev_user.id
        WHERE cba.id = $1 AND cba.tenant_id = $2
      `;

      const result = await pool.query(query, [id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cost/benefit analysis not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error fetching cost/benefit analysis:', error);
      res.status(500).json({
        error: 'Failed to fetch cost/benefit analysis',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /cost-benefit-analyses
// Create new cost/benefit analysis
// =====================================================

router.post(
  '/',
  authenticateJWT,
  requirePermission('cost_benefit:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createCostBenefitSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      const query = `
        INSERT INTO cost_benefit_analyses (
          tenant_id, vehicle_assignment_id, department_id,
          requesting_position, prepared_by_user_id,
          annual_fuel_cost, annual_maintenance_cost, annual_insurance_cost,
          annual_parking_cost, vehicle_elimination_savings,
          productivity_impact_hours, productivity_impact_dollars,
          on_call_expense_reduction, mileage_reimbursement_reduction,
          labor_cost_savings,
          public_safety_impact, visibility_requirement, response_time_impact,
          employee_identification_need, specialty_equipment_need,
          other_non_quantifiable_factors, recommendation,
          created_by_user_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23
        )
        RETURNING *
      `;

      const params = [
        tenant_id,
        data.vehicle_assignment_id || null,
        data.department_id,
        data.requesting_position,
        user_id,
        data.annual_fuel_cost,
        data.annual_maintenance_cost,
        data.annual_insurance_cost,
        data.annual_parking_cost,
        data.vehicle_elimination_savings,
        data.productivity_impact_hours,
        data.productivity_impact_dollars,
        data.on_call_expense_reduction,
        data.mileage_reimbursement_reduction,
        data.labor_cost_savings,
        data.public_safety_impact || null,
        data.visibility_requirement || null,
        data.response_time_impact || null,
        data.employee_identification_need || null,
        data.specialty_equipment_need || null,
        data.other_non_quantifiable_factors || null,
        data.recommendation || null,
        user_id,
      ];

      const result = await pool.query(query, params);

      // If linked to a vehicle assignment, update the assignment
      if (data.vehicle_assignment_id) {
        await pool.query(
          `UPDATE vehicle_assignments
           SET cost_benefit_analysis_id = $1
           WHERE id = $2 AND tenant_id = $3',
          [result.rows[0].id, data.vehicle_assignment_id, tenant_id]
        );
      }

      res.status(201).json({
        message: 'Cost/benefit analysis created successfully',
        analysis: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error creating cost/benefit analysis:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to create cost/benefit analysis',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// PUT /cost-benefit-analyses/:id
// Update cost/benefit analysis
// =====================================================

router.put(
  '/:id',
  authenticateJWT,
  requirePermission('cost_benefit:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateCostBenefitSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      params.push(id, tenant_id);

      const query = `
        UPDATE cost_benefit_analyses
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cost/benefit analysis not found' });
      }

      res.json({
        message: 'Cost/benefit analysis updated successfully',
        analysis: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error updating cost/benefit analysis:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to update cost/benefit analysis',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// POST /cost-benefit-analyses/:id/review
// Review/approve cost/benefit analysis
// =====================================================

router.post(
  '/:id/review',
  authenticateJWT,
  requirePermission('cost_benefit:approve:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = reviewCostBenefitSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      const query = `
        UPDATE cost_benefit_analyses
        SET
          approval_status = $1,
          reviewed_by_user_id = $2,
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `;

      const result = await pool.query(query, [
        data.approval_status,
        user_id,
        id,
        tenant_id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cost/benefit analysis not found' });
      }

      res.json({
        message: `Cost/benefit analysis ${data.approval_status}`,
        analysis: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error reviewing cost/benefit analysis:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to review cost/benefit analysis',
        details: getErrorMessage(error),
      });
    }
  }
);

// =====================================================
// DELETE /cost-benefit-analyses/:id
// Delete cost/benefit analysis
// =====================================================

router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('cost_benefit:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;

      const query = `
        DELETE FROM cost_benefit_analyses
        WHERE id = $1 AND tenant_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cost/benefit analysis not found' });
      }

      res.json({
        message: 'Cost/benefit analysis deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting cost/benefit analysis:', error);
      res.status(500).json({
        error: 'Failed to delete cost/benefit analysis',
        details: getErrorMessage(error),
      });
    }
  }
);

export default router;
