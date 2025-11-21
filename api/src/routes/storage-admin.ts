/**
 * Storage Admin Routes
 *
 * Administrative API endpoints for storage management
 * Endpoints:
 * - Upload/download/delete files
 * - List files and get metadata
 * - Storage statistics and quota management
 * - Migration between providers
 * - Auto-tiering management
 * - Deduplication stats
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import StorageManager from '../services/StorageManager';
import { loadStorageConfig, loadQuotaConfig, loadFailoverConfig, storageFeatures } from '../config/storage';
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router();

// Initialize multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '524288000') // 500MB default
  }
});

// Initialize storage manager (singleton)
let storageManager: StorageManager | null = null;

async function getStorageManager(): Promise<StorageManager> {
  if (!storageManager) {
    const config = loadStorageConfig();
    const quotaConfig = loadQuotaConfig();
    const failoverOrder = loadFailoverConfig();

    storageManager = new StorageManager(config, {
      enableDeduplication: storageFeatures.enableDeduplication,
      quotaConfig,
      failoverOrder: storageFeatures.enableFailover ? failoverOrder : []
    });

    await storageManager.initialize();
  }

  return storageManager;
}

/**
 * @swagger
 * /api/storage/upload:
 *   post:
 *     tags: [Storage]
 *     summary: Upload a file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               key:
 *                 type: string
 *               tier:
 *                 type: string
 *                 enum: [hot, warm, cold, archive]
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const manager = await getStorageManager();
    const key = req.body.key || `${Date.now()}-${req.file.originalname}`;
    const tier = req.body.tier || 'hot';

    const result = await manager.upload(key, req.file.buffer, {
      tier,
      metadata: {
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: (req as any).user?.id || 'anonymous'
      },
      contentType: req.file.mimetype,
      overwrite: req.body.overwrite === 'true'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/download/{key}:
 *   get:
 *     tags: [Storage]
 *     summary: Download a file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File content
 */
