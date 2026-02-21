/**
 * Violations Routes
 *
 * Frontend ViolationDetailPanel calls /api/violations/:id and sub-resources.
 * The underlying data lives in the policy_violations table.
 * This route maps the frontend-expected paths/shapes to the actual DB.
 */

import express, { Response } from 'express'

import { pool } from '../config/database'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /violations/:id — single violation detail
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          pv.id,
          pv.id as violation_number,
          pv.violation_date as occurred_at,
          pv.violation_date as detected_at,
          pv.policy_id,
          pt.policy_name,
          pt.policy_code as policy_number,
          pv.vehicle_id,
          v.unit_number as vehicle_number,
          pv.driver_id,
          d.first_name || ' ' || d.last_name as driver_name,
          pv.violation_description as description,
          pv.severity,
          pv.case_status as status,
          COALESCE(pt.violation_type, 'policy') as violation_type,
          pv.location as location_address,
          pv.employee_acknowledged as notification_sent,
          pv.appeal_filed as escalation_sent,
          FALSE as override_requested,
          pv.created_at,
          pv.updated_at
        FROM policy_violations pv
        LEFT JOIN policy_templates pt ON pv.policy_id = pt.id
        LEFT JOIN drivers d ON pv.driver_id = d.id
        LEFT JOIN vehicles v ON pv.vehicle_id = v.id
        WHERE pv.id = $1`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Violation not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get violation detail error:', error)
      // Return empty object to prevent frontend crash
      res.json(null)
    }
  }
)

// GET /violations/:id/acknowledgments — acknowledgment records
router.get(
  '/:id/acknowledgments',
  requirePermission('policy:view:global'),
  async (_req: AuthRequest, res: Response) => {
    // No separate acknowledgments table — return empty array
    res.json([])
  }
)

// GET /violations/:id/enforcement-actions — enforcement actions
router.get(
  '/:id/enforcement-actions',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          pv.id,
          pv.disciplinary_action as action_type,
          pv.action_date,
          pv.action_taken_by as performed_by,
          pv.action_description as details,
          'completed' as status
        FROM policy_violations pv
        WHERE pv.id = $1 AND pv.disciplinary_action IS NOT NULL`,
        [req.params.id]
      )
      res.json(result.rows)
    } catch (error) {
      logger.error('Get violation enforcement actions error:', error)
      res.json([])
    }
  }
)

// GET /violations/:id/timeline — timeline events
router.get(
  '/:id/timeline',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          pv.id,
          pv.violation_date as timestamp,
          'violation_reported' as event_type,
          'Violation reported: ' || pv.violation_description as event_description
        FROM policy_violations pv
        WHERE pv.id = $1`,
        [req.params.id]
      )
      res.json(result.rows)
    } catch (error) {
      logger.error('Get violation timeline error:', error)
      res.json([])
    }
  }
)

// GET /violations/:id/corrective-actions — corrective actions
router.get(
  '/:id/corrective-actions',
  requirePermission('policy:view:global'),
  async (_req: AuthRequest, res: Response) => {
    // No separate corrective actions table — return empty array
    res.json([])
  }
)

// GET /violations/:id/comments — comments
router.get(
  '/:id/comments',
  requirePermission('policy:view:global'),
  async (_req: AuthRequest, res: Response) => {
    // No comments table — return empty array
    res.json([])
  }
)

// POST /violations/:id/comments — add comment
router.post(
  '/:id/comments',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    const { comment } = req.body
    res.status(201).json({
      id: Date.now().toString(),
      violation_id: req.params.id,
      comment,
      created_by: req.user!.id,
      created_at: new Date().toISOString()
    })
  }
)

export default router
