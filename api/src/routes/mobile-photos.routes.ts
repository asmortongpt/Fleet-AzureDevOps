Here's the refactored version of `mobile-photos.routes.ts` with all `pool.query`/`db.query` replaced by repository methods. I've assumed the existence of a `PhotoRepository` class with appropriate methods. I've also completed the file as requested.


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
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: JSON string of photo metadata
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

      const photoIds = [];

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
      console.error('Error uploading batch of photos:', error);
      res.status(500).json({
        error: 'An error occurred while uploading the photos',
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/sync-queue:
 *   get:
 *     summary: Get pending uploads
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending uploads
 */
router.get(
  '/sync-queue',
  csrfProtection,
  requirePermission('driver:read:global'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      const pendingUploads = await PhotoRepository.getPendingUploads(req.user.id);
      res.json(pendingUploads);
    } catch (error) {
      console.error('Error getting sync queue:', error);
      res.status(500).json({
        error: 'An error occurred while retrieving the sync queue',
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/sync-complete:
 *   post:
 *     summary: Mark photos as synced
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
 *         description: Photos marked as synced successfully
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

      const { photoIds, deviceId } = req.body;

      await PhotoRepository.markPhotosAsSynced(photoIds, deviceId);

      res.json({
        message: 'Photos marked as synced successfully',
      });
    } catch (error) {
      console.error('Error marking photos as synced:', error);
      res.status(500).json({
        error: 'An error occurred while marking photos as synced',
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/status/{id}:
 *   get:
 *     summary: Get upload status of a photo
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The photo ID
 *     responses:
 *       200:
 *         description: Photo status
 *       404:
 *         description: Photo not found
 */
router.get(
  '/status/:id',
  csrfProtection,
  requirePermission('driver:read:global'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id, 10);
      const photo = await PhotoRepository.getPhotoById(photoId);

      if (!photo) {
        return res.status(404).json({
          error: 'Photo not found',
        });
      }

      res.json({
        id: photo.id,
        status: photo.status,
        priority: photo.priority,
      });
    } catch (error) {
      console.error('Error getting photo status:', error);
      res.status(500).json({
        error: 'An error occurred while retrieving the photo status',
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/{id}:
 *   get:
 *     summary: Get details of a photo
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The photo ID
 *     responses:
 *       200:
 *         description: Photo details
 *       404:
 *         description: Photo not found
 */
router.get(
  '/:id',
  csrfProtection,
  requirePermission('driver:read:global'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id, 10);
      const photo = await PhotoRepository.getPhotoById(photoId);

      if (!photo) {
        return res.status(404).json({
          error: 'Photo not found',
        });
      }

      res.json({
        id: photo.id,
        userId: photo.userId,
        metadata: JSON.parse(photo.metadata),
        status: photo.status,
        priority: photo.priority,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
      });
    } catch (error) {
      console.error('Error getting photo details:', error);
      res.status(500).json({
        error: 'An error occurred while retrieving the photo details',
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/{id}:
 *   delete:
 *     summary: Delete a photo
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The photo ID
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 *       404:
 *         description: Photo not found
 */
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('driver:delete:global'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id, 10);
      const deleted = await PhotoRepository.deletePhoto(photoId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Photo not found',
        });
      }

      res.json({
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({
        error: 'An error occurred while deleting the photo',
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/processing/stats:
 *   get:
 *     summary: Get processing queue statistics
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processing queue statistics
 */
router.get(
  '/processing/stats',
  csrfProtection,
  requirePermission('admin:read:global'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      const stats = await PhotoRepository.getProcessingStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting processing stats:', error);
      res.status(500).json({
        error: 'An error occurred while retrieving processing statistics',
      });
    }
  }
);

export default router;


In this refactored version, I've replaced all database operations with calls to methods from the `PhotoRepository` class. Here's a summary of the changes:

1. Added import for `PhotoRepository` at the top of the file.
2. Replaced `pool.query`/`db.query` calls with corresponding `PhotoRepository` methods:
   - `createPhoto` for inserting new photos
   - `getPendingUploads` for retrieving pending uploads
   - `markPhotosAsSynced` for updating photo sync status
   - `getPhotoById` for retrieving photo details and status
   - `deletePhoto` for deleting photos
   - `getProcessingStats` for retrieving processing queue statistics

3. Assumed the existence of the following methods in `PhotoRepository`:
   - `createPhoto(data: { id: string, userId: number, metadata: string, status: string, priority: string }): Promise<void>`
   - `getPendingUploads(userId: number): Promise<any[]>`
   - `markPhotosAsSynced(photoIds: number[], deviceId: string): Promise<void>`
   - `getPhotoById(photoId: number): Promise<any | null>`
   - `deletePhoto(photoId: number): Promise<boolean>`
   - `getProcessingStats(): Promise<any>`

These repository methods should be implemented in the `photo.repository.ts` file to handle the actual database operations.

Note that this refactoring assumes that the `PhotoRepository` class is properly set up and connected to the database. You may need to adjust the method signatures or implementations based on your specific database schema and requirements.