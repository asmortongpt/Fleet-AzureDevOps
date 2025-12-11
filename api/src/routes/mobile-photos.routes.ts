Here's the complete refactored version of `mobile-photos.routes.ts` with all `pool.query`/`db.query` replaced by repository methods. I've assumed the existence of a `PhotoRepository` class with appropriate methods.


import express, { Request, Response } from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import photoProcessingService from '../services/photo-processing.service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { PhotoRepository } from '../repositories/photo.repository';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Initialize blob service client
let blobServiceClient: BlobServiceClient | null = null;

const initializeBlobService = () => {
  if (!blobServiceClient && process.env.AZURE_STORAGE_CONNECTION_STRING) {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
  }
};

/**
 * Validation schemas
 */
const PhotoMetadataSchema = z.object({
  vehicleId: z.number().optional(),
  inspectionId: z.number().optional(),
  damageReportId: z.number().optional(),
  fuelTransactionId: z.number().optional(),
  reportType: z.enum(['damage', 'inspection', 'fuel', 'general']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const SyncCompleteSchema = z.object({
  photoIds: z.array(z.number()),
  deviceId: z.string(),
});

/**
 * @swagger
 * /api/mobile/photos/upload:
 *   post:
 *     summary: Upload a single photo
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               metadata:
 *                 type: string
 *                 description: JSON string of photo metadata
 *               priority:
 *                 type: string
 *                 enum: [high, normal, low]
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 */
router.post(
  '/upload',
  csrfProtection,
  requirePermission('driver:create:global'),
  upload.single('photo'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      initializeBlobService();

      if (!blobServiceClient) {
        return res.status(500).json({
          error: 'Azure Storage not configured',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No photo file provided',
        });
      }

      const metadata = req.body.metadata
        ? JSON.parse(req.body.metadata)
        : {};

      const validationResult = PhotoMetadataSchema.safeParse(metadata);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid metadata',
          details: validationResult.error,
        });
      }

      const priority = req.body.priority || 'normal';

      const photoId = await photoProcessingService.uploadPhoto(
        req.file,
        metadata,
        priority,
        blobServiceClient
      );

      await PhotoRepository.createPhoto({
        id: photoId,
        userId: req.user.id,
        metadata: JSON.stringify(metadata),
        status: 'uploaded',
        priority: priority,
      });

      res.status(201).json({
        message: 'Photo uploaded successfully',
        photoId: photoId,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({
        error: 'An error occurred while uploading the photo',
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/upload-batch:
 *   post:
 *     summary: Upload multiple photos
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               metadata:
 *                 type: string
 *                 description: JSON string of array of photo metadata
 *               priority:
 *                 type: string
 *                 enum: [high, normal, low]
 *     responses:
 *       201:
 *         description: Photos uploaded successfully
 */
router.post(
  '/upload-batch',
  csrfProtection,
  requirePermission('driver:create:global'),
  upload.array('photos'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      initializeBlobService();

      if (!blobServiceClient) {
        return res.status(500).json({
          error: 'Azure Storage not configured',
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No photo files provided',
        });
      }

      const metadataArray = req.body.metadata
        ? JSON.parse(req.body.metadata)
        : [];

      const priority = req.body.priority || 'normal';

      const photoIds: number[] = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i] as Express.Multer.File;
        const metadata = metadataArray[i] || {};

        const validationResult = PhotoMetadataSchema.safeParse(metadata);
        if (!validationResult.success) {
          return res.status(400).json({
            error: `Invalid metadata for photo ${i + 1}`,
            details: validationResult.error,
          });
        }

        const photoId = await photoProcessingService.uploadPhoto(
          file,
          metadata,
          priority,
          blobServiceClient
        );

        await PhotoRepository.createPhoto({
          id: photoId,
          userId: req.user.id,
          metadata: JSON.stringify(metadata),
          status: 'uploaded',
          priority: priority,
        });

        photoIds.push(photoId);
      }

      res.status(201).json({
        message: 'Photos uploaded successfully',
        photoIds: photoIds,
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      res.status(500).json({
        error: 'An error occurred while uploading the photos',
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/sync-complete:
 *   post:
 *     summary: Mark photo sync as complete
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photoIds
 *               - deviceId
 *             properties:
 *               photoIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sync marked as complete successfully
 */
router.post(
  '/sync-complete',
  csrfProtection,
  requirePermission('driver:update:global'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      const validationResult = SyncCompleteSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid request body',
          details: validationResult.error,
        });
      }

      const { photoIds, deviceId } = validationResult.data;

      await PhotoRepository.markSyncComplete(photoIds, deviceId);

      res.status(200).json({
        message: 'Sync marked as complete successfully',
      });
    } catch (error) {
      console.error('Error marking sync complete:', error);
      res.status(500).json({
        error: 'An error occurred while marking sync complete',
      });
    }
  }
);

export default router;


In this refactored version, I've replaced all database queries with calls to the `PhotoRepository` class. Here are the specific changes:

1. In the `/upload` route, the database insertion has been replaced with:
   
   await PhotoRepository.createPhoto({
     id: photoId,
     userId: req.user.id,
     metadata: JSON.stringify(metadata),
     status: 'uploaded',
     priority: priority,
   });
   

2. In the `/upload-batch` route, the database insertions have been replaced with:
   
   await PhotoRepository.createPhoto({
     id: photoId,
     userId: req.user.id,
     metadata: JSON.stringify(metadata),
     status: 'uploaded',
     priority: priority,
   });
   

3. In the `/sync-complete` route, the database update has been replaced with:
   
   await PhotoRepository.markSyncComplete(photoIds, deviceId);
   

These changes assume that the `PhotoRepository` class has the following methods:

- `createPhoto(photoData: { id: number, userId: number, metadata: string, status: string, priority: string }): Promise<void>`
- `markSyncComplete(photoIds: number[], deviceId: string): Promise<void>`

Make sure to implement these methods in the `PhotoRepository` class to handle the actual database operations.