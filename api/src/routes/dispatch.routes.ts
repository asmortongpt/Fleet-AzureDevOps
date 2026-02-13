/**
 * Fleet Management - Dispatch Radio Routes
 *
 * Endpoints:
 * - GET /api/dispatch/channels - List all available dispatch channels
 * - GET /api/dispatch/channels/:id - Get channel details
 * - POST /api/dispatch/channels - Create new channel (admin)
 * - GET /api/dispatch/channels/:id/history - Get transmission history
 * - GET /api/dispatch/channels/:id/listeners - Get active listeners
 * - POST /api/dispatch/emergency - Create emergency alert
 * - GET /api/dispatch/emergency - List emergency alerts
 * - PUT /api/dispatch/emergency/:id/acknowledge - Acknowledge alert
 * - PUT /api/dispatch/emergency/:id/resolve - Resolve alert
 * - GET /api/dispatch/metrics - Get dispatch performance metrics
 * - WebSocket: /api/dispatch/ws - Real-time audio streaming
 */

import { Router, Request, Response } from 'express'

import { pool } from '../config/database';
import logger from '../config/logger';
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import webrtcService from '../services/webrtc.service'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * @openapi
 * /api/dispatch/channels:
 *   get:
 *     summary: Get all dispatch channels
 *     description: Returns list of active dispatch channels available to the user
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dispatch channels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 channels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       channelType:
 *                         type: string
 *                       priorityLevel:
 *                         type: integer
 *                       colorCode:
 *                         type: string
 */
