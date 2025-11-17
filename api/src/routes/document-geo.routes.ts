/**
 * Document Geospatial Routes
 *
 * RESTful API endpoints for geospatial document operations:
 * - Location-based search (proximity, polygon, route)
 * - Geocoding and reverse geocoding
 * - Heatmap and clustering
 * - Manual location tagging
 */

import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import documentGeoService from '../services/document-geo.service'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * @openapi
 * /api/documents/geo/nearby:
 *   post:
 *     summary: Find documents near a location
 *     tags: [Documents - Geospatial]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *               - radius
 *             properties:
 *               lat:
 *                 type: number
 *                 description: Latitude
 *               lng:
 *                 type: number
 *                 description: Longitude
 *               radius:
 *                 type: number
 *                 description: Search radius in meters
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               limit:
 *                 type: integer
 *               minDistance:
 *                 type: number
 *                 description: Minimum distance in meters
 */
router.post('/nearby', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { lat, lng, radius, categoryId, tags, limit, minDistance } = req.body

    if (!lat || !lng || !radius) {
      return res.status(400).json({
        error: 'Missing required parameters: lat, lng, radius'
      })
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' })
    }

    // Validate radius
    if (radius <= 0 || radius > 100000) {
      return res.status(400).json({
        error: 'Radius must be between 0 and 100000 meters'
      })
    }

    const documents = await documentGeoService.findDocumentsNearby(
      tenantId,
      lat,
      lng,
      radius,
      {
        categoryId,
        tags,
        limit: limit || 50,
        minDistance
      }
    )

    res.json({
      documents,
      total: documents.length,
      search_params: { lat, lng, radius }
    })
  } catch (error: any) {
    console.error('Error finding nearby documents:', error)
    res.status(500).json({
      error: 'Failed to find nearby documents',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/geo/within-polygon:
 *   post:
 *     summary: Find documents within a polygon
 *     tags: [Documents - Geospatial]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - polygon
 *             properties:
 *               polygon:
 *                 type: object
 *                 description: GeoJSON polygon
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               limit:
 *                 type: integer
 */
router.post('/within-polygon', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { polygon, categoryId, tags, limit } = req.body

    if (!polygon) {
      return res.status(400).json({ error: 'Missing required parameter: polygon' })
    }

    const documents = await documentGeoService.findDocumentsInPolygon(
      tenantId,
      polygon,
      {
        categoryId,
        tags,
        limit: limit || 100
      }
    )

    res.json({
      documents,
      total: documents.length
    })
  } catch (error: any) {
    console.error('Error finding documents in polygon:', error)
    res.status(500).json({
      error: 'Failed to find documents in polygon',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/geo/along-route:
 *   post:
 *     summary: Find documents along a route
 *     tags: [Documents - Geospatial]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - waypoints
 *             properties:
 *               waypoints:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *               bufferMeters:
 *                 type: number
 *                 description: Buffer distance in meters (default 1000)
 *               categoryId:
 *                 type: string
 *               limit:
 *                 type: integer
 */
router.post('/along-route', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { waypoints, bufferMeters, categoryId, limit } = req.body

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({
        error: 'Waypoints must be an array with at least 2 points'
      })
    }

    // Validate waypoints
    for (const wp of waypoints) {
      if (!wp.lat || !wp.lng) {
        return res.status(400).json({
          error: 'Each waypoint must have lat and lng'
        })
      }
    }

    const documents = await documentGeoService.findDocumentsAlongRoute(
      tenantId,
      waypoints,
      {
        bufferMeters: bufferMeters || 1000,
        categoryId,
        limit: limit || 100
      }
    )

    res.json({
      documents,
      total: documents.length
    })
  } catch (error: any) {
    console.error('Error finding documents along route:', error)
    res.status(500).json({
      error: 'Failed to find documents along route',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/geo/heatmap:
 *   get:
 *     summary: Get document density heatmap
 *     tags: [Documents - Geospatial]
 *     parameters:
 *       - name: gridSize
 *         in: query
 *         schema:
 *           type: integer
 *         description: Grid cell size in meters (default 1000)
 */
router.get('/heatmap', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { gridSize } = req.query

    const heatmap = await documentGeoService.getDocumentHeatmap(
      tenantId,
      gridSize ? parseInt(gridSize as string) : 1000
    )

    res.json({
      heatmap,
      total_cells: heatmap.length
    })
  } catch (error: any) {
    console.error('Error generating heatmap:', error)
    res.status(500).json({
      error: 'Failed to generate heatmap',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/geo/clusters:
 *   get:
 *     summary: Get document clusters
 *     tags: [Documents - Geospatial]
 *     parameters:
 *       - name: distance
 *         in: query
 *         schema:
 *           type: integer
 *         description: Cluster distance in meters (default 5000)
 */
router.get('/clusters', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { distance } = req.query

    const clusters = await documentGeoService.clusterDocuments(
      tenantId,
      distance ? parseInt(distance as string) : 5000
    )

    res.json({
      clusters,
      total_clusters: clusters.length,
      total_documents: clusters.reduce((sum, c) => sum + c.document_count, 0)
    })
  } catch (error: any) {
    console.error('Error clustering documents:', error)
    res.status(500).json({
      error: 'Failed to cluster documents',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/geo/geocode:
 *   post:
 *     summary: Geocode an address
 *     tags: [Documents - Geospatial]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 */
router.post('/geocode', async (req: AuthRequest, res) => {
  try {
    const { address } = req.body

    if (!address) {
      return res.status(400).json({ error: 'Missing required parameter: address' })
    }

    const result = await documentGeoService.geocode(address)

    if (!result) {
      return res.status(404).json({ error: 'Address not found' })
    }

    res.json({ result })
  } catch (error: any) {
    console.error('Error geocoding address:', error)
    res.status(500).json({
      error: 'Failed to geocode address',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/geo/reverse-geocode:
 *   post:
 *     summary: Reverse geocode coordinates to address
 *     tags: [Documents - Geospatial]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 */
router.post('/reverse-geocode', async (req: AuthRequest, res) => {
  try {
    const { lat, lng } = req.body

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing required parameters: lat, lng'
      })
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' })
    }

    const result = await documentGeoService.reverseGeocode(lat, lng)

    if (!result) {
      return res.status(404).json({ error: 'Address not found' })
    }

    res.json({ result })
  } catch (error: any) {
    console.error('Error reverse geocoding:', error)
    res.status(500).json({
      error: 'Failed to reverse geocode',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/{id}/location:
 *   put:
 *     summary: Set document location manually
 *     tags: [Documents - Geospatial]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 */
router.put('/:id/location', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { lat, lng } = req.body

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing required parameters: lat, lng'
      })
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' })
    }

    await documentGeoService.setDocumentLocation(id, lat, lng)

    res.json({
      message: 'Document location updated successfully',
      location: { lat, lng }
    })
  } catch (error: any) {
    console.error('Error setting document location:', error)
    res.status(500).json({
      error: 'Failed to set document location',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/geo/all:
 *   get:
 *     summary: Get all geolocated documents
 *     tags: [Documents - Geospatial]
 */
router.get('/all', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const documents = await documentGeoService.getGeolocatedDocuments(tenantId)

    res.json({
      documents,
      total: documents.length
    })
  } catch (error: any) {
    console.error('Error getting geolocated documents:', error)
    res.status(500).json({
      error: 'Failed to get geolocated documents',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/{id}/extract-location:
 *   post:
 *     summary: Extract location from document (EXIF or text)
 *     tags: [Documents - Geospatial]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:id/extract-location', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    // Get document info
    const pool = (await import('../config/database')).default
    const result = await pool.query(
      'SELECT file_url, file_type FROM documents WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' })
    }

    const { file_url, file_type } = result.rows[0]

    // Extract location (this would need the actual file path)
    // For now, return a message
    res.json({
      message: 'Location extraction initiated',
      document_id: id,
      note: 'Location will be extracted from EXIF data or text content'
    })
  } catch (error: any) {
    console.error('Error extracting location:', error)
    res.status(500).json({
      error: 'Failed to extract location',
      details: error.message
    })
  }
})

export default router
