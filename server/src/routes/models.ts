/**
 * 3D Vehicle Models API Routes
 * Handles search, upload, download, and management of 3D models
 * REFACTORED: Uses repository pattern for database access
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { logger } from '../services/logger';
import { authenticateToken } from '../middleware/auth';
import { ModelsContainer } from '../containers/models.container';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'model/gltf-binary',
      'model/gltf+json',
      'application/octet-stream',
    ];
    const allowedExts = ['.glb', '.gltf', '.fbx', '.obj', '.usdz'];
    const ext = file.originalname.toLowerCase().match(/\.[^.]*$/)?.[0] || '';

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only GLB, GLTF, FBX, OBJ, and USDZ files are allowed.'
        )
      );
    }
  },
});

// Helper to get tenant ID from request
const getTenantId = (req: Request): number => {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return parseInt(tenantId as string, 10);
};

/**
 * GET /api/v1/models
 * List all available 3D models with filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      vehicleType,
      make,
      source,
      quality,
      limit = '20',
      offset = '0',
    } = req.query;

    const container: ModelsContainer = req.app.locals.modelsContainer;
    const modelsRepo = container.getModelsRepository();
    const tenantId = getTenantId(req);

    const result = await modelsRepo.searchModels(
      {
        search: search as string,
        vehicleType: vehicleType as string,
        make: make as string,
        source: source as string,
        quality: quality as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
      tenantId
    );

    res.json({
      models: result.models,
      total: result.total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

/**
 * GET /api/v1/models/search
 * Search models using full-text search
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, vehicleType, make, source, limit = '20' } = req.query;

    const container: ModelsContainer = req.app.locals.modelsContainer;
    const modelsRepo = container.getModelsRepository();
    const tenantId = getTenantId(req);

    const models = await modelsRepo.fullTextSearch(
      (q as string) || null,
      (vehicleType as string) || null,
      (make as string) || null,
      (source as string) || null,
      parseInt(limit as string),
      tenantId
    );

    res.json({
      models,
      total: models.length,
    });
  } catch (error) {
    logger.error('Error searching models:', error);
    res.status(500).json({ error: 'Failed to search models' });
  }
});

/**
 * GET /api/v1/models/featured
 * Get featured models
 */
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '10');

    const container: ModelsContainer = req.app.locals.modelsContainer;
    const modelsRepo = container.getModelsRepository();
    const tenantId = getTenantId(req);

    const models = await modelsRepo.getFeaturedModels(limit, tenantId);

    res.json({ models });
  } catch (error) {
    logger.error('Error fetching featured models:', error);
    res.status(500).json({ error: 'Failed to fetch featured models' });
  }
});

/**
 * GET /api/v1/models/popular
 * Get popular models
 */
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '10');

    const container: ModelsContainer = req.app.locals.modelsContainer;
    const modelsRepo = container.getModelsRepository();
    const tenantId = getTenantId(req);

    const models = await modelsRepo.getPopularModels(limit, tenantId);

    res.json({ models });
  } catch (error) {
    logger.error('Error fetching popular models:', error);
    res.status(500).json({ error: 'Failed to fetch popular models' });
  }
});

/**
 * GET /api/v1/models/:id
 * Get model details by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const container: ModelsContainer = req.app.locals.modelsContainer;
    const modelsRepo = container.getModelsRepository();
    const tenantId = getTenantId(req);

    const model = await modelsRepo.getModelById(parseInt(id), tenantId);

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json({ model });
  } catch (error) {
    logger.error('Error fetching model:', error);
    res.status(500).json({ error: 'Failed to fetch model' });
  }
});

/**
 * POST /api/v1/models/upload
 * Upload a custom 3D model
 */
router.post(
  '/upload',
  authenticateToken,
  upload.single('model'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const {
        name,
        description,
        vehicleType,
        make,
        model,
        year,
        license,
        quality,
        tags,
      } = req.body;

      const container: ModelsContainer = req.app.locals.modelsContainer;
      const modelsRepo = container.getModelsRepository();
      const azureBlob = container.getAzureBlobService();
      const tenantId = getTenantId(req);

      // Upload to Azure Blob Storage
      const uploadResult = await azureBlob.uploadModel(
        req.file.buffer,
        req.file.originalname,
        {
          metadata: {
            uploadedBy: String(req.user?.id || 'unknown'),
            name,
            vehicleType,
          },
        }
      );

      // Save to database via repository
      const savedModel = await modelsRepo.uploadModel(
        {
          name,
          description,
          vehicleType,
          make,
          model,
          year: year ? parseInt(year) : undefined,
          fileUrl: uploadResult.cdnUrl,
          fileFormat: req.file.originalname.split('.').pop(),
          fileSizeMb: parseFloat((uploadResult.size / (1024 * 1024)).toFixed(2)),
          source: 'custom',
          license: license || 'Custom',
          qualityTier: quality || 'medium',
          tags: tags ? tags.split(',') : undefined,
        },
        tenantId
      );

      logger.info(`Model uploaded: ${name} by user ${req.user?.id}`);

      res.status(201).json({
        model: savedModel,
        message: 'Model uploaded successfully',
      });
    } catch (error: any) {
      logger.error('Error uploading model:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to upload model' });
    }
  }
);

