import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { pool } from '../config/database'
import { logger } from '../utils/logger'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()

// All routes require authentication
router.use(authenticateJWT)

// Validation schemas
const arcgisLayerSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  serviceUrl: z.string().url(),
  layerType: z.enum(['feature', 'tile', 'image', 'dynamic', 'wms']),
  enabled: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  minZoom: z.number().optional(),
  maxZoom: z.number().optional(),
  refreshInterval: z.number().optional(),
  authentication: z.object({
    type: z.enum(['token', 'oauth', 'none']),
    token: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional()
  }).optional(),
  styling: z.object({
    fillColor: z.string().optional(),
    strokeColor: z.string().optional(),
    strokeWidth: z.number().optional(),
    iconUrl: z.string().optional(),
    iconSize: z.number().optional(),
    labelField: z.string().optional(),
    labelSize: z.number().optional(),
    labelColor: z.string().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
})

/**
 * GET /api/arcgis-layers
 * Get all ArcGIS layers for tenant
 */
router.get('/', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id

  try {
    const result = await pool.query(
      `SELECT id, tenant_id, layer_name, layer_type, layer_config, is_active, created_at FROM arcgis_layers
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    )

    res.json({
      success: true,
      layers: result.rows
    })
  } catch (error: any) {
    logger.error('Failed to fetch ArcGIS layers', {
      error: getErrorMessage(error),
      tenantId
    })
    res.status(500).json({ error: 'Failed to fetch layers' })
  }
})

/**
 * GET /api/arcgis-layers/enabled/list
 * Get only enabled layers for map rendering
 * IMPORTANT: This route must be before /:id to avoid conflict
 */
router.get('/enabled/list', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id

  try {
    const result = await pool.query(
      `SELECT id, tenant_id, layer_name, layer_type, layer_config, is_active, created_at FROM arcgis_layers
       WHERE tenant_id = $1 AND enabled = true
       ORDER BY created_at ASC`,
      [tenantId]
    )

    res.json({
      success: true,
      layers: result.rows
    })
  } catch (error: any) {
    logger.error('Failed to fetch enabled ArcGIS layers', {
      error: getErrorMessage(error),
      tenantId
    })
    res.status(500).json({ error: 'Failed to fetch layers' })
  }
})

/**
 * GET /api/arcgis-layers/:id
 * Get specific ArcGIS layer
 */
router.get('/:id', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id
  const { id } = req.params

  try {
    const result = await pool.query(
      `SELECT id, tenant_id, layer_name, layer_type, layer_config, is_active, created_at FROM arcgis_layers
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' })
    }

    res.json({
      success: true,
      layer: result.rows[0]
    })
  } catch (error: any) {
    logger.error('Failed to fetch ArcGIS layer', {
      error: getErrorMessage(error),
      layerId: id
    })
    res.status(500).json({ error: 'Failed to fetch layer' })
  }
})

/**
 * POST /api/arcgis-layers
 * Create new ArcGIS layer configuration
 * Requires: admin, fleet_manager
 */
router.post(
  '/',
  requirePermission('geofence:create:fleet'),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenant_id

    try {
      const validated = arcgisLayerSchema.parse(req.body)

      const result = await pool.query(
        `INSERT INTO arcgis_layers (
          tenant_id, name, description, service_url, layer_type,
          enabled, opacity, min_zoom, max_zoom, refresh_interval,
          authentication, styling, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *`,
        [
          tenantId,
          validated.name,
          validated.description || null,
          validated.serviceUrl,
          validated.layerType,
          validated.enabled,
          validated.opacity,
          validated.minZoom || null,
          validated.maxZoom || null,
          validated.refreshInterval || null,
          validated.authentication ? JSON.stringify(validated.authentication) : null,
          validated.styling ? JSON.stringify(validated.styling) : null,
          validated.metadata ? JSON.stringify(validated.metadata) : null
        ]
      )

      logger.info('ArcGIS layer created', {
        layerId: result.rows[0].id,
        name: validated.name,
        tenantId
      })

      res.status(201).json({
        success: true,
        layer: result.rows[0]
      })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        })
      }

      logger.error('Failed to create ArcGIS layer', {
        error: getErrorMessage(error),
        tenantId
      })
      res.status(500).json({ error: 'Failed to create layer' })
    }
  }
)

