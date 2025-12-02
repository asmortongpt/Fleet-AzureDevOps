/**
 * 3D Vehicle Models API Routes
 * Handles search, upload, download, and management of 3D models
 * MIGRATED TO DRIZZLE ORM - All queries now use type-safe Drizzle operations
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import { db } from '../../../api/src/db';
import { vehicle3dModels, vehicles } from '../../../api/src/db/schema';
import { eq, desc, sql, and, or, like, ilike } from 'drizzle-orm';
import { getSketchfabService } from '../services/sketchfab';
import { getAzureBlobService } from '../services/azure-blob';
import { logger } from '../services/logger';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
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

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Build where conditions
    const conditions = [eq(vehicle3dModels.isActive, true)];

    if (search) {
      // Full-text search simulation using ILIKE
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(vehicle3dModels.name, searchTerm),
          ilike(vehicle3dModels.description, searchTerm),
          ilike(vehicle3dModels.make, searchTerm),
          ilike(vehicle3dModels.model, searchTerm)
        )!
      );
    }

    if (vehicleType) {
      conditions.push(eq(vehicle3dModels.vehicleType, vehicleType as string));
    }

    if (make) {
      conditions.push(ilike(vehicle3dModels.make, `%${make}%`));
    }

    if (source) {
      conditions.push(eq(vehicle3dModels.source, source as string));
    }

    if (quality) {
      conditions.push(eq(vehicle3dModels.qualityTier, quality as string));
    }

    // Fetch models with conditions
    const result = await db
      .select({
        id: vehicle3dModels.id,
        name: vehicle3dModels.name,
        description: vehicle3dModels.description,
        vehicleType: vehicle3dModels.vehicleType,
        make: vehicle3dModels.make,
        model: vehicle3dModels.model,
        year: vehicle3dModels.year,
        fileUrl: vehicle3dModels.fileUrl,
        fileFormat: vehicle3dModels.fileFormat,
        fileSizeMb: vehicle3dModels.fileSizeMb,
        polyCount: vehicle3dModels.polyCount,
        source: vehicle3dModels.source,
        license: vehicle3dModels.license,
        thumbnailUrl: vehicle3dModels.thumbnailUrl,
        previewImages: vehicle3dModels.previewImages,
        qualityTier: vehicle3dModels.qualityTier,
        hasInterior: vehicle3dModels.hasInterior,
        hasPbrMaterials: vehicle3dModels.hasPbrMaterials,
        viewCount: vehicle3dModels.viewCount,
        downloadCount: vehicle3dModels.downloadCount,
        isFeatured: vehicle3dModels.isFeatured,
        tags: vehicle3dModels.tags,
        createdAt: vehicle3dModels.createdAt,
      })
      .from(vehicle3dModels)
      .where(and(...conditions))
      .orderBy(
        desc(vehicle3dModels.isFeatured),
        desc(vehicle3dModels.viewCount),
        desc(vehicle3dModels.createdAt)
      )
      .limit(limitNum)
      .offset(offsetNum);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicle3dModels)
      .where(eq(vehicle3dModels.isActive, true));

    const total = Number(countResult[0]?.count || 0);

    res.json({
      models: result,
      total,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

/**
 * GET /api/v1/models/search
 * Search models using full-text search
 * Note: For true full-text search, use database functions or external search
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, vehicleType, make, source, limit = '20' } = req.query;

    const limitNum = parseInt(limit as string);
    const conditions = [eq(vehicle3dModels.isActive, true)];

    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(
        or(
          ilike(vehicle3dModels.name, searchTerm),
          ilike(vehicle3dModels.description, searchTerm),
          ilike(vehicle3dModels.make, searchTerm),
          ilike(vehicle3dModels.model, searchTerm)
        )!
      );
    }

    if (vehicleType) {
      conditions.push(eq(vehicle3dModels.vehicleType, vehicleType as string));
    }

    if (make) {
      conditions.push(ilike(vehicle3dModels.make, `%${make}%`));
    }

    if (source) {
      conditions.push(eq(vehicle3dModels.source, source as string));
    }

    const result = await db
      .select()
      .from(vehicle3dModels)
      .where(and(...conditions))
      .limit(limitNum);

    res.json({
      models: result,
      total: result.length,
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

    const result = await db
      .select()
      .from(vehicle3dModels)
      .where(and(eq(vehicle3dModels.isActive, true), eq(vehicle3dModels.isFeatured, true)))
      .orderBy(desc(vehicle3dModels.viewCount))
      .limit(limit);

    res.json({ models: result });
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

    const result = await db
      .select()
      .from(vehicle3dModels)
      .where(eq(vehicle3dModels.isActive, true))
      .orderBy(desc(vehicle3dModels.viewCount))
      .limit(limit);

    res.json({ models: result });
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
    const modelId = parseInt(id, 10);

    if (isNaN(modelId)) {
      return res.status(400).json({ error: 'Invalid model ID' });
    }

    const result = await db
      .select()
      .from(vehicle3dModels)
      .where(and(eq(vehicle3dModels.id, modelId), eq(vehicle3dModels.isActive, true)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Increment view count
    await db
      .update(vehicle3dModels)
      .set({ viewCount: sql`${vehicle3dModels.viewCount} + 1` })
      .where(eq(vehicle3dModels.id, modelId));

    res.json({ model: result[0] });
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

      // Upload to Azure Blob Storage
      const azureBlob = getAzureBlobService();
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

      // Save to database using Drizzle
      const result = await db
        .insert(vehicle3dModels)
        .values({
          name,
          description: description || null,
          vehicleType: vehicleType || null,
          make: make || null,
          model: model || null,
          year: year ? parseInt(year) : null,
          fileUrl: uploadResult.cdnUrl,
          fileFormat: req.file.originalname.split('.').pop() || null,
          fileSizeMb: (uploadResult.size / (1024 * 1024)).toFixed(2),
          source: 'custom',
          license: license || 'Custom',
          thumbnailUrl: null,
          qualityTier: quality || 'medium',
          tags: tags ? tags.split(',') : null,
        })
        .returning();

      logger.info(`Model uploaded: ${name} by user ${req.user?.id}`);

      res.status(201).json({
        model: result[0],
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

      const sketchfab = getSketchfabService();

      // Get model details
      const modelDetails = await sketchfab.getModel(uid);

      let fileUrl = modelDetails.viewerUrl;
      let source = 'sketchfab';

      // Optionally download and upload to Azure
      if (saveToAzure) {
        try {
          const tempPath = `/tmp/${uid}.glb`;
          await sketchfab.downloadModel(uid, tempPath);

          const azureBlob = getAzureBlobService();
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

      // Save to database using Drizzle
      const result = await db
        .insert(vehicle3dModels)
        .values({
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
          polyCount: modelDetails.faceCount || null,
          viewCount: modelDetails.viewCount || 0,
        })
        .returning();

      res.status(201).json({
        model: result[0],
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
      const modelId = parseInt(id, 10);

      if (isNaN(modelId)) {
        return res.status(400).json({ error: 'Invalid model ID' });
      }

      // Check if model exists
      const modelResult = await db
        .select()
        .from(vehicle3dModels)
        .where(eq(vehicle3dModels.id, modelId))
        .limit(1);

      if (modelResult.length === 0) {
        return res.status(404).json({ error: 'Model not found' });
      }

      // Soft delete (set is_active = false)
      await db
        .update(vehicle3dModels)
        .set({ isActive: false })
        .where(eq(vehicle3dModels.id, modelId));

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
      const vehicleIdNum = parseInt(vehicleId, 10);
      const modelIdNum = parseInt(modelId, 10);

      if (isNaN(vehicleIdNum) || isNaN(modelIdNum)) {
        return res.status(400).json({ error: 'Invalid vehicle or model ID' });
      }

      if (!modelId) {
        return res.status(400).json({ error: 'Model ID is required' });
      }

      // Verify model exists
      const modelResult = await db
        .select({ id: vehicle3dModels.id })
        .from(vehicle3dModels)
        .where(and(eq(vehicle3dModels.id, modelIdNum), eq(vehicle3dModels.isActive, true)))
        .limit(1);

      if (modelResult.length === 0) {
        return res.status(404).json({ error: 'Model not found' });
      }

      // Update vehicle
      await db
        .update(vehicles)
        .set({ model3dId: modelIdNum })
        .where(eq(vehicles.id, vehicleIdNum));

      logger.info(
        `Model ${modelId} assigned to vehicle ${vehicleId} by user ${req.user?.id}`
      );

      res.json({ message: 'Model assigned to vehicle successfully' });
    } catch (error) {
      logger.error('Error assigning model to vehicle:', error);
      res.status(500).json({ error: 'Failed to assign model to vehicle' });
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
    const modelId = parseInt(id, 10);

    if (isNaN(modelId)) {
      return res.status(400).json({ error: 'Invalid model ID' });
    }

    const result = await db
      .select()
      .from(vehicle3dModels)
      .where(and(eq(vehicle3dModels.id, modelId), eq(vehicle3dModels.isActive, true)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const model = result[0];

    // Increment download count
    await db
      .update(vehicle3dModels)
      .set({ downloadCount: sql`${vehicle3dModels.downloadCount} + 1` })
      .where(eq(vehicle3dModels.id, modelId));

    // Redirect to file URL (or generate SAS token for Azure)
    if (model.source === 'azure-blob') {
      try {
        const azureBlob = getAzureBlobService();
        const blobName = model.fileUrl.split('/').pop();
        const sasUrl = await azureBlob.generateSasUrl(blobName!, 60); // 1 hour
        res.json({ downloadUrl: sasUrl });
      } catch (error) {
        // Fallback to direct URL
        res.json({ downloadUrl: model.fileUrl });
      }
    } else {
      res.json({ downloadUrl: model.fileUrl });
    }
  } catch (error) {
    logger.error('Error getting download URL:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

export default router;
