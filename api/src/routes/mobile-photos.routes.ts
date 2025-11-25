/**
 * Mobile Photos API Routes
 *
 * Comprehensive endpoints for mobile photo upload and processing
 * Routes:
 * - POST /api/mobile/photos/upload - Upload single photo
 * - POST /api/mobile/photos/upload-batch - Batch upload
 * - GET /api/mobile/photos/sync-queue - Get pending uploads
 * - POST /api/mobile/photos/sync-complete - Mark as synced
 * - GET /api/mobile/photos/status/:id - Upload status
 * - GET /api/mobile/photos/:id - Get photo details
 * - DELETE /api/mobile/photos/:id - Delete photo
 * - GET /api/mobile/photos/processing/stats - Processing queue stats
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import pool from '../config/database';
import photoProcessingService from '../services/photo-processing.service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler'

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

      const tenantId = (req as any).user.tenant_id;
      const userId = (req as any).user.id;
      const priority = req.body.priority || 'normal';

      // Parse metadata if provided
      let metadata = {};
      if (req.body.metadata) {
        try {
          metadata = JSON.parse(req.body.metadata);
          PhotoMetadataSchema.parse(metadata);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid metadata format',
          });
        }
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${uuidv4()}.${fileExtension}`;

      // Upload to Azure Blob Storage
      const containerClient = blobServiceClient.getContainerClient('mobile-photos');
      await containerClient.createIfNotExists({ access: 'blob' });

      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.upload(req.file.buffer, req.file.buffer.length, {
        blobHTTPHeaders: {
          blobContentType: req.file.mimetype,
        },
        metadata: {
          originalName: req.file.originalname,
          uploadedBy: String(userId),
          tenantId: String(tenantId),
        },
      });

      const blobUrl = blockBlobClient.url;

      // Save photo record to database
      const photoResult = await pool.query(
        `INSERT INTO mobile_photos
         (tenant_id, user_id, photo_url, file_name, file_size, mime_type, metadata, taken_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          tenantId,
          userId,
          blobUrl,
          req.file.originalname,
          req.file.size,
          req.file.mimetype,
          JSON.stringify(metadata),
        ]
      );

      const photo = photoResult.rows[0];

      // Add to processing queue
      await photoProcessingService.addToQueue(
        tenantId,
        userId,
        photo.id,
        blobUrl,
        priority as 'high' | 'normal' | 'low'
      );

      res.status(201).json({
        success: true,
        photo: {
          id: photo.id,
          url: photo.photo_url,
          fileName: photo.file_name,
          uploadedAt: photo.created_at,
        },
      });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      res.status(500).json({
        error: 'Failed to upload photo',
        details: getErrorMessage(error),
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/upload-batch:
 *   post:
 *     summary: Upload multiple photos in batch
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
 *               - photos
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               metadata:
 *                 type: string
 *                 description: JSON array of metadata objects (one per photo)
 *     responses:
 *       201:
 *         description: Batch upload completed
 */
