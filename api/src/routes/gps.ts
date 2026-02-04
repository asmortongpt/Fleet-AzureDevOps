/**
 * GPS Routes API
 * Provides endpoints for GPS tracking, position history, and geofencing
 */


import { Router, Request, Response } from 'express'

import logger from '../config/logger'; // Wave 17: Add Winston logger
import { pool } from '../db/connection'
import { csrfProtection } from '../middleware/csrf'
import { AuthRequest, authenticateJWT } from '../middleware/auth'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * GET /api/gps
 * Get current positions for all vehicles with optional filters and pagination
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      minLat,
      maxLat,
      minLng,
      maxLng,
      page = '1',
      limit = '50'
    } = req.query

    const tenantId = req.user?.tenant_id
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    const conditions: string[] = ['l.tenant_id = $1']
    const params: any[] = [tenantId]
    let paramIndex = 2

    if (minLat && maxLat && minLng && maxLng) {
      conditions.push(`l.latitude BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
      params.push(parseFloat(minLat as string), parseFloat(maxLat as string))
      paramIndex += 2
      conditions.push(`l.longitude BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
      params.push(parseFloat(minLng as string), parseFloat(maxLng as string))
      paramIndex += 2
    }

    const statusFilter = ['moving', 'idle', 'stopped'].includes(String(status))
      ? String(status)
      : null
    if (statusFilter) {
      conditions.push(`(CASE
        WHEN l.speed >= 5 THEN 'moving'
        WHEN l.speed >= 1 THEN 'idle'
        ELSE 'stopped'
      END) = $${paramIndex}`)
      params.push(statusFilter)
      paramIndex += 1
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const dataQuery = `
      WITH latest AS (
        SELECT DISTINCT ON (gt.vehicle_id) gt.*
        FROM gps_tracks gt
        WHERE gt.tenant_id = $1
        ORDER BY gt.vehicle_id, gt.timestamp DESC
      )
      SELECT
        l.*,
        v.number as vehicle_number,
        v.name as vehicle_name,
        v.status as vehicle_status,
        CASE
          WHEN l.speed >= 5 THEN 'moving'
          WHEN l.speed >= 1 THEN 'idle'
          ELSE 'stopped'
        END as motion_status
      FROM latest l
      JOIN vehicles v ON v.id = l.vehicle_id
      ${whereClause}
      ORDER BY l.timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const countQuery = `
      WITH latest AS (
        SELECT DISTINCT ON (gt.vehicle_id) gt.*
        FROM gps_tracks gt
        WHERE gt.tenant_id = $1
        ORDER BY gt.vehicle_id, gt.timestamp DESC
      )
      SELECT COUNT(*) as total
      FROM latest l
      JOIN vehicles v ON v.id = l.vehicle_id
      ${whereClause}
    `

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...params, limitNum, offset]),
      pool.query(countQuery, params)
    ])

    const total = parseInt(countResult.rows[0]?.total || '0', 10)

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    logger.error('Error getting GPS positions:', error) // Wave 17: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve GPS positions'
    })
  }
})

/**
 * GET /api/gps/facilities
 * Get all facilities/geofences
 */
router.get('/facilities', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, address, latitude, longitude, type, status
       FROM facilities
       WHERE tenant_id = $1
       ORDER BY name ASC`,
      [req.user?.tenant_id]
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    logger.error('Error getting facilities:', error) // Wave 17: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve facilities'
    })
  }
})

/**
 * GET /api/gps/geofence/alerts
 * Get geofencing alerts with optional filters
 */
router.get('/geofence/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, startDate, endDate } = req.query
    const params: any[] = [req.user?.tenant_id]
    let whereClause = 'WHERE tenant_id = $1 AND (alert_type = \'geofence\' OR (metadata->>\'category\') = \'geofence\')'

    if (vehicleId) {
      params.push(vehicleId)
      whereClause += ` AND vehicle_id = $${params.length}`
    }

    if (startDate) {
      params.push(new Date(startDate as string))
      whereClause += ` AND created_at >= $${params.length}`
    }

    if (endDate) {
      params.push(new Date(endDate as string))
      whereClause += ` AND created_at <= $${params.length}`
    }

    const result = await pool.query(
      `SELECT id, alert_type, severity, title, description, vehicle_id, driver_id, created_at, metadata
       FROM alerts
       ${whereClause}
       ORDER BY created_at DESC`,
      params
    )

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    logger.error('Error getting geofence alerts:', error) // Wave 17: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve geofence alerts'
    })
  }
})

/**
 * GET /api/gps/:vehicleId
 * Get current position for specific vehicle
 */
router.get('/:vehicleId', async (req: AuthRequest, res: Response) => {
  try {
    const vehicleId = req.params.vehicleId

    const result = await pool.query(
      `SELECT
         gt.*,
         v.number as vehicle_number,
         v.name as vehicle_name,
         v.status as vehicle_status,
         CASE
           WHEN gt.speed >= 5 THEN 'moving'
           WHEN gt.speed >= 1 THEN 'idle'
           ELSE 'stopped'
         END as motion_status
       FROM gps_tracks gt
       JOIN vehicles v ON v.id = gt.vehicle_id
       WHERE gt.vehicle_id = $1 AND gt.tenant_id = $2
       ORDER BY gt.timestamp DESC
       LIMIT 1`,
      [vehicleId, req.user?.tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle position not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    logger.error('Error getting vehicle position:', error) // Wave 17: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve vehicle position'
    })
  }
})

/**
 * GET /api/gps/:vehicleId/history
 * Get route history (breadcrumbs) for specific vehicle
 */
router.get('/:vehicleId/history', async (req: AuthRequest, res: Response) => {
  try {
    const vehicleId = req.params.vehicleId
    const { limit = 100 } = req.query

    const result = await pool.query(
      `SELECT
         id, tenant_id, vehicle_id, timestamp, latitude, longitude, speed, heading, odometer, fuel_level, engine_status, metadata
       FROM gps_tracks
       WHERE vehicle_id = $1 AND tenant_id = $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      [vehicleId, req.user?.tenant_id, Number(limit)]
    )

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    logger.error('Error getting vehicle history:', error) // Wave 17: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve vehicle history'
    })
  }
})

/**
 * POST /api/gps/start
 * Start GPS emulation (for testing/demo purposes)
 */
router.post('/start',csrfProtection, (req: Request, res: Response) => {
  try {
    gpsEmulator.start()

    res.json({
      success: true,
      message: 'GPS emulation started'
    })
  } catch (error) {
    logger.error('Error starting GPS emulation:', error) // Wave 17: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to start GPS emulation'
    })
  }
})

/**
 * POST /api/gps/stop
 * Stop GPS emulation (for testing/demo purposes)
 */
router.post('/stop',csrfProtection, (req: Request, res: Response) => {
  try {
    gpsEmulator.stop()

    res.json({
      success: true,
      message: 'GPS emulation stopped'
    })
  } catch (error) {
    logger.error('Error stopping GPS emulation:', error) // Wave 17: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to stop GPS emulation'
    })
  }
})

export default router
