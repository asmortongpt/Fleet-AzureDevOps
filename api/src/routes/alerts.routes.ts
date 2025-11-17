/**
 * Alert & Notification Routes
 * Centralized alert system for proactive fleet management
 *
 * Features:
 * - Alert listing and filtering
 * - Alert acknowledgment and resolution
 * - Alert rules management
 * - Alert statistics for dashboard
 * - Multi-channel notification delivery
 */

import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth'
import pool from '../config/database'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import alertEngine from '../services/alert-engine.service'

const router = Router()
router.use(authenticateJWT)

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     summary: Get user's alerts
 *     description: Retrieve alerts with optional filtering by status, severity, and date range
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, acknowledged, resolved]
 *         description: Filter by alert status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, critical, emergency]
 *         description: Filter by severity level
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of alerts to return
 *     responses:
 *       200:
 *         description: List of alerts
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { status, severity, from_date, to_date, limit = 50 } = req.query
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    let query = `
      SELECT
        a.*,
        u_ack.first_name || ' ' || u_ack.last_name as acknowledged_by_name,
        u_res.first_name || ' ' || u_res.last_name as resolved_by_name
      FROM alerts a
      LEFT JOIN users u_ack ON a.acknowledged_by = u_ack.id
      LEFT JOIN users u_res ON a.resolved_by = u_res.id
      WHERE a.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (status) {
      paramCount++
      query += ` AND a.status = $${paramCount}`
      params.push(status)
    }

    if (severity) {
      paramCount++
      query += ` AND a.severity = $${paramCount}`
      params.push(severity)
    }

    if (from_date) {
      paramCount++
      query += ` AND a.created_at >= $${paramCount}`
      params.push(from_date)
    }

    if (to_date) {
      paramCount++
      query += ` AND a.created_at <= $${paramCount}`
      params.push(to_date)
    }

    query += ` ORDER BY
      CASE a.severity
        WHEN 'emergency' THEN 1
        WHEN 'critical' THEN 2
        WHEN 'warning' THEN 3
        WHEN 'info' THEN 4
      END,
      a.created_at DESC
      LIMIT $${paramCount + 1}`
    params.push(limit)

    const result = await pool.query(query, params)

    res.json({
      alerts: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

/**
 * @openapi
 * /api/alerts/stats:
 *   get:
 *     summary: Get alert statistics
 *     description: Retrieve alert statistics for dashboard display
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const [statusCounts, severityCounts, recentAlerts, trends] = await Promise.all([
      // Status breakdown
      pool.query(
        `SELECT status, COUNT(*) as count
         FROM alerts
         WHERE tenant_id = $1
         GROUP BY status`,
        [tenantId]
      ),
      // Severity breakdown
      pool.query(
        `SELECT severity, COUNT(*) as count
         FROM alerts
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY severity`,
        [tenantId]
      ),
      // Recent unacknowledged alerts
      pool.query(
        `SELECT COUNT(*) as count
         FROM alerts
         WHERE tenant_id = $1
         AND status IN ('pending', 'sent')
         AND severity IN ('critical', 'emergency')`,
        [tenantId]
      ),
      // 7-day trend
      pool.query(
        `SELECT
           DATE(created_at) as date,
           COUNT(*) as count,
           COUNT(*) FILTER (WHERE severity IN ('critical', 'emergency')) as critical_count
         FROM alerts
         WHERE tenant_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [tenantId]
      )
    ])

    res.json({
      by_status: statusCounts.rows,
      by_severity: severityCounts.rows,
      unacknowledged_critical: parseInt(recentAlerts.rows[0]?.count || '0'),
      trend_7_days: trends.rows
    })
  } catch (error) {
    console.error('Error fetching alert stats:', error)
    res.status(500).json({ error: 'Failed to fetch alert statistics' })
  }
})

/**
 * @openapi
 * /api/alerts/{id}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     description: Mark an alert as acknowledged by the current user
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.post('/:id/acknowledge', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const tenantId = req.user?.tenant_id

    const result = await pool.query(
      `UPDATE alerts
       SET status = 'acknowledged',
           acknowledged_at = NOW(),
           acknowledged_by = $1,
           updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [userId, id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' })
    }

    res.json({
      alert: result.rows[0],
      message: 'Alert acknowledged successfully'
    })
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    res.status(500).json({ error: 'Failed to acknowledge alert' })
  }
})

/**
 * @openapi
 * /api/alerts/{id}/resolve:
 *   post:
 *     summary: Resolve an alert
 *     description: Mark an alert as resolved with optional resolution notes
 *     tags:
 *       - Alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution_notes:
 *                 type: string
 *                 description: Notes about how the alert was resolved
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.post('/:id/resolve', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { resolution_notes } = req.body
    const userId = req.user?.id
    const tenantId = req.user?.tenant_id

    const result = await pool.query(
      `UPDATE alerts
       SET status = 'resolved',
           resolved_at = NOW(),
           resolved_by = $1,
           resolution_notes = $2,
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [userId, resolution_notes, id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' })
    }

    res.json({
      alert: result.rows[0],
      message: 'Alert resolved successfully'
    })
  } catch (error) {
    console.error('Error resolving alert:', error)
    res.status(500).json({ error: 'Failed to resolve alert' })
  }
})

/**
 * @openapi
 * /api/alert-rules:
 *   get:
 *     summary: Get alert rules
 *     description: Retrieve all alert rules for the tenant
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of alert rules
 *       500:
 *         description: Server error
 */
