/**
 * API Routes for 3D Model Management
 *
 * RESTful endpoints for generating and managing vehicle 3D models
 */

import path from 'path';

import express, { Request, Response } from 'express';
import multer from 'multer';

import FleetModelService from '../../fleet-3d-model-integration';

const router = express.Router();

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed'));
  },
});

// Initialize service
const modelService = new FleetModelService(
  process.env.DATABASE_URL || '',
  process.env.MESHY_API_KEY || ''
);

// ============================================================================
// GET /api/3d-models/vehicle/:vehicleId
// Get current 3D model for a vehicle
// ============================================================================

router.get('/vehicle/:vehicleId', async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);

    const model = await modelService['db'].getCurrentModel(vehicleId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'No 3D model found for this vehicle',
      });
    }

    res.json({
      success: true,
      data: {
        id: model.id,
        vehicleId: model.vehicle_id,
        status: model.generation_status,
        paintColor: model.paint_color,
        paintHex: model.paint_hex,
        trim: model.trim_level,
        wheels: model.wheel_type,
        features: model.features,
        models: {
          glb: model.model_url_glb,
          fbx: model.model_url_fbx,
          obj: model.model_url_obj,
          usdz: model.model_url_usdz,
        },
        textures: {
          baseColor: model.texture_base_color,
          metallic: model.texture_metallic,
          roughness: model.texture_roughness,
          normal: model.texture_normal,
        },
        thumbnail: model.thumbnail_url,
        version: model.version,
        createdAt: model.created_at,
        creditsUsed: model.credits_used,
      },
    });
  } catch (error) {
    console.error('Error fetching vehicle model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle model',
    });
  }
});

// ============================================================================
// GET /api/3d-models/vehicle/:vehicleId/history
// Get model generation history for a vehicle
// ============================================================================

router.get('/vehicle/:vehicleId/history', async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);

    const history = await modelService['db'].getModelHistory(vehicleId);

    res.json({
      success: true,
      data: history.map(model => ({
        id: model.id,
        status: model.generation_status,
        paintColor: model.paint_color,
        trim: model.trim_level,
        version: model.version,
        isCurrent: model.is_current,
        thumbnail: model.thumbnail_url,
        createdAt: model.created_at,
        creditsUsed: model.credits_used,
      })),
    });
  } catch (error) {
    console.error('Error fetching model history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model history',
    });
  }
});

// ============================================================================
// POST /api/3d-models/generate
// Generate initial 3D model for a vehicle
// ============================================================================

router.post('/generate', upload.array('referenceImages', 4), async (req: Request, res: Response) => {
  try {
    const {
      vehicleId,
      paintColor,
      paintHex,
      trim,
      wheels,
      features,
    } = req.body;

    // Validate required fields
    if (!vehicleId || !paintColor || !trim || !wheels) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vehicleId, paintColor, trim, wheels',
      });
    }

    // Parse features if provided as JSON string
    const parsedFeatures = features ? JSON.parse(features) : {};

    // Get reference image URLs if uploaded
    const referenceImages = req.files
      ? (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`)
      : undefined;

    // Start generation (async)
    const model = await modelService.generateInitialModel(parseInt(vehicleId), {
      paintColor,
      paintHex,
      trim: trim as 'Pro' | 'XLT' | 'Lariat' | 'Platinum',
      wheels,
      features: parsedFeatures,
      referenceImages,
    });

    res.status(202).json({
      success: true,
      message: 'Model generation started',
      data: {
        modelId: model.id,
        meshyTaskId: model.meshy_task_id,
        status: model.generation_status,
        estimatedTime: '5-10 minutes',
      },
    });
  } catch (error) {
    console.error('Error generating model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate model',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// POST /api/3d-models/change-color
// Change paint color of existing model
// ============================================================================

router.post('/change-color', async (req: Request, res: Response) => {
  try {
    const {
      vehicleId,
      paintColor,
      paintHex,
      customDescription,
    } = req.body;

    // Validate required fields
    if (!vehicleId || !paintColor) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vehicleId, paintColor',
      });
    }

    // Start color change (async)
    const model = await modelService.changePaintColor(
      parseInt(vehicleId),
      paintColor,
      paintHex,
      customDescription
    );

    res.status(202).json({
      success: true,
      message: 'Color change started',
      data: {
        modelId: model.id,
        meshyTaskId: model.meshy_task_id,
        status: model.generation_status,
        newColor: paintColor,
        estimatedTime: '3-5 minutes',
      },
    });
  } catch (error) {
    console.error('Error changing color:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change color',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// POST /api/3d-models/add-damage
// Add damage to vehicle model
// ============================================================================

router.post('/add-damage', upload.array('damagePhotos', 5), async (req: Request, res: Response) => {
  try {
    const {
      vehicleId,
      damageType,
      location,
      severity,
      description,
      occurredAt,
      estimatedCost,
    } = req.body;

    // Validate required fields
    if (!vehicleId || !damageType || !location || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vehicleId, damageType, location, severity',
      });
    }

    // Get damage photo URLs if uploaded
    const damagePhotos = req.files
      ? (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`)
      : undefined;

    // Add damage to model
    const result = await modelService.addDamageToModel(parseInt(vehicleId), {
      type: damageType,
      location,
      severity,
      description,
      photos: damagePhotos,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
    });

    res.status(202).json({
      success: true,
      message: 'Damage model generation started',
      data: {
        damageRecordId: result.damageRecord.id,
        modelId: result.modelRecord.id,
        meshyTaskId: result.modelRecord.meshy_task_id,
        status: result.modelRecord.generation_status,
        estimatedTime: '3-5 minutes',
      },
    });
  } catch (error) {
    console.error('Error adding damage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add damage to model',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET /api/3d-models/damage/:vehicleId
// Get all damage records for a vehicle
// ============================================================================

router.get('/damage/:vehicleId', async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);

    const damage = await modelService['db'].getVehicleDamage(vehicleId);

    res.json({
      success: true,
      data: damage.map(d => ({
        id: d.id,
        type: d.damage_type,
        location: d.damage_location,
        severity: d.severity,
        description: d.description,
        photos: d.damage_photos,
        occurredAt: d.occurred_at,
        reportedAt: d.reported_at,
        estimatedCost: d.estimated_cost,
        actualCost: d.actual_cost,
        damageModelUrl: d.damage_model_url,
      })),
    });
  } catch (error) {
    console.error('Error fetching damage records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch damage records',
    });
  }
});

