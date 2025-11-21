import express, { Response } from 'express'
import pool from '../config/database'
import { createAuditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()
router.use(authenticateJWT)

/**
 * GET /api/quality-gates
 * Get quality gate results with optional filtering
 */
router.get('/',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { deployment_id, status, gate_type, limit = 50 } = req.query

    let query = `
      SELECT
        qg.*,
        d.environment,
        d.version,
        d.deployed_by_user_id,
        u.first_name || ' ' || u.last_name as executed_by_name
      FROM quality_gates qg
      LEFT JOIN deployments d ON qg.deployment_id = d.id
      LEFT JOIN users u ON qg.executed_by_user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 1

    if (deployment_id) {
      query += ` AND qg.deployment_id = $${paramCount}`
      params.push(deployment_id)
      paramCount++
    }

    if (status) {
      query += ` AND qg.status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    if (gate_type) {
      query += ` AND qg.gate_type = $${paramCount}`
      params.push(gate_type)
      paramCount++
    }

    query += ` ORDER BY qg.executed_at DESC LIMIT $${paramCount}`
    params.push(limit)

    const result = await pool.query(query, params)

    res.json({
      quality_gates: result.rows,
      total: result.rows.length
    })
  } catch (error: any) {
    console.error('Error fetching quality gates:', error)
    res.status(500).json({ error: 'Failed to fetch quality gates', message: getErrorMessage(error) })
  }
})

/**
 * POST /api/quality-gates
 * Create a new quality gate result
 */
router.post('/',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const {
      deployment_id,
      gate_type,
      status,
      result_data = {},
      error_message,
      execution_time_seconds,
      executed_by_user_id,
      metadata = {}
    } = req.body

    // Validate required fields
    if (!gate_type || !status) {
      return res.status(400).json({ error: 'gate_type and status are required' })
    }

    // Validate gate_type
    const validGateTypes = [
      'unit_tests',
      'integration_tests',
      'e2e_tests',
      'security_scan',
      'performance',
      'accessibility',
      'code_coverage',
      'linting',
      'type_check'
    ]
    if (!validGateTypes.includes(gate_type)) {
      return res.status(400).json({
        error: 'Invalid gate_type',
        valid_types: validGateTypes
      })
    }

    // Validate status
    const validStatuses = ['pending', 'running', 'passed', 'failed', 'skipped']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        valid_statuses: validStatuses
      })
    }

    const result = await pool.query(
      `INSERT INTO quality_gates (
        deployment_id, gate_type, status, result_data, error_message,
        execution_time_seconds, executed_by_user_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        deployment_id,
        gate_type,
        status,
        JSON.stringify(result_data),
        error_message,
        execution_time_seconds,
        executed_by_user_id,
        JSON.stringify(metadata)
      ]
    )

    // Create audit log
    if (req.user?.id) {
      await createAuditLog(
        req.user.tenant_id || null,
        req.user.id,
        'CREATE',
        'quality_gate',
        result.rows[0].id,
        { gate_type, status },
        req.ip || null,
        req.get('user-agent') || null,
        'success'
      )
    }

    res.status(201).json(result.rows[0])
  } catch (error: any) {
    console.error('Error creating quality gate:', error)
    res.status(500).json({ error: 'Failed to create quality gate', message: getErrorMessage(error) })
  }
})

/**
 * GET /api/quality-gates/summary
 * Get aggregated quality gate summary statistics
 */
router.get('/summary',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { days = 7 } = req.query

    // Validate and sanitize days parameter
    const daysNum = Math.max(1, Math.min(365, parseInt(days as string) || 7))

    const result = await pool.query(
      `SELECT
        gate_type,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'passed' THEN 1 END) as passed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped,
        ROUND(AVG(execution_time_seconds), 2) as avg_execution_time,
        MAX(executed_at) as last_run
      FROM quality_gates
      WHERE executed_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY gate_type
      ORDER BY gate_type`,
      [daysNum]
    )

    res.json({
      summary: result.rows,
      period_days: days
    })
  } catch (error: any) {
    console.error('Error fetching quality gate summary:', error)
    res.status(500).json({ error: 'Failed to fetch summary', message: getErrorMessage(error) })
  }
})

/**
 * GET /api/quality-gates/latest/:gate_type
 * Get latest result for a specific gate type
 */
router.get('/latest/:gate_type',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { gate_type } = req.params

    const result = await pool.query(
      `SELECT * FROM quality_gates
      WHERE gate_type = $1
      ORDER BY executed_at DESC
      LIMIT 1`,
      [gate_type]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No results found for this gate type' })
    }

    res.json(result.rows[0])
  } catch (error: any) {
    console.error('Error fetching latest quality gate:', error)
    res.status(500).json({ error: 'Failed to fetch quality gate', message: getErrorMessage(error) })
  }
})

export default router
