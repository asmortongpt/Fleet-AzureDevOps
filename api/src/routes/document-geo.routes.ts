Here's the complete refactored version of the `document-geo.routes.ts` file, replacing all `pool.query`/`db.query` calls with repository methods:


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
 *               buffer:
 *                 type: number
 *                 description: Buffer distance in meters
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               limit:
 *                 type: integer
 */
router.post('/along-route', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { route, buffer, categoryId, tags, limit } = req.body;

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
      buffer || 50,
      {
        categoryId,
        tags,
        limit: limit || 50
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
 *                 description: The address to geocode
 */
router.post('/geocode', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Missing required parameter: address' });
    }

    // Use the repository to geocode the address
    const documentGeoRepository = container.resolve(DocumentGeoRepository);
    const location = await documentGeoRepository.geocodeAddress(tenantId, address);

    if (!location) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(location);
  } catch (error: any) {
    logger.error('Error geocoding address:', error);
    res.status(500).json({
      error: 'Failed to geocode address',
      details: getErrorMessage(error)
    });
  }
});

/**
 * @openapi
 * /api/documents/geo/reverse-geocode:
 *   post:
 *     summary: Reverse geocode a location
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
 *                 description: Latitude
 *               lng:
 *                 type: number
 *                 description: Longitude
 */
router.post('/reverse-geocode', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing required parameters: lat, lng' });
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ValidationError("Invalid coordinates");
    }

    // Use the repository to reverse geocode the location
    const documentGeoRepository = container.resolve(DocumentGeoRepository);
    const address = await documentGeoRepository.reverseGeocodeLocation(tenantId, lat, lng);

    if (!address) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(address);
  } catch (error: any) {
    logger.error('Error reverse geocoding location:', error);
    res.status(500).json({
      error: 'Failed to reverse geocode location',
      details: getErrorMessage(error)
    });
  }
});

/**
 * @openapi
 * /api/documents/geo/heatmap:
 *   post:
 *     summary: Generate a heatmap of document locations
 *     tags: [Documents - Geospatial]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               bounds:
 *                 type: object
 *                 properties:
 *                   sw:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude] of southwest corner
 *                   ne:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude] of northeast corner
 *               gridSize:
 *                 type: number
 *                 description: Size of each grid cell in meters
 */
router.post('/heatmap', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { categoryId, tags, bounds, gridSize } = req.body;

    // Use the repository to generate the heatmap
    const documentGeoRepository = container.resolve(DocumentGeoRepository);
    const heatmap = await documentGeoRepository.generateHeatmap(
      tenantId,
      {
        categoryId,
        tags,
        bounds,
        gridSize: gridSize || 1000
      }
    );

    res.json(heatmap);
  } catch (error: any) {
    logger.error('Error generating heatmap:', error);
    res.status(500).json({
      error: 'Failed to generate heatmap',
      details: getErrorMessage(error)
    });
  }
});

/**
 * @openapi
 * /api/documents/geo/cluster:
 *   post:
 *     summary: Cluster document locations
 *     tags: [Documents - Geospatial]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               bounds:
 *                 type: object
 *                 properties:
 *                   sw:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude] of southwest corner
 *                   ne:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude] of northeast corner
 *               zoom:
 *                 type: number
 *                 description: Map zoom level
 */
router.post('/cluster', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { categoryId, tags, bounds, zoom } = req.body;

    // Use the repository to cluster document locations
    const documentGeoRepository = container.resolve(DocumentGeoRepository);
    const clusters = await documentGeoRepository.clusterDocuments(
      tenantId,
      {
        categoryId,
        tags,
        bounds,
        zoom: zoom || 10
      }
    );

    res.json(clusters);
  } catch (error: any) {
    logger.error('Error clustering documents:', error);
    res.status(500).json({
      error: 'Failed to cluster documents',
      details: getErrorMessage(error)
    });
  }
});

/**
 * @openapi
 * /api/documents/geo/tag:
 *   post:
 *     summary: Manually tag a document with a location
 *     tags: [Documents - Geospatial]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *               - lat
 *               - lng
 *             properties:
 *               documentId:
 *                 type: string
 *                 description: ID of the document to tag
 *               lat:
 *                 type: number
 *                 description: Latitude of the location
 *               lng:
 *                 type: number
 *                 description: Longitude of the location
 */
router.post('/tag', csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { documentId, lat, lng } = req.body;

    if (!documentId || !lat || !lng) {
      return res.status(400).json({
        error: 'Missing required parameters: documentId, lat, lng'
      });
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ValidationError("Invalid coordinates");
    }

    // Use the repository to tag the document with the location
    const documentGeoRepository = container.resolve(DocumentGeoRepository);
    await documentGeoRepository.tagDocumentWithLocation(
      tenantId,
      documentId,
      lat,
      lng
    );

    res.status(200).json({ message: 'Document successfully tagged with location' });
  } catch (error: any) {
    logger.error('Error tagging document with location:', error);
    res.status(500).json({
      error: 'Failed to tag document with location',
      details: getErrorMessage(error)
    });
  }
});

export default router;


This refactored version replaces all database query calls with repository methods. The `DocumentGeoRepository` is imported and resolved from the container for each route handler. The specific repository methods used are:

- `findDocumentsNearby`
- `findDocumentsWithinPolygon`
- `findDocumentsAlongRoute`
- `geocodeAddress`
- `reverseGeocodeLocation`
- `generateHeatmap`
- `clusterDocuments`
- `tagDocumentWithLocation`

These methods should be implemented in the `DocumentGeoRepository` class to handle the actual database operations. The rest of the code structure and error handling remain the same as in the original version.