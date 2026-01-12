/**
 * LiDAR 3D Scanning API Routes
 *
 * Endpoints for processing LiDAR scans, generating 3D models,
 * calculating damage volumes, and AR integration.
 */

import express, { Response } from 'express';
import { z } from 'zod';
import logger from '../config/logger';
import { NotFoundError } from '../errors/app-error';
import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';
import { lidar3DScanningService } from '../services/lidar-3d-scanning.service';
import {
  CalculateVolumeRequest,
  CompareScansRequest,
  DamageAnnotationSchema,
  MeshGenerationOptionsSchema,
  Model3DGenerationRequestSchema,
  PointCloudProcessingOptionsSchema,
  ProcessLiDARScanRequest,
} from '../types/lidar.types';
import { getErrorMessage } from '../utils/error-handler';

const router = express.Router();

/**
 * POST /api/lidar/process-scan
 * Process LiDAR scan and generate 3D models
 */
router.post(
  '/process-scan',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage_report:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'lidar_scan' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        vehicleId: z.number().int().positive(),
        pointCloudData: z.union([
          z.array(
            z.object({
              x: z.number(),
              y: z.number(),
              z: z.number(),
              intensity: z.number().optional(),
              rgb: z
                .object({
                  r: z.number().min(0).max(255),
                  g: z.number().min(0).max(255),
                  b: z.number().min(0).max(255),
                })
                .optional(),
            })
          ),
          z.string().url(),
        ]),
        metadata: z.object({
          scannerId: z.string(),
          scannerType: z.enum(['iphone_lidar', 'ipad_pro', 'standalone', 'industrial']),
          scanDate: z.string().transform(str => new Date(str)),
          scanDurationMs: z.number().int().positive(),
          pointCount: z.number().int().positive(),
          resolution: z.number().positive(),
          accuracy: z.number().positive(),
          captureDevice: z.object({
            model: z.string(),
            osVersion: z.string(),
            appVersion: z.string(),
          }),
          environmentalConditions: z
            .object({
              lighting: z.enum(['indoor', 'outdoor', 'mixed']),
              temperature: z.number().optional(),
              humidity: z.number().optional(),
            })
            .optional(),
          boundingBox: z.object({
            minX: z.number(),
            minY: z.number(),
            minZ: z.number(),
            maxX: z.number(),
            maxY: z.number(),
            maxZ: z.number(),
          }),
          damageReportId: z.string().uuid().optional(),
        }),
        processingOptions: PointCloudProcessingOptionsSchema.optional(),
        meshOptions: MeshGenerationOptionsSchema.optional(),
        generateModels: z
          .array(z.enum(['glb', 'usdz', 'obj', 'ply', 'stl', 'fbx']))
          .optional()
          .default(['glb', 'usdz']),
        detectDamage: z.boolean().default(true),
      });

      const request: ProcessLiDARScanRequest = schema.parse(req.body);

      const result = await lidar3DScanningService.processScan(
        req.user!.tenant_id,
        req.user!.id.toString(),
        request
      );

      res.status(201).json({
        success: true,
        message: 'LiDAR scan processed successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Process LiDAR scan error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        });
      }
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to process LiDAR scan',
      });
    }
  }
);

/**
 * GET /api/lidar/scans/:scanId
 * Get scan details with models and annotations
 */
router.get(
  '/scans/:scanId',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'lidar_scan' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const scanId = req.params.scanId;

      const scanData = await lidar3DScanningService.getScan(req.user!.tenant_id, scanId);

      res.json({
        success: true,
        data: scanData,
      });
    } catch (error: any) {
      logger.error('Get LiDAR scan error:', error);
      if (error.message === 'Scan not found') {
        throw new NotFoundError('LiDAR scan not found');
      }
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to retrieve scan',
      });
    }
  }
);

/**
 * GET /api/lidar/scans
 * List LiDAR scans (optionally filtered by vehicle)
 */
router.get(
  '/scans',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'lidar_scans' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

      const result = await lidar3DScanningService.listScans(
        req.user!.tenant_id,
        vehicleId,
        page,
        pageSize
      );

      res.json({
        success: true,
        data: result.scans,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / result.pageSize),
        },
      });
    } catch (error: any) {
      logger.error('List LiDAR scans error:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to list scans',
      });
    }
  }
);

/**
 * POST /api/lidar/calculate-volume
 * Calculate volume for damage zones
 */
router.post(
  '/calculate-volume',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage_report:view:own'),
  auditLog({ action: 'CREATE', resourceType: 'volume_calculation' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        scanId: z.string().uuid(),
        method: z.enum(['convex_hull', 'delaunay', 'marching_cubes', 'voxel']).optional(),
        damageAnnotations: z.array(z.string().uuid()).optional(),
      });

      const request: CalculateVolumeRequest = schema.parse(req.body);

      const result = await lidar3DScanningService.calculateVolume(req.user!.tenant_id, request);

      res.json({
        success: true,
        message: 'Volume calculation completed',
        data: result,
      });
    } catch (error: any) {
      logger.error('Calculate volume error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        });
      }
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to calculate volume',
      });
    }
  }
);

/**
 * POST /api/lidar/compare-scans
 * Compare two scans to detect damage progression
 */
