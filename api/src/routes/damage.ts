Here's the complete refactored version of the `damage.ts` file, replacing all `pool.query` calls with repository methods:


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import {
  MobileDamageService,
  MobilePhotoData,
  LiDARScanData,
  VideoAnalysisData,
} from '../services/mobileDamageService';
import { OpenAIVisionService } from '../services/openaiVisionService';
import { logger } from '../utils/logger';
import { aiProcessingLimiter } from '../config/rate-limiters';
import { validateFileContent, validateFileSize } from '../utils/file-validation';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { rateLimit } from '../middleware/rateLimit';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { VehicleRepository } from '../repositories/vehicleRepository';
import { DamageRepository } from '../repositories/damageRepository';

const router = express.Router();
const vehicleRepository = new VehicleRepository();
const damageRepository = new DamageRepository();

/**
 * Validate that a vehicle belongs to the user's tenant
 */
async function validateVehicleTenant(vehicleId: string, tenantId: string): Promise<boolean> {
  try {
    const result = await vehicleRepository.getVehicleByTenant(vehicleId, tenantId);
    return result !== null;
  } catch (error) {
    logger.error(`Error validating vehicle tenant`, { error, vehicleId, tenantId });
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
  },
});

/**
 * POST /api/damage/analyze-photo
 * Analyze single photo for damage detection
 * Requires: Authentication, damage:analyze permission, rate limiting
 */
router.post(
  '/analyze-photo',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage:analyze'),
  rateLimit(20, 60000), // 20 requests per minute
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError("No photo file provided");
      }

      // SECURITY: Validate file content and size
      const contentValidation = await validateFileContent(req.file.buffer);
      if (!contentValidation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: contentValidation.error,
        });
      }

      // Validate file size for images (10MB limit for damage analysis photos)
      const sizeValidation = validateFileSize(req.file.buffer, contentValidation.mimeType!);
      if (!sizeValidation.valid) {
        return res.status(400).json({
          error: 'File size validation failed',
          message: sizeValidation.error,
        });
      }

      logger.info('Analyzing photo for damage', {
        fileSize: req.file.size,
        fileName: req.file.originalname,
        userId: req.user.id,
        tenantId: req.user.tenantId,
      });

      const photoData: MobilePhotoData = {
        id: uuidv4(),
        data: req.file.buffer,
        contentType: req.file.mimetype,
        fileName: req.file.originalname,
      };

      const analysisResult = await getMobileDamageService().analyzePhoto(photoData);

      // Save analysis result to database
      await damageRepository.createDamageAnalysis({
        id: analysisResult.id,
        vehicleId: analysisResult.vehicleId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
        analysisType: 'photo',
        analysisResult: JSON.stringify(analysisResult),
        createdAt: new Date(),
      });

      res.status(200).json(analysisResult);
    } catch (error) {
      logger.error('Error analyzing photo', { error, userId: req.user.id });
      res.status(500).json({ error: 'An error occurred while analyzing the photo' });
    }
  }
);

/**
 * POST /api/damage/analyze-lidar
 * Analyze LiDAR scan for damage detection
 * Requires: Authentication, damage:analyze permission, rate limiting
 */
router.post(
  '/analyze-lidar',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage:analyze'),
  rateLimit(10, 60000), // 10 requests per minute
  upload.single('lidar'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError("No LiDAR file provided");
      }

      // SECURITY: Validate file content and size
      const contentValidation = await validateFileContent(req.file.buffer);
      if (!contentValidation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: contentValidation.error,
        });
      }

      // Validate file size for LiDAR scans (50MB limit)
      const sizeValidation = validateFileSize(req.file.buffer, contentValidation.mimeType!);
      if (!sizeValidation.valid) {
        return res.status(400).json({
          error: 'File size validation failed',
          message: sizeValidation.error,
        });
      }

      logger.info('Analyzing LiDAR scan for damage', {
        fileSize: req.file.size,
        fileName: req.file.originalname,
        userId: req.user.id,
        tenantId: req.user.tenantId,
      });

      const lidarData: LiDARScanData = {
        id: uuidv4(),
        data: req.file.buffer,
        contentType: req.file.mimetype,
        fileName: req.file.originalname,
      };

      const analysisResult = await getMobileDamageService().analyzeLiDAR(lidarData);

      // Save analysis result to database
      await damageRepository.createDamageAnalysis({
        id: analysisResult.id,
        vehicleId: analysisResult.vehicleId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
        analysisType: 'lidar',
        analysisResult: JSON.stringify(analysisResult),
        createdAt: new Date(),
      });

      res.status(200).json(analysisResult);
    } catch (error) {
      logger.error('Error analyzing LiDAR scan', { error, userId: req.user.id });
      res.status(500).json({ error: 'An error occurred while analyzing the LiDAR scan' });
    }
  }
);

