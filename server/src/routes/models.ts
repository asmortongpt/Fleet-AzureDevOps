/**
 * 3D Vehicle Models API Routes
 * Handles search, upload, download, and management of 3D models
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Pool } from 'pg';

import { authenticateToken } from '../middleware/auth';
import { getAzureBlobService } from '../services/azure-blob';
import { logger } from '../services/logger';
import { getSketchfabService } from '../services/sketchfab';

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

    const pool: Pool = req.app.locals.db;

    let query = `
      SELECT
        id, name, description, vehicle_type, make, model, year,
        file_url, file_format, file_size_mb, poly_count,
        source, license, thumbnail_url, preview_images,
        quality_tier, has_interior, has_pbr_materials,
        view_count, download_count, is_featured,
        tags, created_at
      FROM vehicle_3d_models
      WHERE is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(make, '') || ' ' || coalesce(model, ''))
                 @@ plainto_tsquery('english', $${paramIndex})`;
      params.push(search);
      paramIndex++;
    }

    if (vehicleType) {
      query += ` AND vehicle_type = $${paramIndex}`;
      params.push(vehicleType);
      paramIndex++;
    }

    if (make) {
      query += ` AND make ILIKE $${paramIndex}`;
      params.push(`%${make}%`);
      paramIndex++;
    }

    if (source) {
      query += ` AND source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    if (quality) {
      query += ` AND quality_tier = $${paramIndex}`;
      params.push(quality);
      paramIndex++;
    }

    query += ` ORDER BY is_featured DESC, view_count DESC, created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM vehicle_3d_models WHERE is_active = true`;
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      models: result.rows,
      total,
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

    const pool: Pool = req.app.locals.db;

    const result = await pool.query(
      `SELECT * FROM search_vehicle_3d_models($1, $2, $3, $4, $5)`,
      [
        q || null,
        vehicleType || null,
        make || null,
        source || null,
        parseInt(limit as string),
      ]
    );

    res.json({
      models: result.rows,
      total: result.rows.length,
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
    const pool: Pool = req.app.locals.db;
    const limit = parseInt((req.query.limit as string) || '10');

    const result = await pool.query(
      `SELECT * FROM v_featured_vehicle_3d_models LIMIT $1`,
      [limit]
    );

    res.json({ models: result.rows });
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
    const pool: Pool = req.app.locals.db;
    const limit = parseInt((req.query.limit as string) || '10');

    const result = await pool.query(
      `SELECT * FROM v_popular_vehicle_3d_models LIMIT $1`,
      [limit]
    );

    res.json({ models: result.rows });
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
    const pool: Pool = req.app.locals.db;

    const result = await pool.query(
      `SELECT * FROM vehicle_3d_models WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Increment view count
    await pool.query(`SELECT increment_model_view_count($1)`, [id]);

    res.json({ model: result.rows[0] });
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

      // Save to database
      const pool: Pool = req.app.locals.db;
      const result = await pool.query(
        `INSERT INTO vehicle_3d_models (
          name, description, vehicle_type, make, model, year,
          file_url, file_format, file_size_mb,
          source, license, thumbnail_url, quality_tier, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          name,
          description || null,
          vehicleType || null,
          make || null,
          model || null,
          year ? parseInt(year) : null,
          uploadResult.cdnUrl,
          req.file.originalname.split('.').pop(),
          (uploadResult.size / (1024 * 1024)).toFixed(2),
          'custom',
          license || 'Custom',
          null, // thumbnail_url
          quality || 'medium',
          tags ? tags.split(',') : null,
        ]
      );

      logger.info(`Model uploaded: ${name} by user ${req.user?.id}`);

      res.status(201).json({
        model: result.rows[0],
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

      // Save to database
      const pool: Pool = req.app.locals.db;
      const result = await pool.query(
        `INSERT INTO vehicle_3d_models (
          name, description, file_url, source, source_id,
          license, license_url, author, author_url,
          thumbnail_url, poly_count, view_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          modelDetails.name,
          modelDetails.description,
          fileUrl,
          source,
          uid,
          modelDetails.license.label,
          modelDetails.license.url,
          modelDetails.user.displayName,
          modelDetails.user.profileUrl,
          thumbnail,
          modelDetails.faceCount || null,
          modelDetails.viewCount || 0,
        ]
      );

      res.status(201).json({
        model: result.rows[0],
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
      const pool: Pool = req.app.locals.db;

      // Check if model exists and get file info
      const modelResult = await pool.query(
        `SELECT * FROM vehicle_3d_models WHERE id = $1`,
        [id]
      );

      if (modelResult.rows.length === 0) {
        return res.status(404).json({ error: 'Model not found' });
      }

      const model = modelResult.rows[0];

      // Soft delete (set is_active = false)
      await pool.query(
        `UPDATE vehicle_3d_models SET is_active = false WHERE id = $1`,
        [id]
      );

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

      const pool: Pool = req.app.locals.db;

      // Verify model exists
      const modelResult = await pool.query(
        `SELECT id FROM vehicle_3d_models WHERE id = $1 AND is_active = true`,
        [modelId]
      );

      if (modelResult.rows.length === 0) {
        return res.status(404).json({ error: 'Model not found' });
      }

      // Update vehicle
      await pool.query(`UPDATE vehicles SET model_3d_id = $1 WHERE id = $2`, [
        modelId,
        vehicleId,
      ]);

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
    const pool: Pool = req.app.locals.db;

    const result = await pool.query(
      `SELECT * FROM vehicle_3d_models WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const model = result.rows[0];

    // Increment download count
    await pool.query(`SELECT increment_model_download_count($1)`, [id]);

    // Redirect to file URL (or generate SAS token for Azure)
    if (model.source === 'azure-blob') {
      try {
        const azureBlob = getAzureBlobService();
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
