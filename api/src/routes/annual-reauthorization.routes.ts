/**
 * Annual Reauthorization API Routes
 * Supports BR-9 (Annual Reauthorization - November Cycle)
 *
 * Handles:
 * - Annual reauthorization cycle creation
 * - Bulk listing for review
 * - Reauthorization decisions (reauthorize, modify, terminate)
 * - Electronic submission to Fleet Management
 */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

let pool: Pool;
export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
}

// =====================================================
// Validation Schemas
// =====================================================

const createReauthCycleSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  cycle_name: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deadline_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

const createReauthDecisionSchema = z.object({
  reauthorization_cycle_id: z.string().uuid(),
  vehicle_assignment_id: z.string().uuid(),
  decision: z.enum(['reauthorize', 'modify', 'terminate']),
  modification_notes: z.string().optional(),
  new_vehicle_id: z.string().uuid().optional(),
  new_driver_id: z.string().uuid().optional(),
  parameter_changes: z.record(z.any()).optional(),
  termination_reason: z.string().optional(),
  termination_effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  director_notes: z.string().optional(),
});

// =====================================================
// GET /annual-reauthorization-cycles
// List reauthorization cycles
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('reauthorization:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = '1', limit = '50', year, status } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const tenant_id = req.user!.tenant_id;

      let whereConditions = ['arc.tenant_id = $1'];
      let params: any[] = [tenant_id];
      let paramIndex = 2;

      if (year) {
        whereConditions.push(`arc.year = $${paramIndex++}`);
        params.push(parseInt(year as string));
      }
      if (status) {
        whereConditions.push(`arc.status = $${paramIndex++}`);
        params.push(status);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          arc.*,
          u.first_name AS submitted_by_first_name,
          u.last_name AS submitted_by_last_name
        FROM annual_reauthorization_cycles arc
        LEFT JOIN users u ON arc.submitted_by_user_id = u.id
        WHERE ${whereClause}
        ORDER BY arc.year DESC, arc.start_date DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      params.push(parseInt(limit as string), offset);

      const result = await pool.query(query, params);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM annual_reauthorization_cycles arc
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        cycles: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error('Error fetching reauthorization cycles:', error);
      res.status(500).json({
        error: 'Failed to fetch reauthorization cycles',
        details: error.message,
      });
    }
  }
);

// =====================================================
// POST /annual-reauthorization-cycles
// Create new reauthorization cycle
// =====================================================

router.post(
  '/',
  authenticateJWT,
  requirePermission('reauthorization:submit:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createReauthCycleSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      // Check if cycle for this year already exists
      const existingQuery = `
        SELECT id FROM annual_reauthorization_cycles
        WHERE tenant_id = $1 AND year = $2
      `;
      const existing = await pool.query(existingQuery, [tenant_id, data.year]);

      if (existing.rows.length > 0) {
        return res.status(400).json({
          error: `Reauthorization cycle for year ${data.year} already exists`,
        });
      }

      // Count active assignments to include in the cycle
      const countQuery = `
        SELECT COUNT(*) as total
        FROM vehicle_assignments
        WHERE tenant_id = $1
          AND lifecycle_state = 'active'
          AND (assignment_type = 'designated' OR assignment_type = 'on_call')
      `;
      const countResult = await pool.query(countQuery, [tenant_id]);
      const totalAssignments = parseInt(countResult.rows[0].total);

      const query = `
        INSERT INTO annual_reauthorization_cycles (
          tenant_id, year, cycle_name, start_date, deadline_date,
          total_assignments_count, notes, created_by_user_id, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 'initiated'
        )
        RETURNING *
      `;

      const params = [
        tenant_id,
        data.year,
        data.cycle_name || `${data.year} Annual Reauthorization`,
        data.start_date,
        data.deadline_date,
        totalAssignments,
        data.notes || null,
        user_id,
      ];

      const result = await pool.query(query, params);

      res.status(201).json({
        message: 'Annual reauthorization cycle created successfully',
        cycle: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error creating reauthorization cycle:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to create reauthorization cycle',
        details: error.message,
      });
    }
  }
);

// =====================================================
// GET /annual-reauthorization-cycles/:id/assignments
// Get assignments for review in this cycle
// =====================================================

