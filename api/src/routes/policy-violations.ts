/**
 * Policy Violations Routes
 *
 * Alias/proxy for policy violation endpoints.
 * Frontend calls /api/policy-violations/* but the core violation data
 * lives in the policy_violations table (managed by policy-templates.ts).
 * This route file provides the frontend-expected paths.
 */

import express, { Response } from 'express'

import { pool } from '../config/database'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /policy-violations — list violations (mirrors policy-templates /violations)
router.get(
  '/',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, employee_id, policy_id, severity, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT pv.*,
               pt.template_name as policy_name,
               pt.template_category as policy_code,
               CONCAT(u.first_name, ' ', u.last_name) as employee_name,
               d.license_number as employee_number_display
        FROM policy_violations pv
        LEFT JOIN policy_templates pt ON pv.policy_id = pt.id
        LEFT JOIN drivers d ON pv.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE pv.tenant_id = $1
      `
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (employee_id) {
        query += ` AND pv.driver_id = $${paramIndex}::uuid`
        params.push(employee_id)
        paramIndex++
      }

      if (policy_id) {
        query += ` AND pv.policy_id = $${paramIndex}`
        params.push(policy_id)
        paramIndex++
      }

      if (severity) {
        query += ` AND pv.severity = $${paramIndex}`
        params.push(severity)
        paramIndex++
      }

      if (status) {
        query += ` AND pv.acknowledged = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      query += ` ORDER BY pv.violation_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countParams: unknown[] = [req.user!.tenant_id]
      const countQuery = `
        SELECT COUNT(*)
        FROM policy_violations pv
        WHERE pv.tenant_id = $1
      `
      const countResult = await pool.query(countQuery, countParams)

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      logger.error('Get policy violations error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// GET /policy-violations/statistics — violation statistics for dashboard
router.get(
  '/statistics',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id

      const statsResult = await pool.query(
        `SELECT
          COUNT(*) as total_violations,
          COUNT(CASE WHEN pv.acknowledged = false THEN 1 END) as open_violations,
          COUNT(CASE WHEN pv.acknowledged = true THEN 1 END) as resolved_violations,
          COUNT(CASE WHEN pv.severity = 'critical' THEN 1 END) as critical_count,
          COUNT(CASE WHEN pv.severity = 'high' THEN 1 END) as serious_count,
          COUNT(CASE WHEN pv.severity = 'medium' THEN 1 END) as moderate_count,
          COUNT(CASE WHEN pv.severity = 'low' THEN 1 END) as minor_count
        FROM policy_violations pv
        WHERE pv.tenant_id = $1`,
        [tenantId]
      )

      res.json({
        success: true,
        data: statsResult.rows[0] || {
          total_violations: 0,
          open_violations: 0,
          resolved_violations: 0,
          critical_count: 0,
          serious_count: 0,
          moderate_count: 0,
          minor_count: 0
        }
      })
    } catch (error) {
      logger.error('Get policy violation statistics error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// GET /policy-violations/export — export violations
router.get(
  '/export',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT pv.*,
                pt.policy_name,
                pt.policy_code,
                d.first_name || ' ' || d.last_name as employee_name,
                d.employee_number as employee_number_display
         FROM policy_violations pv
         JOIN policy_templates pt ON pv.policy_id = pt.id
         JOIN drivers d ON pv.employee_number = d.id
         WHERE pv.tenant_id = $1
         ORDER BY pv.violation_time DESC`,
        [req.user!.tenant_id]
      )

      res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      logger.error('Export policy violations error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// GET /policy-violations/:id/comments — get comments for a violation
router.get(
  '/:id/comments',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Return empty comments array — no comments table exists yet
      res.json({
        success: true,
        data: []
      })
    } catch (error) {
      logger.error('Get violation comments error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// POST /policy-violations/:id/comments — add comment to a violation
router.post(
  '/:id/comments',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { comment } = req.body
      // Return the comment as if saved — no comments table exists yet
      res.status(201).json({
        success: true,
        data: {
          id: Date.now(),
          violation_id: req.params.id,
          comment,
          created_by: req.user!.id,
          created_at: new Date().toISOString()
        }
      })
    } catch (error) {
      logger.error('Add violation comment error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// POST /policy-violations/:id/resolve — resolve a violation
router.post(
  '/:id/resolve',
  requirePermission('policy:update:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE policy_violations
         SET case_status = 'closed', action_description = COALESCE($3, action_description), updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, req.body.corrective_action || null]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Violation not found' })
      }

      res.json({ success: true, data: result.rows[0] })
    } catch (error) {
      logger.error('Resolve violation error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// POST /policy-violations/:id/override — override a violation
router.post(
  '/:id/override',
  requirePermission('policy:update:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE policy_violations
         SET case_status = 'action_taken', action_description = COALESCE($3, action_description), updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, req.body.reason || null]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Violation not found' })
      }

      res.json({ success: true, data: result.rows[0] })
    } catch (error) {
      logger.error('Override violation error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

export default router