// ============================================================================
// GET /api/3d-models/paint-colors
// Get available paint color options
// ============================================================================

router.get('/paint-colors', (req: Request, res: Response) => {
  const colors = [
    {
      name: 'Antimatter Blue',
      hex: '#1E3A5F',
      category: 'Metallic',
      upcharge: 0,
    },
    {
      name: 'Avalanche',
      hex: '#F8F8F8',
      category: 'Solid',
      upcharge: 0,
    },
    {
      name: 'Iconic Silver',
      hex: '#C0C0C0',
      category: 'Metallic',
      upcharge: 0,
    },
    {
      name: 'Carbonized Gray',
      hex: '#3E3E3E',
      category: 'Metallic',
      upcharge: 0,
    },
    {
      name: 'Agate Black',
      hex: '#0A0A0A',
      category: 'Solid',
      upcharge: 0,
    },
    {
      name: 'Rapid Red',
      hex: '#C41E3A',
      category: 'Metallic',
      upcharge: 0,
    },
    {
      name: 'Atlas Blue',
      hex: '#2E5A88',
      category: 'Metallic',
      upcharge: 0,
    },
    {
      name: 'Star White',
      hex: '#FFFFFF',
      category: 'Tri-coat',
      upcharge: 500,
    },
  ];

  res.json({
    success: true,
    data: colors,
  });
});

// ============================================================================
// GET /api/3d-models/trims
// Get available trim levels
// ============================================================================

router.get('/trims', (req: Request, res: Response) => {
  const trims = [
    {
      name: 'Pro',
      description: 'Work-focused trim with essential features',
      basePrice: 49995,
      features: ['Steel wheels', 'Basic grille', 'Halogen headlights'],
    },
    {
      name: 'XLT',
      description: 'Enhanced comfort and technology',
      basePrice: 54995,
      features: ['Chrome grille', 'LED headlights', 'Body-color bumpers'],
    },
    {
      name: 'Lariat',
      description: 'Luxury features and premium styling',
      basePrice: 69995,
      features: ['Premium chrome grille', 'LED signature lighting', 'Chrome door handles'],
    },
    {
      name: 'Platinum',
      description: 'Top-tier luxury and technology',
      basePrice: 94995,
      features: ['Unique grille design', 'Premium LED lighting', 'Chrome accents'],
    },
  ];

  res.json({
    success: true,
    data: trims,
  });
});

// ============================================================================
// GET /api/3d-models/status/:meshyTaskId
// Check generation status of a specific task
// ============================================================================

router.get('/status/:meshyTaskId', async (req: Request, res: Response) => {
  try {
    const { meshyTaskId } = req.params;

    // Query database for task status
    const result = await modelService['db']['pool'].query(
      'SELECT * FROM vehicle_3d_models WHERE meshy_task_id = $1',
      [meshyTaskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const model = result.rows[0];

    res.json({
      success: true,
      data: {
        status: model.generation_status,
        progress: model.progress || 0,
        createdAt: model.created_at,
        updatedAt: model.updated_at,
        isComplete: model.generation_status === 'SUCCEEDED',
        hasFailed: model.generation_status === 'FAILED',
        models: model.generation_status === 'SUCCEEDED' ? {
          glb: model.model_url_glb,
          fbx: model.model_url_fbx,
          obj: model.model_url_obj,
          usdz: model.model_url_usdz,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check status',
    });
  }
});

// ============================================================================
// Initialize service and export router
// ============================================================================

(async () => {
  try {
    await modelService.initialize();
    console.log('✅ 3D Model Service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize 3D Model Service:', error);
  }
})();

export default router;
