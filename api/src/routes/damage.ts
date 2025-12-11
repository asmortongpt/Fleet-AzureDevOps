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

async function validateVehicleTenant(vehicleId: string, tenantId: string): Promise<boolean> {
  try {
    const result = await vehicleRepository.getVehicleByTenant(vehicleId, tenantId);
    return result !== null;
  } catch (error) {
    logger.error(`Error validating vehicle tenant`, { error, vehicleId, tenantId });
    return false;
  }
}

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

router.post(
  '/analyze-photo',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage:analyze'),
  rateLimit(20, 60000),
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError("No photo file provided");
      }

      const contentValidation = await validateFileContent(req.file.buffer);
      if (!contentValidation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: contentValidation.error,
        });
      }

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

router.post(
  '/analyze-lidar',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage:analyze'),
  rateLimit(10, 60000),
  upload.single('lidar'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError("No LiDAR file provided");
      }

      const contentValidation = await validateFileContent(req.file.buffer);
      if (!contentValidation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: contentValidation.error,
        });
      }

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

router.post(
  '/analyze-video',
  csrfProtection,
  authenticateJWT,
  requirePermission('damage:analyze'),
  aiProcessingLimiter,
  upload.single('video'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError("No video file provided");
      }

      const contentValidation = await validateFileContent(req.file.buffer);
      if (!contentValidation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: contentValidation.error,
        });
      }

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

export default router;