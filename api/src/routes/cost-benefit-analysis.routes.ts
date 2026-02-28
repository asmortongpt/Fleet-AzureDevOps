/**
 * Cost/Benefit Analysis API Routes
 * Supports BR-5 (Cost/Benefit Analysis Management)
 *
 * Handles:
 * - Cost/benefit analysis creation and management
 * - Current vs proposed cost comparison
 * - ROI and NPV calculations
 * - Analysis status workflow
 *
 * Actual DB columns (cost_benefit_analyses):
 *   id, tenant_id, analysis_name, analysis_type, analysis_date,
 *   evaluation_period_months, current_annual_cost, current_fuel_cost,
 *   current_maintenance_cost, proposed_annual_cost, proposed_fuel_cost,
 *   proposed_maintenance_cost, proposed_upfront_cost, annual_savings,
 *   total_savings, payback_period_months, roi_percentage, npv,
 *   status, assumptions, metadata, created_at, updated_at, created_by
 */


import express, { Response } from 'express'
import { Pool } from 'pg'
import { z } from 'zod'

import logger from '../config/logger'
import { pool as dbPool } from '../db/connection'
import { NotFoundError } from '../errors/app-error'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { getErrorMessage } from '../utils/error-handler'


const router = express.Router()

let pool: Pool = dbPool
export function setDatabasePool(newPool: Pool) {
  pool = newPool
}

// =====================================================
// Validation Schemas
// =====================================================

const createCostBenefitSchema = z.object({
  analysis_name: z.string().min(1).max(255),
  analysis_type: z.string().min(1).max(50), // ev_conversion, vehicle_replacement, route_optimization
  analysis_date: z.string().optional(), // defaults to CURRENT_DATE in DB
  evaluation_period_months: z.number().int().positive().optional().default(60),

  // Current state costs
  current_annual_cost: z.number().nonnegative().optional(),
  current_fuel_cost: z.number().nonnegative().optional(),
  current_maintenance_cost: z.number().nonnegative().optional(),

  // Proposed state costs
  proposed_annual_cost: z.number().nonnegative().optional(),
  proposed_fuel_cost: z.number().nonnegative().optional(),
  proposed_maintenance_cost: z.number().nonnegative().optional(),
  proposed_upfront_cost: z.number().nonnegative().optional(),

  // Savings & ROI
  annual_savings: z.number().optional(),
  total_savings: z.number().optional(),
  payback_period_months: z.number().nonnegative().optional(),
  roi_percentage: z.number().optional(),
  npv: z.number().optional(),

  // Status
  status: z.string().optional(), // draft, under_review, approved, rejected

  // Metadata
  assumptions: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const updateCostBenefitSchema = createCostBenefitSchema.partial()

const reviewCostBenefitSchema = z.object({
  status: z.enum(['draft', 'under_review', 'approved', 'rejected']),
})

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
      const { page = '1', limit = '50', analysis_type, status } = req.query

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
      const tenant_id = req.user!.tenant_id

      const whereConditions = [`cba.tenant_id = $1`]
      const params: any[] = [tenant_id]
      let paramIndex = 2

      if (analysis_type) {
        whereConditions.push(`cba.analysis_type = $${paramIndex++}`)
        params.push(analysis_type)
      }
      if (status) {
        whereConditions.push(`cba.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = whereConditions.join(` AND `)

      const query = `
        SELECT
          cba.*,
          u.first_name AS created_by_first_name,
          u.last_name AS created_by_last_name
        FROM cost_benefit_analyses cba
        LEFT JOIN users u ON cba.created_by = u.id
        WHERE ${whereClause}
        ORDER BY cba.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `

      params.push(parseInt(limit as string), offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*) as total
        FROM cost_benefit_analyses cba
        WHERE ${whereClause}
      `
      const countResult = await pool.query(countQuery, params.slice(0, -2))
      const total = parseInt(countResult.rows[0].total)

      res.json({
        analyses: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      })
    } catch (error: unknown) {
      logger.error(`Error fetching cost/benefit analyses:`, error)
      res.status(500).json({
        error: 'Failed to fetch cost/benefit analyses',
        details: getErrorMessage(error),
      })
    }
  }
)

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
      const { id } = req.params
      const tenant_id = req.user!.tenant_id

      const query = `
        SELECT
          cba.*,
          u.first_name AS created_by_first_name,
          u.last_name AS created_by_last_name,
          u.email AS created_by_email
        FROM cost_benefit_analyses cba
        LEFT JOIN users u ON cba.created_by = u.id
        WHERE cba.id = $1 AND cba.tenant_id = $2
      `

      const result = await pool.query(query, [id, tenant_id])

      if (result.rows.length === 0) {
        throw new NotFoundError("Cost/benefit analysis not found")
      }

      res.json(result.rows[0])
    } catch (error: unknown) {
      logger.error('Error fetching cost/benefit analysis:', error)
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          error: 'Cost/benefit analysis not found',
        })
      }
      res.status(500).json({
        error: 'Failed to fetch cost/benefit analysis',
        details: getErrorMessage(error),
      })
    }
  }
)

// =====================================================
// POST /cost-benefit-analyses
// Create new cost/benefit analysis
// =====================================================