/**
 * PUT /api/arcgis-layers/:id
 * Update ArcGIS layer configuration
 * Requires: admin, fleet_manager
 */
router.put(
  '/:id',
  requirePermission('geofence:create:fleet'),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenant_id
    const { id } = req.params

    try {
      const validated = arcgisLayerSchema.partial().parse(req.body)

      // Build dynamic update query
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (validated.name !== undefined) {
        updates.push(`name = $${paramCount++}`)
        values.push(validated.name)
      }
      if (validated.description !== undefined) {
        updates.push(`description = $${paramCount++}`)
        values.push(validated.description)
      }
      if (validated.serviceUrl !== undefined) {
        updates.push(`service_url = $${paramCount++}`)
        values.push(validated.serviceUrl)
      }
      if (validated.layerType !== undefined) {
        updates.push(`layer_type = $${paramCount++}`)
        values.push(validated.layerType)
      }
      if (validated.enabled !== undefined) {
        updates.push(`enabled = $${paramCount++}`)
        values.push(validated.enabled)
      }
      if (validated.opacity !== undefined) {
        updates.push(`opacity = $${paramCount++}`)
        values.push(validated.opacity)
      }
      if (validated.minZoom !== undefined) {
        updates.push(`min_zoom = $${paramCount++}`)
        values.push(validated.minZoom)
      }
      if (validated.maxZoom !== undefined) {
        updates.push(`max_zoom = $${paramCount++}`)
        values.push(validated.maxZoom)
      }
      if (validated.refreshInterval !== undefined) {
        updates.push(`refresh_interval = $${paramCount++}`)
        values.push(validated.refreshInterval)
      }
      if (validated.authentication !== undefined) {
        updates.push(`authentication = $${paramCount++}`)
        values.push(JSON.stringify(validated.authentication))
      }
      if (validated.styling !== undefined) {
        updates.push(`styling = $${paramCount++}`)
        values.push(JSON.stringify(validated.styling))
      }
      if (validated.metadata !== undefined) {
        updates.push(`metadata = $${paramCount++}`)
        values.push(JSON.stringify(validated.metadata))
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      updates.push(`updated_at = NOW()`)
      values.push(id, tenantId)

      const result = await pool.query(
        `UPDATE arcgis_layers
         SET ${updates.join(', ')}
         WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
         RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Layer not found' })
      }

      logger.info('ArcGIS layer updated', {
        layerId: id,
        tenantId
      })

      res.json({
        success: true,
        layer: result.rows[0]
      })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        })
      }

      logger.error('Failed to update ArcGIS layer', {
        error: getErrorMessage(error),
        layerId: id
      })
      res.status(500).json({ error: 'Failed to update layer' })
    }
  }
)

/**
 * DELETE /api/arcgis-layers/:id
 * Delete ArcGIS layer configuration
 * Requires: admin, fleet_manager
 */
router.delete(
  '/:id',
  requirePermission('geofence:create:fleet'),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenant_id
    const { id } = req.params

    try {
      const result = await pool.query(
        `DELETE FROM arcgis_layers
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [id, tenantId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Layer not found' })
      }

      logger.info('ArcGIS layer deleted', {
        layerId: id,
        tenantId
      })

      res.json({
        success: true,
        message: 'Layer deleted successfully'
      })
    } catch (error: any) {
      logger.error('Failed to delete ArcGIS layer', {
        error: getErrorMessage(error),
        layerId: id
      })
      res.status(500).json({ error: 'Failed to delete layer' })
    }
  }
)

export default router
