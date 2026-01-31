/**
 * AI Damage Detection API Routes
 *
 * RESTful endpoints for vehicle damage detection using AI/ML
 *
 * Endpoints:
 * - POST /api/ai/damage-detection - Detect damage from image
 * - GET /api/ai/damage-detection/:id - Get detection by ID
 * - GET /api/ai/damage-detection/vehicle/:vehicleId - Get vehicle damage history
 * - GET /api/ai/damage-detection/pending - Get pending damages
 * - PATCH /api/ai/damage-detection/:id/repair-status - Update repair status
 * - GET /api/ai/damage-detection/stats - Get statistics
 *
 * @module routes/ai-damage-detection
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Pool } from 'pg';

import logger from '../config/logger';
import { createAiDamageDetectionService } from '../services/ai-damage-detection.service';

// ============================================================================
// SETUP
// ============================================================================

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/ai/damage-detection
 * Detect damage from uploaded image or URL
 *
 * Body (multipart/form-data):
 * - vehicleId (required): Vehicle ID
 * - reportedBy (required): User ID who reported the damage
 * - image (optional): Image file upload
 * - imageUrl (optional): Image URL
 * - imageBase64 (optional): Base64 encoded image
 * - autoCreateWorkOrder (optional): Auto-create work orders (default: true)
 * - notes (optional): Additional notes
 * - location (optional): Location where damage occurred
 * - incidentDate (optional): When the incident occurred
 *
 * Response: DamageDetectionResponse
 */
router.post(
  '/',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = req.app.get('db') as Pool;
      const service = createAiDamageDetectionService(db);

      // Extract request data
      const {
        vehicleId,
        reportedBy,
        imageUrl,
        imageBase64,
        autoCreateWorkOrder,
        notes,
        location,
        incidentDate
      } = req.body;

      // Validate required fields
      if (!vehicleId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'vehicleId is required'
        });
      }

      if (!reportedBy) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'reportedBy is required'
        });
      }

      // Get image from file upload, URL, or base64
      const imageBuffer = req.file?.buffer;
      if (!imageBuffer && !imageUrl && !imageBase64) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Image is required (file upload, imageUrl, or imageBase64)'
        });
      }

      // Process damage detection
      const result = await service.detectDamage({
        vehicleId,
        reportedBy,
        imageUrl,
        imageBase64,
        imageBuffer,
        autoCreateWorkOrder: autoCreateWorkOrder !== 'false',
        notes,
        location,
        incidentDate: incidentDate ? new Date(incidentDate) : undefined
      });

      logger.info('Damage detection API request successful', {
        detectionId: result.detectionId,
        vehicleId,
        damageCount: result.summary.totalDamages
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Damage detection API error', { error });
      next(error);
    }
  }
);

/**
 * GET /api/ai/damage-detection/:id
 * Get damage detection by ID
 *
 * Params:
 * - id: Detection ID
 *
 * Response: Detection record
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.app.get('db') as Pool;
    const service = createAiDamageDetectionService(db);

    const { id } = req.params;

    const detection = await service.getDetectionById(id);

    if (!detection) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Detection ${id} not found`
      });
    }

    res.json({
      success: true,
      data: detection
    });
  } catch (error) {
    logger.error('Get detection error', { error, id: req.params.id });
    next(error);
  }
});

/**
 * GET /api/ai/damage-detection/vehicle/:vehicleId
 * Get damage detection history for a vehicle
 *
 * Params:
 * - vehicleId: Vehicle ID
 *
 * Query:
 * - limit (optional): Max records to return (default: 50)
 *
 * Response: Array of detection records
 */
router.get('/vehicle/:vehicleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.app.get('db') as Pool;
    const service = createAiDamageDetectionService(db);

    const { vehicleId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await service.getVehicleDamageHistory(vehicleId, limit);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    logger.error('Get vehicle damage history error', { error, vehicleId: req.params.vehicleId });
    next(error);
  }
});

/**
 * GET /api/ai/damage-detection/pending
 * Get all pending damages (not yet repaired)
 *
 * Query:
 * - vehicleId (optional): Filter by vehicle ID
 *
 * Response: Array of pending damage records
 */
router.get('/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.app.get('db') as Pool;
    const service = createAiDamageDetectionService(db);

    const vehicleId = req.query.vehicleId as string | undefined;

    const pending = await service.getPendingDamages(vehicleId);

    res.json({
      success: true,
      data: pending,
      count: pending.length
    });
  } catch (error) {
    logger.error('Get pending damages error', { error });
    next(error);
  }
});

/**
 * PATCH /api/ai/damage-detection/:id/repair-status
 * Update repair status for a detection
 *
 * Params:
 * - id: Detection ID
 *
 * Body:
 * - status (required): 'pending' | 'in_progress' | 'completed' | 'cancelled'
 * - completedBy (optional): User ID who completed the repair
 *
 * Response: Success message
 */
router.patch('/:id/repair-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.app.get('db') as Pool;
    const service = createAiDamageDetectionService(db);

    const { id } = req.params;
    const { status, completedBy } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    await service.updateRepairStatus(id, status, completedBy);

    res.json({
      success: true,
      message: 'Repair status updated successfully'
    });
  } catch (error) {
    logger.error('Update repair status error', { error, id: req.params.id });
    next(error);
  }
});

/**
 * GET /api/ai/damage-detection/stats
 * Get damage detection statistics
 *
 * Query:
 * - vehicleId (optional): Filter by vehicle ID
 * - days (optional): Number of days to look back (default: 30)
 *
 * Response: Statistics object
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.app.get('db') as Pool;
    const service = createAiDamageDetectionService(db);

    const vehicleId = req.query.vehicleId as string | undefined;
    const days = parseInt(req.query.days as string) || 30;

    const stats = await service.getStatistics(vehicleId, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get statistics error', { error });
    next(error);
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('AI Damage Detection route error', { error, path: req.path });

  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message || 'An error occurred during damage detection'
  });
});

// ============================================================================
// EXPORTS
// ============================================================================

export default router;
