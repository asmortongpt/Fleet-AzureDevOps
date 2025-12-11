/**
 * Document Geospatial Routes
 *
 * RESTful API endpoints for geospatial document operations:
 * - Location-based search (proximity, polygon, route)
 * - Geocoding and reverse geocoding
 * - Heatmap and clustering
 * - Manual location tagging
 */

import { Router } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';
import { getErrorMessage } from '../utils/error-handler';

// Import repositories
import { DocumentGeoRepository } from '../repositories/document-geo.repository';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

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
router.post('/nearby', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { lat, lng, radius, categoryId, tags, limit, minDistance } = req.body;

    if (!lat || !lng || !radius) {
      return res.status(400).json({
        error: 'Missing required parameters: lat, lng, radius'
      });
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ValidationError("Invalid coordinates");
    }

    // Validate radius
    if (radius <= 0 || radius > 100000) {
      return res.status(400).json({
        error: 'Radius must be between 0 and 100000 meters'
      });
    }

    // Use the repository to find nearby documents
    const documentGeoRepository = container.resolve(DocumentGeoRepository);
    const documents = await documentGeoRepository.findDocumentsNearby(
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
    );

    res.json({
      documents,
      total: documents.length,
      search_params: { lat, lng, radius }
    });
  } catch (error: any) {
    logger.error('Error finding nearby documents:', error);
    res.status(500).json({
      error: 'Failed to find nearby documents',
      details: getErrorMessage(error)
    });
  }
});

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
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *                 description: Array of [longitude, latitude] pairs defining the polygon
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               limit:
 *                 type: integer
 */
router.post('/within-polygon', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { polygon, categoryId, tags, limit } = req.body;

    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({
        error: 'Invalid polygon. Must be an array of at least 3 [longitude, latitude] pairs.'
      });
    }

    // Use the repository to find documents within the polygon
    const documentGeoRepository = container.resolve(DocumentGeoRepository);
    const documents = await documentGeoRepository.findDocumentsWithinPolygon(
      tenantId,
      polygon,
      {
        categoryId,
        tags,
        limit: limit || 50
      }
    );

    res.json({
      documents,
      total: documents.length,
      search_params: { polygon }
    });
  } catch (error: any) {
    logger.error('Error finding documents within polygon:', error);
    res.status(500).json({
      error: 'Failed to find documents within polygon',
      details: getErrorMessage(error)
    });
  }
});

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
 *               - route
 *             properties:
 *               route:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *                 description: Array of [longitude, latitude] pairs defining the route
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               limit:
 *                 type: integer
 *               buffer:
 *                 type: number
 *                 description: Buffer distance in meters
 */
router.post('/along-route', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { route, categoryId, tags, limit, buffer } = req.body;

    if (!route || !Array.isArray(route) || route.length < 2) {
      return res.status(400).json({
        error: 'Invalid route. Must be an array of at least 2 [longitude, latitude] pairs.'
      });
    }

    // Use the repository to find documents along the route
    const documentGeoRepository = container.resolve(DocumentGeoRepository);
    const documents = await documentGeoRepository.findDocumentsAlongRoute(
      tenantId,
      route,
      {
        categoryId,
        tags,
        limit: limit || 50,
        buffer: buffer || 50
      }
    );

    res.json({
      documents,
      total: documents.length,
      search_params: { route, buffer }
    });
  } catch (error: any) {
    logger.error('Error finding documents along route:', error);
    res.status(500).json({
      error: 'Failed to find documents along route',
      details: getErrorMessage(error)
    });
  }
});

export default router;