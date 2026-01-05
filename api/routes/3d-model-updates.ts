/**
 * REST API for updating 3D models from external applications
 * Supports images, videos, and LiDAR data
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

import express, { Request, Response } from 'express';
import multer from 'multer';
import { Pool } from 'pg';

const router = express.Router();
const execAsync = promisify(exec);

// Configure file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', req.body.vehicleId || 'temp');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and LiDAR files
    const allowedTypes = /jpeg|jpg|png|mp4|mov|avi|ply|las|xyz|pcd/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, videos, LiDAR files (.ply, .las, .xyz)'));
    }
  }
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * POST /api/3d-models/update/image
 * Update model texture from image(s)
 */
router.post('/update/image', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const { vehicleId, textureType = 'diffuse', applyDamage = false } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
    }

    console.log(`📸 Updating vehicle ${vehicleId} with ${files.length} images`);

    // Get current model path from database
    const modelResult = await pool.query(
      'SELECT model_path, manufacturer, model FROM vehicle_3d_models WHERE vehicle_id = $1 AND is_current = true',
      [vehicleId]
    );

    if (modelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle 3D model not found' });
    }

    const currentModel = modelResult.rows[0];
    const modelPath = currentModel.model_path;

    // Prepare Blender Python script
    const imagePaths = files.map(f => f.path).join(',');
    const outputPath = path.join(process.cwd(), 'output', 'updated_models', `vehicle_${vehicleId}_${Date.now()}.glb`);

    const blenderScript = `
import bpy
import sys
sys.path.append('${path.join(process.cwd())}')

from update_model_from_media import ModelTextureUpdater

# Load model
updater = ModelTextureUpdater('${modelPath}')
if updater.load_model():
    # Apply images
    image_paths = '${imagePaths}'.split(',')
    for img_path in image_paths:
        updater.apply_image_texture(img_path, texture_type='${textureType}')

    # Save updated model
    updater.save_model('${outputPath}')
    print('SUCCESS:${outputPath}')
else:
    print('ERROR:Failed to load model')
    sys.exit(1)
`;

    const scriptPath = path.join(process.cwd(), 'temp', `update_${vehicleId}_${Date.now()}.py`);
    await fs.mkdir(path.dirname(scriptPath), { recursive: true });
    await fs.writeFile(scriptPath, blenderScript);

    // Execute Blender in background
    console.log('🔄 Running Blender to apply textures...');
    const { stdout, stderr } = await execAsync(
      `blender --background --python ${scriptPath}`
    );

    // Parse output
    const successMatch = stdout.match(/SUCCESS:(.+)/);
    if (successMatch) {
      const newModelPath = successMatch[1].trim();

      // Update database
      await pool.query(
        'UPDATE vehicle_3d_models SET is_current = false WHERE vehicle_id = $1',
        [vehicleId]
      );

      await pool.query(`
        INSERT INTO vehicle_3d_models
        (vehicle_id, model_path, texture_source, texture_type, is_current, created_at)
        VALUES ($1, $2, $3, $4, true, NOW())
      `, [vehicleId, newModelPath, 'uploaded_images', textureType]);

      // Clean up
      await fs.unlink(scriptPath);

      res.json({
        success: true,
        message: 'Model updated successfully',
        modelPath: newModelPath,
        imagesProcessed: files.length
      });

    } else {
      throw new Error('Blender execution failed: ' + stderr);
    }

  } catch (error) {
    console.error('Error updating model from images:', error);
    res.status(500).json({
      error: 'Failed to update model',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/3d-models/update/video
 * Extract textures from video and apply to model
 */
router.post('/update/video', upload.single('video'), async (req: Request, res: Response) => {
  try {
    const { vehicleId, frameInterval = 30, useFrames = '0,1,2,3' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }

    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
    }

    console.log(`🎥 Updating vehicle ${vehicleId} from video: ${file.originalname}`);

    // Get current model
    const modelResult = await pool.query(
      'SELECT model_path FROM vehicle_3d_models WHERE vehicle_id = $1 AND is_current = true',
      [vehicleId]
    );

    if (modelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle 3D model not found' });
    }

    const modelPath = modelResult.rows[0].model_path;
    const outputPath = path.join(process.cwd(), 'output', 'updated_models', `vehicle_${vehicleId}_video_${Date.now()}.glb`);
    const framesDir = path.join(process.cwd(), 'temp', 'frames', `vehicle_${vehicleId}`);

    const blenderScript = `
import bpy
import sys
sys.path.append('${path.join(process.cwd())}')

from update_model_from_media import ModelTextureUpdater

updater = ModelTextureUpdater('${modelPath}')
if updater.load_model():
    # Extract frames from video
    frames = updater.extract_frames_from_video(
        '${file.path}',
        '${framesDir}',
        frame_interval=${frameInterval}
    )

    if frames:
        # Create composite texture from selected frames
        selected_indices = [${useFrames}]
        selected_frames = [frames[i] for i in selected_indices if i < len(frames)]

        texture_path = updater.create_texture_from_multiple_images(
            selected_frames,
            '${path.join(framesDir, 'composite_texture.jpg')}'
        )

        # Apply to model
        updater.apply_image_texture(texture_path, texture_type='diffuse')

        # Save
        updater.save_model('${outputPath}')
        print('SUCCESS:${outputPath}')
    else:
        print('ERROR:No frames extracted from video')
        sys.exit(1)
else:
    print('ERROR:Failed to load model')
    sys.exit(1)
`;

    const scriptPath = path.join(process.cwd(), 'temp', `update_video_${vehicleId}_${Date.now()}.py`);
    await fs.writeFile(scriptPath, blenderScript);

    console.log('🔄 Processing video and applying textures...');
    const { stdout, stderr } = await execAsync(
      `blender --background --python ${scriptPath}`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for video processing
    );

    const successMatch = stdout.match(/SUCCESS:(.+)/);
    if (successMatch) {
      const newModelPath = successMatch[1].trim();

      // Update database
      await pool.query(
        'UPDATE vehicle_3d_models SET is_current = false WHERE vehicle_id = $1',
        [vehicleId]
      );

      await pool.query(`
        INSERT INTO vehicle_3d_models
        (vehicle_id, model_path, texture_source, texture_type, is_current, created_at)
        VALUES ($1, $2, $3, $4, true, NOW())
      `, [vehicleId, newModelPath, 'uploaded_video', 'video_extracted']);

      // Clean up
      await fs.unlink(scriptPath);
      await fs.unlink(file.path);

      res.json({
        success: true,
        message: 'Model updated from video successfully',
        modelPath: newModelPath,
        videoProcessed: file.originalname
      });

    } else {
      throw new Error('Video processing failed: ' + stderr);
    }

  } catch (error) {
    console.error('Error updating model from video:', error);
    res.status(500).json({
      error: 'Failed to update model from video',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/3d-models/update/lidar
 * Refine model geometry using LiDAR point cloud
 */
router.post('/update/lidar', upload.single('lidar'), async (req: Request, res: Response) => {
  try {
    const { vehicleId, refinementMethod = 'shrinkwrap' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No LiDAR file uploaded' });
    }

    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
    }

    console.log(`📡 Updating vehicle ${vehicleId} from LiDAR: ${file.originalname}`);

    // Get current model
    const modelResult = await pool.query(
      'SELECT model_path FROM vehicle_3d_models WHERE vehicle_id = $1 AND is_current = true',
      [vehicleId]
    );

    if (modelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle 3D model not found' });
    }

    const modelPath = modelResult.rows[0].model_path;
    const outputPath = path.join(process.cwd(), 'output', 'updated_models', `vehicle_${vehicleId}_lidar_${Date.now()}.glb`);

    const blenderScript = `
import bpy
import sys
sys.path.append('${path.join(process.cwd())}')

from update_model_from_media import LiDARIntegrator

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Load model
bpy.ops.import_scene.gltf(filepath='${modelPath}')
model_obj = bpy.context.selected_objects[0]

# Load and integrate LiDAR
integrator = LiDARIntegrator('${modelPath}')
point_cloud = integrator.load_point_cloud('${file.path}')

if point_cloud:
    # Refine model geometry
    integrator.refine_model_from_pointcloud(
        point_cloud,
        model_obj,
        method='${refinementMethod}'
    )

    # Export refined model
    bpy.ops.export_scene.gltf(
        filepath='${outputPath}',
        export_format='GLB'
    )

    print('SUCCESS:${outputPath}')
else:
    print('ERROR:Failed to load LiDAR data')
    sys.exit(1)
`;

    const scriptPath = path.join(process.cwd(), 'temp', `update_lidar_${vehicleId}_${Date.now()}.py`);
    await fs.writeFile(scriptPath, blenderScript);

    console.log('🔄 Processing LiDAR and refining model...');
    const { stdout, stderr } = await execAsync(
      `blender --background --python ${scriptPath}`,
      { maxBuffer: 20 * 1024 * 1024 } // 20MB buffer for LiDAR processing
    );

    const successMatch = stdout.match(/SUCCESS:(.+)/);
    if (successMatch) {
      const newModelPath = successMatch[1].trim();

      // Update database
      await pool.query(
        'UPDATE vehicle_3d_models SET is_current = false WHERE vehicle_id = $1',
        [vehicleId]
      );

      await pool.query(`
        INSERT INTO vehicle_3d_models
        (vehicle_id, model_path, geometry_source, refinement_method, is_current, created_at)
        VALUES ($1, $2, $3, $4, true, NOW())
      `, [vehicleId, newModelPath, 'lidar_scan', refinementMethod]);

      // Clean up
      await fs.unlink(scriptPath);
      await fs.unlink(file.path);

      res.json({
        success: true,
        message: 'Model refined with LiDAR data successfully',
        modelPath: newModelPath,
        lidarFile: file.originalname,
        refinementMethod
      });

    } else {
      throw new Error('LiDAR processing failed: ' + stderr);
    }

  } catch (error) {
    console.error('Error updating model from LiDAR:', error);
    res.status(500).json({
      error: 'Failed to update model from LiDAR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/3d-models/:vehicleId/history
 * Get update history for a vehicle's 3D model
 */
router.get('/:vehicleId/history', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const result = await pool.query(`
      SELECT
        id,
        model_path,
        texture_source,
        texture_type,
        geometry_source,
        refinement_method,
        is_current,
        created_at
      FROM vehicle_3d_models
      WHERE vehicle_id = $1
      ORDER BY created_at DESC
    `, [vehicleId]);

    res.json({
      vehicleId,
      history: result.rows
    });

  } catch (error) {
    console.error('Error fetching model history:', error);
    res.status(500).json({ error: 'Failed to fetch model history' });
  }
});

export default router;