router.get('/rules', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const result = await pool.query(
      `SELECT
         ar.*,
         u.first_name || ' ' || u.last_name as created_by_name
       FROM alert_rules ar
       LEFT JOIN users u ON ar.created_by = u.id
       WHERE ar.tenant_id = $1
       ORDER BY ar.created_at DESC`,
      [tenantId]
    )

    res.json({
      rules: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching alert rules:', error)
    res.status(500).json({ error: 'Failed to fetch alert rules' })
  }
})

/**
 * @openapi
 * /api/alert-rules:
 *   post:
 *     summary: Create alert rule
 *     description: Create a new alert rule
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rule_name
 *               - rule_type
 *               - conditions
 *               - severity
 *             properties:
 *               rule_name:
 *                 type: string
 *               rule_type:
 *                 type: string
 *               conditions:
 *                 type: object
 *               severity:
 *                 type: string
 *                 enum: [info, warning, critical, emergency]
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_enabled:
 *                 type: boolean
 *               cooldown_minutes:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Alert rule created successfully
 *       500:
 *         description: Server error
 */
router.post('/rules', requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  try {
    const {
      rule_name,
      rule_type,
      conditions,
      severity,
      channels,
      recipients,
      is_enabled,
      cooldown_minutes
    } = req.body

    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const result = await pool.query(
      `INSERT INTO alert_rules (
        tenant_id, rule_name, rule_type, conditions, severity,
        channels, recipients, is_enabled, cooldown_minutes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tenantId,
        rule_name,
        rule_type,
        JSON.stringify(conditions),
        severity,
        channels || ['in_app'],
        recipients || [],
        is_enabled !== false,
        cooldown_minutes || 60,
        userId
      ]
    )

    res.status(201).json({
      rule: result.rows[0],
      message: 'Alert rule created successfully'
    })
  } catch (error) {
    console.error('Error creating alert rule:', error)
    res.status(500).json({ error: 'Failed to create alert rule' })
  }
})

/**
 * @openapi
 * /api/alert-rules/{id}:
 *   put:
 *     summary: Update alert rule
 *     description: Update an existing alert rule
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert rule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Alert rule updated successfully
 *       404:
 *         description: Alert rule not found
 *       500:
 *         description: Server error
 */
router.put('/rules/:id', requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const tenantId = req.user?.tenant_id

    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    const allowedFields = [
      'rule_name', 'rule_type', 'conditions', 'severity',
      'channels', 'recipients', 'is_enabled', 'cooldown_minutes'
    ]

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        setClauses.push(`${key} = $${paramCount}`)
        // Stringify objects for JSONB fields
        if (key === 'conditions') {
          values.push(JSON.stringify(updates[key]))
        } else {
          values.push(updates[key])
        }
        paramCount++
      }
    })

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    setClauses.push(`updated_at = NOW()`)
    values.push(id, tenantId)

    const result = await pool.query(
      `UPDATE alert_rules
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert rule not found' })
    }

    res.json({
      rule: result.rows[0],
      message: 'Alert rule updated successfully'
    })
  } catch (error) {
    console.error('Error updating alert rule:', error)
    res.status(500).json({ error: 'Failed to update alert rule' })
  }
})

/**
 * @openapi
 * /api/alert-rules/{id}:
 *   delete:
 *     summary: Delete alert rule
 *     description: Delete an alert rule
 *     tags:
 *       - Alert Rules
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert rule ID
 *     responses:
 *       200:
 *         description: Alert rule deleted successfully
 *       404:
 *         description: Alert rule not found
 *       500:
 *         description: Server error
 */
router.delete('/rules/:id', requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    const result = await pool.query(
      `DELETE FROM alert_rules
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert rule not found' })
    }

    res.json({
      message: 'Alert rule deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting alert rule:', error)
    res.status(500).json({ error: 'Failed to delete alert rule' })
  }
})

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve in-app notifications for the current user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of notifications to return
 *     responses:
 *       200:
 *         description: List of notifications
 *       500:
 *         description: Server error
 */
router.get('/notifications', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { is_read, limit = 50 } = req.query
    const userId = req.user?.id
    const tenantId = req.user?.tenant_id

    let query = `
      SELECT
        n.*,
        a.status as alert_status
      FROM notifications n
      LEFT JOIN alerts a ON n.alert_id = a.id
      WHERE n.user_id = $1 AND n.tenant_id = $2
    `

    const params: any[] = [userId, tenantId]
    let paramCount = 2

    if (is_read !== undefined) {
      paramCount++
      query += ` AND n.is_read = $${paramCount}`
      params.push(is_read === 'true')
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount + 1}`
    params.push(limit)

    const result = await pool.query(query, params)

    res.json({
      notifications: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Mark a notification as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.post('/notifications/:id/read', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({
      notification: result.rows[0],
      message: 'Notification marked as read'
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

/**
 * @openapi
 * /api/notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     description: Mark all notifications for the current user as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       500:
 *         description: Server error
 */
router.post('/notifications/read-all', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false
       RETURNING id`,
      [userId]
    )

    res.json({
      message: 'All notifications marked as read',
      count: result.rows.length
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

export default router