router.post(
  '/',
 csrfProtection, authenticateJWT,
  requirePermission('cost_benefit:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createCostBenefitSchema.parse(req.body)
      const tenant_id = req.user!.tenant_id
      const user_id = req.user!.id

      const query = `
        INSERT INTO cost_benefit_analyses (
          tenant_id, analysis_name, analysis_type, analysis_date,
          evaluation_period_months,
          current_annual_cost, current_fuel_cost, current_maintenance_cost,
          proposed_annual_cost, proposed_fuel_cost, proposed_maintenance_cost,
          proposed_upfront_cost,
          annual_savings, total_savings, payback_period_months,
          roi_percentage, npv,
          status, assumptions, metadata, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `

      const params = [
        tenant_id,
        data.analysis_name,
        data.analysis_type,
        data.analysis_date || null,
        data.evaluation_period_months,
        data.current_annual_cost || null,
        data.current_fuel_cost || null,
        data.current_maintenance_cost || null,
        data.proposed_annual_cost || null,
        data.proposed_fuel_cost || null,
        data.proposed_maintenance_cost || null,
        data.proposed_upfront_cost || null,
        data.annual_savings || null,
        data.total_savings || null,
        data.payback_period_months || null,
        data.roi_percentage || null,
        data.npv || null,
        data.status || 'draft',
        JSON.stringify(data.assumptions || {}),
        JSON.stringify(data.metadata || {}),
        user_id,
      ]

      const result = await pool.query(query, params)

      res.status(201).json({
        message: `Cost/benefit analysis created successfully`,
        analysis: result.rows[0],
      })
    } catch (error: unknown) {
      logger.error('Error creating cost/benefit analysis:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        })
      }
      res.status(500).json({
        error: 'Failed to create cost/benefit analysis',
        details: getErrorMessage(error),
      })
    }
  }
)

// =====================================================
// PUT /cost-benefit-analyses/:id
// Update cost/benefit analysis
// =====================================================

router.put(
  '/:id',
 csrfProtection, authenticateJWT,
  requirePermission(`cost_benefit:create:team`),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const data = updateCostBenefitSchema.parse(req.body)
      const tenant_id = req.user!.tenant_id

      // Only allow updating actual DB columns
      const allowedFields = [
        'analysis_name', 'analysis_type', 'analysis_date', 'evaluation_period_months',
        'current_annual_cost', 'current_fuel_cost', 'current_maintenance_cost',
        'proposed_annual_cost', 'proposed_fuel_cost', 'proposed_maintenance_cost',
        'proposed_upfront_cost', 'annual_savings', 'total_savings',
        'payback_period_months', 'roi_percentage', 'npv', 'status',
      ]

      const updates: string[] = []
      const params: any[] = []
      let paramIndex = 1

      for (const field of allowedFields) {
        const value = (data as Record<string, unknown>)[field]
        if (value !== undefined) {
          updates.push(`${field} = $${paramIndex++}`)
          params.push(value)
        }
      }

      // Handle JSONB fields separately
      if (data.assumptions !== undefined) {
        updates.push(`assumptions = $${paramIndex++}`)
        params.push(JSON.stringify(data.assumptions))
      }
      if (data.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`)
        params.push(JSON.stringify(data.metadata))
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: `No fields to update` })
      }

      updates.push(`updated_at = NOW()`)
      params.push(id, tenant_id)

      const query = `
        UPDATE cost_benefit_analyses
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
        RETURNING *
      `

      const result = await pool.query(query, params)

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Cost/benefit analysis not found` })
      }

      res.json({
        message: 'Cost/benefit analysis updated successfully',
        analysis: result.rows[0],
      })
    } catch (error: unknown) {
      logger.error('Error updating cost/benefit analysis:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        })
      }
      res.status(500).json({
        error: 'Failed to update cost/benefit analysis',
        details: getErrorMessage(error),
      })
    }
  }
)

// =====================================================
// POST /cost-benefit-analyses/:id/review
// Review/approve cost/benefit analysis
// =====================================================

router.post(
  '/:id/review',
 csrfProtection, authenticateJWT,
  requirePermission('cost_benefit:approve:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const data = reviewCostBenefitSchema.parse(req.body)
      const tenant_id = req.user!.tenant_id

      const query = `
        UPDATE cost_benefit_analyses
        SET
          status = $1,
          updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING *
      `

      const result = await pool.query(query, [data.status, id, tenant_id])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Cost/benefit analysis not found` })
      }

      res.json({
        message: `Cost/benefit analysis ${data.status}`,
        analysis: result.rows[0],
      })
    } catch (error: unknown) {
      logger.error(`Error reviewing cost/benefit analysis:`, error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        })
      }
      res.status(500).json({
        error: 'Failed to review cost/benefit analysis',
        details: getErrorMessage(error),
      })
    }
  }
)

// =====================================================
// DELETE /cost-benefit-analyses/:id
// Delete cost/benefit analysis
// =====================================================

router.delete(
  '/:id',
 csrfProtection, authenticateJWT,
  requirePermission('cost_benefit:create:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const tenant_id = req.user!.tenant_id

      const query = `
        DELETE FROM cost_benefit_analyses
        WHERE id = $1 AND tenant_id = $2
        RETURNING *
      `

      const result = await pool.query(query, [id, tenant_id])

      if (result.rows.length === 0) {
        throw new NotFoundError("Cost/benefit analysis not found")
      }

      res.json({
        message: 'Cost/benefit analysis deleted successfully',
      })
    } catch (error: unknown) {
      logger.error('Error deleting cost/benefit analysis:', error)
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          error: 'Cost/benefit analysis not found',
        })
      }
      res.status(500).json({
        error: 'Failed to delete cost/benefit analysis',
        details: getErrorMessage(error),
      })
    }
  }
)

export default router