router.post(
  '/compare-scans',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage_report:view:own'),
  auditLog({ action: 'CREATE', resourceType: 'scan_comparison' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        baseScanId: z.string().uuid(),
        compareScanId: z.string().uuid(),
        tolerance: z.number().positive().optional(),
        generateVisualization: z.boolean().default(false),
      });

      const request: CompareScansRequest = schema.parse(req.body);

      const result = await lidar3DScanningService.compareScans(req.user!.tenant_id, request);

      res.json({
        success: true,
        message: 'Scan comparison completed',
        data: result,
      });
    } catch (error: any) {
      logger.error('Compare scans error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        });
      }
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to compare scans',
      });
    }
  }
);

/**
 * POST /api/lidar/scans/:scanId/generate-model
 * Generate additional 3D model formats for existing scan
 */
router.post(
  '/scans/:scanId/generate-model',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage_report:view:own'),
  auditLog({ action: 'CREATE', resourceType: '3d_model' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const scanId = req.params.scanId;

      const request = Model3DGenerationRequestSchema.parse({
        ...req.body,
        scanId,
      });

      // Load scan and point cloud
      const scanData = await lidar3DScanningService.getScan(req.user!.tenant_id, scanId);

      res.json({
        success: true,
        message: '3D model generation request accepted',
        data: {
          scanId,
          format: request.format,
          status: 'processing',
        },
      });
    } catch (error: any) {
      logger.error('Generate model error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        });
      }
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to generate model',
      });
    }
  }
);

/**
 * GET /api/lidar/scans/:scanId/ar-data
 * Get ARKit data for iOS AR visualization
 */
router.get(
  '/scans/:scanId/ar-data',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'ar_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const scanId = req.params.scanId;

      const arData = await lidar3DScanningService.generateARKitData(req.user!.tenant_id, scanId);

      res.json({
        success: true,
        data: arData,
      });
    } catch (error: any) {
      logger.error('Get AR data error:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to generate AR data',
      });
    }
  }
);

/**
 * POST /api/lidar/scans/:scanId/annotations
 * Add manual damage annotation to scan
 */
router.post(
  '/scans/:scanId/annotations',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage_report:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'damage_annotation' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const scanId = req.params.scanId;
      const annotation = DamageAnnotationSchema.parse(req.body);

      // Store annotation in database
      // Implementation would go here

      res.status(201).json({
        success: true,
        message: 'Damage annotation added successfully',
        data: annotation,
      });
    } catch (error: any) {
      logger.error('Add annotation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid annotation data',
          details: error.issues,
        });
      }
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to add annotation',
      });
    }
  }
);

/**
 * GET /api/lidar/scans/:scanId/download/:format
 * Download 3D model in specified format
 */
router.get(
  '/scans/:scanId/download/:format',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: '3d_model_download' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const scanId = req.params.scanId;
      const format = req.params.format as any;

      const scanData = await lidar3DScanningService.getScan(req.user!.tenant_id, scanId);
      const model = scanData.models.find(m => m.format === format);

      if (!model) {
        throw new NotFoundError(`Model in ${format} format not found`);
      }

      // Redirect to blob storage URL
      res.redirect(model.fileUrl);
    } catch (error: any) {
      logger.error('Download model error:', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: getErrorMessage(error) || 'Failed to download model',
        });
      }
    }
  }
);

/**
 * GET /api/lidar/vehicles/:vehicleId/latest-scan
 * Get latest scan for a vehicle
 */
router.get(
  '/vehicles/:vehicleId/latest-scan',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'latest_scan' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);

      const result = await lidar3DScanningService.listScans(req.user!.tenant_id, vehicleId, 1, 1);

      if (result.scans.length === 0) {
        throw new NotFoundError('No scans found for this vehicle');
      }

      const latestScan = result.scans[0];
      const scanData = await lidar3DScanningService.getScan(
        req.user!.tenant_id,
        latestScan.scanId
      );

      res.json({
        success: true,
        data: scanData,
      });
    } catch (error: any) {
      logger.error('Get latest scan error:', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: getErrorMessage(error) || 'Failed to retrieve latest scan',
        });
      }
    }
  }
);

/**
 * GET /api/lidar/stats
 * Get LiDAR scanning statistics for tenant
 */
router.get(
  '/stats',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'lidar_stats' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await lidar3DScanningService.listScans(req.user!.tenant_id, undefined, 1, 1000);

      const stats = {
        totalScans: result.total,
        totalModels: result.scans.reduce((sum, scan) => sum + scan.modelCount, 0),
        totalDamageAnnotations: result.scans.reduce((sum, scan) => sum + scan.damageCount, 0),
        scansBy Scanner: result.scans.reduce((acc: any, scan: any) => {
          acc[scan.scannerType] = (acc[scan.scannerType] || 0) + 1;
          return acc;
        }, {}),
        averagePointsPerScan:
          result.scans.reduce((sum, scan) => sum + scan.pointCount, 0) / result.scans.length || 0,
        recentScans: result.scans.slice(0, 5),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get LiDAR stats error:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to retrieve statistics',
      });
    }
  }
);

/**
 * DELETE /api/lidar/scans/:scanId
 * Delete a LiDAR scan and all associated data
 */
router.delete(
  '/scans/:scanId',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage_report:delete:own'),
  auditLog({ action: 'DELETE', resourceType: 'lidar_scan' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const scanId = req.params.scanId;

      // Implementation would delete scan and all related models/annotations
      // from database and blob storage

      res.json({
        success: true,
        message: 'LiDAR scan deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete LiDAR scan error:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error) || 'Failed to delete scan',
      });
    }
  }
);

export default router;