router.get('/channels', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        channel_type,
        is_active,
        priority_level,
        color_code,
        created_at,
        updated_at,
        created_by
      FROM dispatch_channels
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY priority_level DESC, name ASC
      `,
      [tenantId]
    )

    res.json({
      success: true,
      channels: result.rows
    })
  } catch (error) {
    logger.error('Error getting dispatch channels:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get dispatch channels'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/channels/{id}:
 *   get:
 *     summary: Get channel details
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Channel details
 */
router.get('/channels/:id', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT 
      id,
      name,
      description,
      channel_type,
      is_active,
      priority_level,
      color_code,
      created_at,
      updated_at,
      created_by FROM dispatch_channels WHERE tenant_id = $1 AND id = $2 AND is_active = true`,
      [req.user?.tenant_id, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      })
    }

    res.json({
      success: true,
      channel: result.rows[0]
    })
  } catch (error) {
    logger.error('Error getting channel:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get channel'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/channels:
 *   post:
 *     summary: Create new dispatch channel (admin only)
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - channelType
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               channelType:
 *                 type: string
 *                 enum: [general, emergency, maintenance, operations]
 *               priorityLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               colorCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Channel created
 */
router.post('/channels', csrfProtection, requirePermission('route:create:fleet'), async (req: Request, res: Response) => {
  try {
    const { name, description, channelType, priorityLevel, colorCode } = req.body
    const userId = req.user?.id
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    // Validate input
    if (!name || !channelType) {
      return res.status(400).json({
        success: false,
        error: 'Name and channel type are required'
      })
    }

    const result = await pool.query(`
      INSERT INTO dispatch_channels
      (tenant_id, name, description, channel_type, priority_level, color_code, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [tenantId, name, description, channelType, priorityLevel || 5, colorCode || '#3B82F6', userId])

    res.status(201).json({
      success: true,
      channel: result.rows[0]
    })
  } catch (error) {
    logger.error('Error creating channel:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create channel'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/channels/{id}/history:
 *   get:
 *     summary: Get channel transmission history
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Transmission history
 */
router.get('/channels/:id/history', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 50

    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.channel_id,
        t.user_id,
        u.email as user_email,
        t.transmission_start,
        t.transmission_end,
        t.duration_seconds,
        t.audio_blob_url,
        t.audio_format,
        t.is_emergency,
        t.location_lat,
        t.location_lng,
        t.message,
        t.metadata,
        t.created_at
      FROM dispatch_transmissions t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.tenant_id = $1 AND t.channel_id = $2
      ORDER BY t.transmission_start DESC
      LIMIT $3
      `,
      [tenantId, id, limit]
    )

    res.json({
      success: true,
      history: result.rows
    })
  } catch (error) {
    logger.error('Error getting channel history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get channel history'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/channels/{id}/listeners:
 *   get:
 *     summary: Get active listeners on channel
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Active listeners
 */
router.get('/channels/:id/listeners', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    const result = await pool.query(
      `
      SELECT
        al.id,
        al.channel_id,
        al.user_id,
        u.email as user_email,
        al.connected_at,
        al.last_heartbeat,
        al.device_type,
        al.device_info
      FROM dispatch_active_listeners al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.tenant_id = $1
        AND al.channel_id = $2
        AND al.last_heartbeat > NOW() - INTERVAL '2 minutes'
      ORDER BY al.connected_at ASC
      `,
      [tenantId, id]
    )

    const listeners = result.rows

    res.json({
      success: true,
      listeners,
      count: listeners.length
    })
  } catch (error) {
    logger.error('Error getting listeners:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get listeners'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/emergency:
 *   post:
 *     summary: Create emergency alert
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alertType
 *             properties:
 *               vehicleId:
 *                 type: integer
 *               alertType:
 *                 type: string
 *                 enum: [panic, accident, medical, fire, security]
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Emergency alert created
 */
router.post('/emergency', csrfProtection, requirePermission('route:create:fleet'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { vehicleId, alertType, location, description } = req.body
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    if (!alertType) {
      return res.status(400).json({
        success: false,
        error: 'Alert type is required'
      })
    }

    const result = await pool.query(
      `
      INSERT INTO dispatch_emergency_alerts
      (tenant_id, user_id, vehicle_id, alert_type, alert_status, location_lat, location_lng, description)
      VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
      RETURNING *
      `,
      [tenantId, userId, vehicleId || null, alertType, location?.lat || null, location?.lng || null, description || null]
    )

    res.status(201).json({
      success: true,
      alert: result.rows[0]
    })
  } catch (error) {
    logger.error('Error creating emergency alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create emergency alert'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/emergency:
 *   get:
 *     summary: Get emergency alerts
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, acknowledged, resolved, false_alarm]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of emergency alerts
 */
router.get('/emergency', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    const status = req.query.status as string
    const limit = parseInt(req.query.limit as string) || 50

    let query = `SELECT 
      id,
      tenant_id,
      user_id,
      vehicle_id,
      alert_type,
      alert_status,
      location_lat,
      location_lng,
      location_address,
      description,
      acknowledged_by,
      acknowledged_at,
      resolved_by,
      resolved_at,
      created_at,
      updated_at FROM dispatch_emergency_alerts`
    const params: (string | number)[] = [tenantId]

    if (status) {
      params.push(status)
      query += ` WHERE tenant_id = $1 AND alert_status = $2`
    } else {
      query += ` WHERE tenant_id = $1`
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1)
    params.push(limit)

    const result = await pool.query(query, params)

    res.json({
      success: true,
      alerts: result.rows
    })
  } catch (error) {
    logger.error('Error getting emergency alerts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get emergency alerts'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/emergency/{id}/acknowledge:
 *   put:
 *     summary: Acknowledge emergency alert
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alert acknowledged
 */
router.put('/emergency/:id/acknowledge', csrfProtection, requirePermission('route:update:fleet'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    const result = await pool.query(`
      UPDATE dispatch_emergency_alerts
      SET alert_status = 'acknowledged',
          acknowledged_by = $1,
          acknowledged_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $2 AND id = $3
      RETURNING *
    `, [userId, tenantId, id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      })
    }

    res.json({
      success: true,
      alert: result.rows[0]
    })
  } catch (error) {
    logger.error('Error acknowledging alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/emergency/{id}/resolve:
 *   put:
 *     summary: Resolve emergency alert
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alert resolved
 */
router.put('/emergency/:id/resolve', csrfProtection, requirePermission('route:update:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    const result = await pool.query(`
      UPDATE dispatch_emergency_alerts
      SET alert_status = 'resolved',
          resolved_by = $1,
          resolved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $2 AND id = $3
      RETURNING *
    `, [userId, tenantId, id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      })
    }

    res.json({
      success: true,
      alert: result.rows[0]
    })
  } catch (error) {
    logger.error('Error resolving alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/metrics:
 *   get:
 *     summary: Get dispatch performance metrics
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dispatch metrics
 */
router.get('/metrics', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' })
    }

    const { startDate, endDate, channelId } = req.query

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate as string) : new Date()

    const params: (string | Date)[] = [tenantId, start, end]
    let channelFilter = ''
    if (channelId) {
      params.push(channelId)
      channelFilter = ` AND t.channel_id = $${params.length}`
    }

    const result = await pool.query(
      `
      SELECT
        DATE(t.transmission_start) AS metric_date,
        t.channel_id,
        COUNT(*)::int AS total_transmissions,
        COALESCE(SUM(t.duration_seconds), 0)::float AS total_duration_seconds,
        COUNT(*) FILTER (WHERE t.is_emergency = true)::int AS emergency_transmissions,
        COUNT(DISTINCT t.user_id)::int AS unique_users,
        NULL::float AS average_response_time_seconds,
        NULL::int AS peak_concurrent_users,
        NULL::float AS transcription_accuracy
      FROM dispatch_transmissions t
      WHERE t.tenant_id = $1
        AND t.transmission_start >= $2
        AND t.transmission_start <= $3
        ${channelFilter}
      GROUP BY DATE(t.transmission_start), t.channel_id
      ORDER BY metric_date DESC
      `,
      params
    )

    res.json({
      success: true,
      metrics: result.rows
    })
  } catch (error) {
    logger.error(`Error getting metrics:`, error)
    res.status(500).json({
      success: false,
      error: `Failed to get metrics`
    })
  }
})

/**
 * @openapi
 * /api/dispatch/webrtc/offer:
 *   post:
 *     summary: Create WebRTC offer for audio connection
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelId
 *             properties:
 *               channelId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: WebRTC offer created
 */
router.post('/webrtc/offer', csrfProtection, requirePermission(`route:create:fleet`), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { channelId, connectionId } = req.body

    const offer = await webrtcService.createOffer(
      connectionId || `webrtc-${Date.now()}`,
      userId,
      channelId
    )

    res.json({
      success: true,
      offer
    })
  } catch (error) {
    logger.error(`Error creating WebRTC offer:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to create WebRTC offer'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/webrtc/answer:
 *   post:
 *     summary: Handle WebRTC answer
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connectionId
 *               - answer
 *             properties:
 *               connectionId:
 *                 type: string
 *               answer:
 *                 type: object
 *     responses:
 *       200:
 *         description: Answer processed
 */
router.post('/webrtc/answer', csrfProtection, requirePermission('route:create:fleet'), async (req: Request, res: Response) => {
  try {
    const { connectionId, answer } = req.body

    await webrtcService.handleAnswer(connectionId, answer)

    res.json({
      success: true
    })
  } catch (error) {
    logger.error('Error handling WebRTC answer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to handle answer'
    })
  }
})

/**
 * @openapi
 * /api/dispatch/webrtc/ice-candidate:
 *   post:
 *     summary: Add ICE candidate for WebRTC connection
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connectionId
 *               - candidate
 *             properties:
 *               connectionId:
 *                 type: string
 *               candidate:
 *                 type: object
 *     responses:
 *       200:
 *         description: ICE candidate added
 */
router.post('/webrtc/ice-candidate', csrfProtection, requirePermission('route:create:fleet'), async (req: Request, res: Response) => {
  try {
    const { connectionId, candidate } = req.body

    await webrtcService.addIceCandidate(connectionId, candidate)

    res.json({
      success: true
    })
  } catch (error) {
    logger.error('Error adding ICE candidate:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add ICE candidate'
    })
  }
})

export default router