/**
 * POST /api/v1/models/import-sketchfab
 * Import a model from Sketchfab
 */
router.post(
  '/import-sketchfab',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { uid, saveToAzure = true } = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'Sketchfab UID is required' });
      }

      const container: ModelsContainer = req.app.locals.modelsContainer;
      const modelsRepo = container.getModelsRepository();
      const sketchfab = container.getSketchfabService();
      const azureBlob = container.getAzureBlobService();
      const tenantId = getTenantId(req);

      // Get model details
      const modelDetails = await sketchfab.getModel(uid);

      let fileUrl = modelDetails.viewerUrl;
      let source = 'sketchfab';

      // Optionally download and upload to Azure
      if (saveToAzure) {
        try {
          const tempPath = `/tmp/${uid}.glb`;
          await sketchfab.downloadModel(uid, tempPath);

          const uploadResult = await azureBlob.uploadFromFile(tempPath, {
            fileName: `sketchfab_${uid}.glb`,
            metadata: {
              sketchfabUid: uid,
              sketchfabAuthor: modelDetails.user.username,
            },
          });

          fileUrl = uploadResult.cdnUrl;
          source = 'azure-blob';

          // Clean up temp file
          const fs = await import('fs/promises');
          await fs.unlink(tempPath);
        } catch (downloadError) {
          logger.warn(
            'Could not download Sketchfab model, using viewer URL:',
            downloadError
          );
        }
      }

      // Extract metadata
      const thumbnail =
        modelDetails.thumbnails.images[
          modelDetails.thumbnails.images.length - 1
        ]?.url;

      // Save to database via repository
      const savedModel = await modelsRepo.importSketchfabModel(
        {
          name: modelDetails.name,
          description: modelDetails.description,
          fileUrl,
          source,
          sourceId: uid,
          license: modelDetails.license.label,
          licenseUrl: modelDetails.license.url,
          author: modelDetails.user.displayName,
          authorUrl: modelDetails.user.profileUrl,
          thumbnailUrl: thumbnail,
          polyCount: modelDetails.faceCount,
          viewCount: modelDetails.viewCount,
        },
        tenantId
      );

      res.status(201).json({
        model: savedModel,
        message: 'Sketchfab model imported successfully',
      });
    } catch (error: any) {
      logger.error('Error importing Sketchfab model:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to import Sketchfab model' });
    }
  }
);

/**
 * DELETE /api/v1/models/:id
 * Delete a model (soft delete)
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const container: ModelsContainer = req.app.locals.modelsContainer;
      const modelsRepo = container.getModelsRepository();
      const tenantId = getTenantId(req);

      await modelsRepo.softDeleteModel(parseInt(id), tenantId);

      logger.info(`Model soft-deleted: ${id} by user ${req.user?.id}`);

      res.json({ message: 'Model deleted successfully' });
    } catch (error) {
      logger.error('Error deleting model:', error);
      res.status(500).json({ error: 'Failed to delete model' });
    }
  }
);

/**
 * POST /api/v1/vehicles/:vehicleId/assign-model
 * Assign a 3D model to a vehicle
 */
router.post(
  '/vehicles/:vehicleId/assign-model',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const { modelId } = req.body;

      if (!modelId) {
        return res.status(400).json({ error: 'Model ID is required' });
      }

      const container: ModelsContainer = req.app.locals.modelsContainer;
      const modelsRepo = container.getModelsRepository();
      const tenantId = getTenantId(req);

      await modelsRepo.assignModelToVehicle(
        parseInt(vehicleId),
        parseInt(modelId),
        tenantId
      );

      logger.info(
        `Model ${modelId} assigned to vehicle ${vehicleId} by user ${req.user?.id}`
      );

      res.json({ message: 'Model assigned to vehicle successfully' });
    } catch (error: any) {
      logger.error('Error assigning model to vehicle:', error);
      res.status(500).json({ error: error.message || 'Failed to assign model to vehicle' });
    }
  }
);

/**
 * GET /api/v1/models/:id/download
 * Download a model file
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const container: ModelsContainer = req.app.locals.modelsContainer;
    const modelsRepo = container.getModelsRepository();
    const azureBlob = container.getAzureBlobService();
    const tenantId = getTenantId(req);

    const model = await modelsRepo.getModelForDownload(parseInt(id), tenantId);

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Generate SAS token for Azure or return direct URL
    if (model.source === 'azure-blob') {
      try {
        const blobName = model.file_url.split('/').pop();
        const sasUrl = await azureBlob.generateSasUrl(blobName, 60); // 1 hour
        res.json({ downloadUrl: sasUrl });
      } catch (error) {
        // Fallback to direct URL
        res.json({ downloadUrl: model.file_url });
      }
    } else {
      res.json({ downloadUrl: model.file_url });
    }
  } catch (error) {
    logger.error('Error getting download URL:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

export default router;