/**
 * POST /api/damage/analyze-video
 * Analyze video for damage detection
 * Requires: Authentication, damage:analyze permission, rate limiting
 */
router.post(
  '/analyze-video',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage:analyze'),
  aiProcessingLimiter, // Custom rate limiter for AI processing
  upload.single('video'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError("No video file provided");
      }

      // SECURITY: Validate file content and size
      const contentValidation = await validateFileContent(req.file.buffer);
      if (!contentValidation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: contentValidation.error,
        });
      }

      // Validate file size for videos (50MB limit)
      const sizeValidation = validateFileSize(req.file.buffer, contentValidation.mimeType!);
      if (!sizeValidation.valid) {
        return res.status(400).json({
          error: 'File size validation failed',
          message: sizeValidation.error,
        });
      }

      logger.info('Analyzing video for damage', {
        fileSize: req.file.size,
        fileName: req.file.originalname,
        userId: req.user.id,
        tenantId: req.user.tenantId,
      });

      const videoData: VideoAnalysisData = {
        id: uuidv4(),
        data: req.file.buffer,
        contentType: req.file.mimetype,
        fileName: req.file.originalname,
      };

      const analysisResult = await getMobileDamageService().analyzeVideo(videoData);

      // Save analysis result to database
      await damageRepository.createDamageAnalysis({
        id: analysisResult.id,
        vehicleId: analysisResult.vehicleId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
        analysisType: 'video',
        analysisResult: JSON.stringify(analysisResult),
        createdAt: new Date(),
      });

      res.status(200).json(analysisResult);
    } catch (error) {
      logger.error('Error analyzing video', { error, userId: req.user.id });
      res.status(500).json({ error: 'An error occurred while analyzing the video' });
    }
  }
);

/**
 * GET /api/damage/analysis/:id
 * Retrieve a specific damage analysis
 * Requires: Authentication, damage:view permission
 */
router.get(
  '/analysis/:id',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage:view'),
  async (req: AuthRequest, res: Response) => {
    try {
      const analysisId = req.params.id;
      const analysis = await damageRepository.getDamageAnalysisById(analysisId);

      if (!analysis) {
        throw new NotFoundError('Damage analysis not found');
      }

      // Check if the analysis belongs to the user's tenant
      if (analysis.tenantId !== req.user.tenantId) {
        throw new NotFoundError('Damage analysis not found');
      }

      res.status(200).json({
        id: analysis.id,
        vehicleId: analysis.vehicleId,
        userId: analysis.userId,
        tenantId: analysis.tenantId,
        analysisType: analysis.analysisType,
        analysisResult: JSON.parse(analysis.analysisResult),
        createdAt: analysis.createdAt,
      });
    } catch (error) {
      logger.error('Error retrieving damage analysis', { error, userId: req.user.id });
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An error occurred while retrieving the damage analysis' });
      }
    }
  }
);

/**
 * GET /api/damage/analyses
 * Retrieve all damage analyses for the user's tenant
 * Requires: Authentication, damage:view permission
 */
router.get(
  '/analyses',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage:view'),
  async (req: AuthRequest, res: Response) => {
    try {
      const analyses = await damageRepository.getAllDamageAnalysesByTenant(req.user.tenantId);

      const formattedAnalyses = analyses.map(analysis => ({
        id: analysis.id,
        vehicleId: analysis.vehicleId,
        userId: analysis.userId,
        tenantId: analysis.tenantId,
        analysisType: analysis.analysisType,
        analysisResult: JSON.parse(analysis.analysisResult),
        createdAt: analysis.createdAt,
      }));

      res.status(200).json(formattedAnalyses);
    } catch (error) {
      logger.error('Error retrieving damage analyses', { error, userId: req.user.id });
      res.status(500).json({ error: 'An error occurred while retrieving the damage analyses' });
    }
  }
);

export default router;


In this refactored version, all database operations have been replaced with calls to the `VehicleRepository` and `DamageRepository` classes. The specific changes are:

1. Imported `VehicleRepository` and `DamageRepository` from their respective files.
2. Created instances of `vehicleRepository` and `damageRepository`.
3. Replaced `pool.query` calls with repository methods:
   - `vehicleRepository.getVehicleByTenant` in `validateVehicleTenant` function.
   - `damageRepository.createDamageAnalysis` in all POST routes.
   - `damageRepository.getDamageAnalysisById` in the GET /analysis/:id route.
   - `damageRepository.getAllDamageAnalysesByTenant` in the GET /analyses route.

These changes encapsulate the database operations within the repository classes, improving the separation of concerns and making the code more maintainable and testable.