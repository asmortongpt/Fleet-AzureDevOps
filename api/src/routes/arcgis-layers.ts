Here's the complete refactored version of the `arcgis-layers.ts` file, including all routes and methods:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { ArcGISLayerRepository } from '../repositories/arcgis-layer-repository';

const router = express.Router();

// Import the repository
const arcGISLayerRepository = container.resolve(ArcGISLayerRepository);

// All routes require authentication
router.use(authenticateJWT);

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
  metadata: z.record(z.any().optional())
});

/**
 * GET /api/arcgis-layers
 * Get all ArcGIS layers for tenant
 */
router.get('/', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;

  try {
    const layers = await arcGISLayerRepository.getAllLayersForTenant(tenantId);

    res.json({
      success: true,
      layers
    });
  } catch (error: any) {
    logger.error(`Failed to fetch ArcGIS layers`, {
      error: getErrorMessage(error),
      tenantId
    });
    res.status(500).json({ error: `Failed to fetch layers` });
  }
});

/**
 * GET /api/arcgis-layers/enabled/list
 * Get only enabled layers for map rendering
 * IMPORTANT: This route must be before /:id to avoid conflict
 */
router.get('/enabled/list', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;

  try {
    const layers = await arcGISLayerRepository.getEnabledLayersForTenant(tenantId);

    res.json({
      success: true,
      layers
    });
  } catch (error: any) {
    logger.error(`Failed to fetch enabled ArcGIS layers`, {
      error: getErrorMessage(error),
      tenantId
    });
    res.status(500).json({ error: `Failed to fetch layers` });
  }
});

/**
 * GET /api/arcgis-layers/:id
 * Get specific ArcGIS layer
 */
router.get('/:id', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { id } = req.params;

  try {
    const layer = await arcGISLayerRepository.getLayerById(id, tenantId);

    if (!layer) {
      return res.status(404).json({ error: `Layer not found` });
    }

    res.json({
      success: true,
      layer
    });
  } catch (error: any) {
    logger.error('Failed to fetch ArcGIS layer', {
      error: getErrorMessage(error),
      layerId: id
    });
    res.status(500).json({ error: `Failed to fetch layer` });
  }
});

/**
 * POST /api/arcgis-layers
 * Create new ArcGIS layer
 */
router.post('/', requirePermission('geofence:edit:fleet'), csrfProtection, async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;

  try {
    const validatedData = arcgisLayerSchema.parse(req.body);

    const newLayer = await arcGISLayerRepository.createLayer({
      ...validatedData,
      tenant_id: tenantId
    });

    res.status(201).json({
      success: true,
      layer: newLayer
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` });
    }
    logger.error('Failed to create ArcGIS layer', {
      error: getErrorMessage(error),
      tenantId
    });
    res.status(500).json({ error: `Failed to create layer` });
  }
});

/**
 * PUT /api/arcgis-layers/:id
 * Update existing ArcGIS layer
 */
router.put('/:id', requirePermission('geofence:edit:fleet'), csrfProtection, async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { id } = req.params;

  try {
    const validatedData = arcgisLayerSchema.partial().parse(req.body);

    const updatedLayer = await arcGISLayerRepository.updateLayer(id, tenantId, validatedData);

    if (!updatedLayer) {
      return res.status(404).json({ error: `Layer not found` });
    }

    res.json({
      success: true,
      layer: updatedLayer
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` });
    }
    logger.error('Failed to update ArcGIS layer', {
      error: getErrorMessage(error),
      layerId: id
    });
    res.status(500).json({ error: `Failed to update layer` });
  }
});

/**
 * DELETE /api/arcgis-layers/:id
 * Delete ArcGIS layer
 */
router.delete('/:id', requirePermission('geofence:edit:fleet'), csrfProtection, async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { id } = req.params;

  try {
    const deleted = await arcGISLayerRepository.deleteLayer(id, tenantId);

    if (!deleted) {
      return res.status(404).json({ error: `Layer not found` });
    }

    res.json({
      success: true,
      message: `Layer deleted successfully`
    });
  } catch (error: any) {
    logger.error('Failed to delete ArcGIS layer', {
      error: getErrorMessage(error),
      layerId: id
    });
    res.status(500).json({ error: `Failed to delete layer` });
  }
});

export default router;


This refactored version replaces all `pool.query` or `db.query` calls with methods from the `ArcGISLayerRepository`. The repository methods are assumed to handle the database operations internally. Make sure that the `ArcGISLayerRepository` class in the `../repositories/arcgis-layer-repository` file implements all the necessary methods used in this router.