router.get(
  '/:id/assignments',
  authenticateJWT,
  requirePermission('reauthorization:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { department_id, assignment_type } = req.query;
      const tenant_id = req.user!.tenant_id;

      let whereConditions = [
        'va.tenant_id = $1',
        'va.lifecycle_state = \'active\'',
        '(va.assignment_type = \'designated\' OR va.assignment_type = \'on_call\')',
      ];
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
          va.*,
          v.unit_number, v.make, v.model, v.year,
          dr.employee_number, dr.position_title,
          u.first_name AS driver_first_name, u.last_name AS driver_last_name,
          dept.name AS department_name,
          rd.id AS decision_id, rd.decision, rd.decision_date
        FROM vehicle_assignments va
        JOIN vehicles v ON va.vehicle_id = v.id
        JOIN drivers dr ON va.driver_id = dr.id
        LEFT JOIN users u ON dr.user_id = u.id
        LEFT JOIN departments dept ON va.department_id = dept.id
        LEFT JOIN reauthorization_decisions rd ON (
          rd.vehicle_assignment_id = va.id
          AND rd.reauthorization_cycle_id = $${paramIndex}
        )
        WHERE ${whereClause}
        ORDER BY dept.name, dr.employee_number
      `;

      params.push(id);

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching assignments for review:', error);
      res.status(500).json({
        error: 'Failed to fetch assignments for review',
        details: error.message,
      });
    }
  }
);

// =====================================================
// POST /reauthorization-decisions
// Create reauthorization decision
// =====================================================

router.post(
  '/decisions',
  authenticateJWT,
  requirePermission('reauthorization:review:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createReauthDecisionSchema.parse(req.body);
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      // Validate decision type requirements
      if (data.decision === 'terminate' && !data.termination_reason) {
        return res.status(400).json({
          error: 'Termination reason required for terminate decision',
        });
      }

      const query = `
        INSERT INTO reauthorization_decisions (
          tenant_id, reauthorization_cycle_id, vehicle_assignment_id,
          decision, decided_by_user_id,
          modification_notes, new_vehicle_id, new_driver_id, parameter_changes,
          termination_reason, termination_effective_date, director_notes,
          director_reviewed, director_review_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW()
        )
        ON CONFLICT (reauthorization_cycle_id, vehicle_assignment_id)
        DO UPDATE SET
          decision = EXCLUDED.decision,
          decided_by_user_id = EXCLUDED.decided_by_user_id,
          modification_notes = EXCLUDED.modification_notes,
          new_vehicle_id = EXCLUDED.new_vehicle_id,
          new_driver_id = EXCLUDED.new_driver_id,
          parameter_changes = EXCLUDED.parameter_changes,
          termination_reason = EXCLUDED.termination_reason,
          termination_effective_date = EXCLUDED.termination_effective_date,
          director_notes = EXCLUDED.director_notes,
          director_reviewed = true,
          director_review_date = NOW(),
          updated_at = NOW()
        RETURNING *
      `;

      const params = [
        tenant_id,
        data.reauthorization_cycle_id,
        data.vehicle_assignment_id,
        data.decision,
        user_id,
        data.modification_notes || null,
        data.new_vehicle_id || null,
        data.new_driver_id || null,
        JSON.stringify(data.parameter_changes || {}),
        data.termination_reason || null,
        data.termination_effective_date || null,
        data.director_notes || null,
      ];

      const result = await pool.query(query, params);

      // Update cycle counts
      await updateCycleCounts(data.reauthorization_cycle_id, tenant_id);

      res.status(201).json({
        message: 'Reauthorization decision recorded successfully',
        decision: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error creating reauthorization decision:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      res.status(500).json({
        error: 'Failed to create reauthorization decision',
        details: error.message,
      });
    }
  }
);

// =====================================================
// POST /annual-reauthorization-cycles/:id/submit
// Submit reauthorization cycle to Fleet Management
// =====================================================

router.post(
  '/:id/submit',
  authenticateJWT,
  requirePermission('reauthorization:submit:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenant_id = req.user!.tenant_id;
      const user_id = req.user!.id;

      // Check if all assignments have decisions
      const pendingQuery = `
        SELECT COUNT(*) as pending_count
        FROM vehicle_assignments va
        WHERE va.tenant_id = $1
          AND va.lifecycle_state = 'active'
          AND (va.assignment_type = 'designated' OR va.assignment_type = 'on_call')
          AND NOT EXISTS (
            SELECT 1 FROM reauthorization_decisions rd
            WHERE rd.vehicle_assignment_id = va.id
              AND rd.reauthorization_cycle_id = $2
          )
      `;

      const pendingResult = await pool.query(pendingQuery, [tenant_id, id]);
      const pendingCount = parseInt(pendingResult.rows[0].pending_count);

      if (pendingCount > 0) {
        return res.status(400).json({
          error: `Cannot submit: ${pendingCount} assignment(s) still pending review`,
        });
      }

      const query = `
        UPDATE annual_reauthorization_cycles
        SET
          status = 'completed',
          submitted_to_fleet = true,
          submitted_at = NOW(),
          submitted_by_user_id = $1,
          completion_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [user_id, id, tenant_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Reauthorization cycle not found' });
      }

      res.json({
        message: 'Reauthorization cycle submitted to Fleet Management successfully',
        cycle: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error submitting reauthorization cycle:', error);
      res.status(500).json({
        error: 'Failed to submit reauthorization cycle',
        details: error.message,
      });
    }
  }
);

// =====================================================
// Helper Functions
// =====================================================

async function updateCycleCounts(cycle_id: string, tenant_id: string) {
  const query = `
    UPDATE annual_reauthorization_cycles
    SET
      reauthorized_count = (
        SELECT COUNT(*) FROM reauthorization_decisions
        WHERE reauthorization_cycle_id = $1 AND decision = 'reauthorize'
      ),
      modified_count = (
        SELECT COUNT(*) FROM reauthorization_decisions
        WHERE reauthorization_cycle_id = $1 AND decision = 'modify'
      ),
      terminated_count = (
        SELECT COUNT(*) FROM reauthorization_decisions
        WHERE reauthorization_cycle_id = $1 AND decision = 'terminate'
      ),
      updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
  `;

  await pool.query(query, [cycle_id, tenant_id]);
}

export default router;