router.post(
  '/upload-batch',
  requirePermission('driver:create:global'),
  upload.array('photos', 20), // Max 20 photos per batch
  auditLog,
  async (req: Request, res: Response) => {
    try {
      initializeBlobService();

      if (!blobServiceClient) {
        return res.status(500).json({
          error: 'Azure Storage not configured',
        });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          error: 'No photo files provided',
        });
      }

      const tenantId = (req as any).user.tenant_id;
      const userId = (req as any).user.id;

      // Parse metadata array if provided
      let metadataArray: any[] = [];
      if (req.body.metadata) {
        try {
          metadataArray = JSON.parse(req.body.metadata);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid metadata format',
          });
        }
      }

      const containerClient = blobServiceClient.getContainerClient('mobile-photos');
      await containerClient.createIfNotExists({ access: 'blob' });

      const results: any[] = [];
      const errors: any[] = [];

      // Upload each photo
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i] as Express.Multer.File;
        const metadata = metadataArray[i] || {};

        try {
          // Generate unique filename
          const fileExtension = file.originalname.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${uuidv4()}.${fileExtension}`;

          // Upload to blob storage
          const blockBlobClient = containerClient.getBlockBlobClient(fileName);

          await blockBlobClient.upload(file.buffer, file.buffer.length, {
            blobHTTPHeaders: {
              blobContentType: file.mimetype,
            },
            metadata: {
              originalName: file.originalname,
              uploadedBy: String(userId),
              tenantId: String(tenantId),
            },
          });

          const blobUrl = blockBlobClient.url;

          // Save to database
          const photoResult = await pool.query(
            `INSERT INTO mobile_photos
             (tenant_id, user_id, photo_url, file_name, file_size, mime_type, metadata, taken_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING *`,
            [
              tenantId,
              userId,
              blobUrl,
              file.originalname,
              file.size,
              file.mimetype,
              JSON.stringify(metadata),
            ]
          );

          const photo = photoResult.rows[0];

          // Add to processing queue
          await photoProcessingService.addToQueue(
            tenantId,
            userId,
            photo.id,
            blobUrl,
            metadata.priority || 'normal'
          );

          results.push({
            success: true,
            photo: {
              id: photo.id,
              url: photo.photo_url,
              fileName: photo.file_name,
            },
          });
        } catch (error: any) {
          console.error(`Failed to upload photo ${i}:`, error);
          errors.push({
            index: i,
            fileName: file.originalname,
            error: getErrorMessage(error),
          });
        }
      }

      res.status(201).json({
        success: true,
        totalFiles: req.files.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors,
      });
    } catch (error: any) {
      console.error('Batch upload error:', error);
      res.status(500).json({
        error: 'Failed to upload photos',
        details: getErrorMessage(error),
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/sync-queue:
 *   get:
 *     summary: Get pending uploads for sync
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get photos uploaded since this timestamp
 *     responses:
 *       200:
 *         description: List of pending photos
 */
router.get(
  '/sync-queue',
  requirePermission('driver:view:global'),
  async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenant_id;
      const userId = (req as any).user.id;
      const since = req.query.since ? new Date(req.query.since as string) : null;

      let query = `
        SELECT
          mp.id,
          mp.photo_url,
          mp.thumbnail_url,
          mp.file_name,
          mp.file_size,
          mp.metadata,
          mp.created_at,
          mp.processed_at,
          ppq.status as processing_status,
          ppq.error_message
        FROM mobile_photos mp
        LEFT JOIN photo_processing_queue ppq ON ppq.photo_id = mp.id
        WHERE mp.tenant_id = $1 AND mp.user_id = $2
      `;

      const params: any[] = [tenantId, userId];

      if (since) {
        params.push(since);
        query += ` AND mp.created_at > $${params.length}`;
      }

      query += ` ORDER BY mp.created_at DESC LIMIT 100`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        photos: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      console.error('Sync queue error:', error);
      res.status(500).json({
        error: 'Failed to get sync queue',
        details: getErrorMessage(error),
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
 *         description: Photos marked as synced
 */
router.post(
  '/sync-complete',
  requirePermission('driver:update:global'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      const validated = SyncCompleteSchema.parse(req.body);
      const tenantId = (req as any).user.tenant_id;
      const userId = (req as any).user.id;

      // Update mobile_photos to mark as synced
      const result = await pool.query(
        `UPDATE mobile_photos
         SET synced_at = NOW(),
             synced_from_device = $1
         WHERE id = ANY($2)
           AND tenant_id = $3
           AND user_id = $4
         RETURNING id`,
        [validated.deviceId, validated.photoIds, tenantId, userId]
      );

      res.json({
        success: true,
        syncedCount: result.rowCount,
        syncedIds: result.rows.map(r => r.id),
      });
    } catch (error: any) {
      console.error('Sync complete error:', error);
      res.status(400).json({
        error: 'Failed to mark photos as synced',
        details: getErrorMessage(error),
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/status/{id}:
 *   get:
 *     summary: Get upload and processing status of a photo
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo status
 */
router.get(
  '/status/:id',
  requirePermission('driver:view:global'),
  async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);
      const tenantId = (req as any).user.tenant_id;

      const result = await pool.query(
        `SELECT
           mp.*,
           ppq.status as processing_status,
           ppq.priority,
           ppq.retry_count,
           ppq.error_message as processing_error,
           ppq.processing_started_at,
           ppq.processing_completed_at
         FROM mobile_photos mp
         LEFT JOIN photo_processing_queue ppq ON ppq.photo_id = mp.id
         WHERE mp.id = $1 AND mp.tenant_id = $2`,
        [photoId, tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Photo not found',
        });
      }

      res.json({
        success: true,
        photo: result.rows[0],
      });
    } catch (error: any) {
      console.error('Get status error:', error);
      res.status(500).json({
        error: 'Failed to get photo status',
        details: getErrorMessage(error),
      });
    }
  }
);

/**
 * @swagger
 * /api/mobile/photos/{id}:
 *   get:
 *     summary: Get photo details
 *     tags: [Mobile Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo details
 */
router.get(
  '/:id',
  requirePermission('driver:view:global'),
  async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);
      const tenantId = (req as any).user.tenant_id;

      const result = await pool.query(
        `SELECT 
      id,
      tenant_id,
      user_id,
      mobile_id,
      photo_url,
      metadata,
      taken_at,
      created_at FROM mobile_photos WHERE id = $1 AND tenant_id = $2`,
        [photoId, tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Photo not found',
        });
      }

      res.json({
        success: true,
        photo: result.rows[0],
      });
    } catch (error: any) {
      console.error('Get photo error:', error);
      res.status(500).json({
        error: 'Failed to get photo',
        details: getErrorMessage(error),
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
 *     responses:
 *       200:
 *         description: Photo deleted
 */
router.delete(
  '/:id',
  requirePermission('driver:delete:global'),
  auditLog,
  async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);
      const tenantId = (req as any).user.tenant_id;
      const userId = (req as any).user.id;

      // Get photo details first
      const photoResult = await pool.query(
        `SELECT 
      id,
      tenant_id,
      user_id,
      mobile_id,
      photo_url,
      metadata,
      taken_at,
      created_at FROM mobile_photos WHERE id = $1 AND tenant_id = $2`,
        [photoId, tenantId]
      );

      if (photoResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Photo not found',
        });
      }

      const photo = photoResult.rows[0];

      // Check if user owns the photo or is admin
      const userRole = (req as any).user.role;
      if (photo.user_id !== userId && userRole !== 'admin' && userRole !== 'fleet_manager') {
        return res.status(403).json({
          error: 'Unauthorized to delete this photo',
        });
      }

      // Delete from database (cascade will delete processing queue entry)
      await pool.query(
        `DELETE FROM mobile_photos WHERE id = $1`,
        [photoId]
      );

      // TODO: Delete from blob storage
      // This would require parsing the blob URL and deleting the blob

      res.json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete photo error:', error);
      res.status(500).json({
        error: 'Failed to delete photo',
        details: getErrorMessage(error),
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
 *         description: Processing queue stats
 */
router.get(
  '/processing/stats',
  requirePermission('driver:view:global'),
  async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenant_id;
      const userRole = (req as any).user.role;

      // Only admins can see global stats
      const statsForTenant = userRole === 'admin' || userRole === 'fleet_manager'
        ? tenantId
        : undefined;

      const stats = await photoProcessingService.getQueueStats(statsForTenant);

      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({
        error: 'Failed to get processing stats',
        details: getErrorMessage(error),
      });
    }
  }
);

export default router;
