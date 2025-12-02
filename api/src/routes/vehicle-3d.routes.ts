/**
 * Vehicle 3D Models API Routes
 *
 * Endpoints for 3D vehicle visualization, AR, and customization
 */

import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import pool from '../config/database';
import VehicleModelsService from '../services/vehicle-models.service';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router();
const vehicleModelsService = new VehicleModelsService(pool);

// Optional authentication - allow public access for some endpoints
const optionalAuth = (req: AuthRequest, res: Response, next: any) => {
  authenticateJWT(req, res, (err?: any) => {
    // Continue even if not authenticated
    next();
  });
};

/**
 * GET /api/vehicles/:id/3d-model
 * Get 3D model data for a vehicle
 */
router.get(
  '/:id/3d-model',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id);

      const modelData = await vehicleModelsService.getVehicle3DModel(vehicleId);

      if (!modelData) {
        return res.status(404).json({ error: 'Vehicle 3D model not found' });
      }

      res.json(modelData);
    } catch (error: any) {
      console.error('Get 3D model error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicles/:id/ar-model
 * Get AR model URL (USDZ for iOS or GLB for Android)
 */
router.get(
  '/:id/ar-model',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const platform = req.query.platform as string; // 'ios' or 'android'

      const modelData = await vehicleModelsService.getVehicle3DModel(vehicleId);

      if (!modelData) {
        return res.status(404).json({ error: 'Vehicle 3D model not found' });
      }

      const arUrl = platform === 'ios' ? modelData.usdz_model_url : modelData.glb_model_url;

      if (!arUrl) {
        return res.status(404).json({ error: 'AR model not available for this platform' });
      }

      res.json({
        url: arUrl,
        platform,
        supports_ar: modelData.supports_ar,
        bbox: {
          width: modelData.bbox_width_m,
          height: modelData.bbox_height_m,
          length: modelData.bbox_length_m
        }
      });
    } catch (error: any) {
      console.error('Get AR model error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * POST /api/vehicles/:id/customize
 * Save vehicle customization
 */
router.post(
  '/:id/customize',
  authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicle_customization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id);

      const schema = z.object({
        exteriorColorHex: z.string().optional(),
        exteriorColorName: z.string().optional(),
        interiorColorHex: z.string().optional(),
        interiorColorName: z.string().optional(),
        wheelStyle: z.string().optional(),
        trimPackage: z.string().optional()
      });

      const customization = schema.parse(req.body);

      const result = await vehicleModelsService.updateCustomization(
        vehicleId,
        customization
      );

      res.json({
        message: 'Customization saved successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Save customization error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid customization data', details: error.errors });
      }
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicle-models
 * List all published 3D vehicle models
 */
router.get(
  '/models',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        make: req.query.make as string,
        model: req.query.model as string,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        bodyStyle: req.query.bodyStyle as string
      };

      const models = await vehicleModelsService.getPublished3DModels(filters);

      res.json({
        data: models,
        count: models.length
      });
    } catch (error: any) {
      console.error('List models error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicle-models/catalog
 * Get makes/models catalog for filtering
 */
router.get(
  '/models/catalog',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const catalog = await vehicleModelsService.getModelCatalog();
      res.json(catalog);
    } catch (error: any) {
      console.error('Get catalog error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicle-models/:id/customization-options
 * Get available customization options for a 3D model
 */
router.get(
  '/models/:id/customization-options',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const model3dId = parseInt(req.params.id);
      const category = req.query.category as string;

      const options = await vehicleModelsService.getCustomizationOptions(model3dId, category);

      res.json({
        data: options,
        count: options.length
      });
    } catch (error: any) {
      console.error('Get customization options error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * POST /api/vehicles/:id/damage-markers
 * Update damage markers from AI detection
 */
router.post(
  '/:id/damage-markers',
  authenticateJWT,
  requirePermission('damage_report:create:own'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicle_damage' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id);

      const schema = z.array(z.object({
        location: z.object({
          x: z.number(),
          y: z.number(),
          z: z.number()
        }),
        severity: z.enum(['minor', 'moderate', 'severe']),
        type: z.string(),
        description: z.string().optional(),
        detectedAt: z.string().optional()
      }));

      const damageMarkers = schema.parse(req.body);

      await vehicleModelsService.updateDamageMarkers(vehicleId, damageMarkers);

      res.json({
        message: 'Damage markers updated successfully',
        count: damageMarkers.length
      });
    } catch (error: any) {
      console.error('Update damage markers error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid damage marker data', details: error.errors });
      }
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * POST /api/vehicles/:id/ar-session
 * Track AR viewing session
 */
router.post(
  '/:id/ar-session',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id);

      const schema = z.object({
        platform: z.enum(['iOS', 'Android', 'WebXR']),
        arFramework: z.string(),
        deviceModel: z.string().optional(),
        osVersion: z.string().optional(),
        placementAttempts: z.number().optional(),
        successfulPlacements: z.number().optional(),
        screenshotsTaken: z.number().optional(),
        viewedAngles: z.number().optional(),
        sessionRating: z.number().min(1).max(5).optional()
      });

      const sessionData = schema.parse(req.body);

      const sessionId = await vehicleModelsService.trackARSession({
        vehicleId,
        userId: req.user?.id,
        ...sessionData
      });

      res.json({
        message: 'AR session tracked',
        sessionId
      });
    } catch (error: any) {
      console.error('Track AR session error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid session data', details: error.errors });
      }
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * PUT /api/ar-sessions/:sessionId
 * End AR session and update metrics
 */
router.put(
  '/ar-sessions/:sessionId',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);

      const schema = z.object({
        placementAttempts: z.number().optional(),
        successfulPlacements: z.number().optional(),
        screenshotsTaken: z.number().optional(),
        viewedAngles: z.number().optional(),
        ledToInquiry: z.boolean().optional(),
        sessionRating: z.number().min(1).max(5).optional()
      });

      const updates = schema.parse(req.body);

      await vehicleModelsService.endARSession(sessionId, updates);

      res.json({
        message: 'AR session ended successfully'
      });
    } catch (error: any) {
      console.error('End AR session error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid update data', details: error.errors });
      }
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * GET /api/ar-sessions/analytics
 * Get AR session analytics
 */
router.get(
  '/ar-sessions/analytics',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'ar_analytics' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      const analytics = await vehicleModelsService.getARAnalytics(days);

      res.json({
        data: analytics,
        period_days: days
      });
    } catch (error: any) {
      console.error('Get AR analytics error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * POST /api/vehicles/:id/render
 * Request a high-quality render
 */
router.post(
  '/:id/render',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'vehicle_render' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id);

      const schema = z.object({
        renderName: z.string(),
        cameraAngle: z.enum(['front', 'rear', 'side', '3quarter', 'interior', 'overhead']),
        resolutionWidth: z.number().optional(),
        resolutionHeight: z.number().optional(),
        renderQuality: z.enum(['low', 'medium', 'high', 'ultra']).optional(),
        backgroundType: z.enum(['studio', 'outdoor', 'showroom', 'transparent']).optional(),
        timeOfDay: z.enum(['morning', 'noon', 'sunset', 'night']).optional()
      });

      const renderData = schema.parse(req.body);

      const renderId = await vehicleModelsService.createRenderRequest({
        vehicleId,
        ...renderData
      });

      // In production, this would trigger a render job
      // For now, return the request ID
      res.json({
        message: 'Render request created',
        renderId,
        status: 'pending'
      });
    } catch (error: any) {
      console.error('Create render error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid render data', details: error.errors });
      }
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * GET /api/vehicles/:id/renders
 * Get all renders for a vehicle
 */
router.get(
  '/:id/renders',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const featured = req.query.featured === 'true' ? true : undefined;

      const renders = await vehicleModelsService.getVehicleRenders(vehicleId, featured);

      res.json({
        data: renders,
        count: renders.length
      });
    } catch (error: any) {
      console.error('Get renders error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * POST /api/3d-performance
 * Track 3D viewer performance metrics
 */
router.post(
  '/3d-performance',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        sessionId: z.string(),
        vehicleId: z.number().optional(),
        model3dId: z.number().optional(),
        platform: z.string(),
        deviceType: z.string(),
        gpuInfo: z.string().optional(),
        loadTimeMs: z.number(),
        fpsAverage: z.number(),
        fpsMin: z.number(),
        memoryUsageMb: z.number().optional(),
        qualityLevel: z.string(),
        polygonCount: z.number().optional(),
        shadowsEnabled: z.boolean().optional(),
        reflectionsEnabled: z.boolean().optional(),
        sessionDurationSeconds: z.number().optional()
      });

      const metrics = schema.parse(req.body);

      await vehicleModelsService.trackPerformance(metrics);

      res.json({
        message: 'Performance metrics tracked'
      });
    } catch (error: any) {
      console.error('Track performance error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid metrics data', details: error.errors });
      }
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * GET /api/3d-performance/summary
 * Get performance summary
 */
router.get(
  '/3d-performance/summary',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: '3d_performance' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const summary = await vehicleModelsService.getPerformanceSummary();

      res.json({
        data: summary
      });
    } catch (error: any) {
      console.error('Get performance summary error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

/**
 * POST /api/vehicles/:id/3d-instance
 * Create or update 3D instance for vehicle
 */
router.post(
  '/:id/3d-instance',
  authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'vehicle_3d_instance' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id);

      // Get vehicle info
      const vehicleResult = await pool.query(
        'SELECT make, model, year FROM vehicles WHERE id = $1',
        [vehicleId]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const vehicle = vehicleResult.rows[0];

      const instance = await vehicleModelsService.findOrCreateModelForVehicle(
        vehicleId,
        {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        }
      );

      res.json({
        message: '3D instance created',
        data: instance
      });
    } catch (error: any) {
      console.error('Create 3D instance error:', error);
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
    }
  }
);

export default router;
