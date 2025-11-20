import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { MobileDamageService, MobilePhotoData, LiDARScanData, VideoAnalysisData } from '../services/mobileDamageService';
import { OpenAIVisionService } from '../services/openaiVisionService';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { aiProcessingLimiter } from '../config/rate-limiters'
import { validateFileContent, validateFileSize } from '../utils/file-validation'
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { rateLimit } from '../middleware/rateLimit';

const router = express.Router();

/**
 * Validate that a vehicle belongs to the user's tenant
 */
async function validateVehicleTenant(vehicleId: string, tenantId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
      [vehicleId, tenantId]
    );
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error validating vehicle tenant', { error, vehicleId, tenantId });
    return false;
  }
}

// Lazy initialization of services to avoid startup errors when OpenAI API key is not configured
let mobileDamageService: MobileDamageService | null = null;
let visionService: OpenAIVisionService | null = null;

function getMobileDamageService(): MobileDamageService {
  if (!mobileDamageService) {
    mobileDamageService = new MobileDamageService();
  }
  return mobileDamageService;
}

function getVisionService(): OpenAIVisionService {
  if (!visionService) {
    visionService = new OpenAIVisionService();
  }
  return visionService;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for videos, validated per file type // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

/**
 * POST /api/damage/analyze-photo
 * Analyze single photo for damage detection
 * Requires: Authentication, damage:analyze permission, rate limiting
 */
router.post(
  '/analyze-photo',
  authenticateJWT,
  requirePermission('damage:analyze'),
  rateLimit(20, 60000), // 20 requests per minute
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    // SECURITY: Validate file content and size
    const contentValidation = await validateFileContent(req.file.buffer);
    if (!contentValidation.valid) {
      return res.status(400).json({
        error: 'File validation failed',
        message: contentValidation.error
      });
    }

    // Validate file size for images (10MB limit for damage analysis photos)
    const sizeValidation = validateFileSize(req.file.buffer, contentValidation.mimeType!);
    if (!sizeValidation.valid) {
      return res.status(400).json({
        error: 'File size validation failed',
        message: sizeValidation.error
      });
    }

    logger.info('Analyzing photo for damage', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: contentValidation.mimeType,
      validatedType: contentValidation.extension
    });

    // Convert buffer to base64 data URL
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Parse metadata from request body
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

    const photoData: MobilePhotoData = {
      imageUrl: base64Image,
      metadata: {
        deviceModel: metadata.deviceModel || 'Unknown',
        captureDate: metadata.captureDate ? new Date(metadata.captureDate) : new Date(),
        gpsLocation: metadata.gpsLocation,
        cameraSettings: metadata.cameraSettings || {},
        orientation: metadata.orientation || 'portrait',
        dimensions: {
          width: metadata.width || 1920,
          height: metadata.height || 1080
        },
        depthData: metadata.depthData // Optional depth data from iPhone
      }
    };

    // Analyze photo with depth enhancement if available
    const analysis = await getMobileDamageService().analyzePhotoWithDepth(photoData);

    // Calculate cost estimate
    const costEstimate = getVisionService().estimateCost(analysis);

    res.json({
      success: true,
      analysis,
      costEstimate
    });
  } catch (error) {
    logger.error('Error analyzing photo', { error });
    res.status(500).json({
      error: 'Failed to analyze photo',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/damage/analyze-lidar
 * Analyze LiDAR scan data with reference photos
 * Requires: Authentication, damage:analyze permission, rate limiting
 */
router.post(
  '/analyze-lidar',
  authenticateJWT,
  requirePermission('damage:analyze'),
  rateLimit(10, 60000), // 10 requests per minute (more intensive)
  upload.array('photos', 10),
  async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photo files provided' });
    }

    if (!req.body.lidarData) {
      return res.status(400).json({ error: 'No LiDAR data provided' });
    }

    logger.info('Analyzing LiDAR scan', {
      photoCount: req.files.length,
      lidarPointCount: JSON.parse(req.body.lidarData).scanMetadata?.pointCount
    });

    // Parse LiDAR data
    const lidarData: LiDARScanData = JSON.parse(req.body.lidarData);

    // Convert photos to MobilePhotoData format
    const photos: MobilePhotoData[] = (req.files as Express.Multer.File[]).map((file, index) => {
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const photoMetadata = req.body[`metadata_${index}`] ? JSON.parse(req.body[`metadata_${index}`]) : {};

      return {
        imageUrl: base64Image,
        metadata: {
          deviceModel: photoMetadata.deviceModel || lidarData.scanMetadata.deviceModel,
          captureDate: new Date(),
          cameraSettings: photoMetadata.cameraSettings || {},
          orientation: 'landscape',
          dimensions: {
            width: photoMetadata.width || 1920,
            height: photoMetadata.height || 1080
          }
        }
      };
    });

    // Analyze with LiDAR enhancement
    const analysis = await getMobileDamageService().analyzeLiDARScan(lidarData, photos);

    // Calculate cost estimate
    const costEstimate = getVisionService().estimateCost(analysis);

    res.json({
      success: true,
      analysis,
      costEstimate
    });
  } catch (error) {
    logger.error('Error analyzing LiDAR scan', { error });
    res.status(500).json({
      error: 'Failed to analyze LiDAR scan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/damage/analyze-video
 * Analyze video walkthrough for damage detection
 * Requires: Authentication, damage:analyze permission, strict rate limiting
 */
router.post(
  '/analyze-video',
  authenticateJWT,
  requirePermission('damage:analyze'),
  rateLimit(5, 60000), // 5 requests per minute (very intensive)
  upload.single('video'),
  async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    logger.info('Analyzing video for damage', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // In production, upload video to Azure Blob Storage and process asynchronously
    // For now, we'll return a placeholder response
    const videoData: VideoAnalysisData = {
      videoUrl: `temp://${req.file.originalname}`,
      metadata: {
        duration: parseFloat(req.body.duration || '0'),
        fps: parseInt(req.body.fps || '30'),
        resolution: {
          width: parseInt(req.body.width || '1920'),
          height: parseInt(req.body.height || '1080')
        },
        format: req.file.mimetype.split('/')[1] || 'mp4',
        fileSize: req.file.size
      }
    };

    // Extract key frames from video (placeholder - would use FFmpeg in production)
    const frameInterval = parseFloat(req.body.frameInterval || '1');
    const analysis = await getMobileDamageService().analyzeVideoWalkthrough(videoData, frameInterval);

    // Calculate cost estimate
    const costEstimate = getVisionService().estimateCost(analysis);

    res.json({
      success: true,
      analysis,
      costEstimate,
      note: 'Video analysis is currently in preview mode'
    });
  } catch (error) {
    logger.error('Error analyzing video', { error });
    res.status(500).json({
      error: 'Failed to analyze video',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/damage/comprehensive-analysis
 * Comprehensive analysis using all available mobile capabilities
 * Requires: Authentication, damage:analyze permission, strict rate limiting
 */
router.post(
  '/comprehensive-analysis',
  authenticateJWT,
  requirePermission('damage:analyze'),
  rateLimit(5, 60000), // 5 requests per minute (very intensive)
  upload.array('photos', 20),
  async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }

    logger.info('Starting comprehensive damage analysis', {
      photoCount: req.files.length,
      hasLiDAR: !!req.body.lidarData,
      hasVideo: !!req.body.videoUrl
    });

    // Parse photos
    const photos: MobilePhotoData[] = (req.files as Express.Multer.File[]).map((file, index) => {
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const photoMetadata = req.body[`metadata_${index}`] ? JSON.parse(req.body[`metadata_${index}`]) : {};

      return {
        imageUrl: base64Image,
        metadata: {
          deviceModel: photoMetadata.deviceModel || 'Unknown',
          captureDate: new Date(),
          gpsLocation: photoMetadata.gpsLocation,
          cameraSettings: photoMetadata.cameraSettings || {},
          orientation: photoMetadata.orientation || 'landscape',
          dimensions: {
            width: photoMetadata.width || 1920,
            height: photoMetadata.height || 1080
          },
          depthData: photoMetadata.depthData
        }
      };
    });

    // Parse optional LiDAR data
    const lidarData: LiDARScanData | undefined = req.body.lidarData
      ? JSON.parse(req.body.lidarData)
      : undefined;

    // Parse optional video data
    const videoData: VideoAnalysisData | undefined = req.body.videoUrl
      ? {
          videoUrl: req.body.videoUrl,
          metadata: {
            duration: parseFloat(req.body.videoDuration || '0'),
            fps: parseInt(req.body.videoFps || '30'),
            resolution: {
              width: parseInt(req.body.videoWidth || '1920'),
              height: parseInt(req.body.videoHeight || '1080')
            },
            format: req.body.videoFormat || 'mp4',
            fileSize: parseInt(req.body.videoSize || '0')
          }
        }
      : undefined;

    // Run comprehensive analysis
    const analysis = await getMobileDamageService().comprehensiveAnalysis({
      lidarData,
      photos,
      videoData
    });

    // Calculate cost estimate
    const costEstimate = getVisionService().estimateCost(analysis);

    res.json({
      success: true,
      analysis,
      costEstimate,
      capabilities: {
        lidarUsed: !!lidarData,
        depthDataUsed: photos.some(p => p.metadata.depthData),
        videoUsed: !!videoData,
        multiPhotoAnalysis: photos.length > 1
      }
    });
  } catch (error) {
    logger.error('Error in comprehensive analysis', { error });
    res.status(500).json({
      error: 'Failed to complete comprehensive analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/damage/save
 * Save confirmed damage to database
 * Requires: Authentication, damage:create permission, tenant validation
 */
router.post(
  '/save',
  authenticateJWT,
  requirePermission('damage:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId, damages, photoUrls, analysisMetadata } = req.body;

      if (!vehicleId || !damages || damages.length === 0) {
        return res.status(400).json({ error: 'vehicleId and damages are required' });
      }

      // Validate vehicle belongs to user's tenant
      const hasAccess = await validateVehicleTenant(vehicleId, req.user!.tenant_id);
      if (!hasAccess) {
        logger.warn('Unauthorized vehicle access attempt', {
          vehicleId,
          userId: req.user!.id,
          tenantId: req.user!.tenant_id
        });
        return res.status(403).json({ error: 'Access denied: Vehicle not found or not accessible' });
      }

      logger.info('Saving damage records', {
        vehicleId,
        damageCount: damages.length,
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const insertedIds: string[] = [];

        for (const damage of damages) {
          const result = await client.query(
            `INSERT INTO vehicle_damage (
              vehicle_id,
              position_x, position_y, position_z,
              normal_x, normal_y, normal_z,
              severity,
              damage_type,
              part_name,
              description,
              photo_urls,
              cost_estimate,
              repair_status,
              reported_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
            RETURNING id`,
            [
              vehicleId,
              damage.position?.x || 0,
              damage.position?.y || 0,
              damage.position?.z || 0,
              damage.normal?.x || 0,
              damage.normal?.y || 1,
              damage.normal?.z || 0,
              damage.severity,
              damage.type,
              damage.part,
              damage.description,
              photoUrls || [],
              damage.costEstimate || 0,
              'pending'
            ]
          );

          insertedIds.push(result.rows[0].id);
        }

        await client.query('COMMIT');

        logger.info('Damage records saved successfully', {
          vehicleId,
          insertedCount: insertedIds.length
        });

        res.json({
          success: true,
          damageIds: insertedIds,
          message: `${insertedIds.length} damage records saved successfully`
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error saving damage records', { error });
      res.status(500).json({
        error: 'Failed to save damage records',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/damage/:vehicleId
 * Get all damage records for a vehicle
 * Requires: Authentication, damage:read permission, tenant validation
 */
router.get(
  '/:vehicleId',
  authenticateJWT,
  requirePermission('damage:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;

      // Validate vehicle belongs to user's tenant
      const hasAccess = await validateVehicleTenant(vehicleId, req.user!.tenant_id);
      if (!hasAccess) {
        logger.warn('Unauthorized vehicle access attempt', {
          vehicleId,
          userId: req.user!.id,
          tenantId: req.user!.tenant_id
        });
        return res.status(403).json({ error: 'Access denied: Vehicle not found or not accessible' });
      }

      logger.info('Fetching damage records', {
        vehicleId,
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      });

      const result = await pool.query(
        `SELECT
          id,
          vehicle_id,
          position_x, position_y, position_z,
          normal_x, normal_y, normal_z,
          severity,
          damage_type,
          part_name,
          description,
          photo_urls,
          cost_estimate,
          actual_repair_cost,
          repair_status,
          repair_scheduled_date,
          repair_completed_date,
          reported_at,
          updated_at
        FROM vehicle_damage
        WHERE vehicle_id = $1 AND deleted_at IS NULL
        ORDER BY reported_at DESC`,
        [vehicleId]
      );

      res.json({
        success: true,
        damages: result.rows
      });
    } catch (error) {
      logger.error('Error fetching damage records', { error });
      res.status(500).json({
        error: 'Failed to fetch damage records',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/damage/summary/:vehicleId
 * Get damage summary for a vehicle
 * Requires: Authentication, damage:read permission, tenant validation
 */
router.get(
  '/summary/:vehicleId',
  authenticateJWT,
  requirePermission('damage:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId } = req.params;

      // Validate vehicle belongs to user's tenant
      const hasAccess = await validateVehicleTenant(vehicleId, req.user!.tenant_id);
      if (!hasAccess) {
        logger.warn('Unauthorized vehicle access attempt', {
          vehicleId,
          userId: req.user!.id,
          tenantId: req.user!.tenant_id
        });
        return res.status(403).json({ error: 'Access denied: Vehicle not found or not accessible' });
      }

      logger.info('Fetching damage summary', {
        vehicleId,
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      });

      const result = await pool.query(
        `SELECT * FROM v_vehicle_damage_summary WHERE vehicle_id = $1`,
        [vehicleId]
      );

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          summary: {
            vehicle_id: vehicleId,
            total_damages: 0,
            critical_count: 0,
            severe_count: 0,
            moderate_count: 0,
            minor_count: 0,
            total_estimated_cost: 0,
            total_actual_cost: 0,
            pending_repairs: 0,
            completed_repairs: 0
          }
        });
      }

      res.json({
        success: true,
        summary: result.rows[0]
      });
    } catch (error) {
      logger.error('Error fetching damage summary', { error });
      res.status(500).json({
        error: 'Failed to fetch damage summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
