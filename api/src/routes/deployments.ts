import express, { Response } from 'express'
import pool from '../config/database'
import { createAuditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()
router.use(authenticateJWT)

/**
 * GET /api/deployments
 * Get deployment history with optional filtering
 */
router.get('/',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { environment, status, limit = 20 } = req.query

    let query = `
      SELECT
        d.*,
        u.first_name || ' ' || u.last_name as deployed_by_name,
        (
          SELECT json_agg(json_build_object(
            'gate_type', qg.gate_type,
            'status', qg.status,
            'execution_time_seconds', qg.execution_time_seconds
          ))
          FROM quality_gates qg
          WHERE qg.deployment_id = d.id
        ) as quality_gates
      FROM deployments d
      LEFT JOIN users u ON d.deployed_by_user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 1

    if (environment) {
      query += ` AND d.environment = $${paramCount}`
      params.push(environment)
      paramCount++
    }

    if (status) {
      query += ` AND d.status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    query += ` ORDER BY d.started_at DESC LIMIT $${paramCount}`
    params.push(limit)

    const result = await pool.query(query, params)

    res.json({
      deployments: result.rows,
      total: result.rows.length
    })
  } catch (error: any) {
    console.error('Error fetching deployments:', error)
    res.status(500).json({ error: 'Failed to fetch deployments', message: getErrorMessage(error) })
  }
})

/**
 * POST /api/deployments
 * Create a new deployment record
 */
router.post('/',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const {
      tenant_id,
      environment,
      version,
      commit_hash,
      branch,
      deployed_by_user_id,
      deployment_notes,
      metadata = {}
    } = req.body

    // Validate required fields
    if (!environment) {
      return res.status(400).json({ error: 'environment is required' })
    }

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production']
    if (!validEnvironments.includes(environment)) {
      return res.status(400).json({
        error: 'Invalid environment',
        valid_environments: validEnvironments
      })
    }

    const result = await pool.query(
      `INSERT INTO deployments (
        tenant_id, environment, version, commit_hash, branch,
        deployed_by_user_id, status, deployment_notes, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
      RETURNING *`,
      [
        tenant_id,
        environment,
        version,
        commit_hash,
        branch,
        deployed_by_user_id,
        deployment_notes,
        JSON.stringify(metadata)
      ]
    )

    // Create audit log
    if (req.user?.id) {
      await createAuditLog(
        req.user.tenant_id || null,
        req.user.id,
        'CREATE',
        'deployment',
        result.rows[0].id,
        { environment, version, commit_hash },
        req.ip || null,
        req.get('user-agent') || null,
        'success'
      )
    }

    res.status(201).json(result.rows[0])
  } catch (error: any) {
    console.error('Error creating deployment:', error)
    res.status(500).json({ error: 'Failed to create deployment', message: getErrorMessage(error) })
  }
})

/**
 * PATCH /api/deployments/:id
 * Update deployment status
 */
router.patch('/:id',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status, completed_at, quality_gate_summary } = req.body

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'rolled_back']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        valid_statuses: validStatuses
      })
    }

    let updateQuery = 'UPDATE deployments SET updated_at = NOW()'
    const params: any[] = []
    let paramCount = 1

    if (status) {
      updateQuery += `, status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    if (completed_at !== undefined) {
      updateQuery += `, completed_at = $${paramCount}`
      params.push(completed_at)
      paramCount++
    }

    if (quality_gate_summary) {
      updateQuery += `, quality_gate_summary = $${paramCount}`
      params.push(JSON.stringify(quality_gate_summary))
      paramCount++
    }

    updateQuery += ` WHERE id = $${paramCount} RETURNING *`
    params.push(id)

    const result = await pool.query(updateQuery, params)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' })
    }

    // Create audit log
    if (req.user?.id) {
      await createAuditLog(
        req.user.tenant_id || null,
        req.user.id,
        'UPDATE',
        'deployment',
        id,
        { status, completed_at },
        req.ip || null,
        req.get('user-agent') || null,
        'success'
      )
    }

    res.json(result.rows[0])
  } catch (error: any) {
    console.error('Error updating deployment:', error)
    res.status(500).json({ error: 'Failed to update deployment', message: getErrorMessage(error) })
  }
})

/**
 * GET /api/deployments/:id
 * Get specific deployment with all quality gate results
 */
router.get('/:id',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const deploymentResult = await pool.query(
      `SELECT
        d.*,
        u.first_name || ' ' || u.last_name as deployed_by_name
      FROM deployments d
      LEFT JOIN users u ON d.deployed_by_user_id = u.id
      WHERE d.id = $1`,
      [id]
    )

    if (deploymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' })
    }

    const qualityGatesResult = await pool.query(
      `SELECT id, tenant_id, name, description, criteria, threshold, metric_type, is_active, created_at, updated_at FROM quality_gates
      WHERE deployment_id = $1
      ORDER BY executed_at ASC`,
      [id]
    )

    res.json({
      ...deploymentResult.rows[0],
      quality_gates: qualityGatesResult.rows
    })
  } catch (error: any) {
    console.error('Error fetching deployment:', error)
    res.status(500).json({ error: 'Failed to fetch deployment', message: getErrorMessage(error) })
  }
})

/**
 * GET /api/deployments/stats/summary
 * Get deployment statistics
 */
router.get('/stats/summary',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query

    // Validate and sanitize days parameter
    const daysNum = Math.max(1, Math.min(365, parseInt(days as string) || 30))

    const result = await pool.query(
      `SELECT
        environment,
        COUNT(*) as total_deployments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'rolled_back' THEN 1 END) as rolled_back,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60), 2) as avg_duration_minutes
      FROM deployments
      WHERE started_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY environment
      ORDER BY environment`,
      [daysNum]
    )

    res.json({
      stats: result.rows,
      period_days: days
    })
  } catch (error: any) {
    console.error('Error fetching deployment stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats', message: getErrorMessage(error) })
  }
})

export default router