router.get('/download/:key(*)', async (req: Request, res: Response) => {
  try {
    const manager = await getStorageManager();
    const key = req.params.key;

    const result = await manager.download(key, {
      onProgress: (progress) => {
        // Could emit progress via WebSocket
      }
    });

    // Set headers
    res.setHeader('Content-Type', result.metadata.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', result.contentLength);

    if (result.metadata.filename) {
      res.setHeader('Content-Disposition', `attachment; filename="${result.metadata.filename}"`);
    }

    // Pipe stream to response
    result.stream.pipe(res);
  } catch (error: any) {
    console.error('Download error:', error);
    res.status(error.statusCode || 500).json({
      error: 'Download failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/url/{key}:
 *   get:
 *     tags: [Storage]
 *     summary: Get a presigned URL for file access
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *           default: 3600
 *     responses:
 *       200:
 *         description: Presigned URL
 */
router.get('/url/:key(*)', async (req: Request, res: Response) => {
  try {
    const manager = await getStorageManager();
    const key = req.params.key;
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600;

    const url = await manager.getUrl(key, {
      expiresIn,
      contentDisposition: req.query.disposition as any
    });

    res.json({
      success: true,
      data: { url, expiresIn }
    });
  } catch (error: any) {
    console.error('Get URL error:', error);
    res.status(error.statusCode || 500).json({
      error: 'Failed to generate URL',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/delete/{key}:
 *   delete:
 *     tags: [Storage]
 *     summary: Delete a file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete('/delete/:key(*)', async (req: Request, res: Response) => {
  try {
    const manager = await getStorageManager();
    const key = req.params.key;

    await manager.delete(key);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(error.statusCode || 500).json({
      error: 'Delete failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/list:
 *   get:
 *     tags: [Storage]
 *     summary: List files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [hot, warm, cold, archive]
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *       - in: query
 *         name: maxKeys
 *         schema:
 *           type: integer
 *           default: 1000
 *     responses:
 *       200:
 *         description: List of files
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const manager = await getStorageManager();

    const result = await manager.list({
      prefix: req.query.prefix as string,
      tier: req.query.tier as string,
      provider: req.query.provider as string,
      maxKeys: req.query.maxKeys ? parseInt(req.query.maxKeys as string) : 1000,
      continuationToken: req.query.continuationToken as string
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('List error:', error);
    res.status(500).json({
      error: 'List failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/stats:
 *   get:
 *     tags: [Storage]
 *     summary: Get storage usage statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const manager = await getStorageManager();
    const stats = await manager.getUsageStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/migrate:
 *   post:
 *     tags: [Storage]
 *     summary: Migrate files from one provider to another
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceProvider:
 *                 type: string
 *               targetProvider:
 *                 type: string
 *               deleteSource:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Migration job created
 */
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    const manager = await getStorageManager();
    const { sourceProvider, targetProvider, deleteSource } = req.body;

    if (!sourceProvider || !targetProvider) {
      return res.status(400).json({
        error: 'sourceProvider and targetProvider are required'
      });
    }

    const job = await manager.migrateFiles(sourceProvider, targetProvider, {
      deleteSource,
      onProgress: (progress) => {
        // Could emit progress via WebSocket
        console.log(`Migration progress: ${progress.completed}/${progress.total} - ${progress.current}`);
      }
    });

    res.json({
      success: true,
      data: job
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({
      error: 'Migration failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/tier/auto:
 *   post:
 *     tags: [Storage]
 *     summary: Perform automatic storage tiering
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tiering completed
 */
router.post('/tier/auto', async (req: Request, res: Response) => {
  try {
    if (!storageFeatures.enableAutoTiering) {
      return res.status(400).json({
        error: 'Auto-tiering is not enabled',
        message: 'Set STORAGE_ENABLE_AUTO_TIERING=true to enable this feature'
      });
    }

    const manager = await getStorageManager();
    const result = await manager.performAutoTiering();

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Auto-tiering error:', error);
    res.status(500).json({
      error: 'Auto-tiering failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/config:
 *   get:
 *     tags: [Storage]
 *     summary: Get storage configuration and features
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage configuration
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = loadStorageConfig();
    const quotaConfig = loadQuotaConfig();
    const failoverOrder = loadFailoverConfig();

    res.json({
      success: true,
      data: {
        provider: config.provider,
        features: storageFeatures,
        quota: quotaConfig,
        failoverOrder,
        maxFileSize: config.maxFileSize,
        allowedMimeTypes: config.allowedMimeTypes
      }
    });
  } catch (error: any) {
    console.error('Config error:', error);
    res.status(500).json({
      error: 'Failed to get config',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/health:
 *   get:
 *     tags: [Storage]
 *     summary: Check storage health
 *     responses:
 *       200:
 *         description: Storage is healthy
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const manager = await getStorageManager();
    const stats = await manager.getUsageStats();

    const health = {
      status: 'healthy',
      provider: loadStorageConfig().provider,
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
      quotaUsed: stats.quotaUsedPercent,
      features: storageFeatures
    };

    // Check quota warnings
    if (stats.quotaUsedPercent > 90) {
      health.status = 'warning';
    }

    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/batch/upload:
 *   post:
 *     tags: [Storage]
 *     summary: Upload multiple files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post('/batch/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const manager = await getStorageManager();
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const key = `${Date.now()}-${file.originalname}`;
        const result = await manager.upload(key, file.buffer, {
          tier: req.body.tier || 'hot',
          metadata: {
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: (req as any).user?.id || 'anonymous'
          },
          contentType: file.mimetype
        });
        results.push(result);
      } catch (error: any) {
        errors.push({
          filename: file.originalname,
          error: getErrorMessage(error)
        });
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        uploaded: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
  } catch (error: any) {
    console.error('Batch upload error:', error);
    res.status(500).json({
      error: 'Batch upload failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * @swagger
 * /api/storage/batch/delete:
 *   post:
 *     tags: [Storage]
 *     summary: Delete multiple files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Files deleted successfully
 */
router.post('/batch/delete', async (req: Request, res: Response) => {
  try {
    const { keys } = req.body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'keys array is required' });
    }

    const manager = await getStorageManager();
    const results = [];
    const errors = [];

    for (const key of keys) {
      try {
        await manager.delete(key);
        results.push(key);
      } catch (error: any) {
        errors.push({
          key,
          error: getErrorMessage(error)
        });
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        deleted: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
  } catch (error: any) {
    console.error('Batch delete error:', error);
    res.status(500).json({
      error: 'Batch delete failed',
      message: getErrorMessage(error)
    });
  }
});

export default router;
