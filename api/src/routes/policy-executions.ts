import express, { Response } from 'express'

import { pool } from '../db/connection'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/policy-executions
router.get(
  '/',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1, limit = 50, policy_id, trigger_type, execution_status,
        vehicle_id, driver_id
      } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT pe.id, pe.tenant_id, pe.policy_id, pe.trigger_type, pe.trigger_event,
                          pe.trigger_data, pe.trigger_timestamp, pe.conditions_met,
                          pe.conditions_evaluated, pe.evaluation_details,
                          pe.actions_executed, pe.action_results,
                          pe.actions_successful, pe.actions_failed,
                          pe.vehicle_id, pe.driver_id, pe.work_order_id,
                          pe.execution_status, pe.started_at, pe.completed_at,
                          pe.duration_ms, pe.error_message, pe.retry_count,
                          pe.executed_by, pe.execution_mode,
                          pe.created_at, pe.updated_at,
                          pt.policy_name, pt.policy_code
                   FROM policy_executions pe
                   JOIN policy_templates pt ON pe.policy_id = pt.id
                   WHERE pe.tenant_id = $1`
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (policy_id) {
        query += ` AND pe.policy_id = $${paramIndex}`
        params.push(policy_id)
        paramIndex++
      }

      if (trigger_type) {
        query += ` AND pe.trigger_type = $${paramIndex}`
        params.push(trigger_type)
        paramIndex++
      }

      if (execution_status) {
        query += ` AND pe.execution_status = $${paramIndex}`
        params.push(execution_status)
        paramIndex++
      }

      if (vehicle_id) {
        query += ` AND pe.vehicle_id = $${paramIndex}`
        params.push(vehicle_id)
        paramIndex++
      }

      if (driver_id) {
        query += ` AND pe.driver_id = $${paramIndex}`
        params.push(driver_id)
        paramIndex++
      }

      query += ` ORDER BY pe.started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM policy_executions WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      logger.error('Get policy executions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/policy-executions/statistics
router.get(
  '/statistics',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { policy_id } = req.query

      let whereClause = 'WHERE pe.tenant_id = $1'
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (policy_id) {
        whereClause += ` AND pe.policy_id = $${paramIndex}`
        params.push(policy_id)
        paramIndex++
      }

      const result = await pool.query(
        `SELECT
           COUNT(*)::int AS total_executions,
           COUNT(*) FILTER (WHERE pe.execution_status = 'completed')::int AS successful,
           COUNT(*) FILTER (WHERE pe.execution_status = 'failed')::int AS failed,
           COUNT(*) FILTER (WHERE pe.execution_status = 'pending')::int AS pending,
           COUNT(*) FILTER (WHERE pe.execution_status = 'running')::int AS running,
           COUNT(*) FILTER (WHERE pe.conditions_met = TRUE)::int AS conditions_met,
           AVG(pe.duration_ms)::int AS avg_duration_ms,
           SUM(pe.actions_successful)::int AS total_actions_successful,
           SUM(pe.actions_failed)::int AS total_actions_failed,
           MAX(pe.started_at) AS last_execution
         FROM policy_executions pe
         ${whereClause}`,
        params
      )

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get policy execution statistics error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/policy-executions/:id
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT pe.id, pe.tenant_id, pe.policy_id, pe.trigger_type, pe.trigger_event,
                pe.trigger_data, pe.trigger_timestamp, pe.conditions_met,
                pe.conditions_evaluated, pe.evaluation_details,
                pe.actions_executed, pe.action_results,
                pe.actions_successful, pe.actions_failed,
                pe.vehicle_id, pe.driver_id, pe.work_order_id,
                pe.execution_status, pe.started_at, pe.completed_at,
                pe.duration_ms, pe.error_message, pe.retry_count,
                pe.executed_by, pe.execution_mode,
                pe.created_at, pe.updated_at,
                pt.policy_name, pt.policy_code
         FROM policy_executions pe
         JOIN policy_templates pt ON pe.policy_id = pt.id
         WHERE pe.id = $1 AND pe.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policy execution not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get policy execution error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
