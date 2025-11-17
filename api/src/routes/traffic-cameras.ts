import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { pool } from '../config/database'
import { logger } from '../config/logger'
import { cameraSyncService } from '../services/camera-sync'

const router = express.Router()

// All routes require authentication
router.use(authenticateJWT)

/**
 * GET /api/traffic-cameras
 * Get all traffic cameras
 */
router.get('/', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, source_id, limit = 1000, offset = 0 } = req.query

    let query = `
      SELECT
        tc.*,
        cds.name as source_name,
        cds.source_type
      FROM traffic_cameras tc
      LEFT JOIN camera_data_sources cds ON tc.source_id = cds.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 1

    if (enabled !== undefined) {
      query += ` AND tc.enabled = $${paramCount++}`
      params.push(enabled === 'true')
    }

    if (source_id) {
      query += ` AND tc.source_id = $${paramCount++}`
      params.push(source_id)
    }

    query += ` ORDER BY tc.name ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    res.json({
      success: true,
      cameras: result.rows,
      count: result.rows.length
    })
  } catch (error: any) {
    logger.error('Failed to fetch traffic cameras', { error: error.message })
    res.status(500).json({ error: 'Failed to fetch cameras' })
  }
})

/**
 * GET /api/traffic-cameras/:id
 * Get specific traffic camera
 */
router.get('/:id', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `SELECT
        tc.*,
        cds.name as source_name,
        cds.source_type,
        cds.service_url
      FROM traffic_cameras tc
      LEFT JOIN camera_data_sources cds ON tc.source_id = cds.id
      WHERE tc.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camera not found' })
    }

    res.json({
      success: true,
      camera: result.rows[0]
    })
  } catch (error: any) {
    logger.error('Failed to fetch traffic camera', {
      error: error.message,
      cameraId: id
    })
    res.status(500).json({ error: 'Failed to fetch camera' })
  }
})

/**
 * GET /api/traffic-cameras/sources/list
 * Get all camera data sources
 */
router.get('/sources/list', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  try {
    const sources = await cameraSyncService.getSyncStatus()

    res.json({
      success: true,
      sources
    })
  } catch (error: any) {
    logger.error('Failed to fetch camera sources', { error: error.message })
    res.status(500).json({ error: 'Failed to fetch sources' })
  }
})

/**
 * POST /api/traffic-cameras/sync
 * Manually trigger camera synchronization
 * Requires: admin, fleet_manager
 */
router.post(
  '/sync',
  requirePermission('geofence:create:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      logger.info('Manual camera sync triggered', { userId: req.user!.id })

      // Run sync in background
      cameraSyncService.syncAll().catch(error => {
        logger.error('Background camera sync failed', { error: error.message })
      })

      res.json({
        success: true,
        message: 'Camera synchronization started'
      })
    } catch (error: any) {
      logger.error('Failed to start camera sync', { error: error.message })
      res.status(500).json({ error: 'Failed to start sync' })
    }
  }
)

/**
 * POST /api/traffic-cameras/sources/:id/sync
 * Manually trigger sync for specific source
 * Requires: admin, fleet_manager
 */
router.post(
  '/sources/:id/sync',
  requirePermission('geofence:create:fleet'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    try {
      const result = await pool.query(
        `SELECT id, name, source_type, service_url, field_mapping, authentication
         FROM camera_data_sources
         WHERE id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Data source not found' })
      }

      const source = result.rows[0]
      logger.info('Manual source sync triggered', {
        userId: req.user!.id,
        sourceId: id,
        sourceName: source.name
      })

      // Run sync in background
      cameraSyncService.syncSource(source).catch(error => {
        logger.error('Background source sync failed', {
          sourceId: id,
          error: error.message
        })
      })

      res.json({
        success: true,
        message: `Synchronization started for ${source.name}`
      })
    } catch (error: any) {
      logger.error('Failed to start source sync', {
        sourceId: id,
        error: error.message
      })
      res.status(500).json({ error: 'Failed to start sync' })
    }
  }
)

/**
 * GET /api/traffic-cameras/nearby
 * Get cameras near a location
 */
router.get('/nearby', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const { lat, lng, radius_miles = 5 } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters required' })
  }

  try {
    // Simple distance calculation (not precise for large distances)
    // For production, use PostGIS geography type and ST_DWithin
    const query = `
      SELECT
        tc.*,
        cds.name as source_name,
        (
          3959 * acos(
            cos(radians($1)) *
            cos(radians(tc.latitude)) *
            cos(radians(tc.longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(tc.latitude))
          )
        ) AS distance_miles
      FROM traffic_cameras tc
      LEFT JOIN camera_data_sources cds ON tc.source_id = cds.id
      WHERE tc.latitude IS NOT NULL
        AND tc.longitude IS NOT NULL
        AND tc.enabled = true
      HAVING distance_miles < $3
      ORDER BY distance_miles ASC
      LIMIT 100
    `

    const result = await pool.query(query, [
      parseFloat(lat as string),
      parseFloat(lng as string),
      parseFloat(radius_miles as string)
    ])

    res.json({
      success: true,
      cameras: result.rows,
      count: result.rows.length
    })
  } catch (error: any) {
    logger.error('Failed to fetch nearby cameras', { error: error.message })
    res.status(500).json({ error: 'Failed to fetch nearby cameras' })
  }
})

export default router
