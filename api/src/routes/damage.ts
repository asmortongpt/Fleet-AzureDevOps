To refactor the `damage.ts` file to use the repository pattern, we'll need to create a repository for database operations and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


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

const router = express.Router();
const vehicleRepository = new VehicleRepository();

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
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: contentValidation.mimeType,
        validatedType: contentValidation.extension,
      });

      // Convert buffer to base64 data URL
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Parse and analyze the photo
      const photoData: MobilePhotoData = {
        id: uuidv4(),
        image: base64Image,
        timestamp: new Date(),
        vehicleId: req.body.vehicleId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
      };

      // Validate vehicle ownership
      if (!await validateVehicleTenant(photoData.vehicleId, photoData.tenantId)) {
        throw new NotFoundError('Vehicle not found or does not belong to your tenant');
      }

      const analysisResult = await getMobileDamageService().analyzePhoto(photoData);

      // Store analysis result in the database
      await vehicleRepository.storeDamageAnalysis(photoData.id, photoData.vehicleId, analysisResult);

      res.status(200).json({
        analysisId: photoData.id,
        result: analysisResult,
      });
    } catch (error) {
      logger.error('Error analyzing photo', { error });
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
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: contentValidation.mimeType,
        validatedType: contentValidation.extension,
      });

      // Convert buffer to base64 data URL
      const base64LiDAR = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Parse and analyze the LiDAR scan
      const lidarData: LiDARScanData = {
        id: uuidv4(),
        scan: base64LiDAR,
        timestamp: new Date(),
        vehicleId: req.body.vehicleId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
      };

      // Validate vehicle ownership
      if (!await validateVehicleTenant(lidarData.vehicleId, lidarData.tenantId)) {
        throw new NotFoundError('Vehicle not found or does not belong to your tenant');
      }

      const analysisResult = await getMobileDamageService().analyzeLiDAR(lidarData);

      // Store analysis result in the database
      await vehicleRepository.storeDamageAnalysis(lidarData.id, lidarData.vehicleId, analysisResult);

      res.status(200).json({
        analysisId: lidarData.id,
        result: analysisResult,
      });
    } catch (error) {
      logger.error('Error analyzing LiDAR scan', { error });
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
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: contentValidation.mimetype,
        validatedType: contentValidation.extension,
      });

      // Convert buffer to base64 data URL
      const base64Video = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Parse and analyze the video
      const videoData: VideoAnalysisData = {
        id: uuidv4(),
        video: base64Video,
        timestamp: new Date(),
        vehicleId: req.body.vehicleId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
      };

      // Validate vehicle ownership
      if (!await validateVehicleTenant(videoData.vehicleId, videoData.tenantId)) {
        throw new NotFoundError('Vehicle not found or does not belong to your tenant');
      }

      const analysisResult = await getMobileDamageService().analyzeVideo(videoData);

      // Store analysis result in the database
      await vehicleRepository.storeDamageAnalysis(videoData.id, videoData.vehicleId, analysisResult);

      res.status(200).json({
        analysisId: videoData.id,
        result: analysisResult,
      });
    } catch (error) {
      logger.error('Error analyzing video', { error });
      res.status(500).json({ error: 'An error occurred while analyzing the video' });
    }
  }
);

export default router;


In this refactored version:

1. We've imported the `VehicleRepository` at the top of the file.

2. We've created an instance of `VehicleRepository` called `vehicleRepository`.

3. The `validateVehicleTenant` function now uses the `vehicleRepository.getVehicleByTenant` method instead of `pool.query`.

4. In each route handler, we've replaced the database operations with calls to `vehicleRepository.storeDamageAnalysis`.

5. We've kept all the route handlers as requested, maintaining their structure and functionality.

6. The `VehicleRepository` class would need to be implemented separately, with methods like `getVehicleByTenant` and `storeDamageAnalysis`. These methods would encapsulate the database operations that were previously done with `pool.query`.

Here's an example of what the `VehicleRepository` class might look like:


// vehicleRepository.ts

import { Pool } from 'pg';
import { logger } from '../utils/logger';

export class VehicleRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool();
  }

  async getVehicleByTenant(vehicleId: string, tenantId: string): Promise<any | null> {
    try {
      const result = await this.pool.query(
        'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [vehicleId, tenantId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting vehicle by tenant', { error, vehicleId, tenantId });
      throw error;
    }
  }

  async storeDamageAnalysis(analysisId: string, vehicleId: string, analysisResult: any): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO damage_analyses (id, vehicle_id, result) VALUES ($1, $2, $3)',
        [analysisId, vehicleId, JSON.stringify(analysisResult)]
      );
    } catch (error) {
      logger.error('Error storing damage analysis', { error, analysisId, vehicleId });
      throw error;
    }
  }
}


This refactored version adheres to the repository pattern, encapsulating database operations within the `VehicleRepository` class and removing all direct `pool.query` calls from the route handlers.