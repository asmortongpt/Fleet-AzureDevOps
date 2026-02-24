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
          pv.employee_number as driver_id,
          d.first_name || ' ' || d.last_name as driver_name,
          pv.violation_description as description,
          pv.severity,
          pv.case_status as status,
          COALESCE(pt.policy_category, 'policy') as violation_type,
          pv.location as location_address,
          pv.employee_acknowledged as notification_sent,
          pv.appeal_filed as escalation_sent,
          FALSE as override_requested,
          pv.created_at,
          pv.updated_at
        FROM policy_violations pv
        LEFT JOIN policy_templates pt ON pv.policy_id = pt.id
        LEFT JOIN drivers d ON pv.employee_number = d.id
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
      res.json(null)
    }
  }
)

// GET /violations/:id/acknowledgments — acknowledgment records from policy_violations
router.get(
  '/:id/acknowledgments',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          pv.id,
          pv.employee_acknowledged as acknowledged,
          pv.employee_acknowledged_date as acknowledged_date,
          pv.employee_statement as statement,
          pv.employee_signature as signature,
          pv.employee_number as driver_id,
          d.first_name || ' ' || d.last_name as acknowledger_name
        FROM policy_violations pv
        LEFT JOIN drivers d ON pv.employee_number = d.id
        WHERE pv.id = $1 AND pv.employee_acknowledged = true`,
        [req.params.id]
      )
      res.json(result.rows)
    } catch (error) {
      logger.error('Get violation acknowledgments error:', error)
      res.json([])
    }
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

// GET /violations/:id/corrective-actions — corrective action records from policy_violations
router.get(
  '/:id/corrective-actions',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          pv.id,
          pv.training_required,
          pv.training_completed,
          pv.training_completion_date,
          pv.disciplinary_action,
          pv.action_description,
          pv.action_date,
          pv.action_taken_by
        FROM policy_violations pv
        WHERE pv.id = $1
          AND (pv.training_required = true OR pv.disciplinary_action IS NOT NULL)`,
        [req.params.id]
      )
      res.json(result.rows)
    } catch (error) {
      logger.error('Get violation corrective actions error:', error)
      res.json([])
    }
  }
)

// GET /violations/:id/comments — comments stored in JSONB column
router.get(
  '/:id/comments',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT COALESCE(comments, '[]'::jsonb) as comments
        FROM policy_violations
        WHERE id = $1`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.json([])
      }

      res.json(result.rows[0].comments)
    } catch (error) {
      logger.error('Get violation comments error:', error)
      res.json([])
    }
  }
)

// POST /violations/:id/comments — append comment to JSONB array
router.post(
  '/:id/comments',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { comment } = req.body
      const violationId = req.params.id
      const userId = req.user!.id

      const newComment = {
        id: undefined as string | undefined,
        violation_id: violationId,
        comment,
        created_by: userId,
        created_at: new Date().toISOString()
      }

      // Generate a real UUID via the database
      const uuidResult = await pool.query(`SELECT gen_random_uuid() as id`)
      newComment.id = uuidResult.rows[0].id

      // Append to JSONB comments array
      const result = await pool.query(
        `UPDATE policy_violations
        SET comments = COALESCE(comments, '[]'::jsonb) || $2::jsonb
        WHERE id = $1
        RETURNING comments`,
        [violationId, JSON.stringify(newComment)]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Violation not found' })
      }

      res.status(201).json(newComment)
    } catch (error) {
      logger.error('Add violation comment error:', error)
      res.status(500).json({ success: false, error: 'Failed to add comment' })
    }
  }
)

export default router
