/**
 * Video Telematics API Routes
 * Camera management, video events, evidence locker, and AI analysis
 */

import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission, rateLimit } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { csrfProtection } from '../middleware/csrf';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler';
import { logger } from '../logger'; // Assuming logger is imported from a centralized logger file

// Import necessary repositories
import { CameraRepository } from '../repositories/camera.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { VideoEventRepository } from '../repositories/video-event.repository';
import { EvidenceLockerRepository } from '../repositories/evidence-locker.repository';
import { AISafetyAnalysisRepository } from '../repositories/ai-safety-analysis.repository';

const router = express.Router();
router.use(authenticateJWT);

const cameraRepository = new CameraRepository();
const vehicleRepository = new VehicleRepository();
const videoEventRepository = new VideoEventRepository();
const evidenceLockerRepository = new EvidenceLockerRepository();
const aiSafetyAnalysisRepository = new AISafetyAnalysisRepository();

// ============================================================================
// Camera Management
// ============================================================================

/**
 * GET /api/video/cameras
 * List all cameras or cameras for a specific vehicle
 */
router.get(
  '/cameras',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'cameras' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId } = req.query;

      if (vehicleId) {
        const cameras = await cameraRepository.getVehicleCameras(Number(vehicleId), req.user!.tenant_id);
        return res.json({ cameras });
      }

      // List all cameras
      const cameras = await cameraRepository.getAllCameras(req.user!.tenant_id);
      res.json({ cameras });
    } catch (error: any) {
      logger.error(`Get cameras error:`, error);
      res.status(500).json({ error: `Failed to fetch cameras` });
    }
  }
);

/**
 * POST /api/video/cameras
 * Register a new camera
 */
router.post(
  '/cameras',
  csrfProtection,
  requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'cameras' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        vehicleId: z.number(),
        cameraType: z.enum(['forward', 'driver_facing', 'rear', 'side_left', 'side_right', 'cargo']),
        resolution: z.string().optional(),
        recordingMode: z.string().optional(),
        preEventBufferSeconds: z.number().optional(),
        postEventBufferSeconds: z.number().optional(),
        privacyBlurFaces: z.boolean().optional(),
        privacyBlurPlates: z.boolean().optional()
      });

      const data = schema.parse(req.body);
      const cameraId = await cameraRepository.registerCamera(data, req.user!.tenant_id);

      res.status(201).json({
        message: 'Camera registered successfully',
        cameraId
      });
    } catch (error: any) {
      logger.error('Register camera error:', error);
      res.status(400).json({ error: getErrorMessage(error) || 'Failed to register camera' });
    }
  }
);

/**
 * PATCH /api/video/cameras/:id/health
 * Update camera health status
 */
router.patch(
  '/cameras/:id/health',
  csrfProtection,
  requirePermission('video_event:create:global'),
  auditLog({ action: 'UPDATE', resourceType: 'camera_health' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, firmwareVersion } = req.body;
      await cameraRepository.updateCameraHealth(Number(req.params.id), status, firmwareVersion, req.user!.tenant_id);

      res.json({ message: 'Camera health updated' });
    } catch (error: any) {
      logger.error('Update camera health error:', error);
      res.status(500).json({ error: 'Failed to update camera health' });
    }
  }
);

// ============================================================================
// Video Events
// ============================================================================

/**
 * GET /api/video/events
 * Get video safety events with filtering
 */
router.get(
  '/events',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        vehicleId: req.query.vehicleId ? Number(req.query.vehicleId) : undefined,
        driverId: req.query.driverId ? Number(req.query.driverId) : undefined,
        eventType: req.query.eventType as string,
        severity: req.query.severity as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        markedAsEvidence: req.query.markedAsEvidence === 'true',
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50
      };

      const result = await videoEventRepository.getVideoEvents(filters, req.user!.tenant_id);
      res.json(result);
    } catch (error: any) {
      logger.error('Get video events error:', error);
      res.status(500).json({ error: 'Failed to fetch video events' });
    }
  }
);

/**
 * GET /api/video/events/:id
 * Get single video event details
 */
router.get(
  '/events/:id',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const event = await videoEventRepository.getVideoEventById(Number(req.params.id), req.user!.tenant_id);
      if (!event) {
        return res.status(404).json({ error: 'Video event not found' });
      }
      res.json(event);
    } catch (error: any) {
      logger.error('Get video event error:', error);
      res.status(500).json({ error: 'Failed to fetch video event' });
    }
  }
);

/**
 * POST /api/video/events
 * Create a new video event
 */
router.post(
  '/events',
  csrfProtection,
  requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        vehicleId: z.number(),
        cameraId: z.number(),
        eventType: z.string(),
        severity: z.string(),
        timestamp: z.string().datetime(),
        videoUrl: z.string().url(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        additionalData: z.any().optional()
      });

      const data = schema.parse(req.body);
      const eventId = await videoEventRepository.createVideoEvent(data, req.user!.tenant_id);

      res.status(201).json({
        message: 'Video event created successfully',
        eventId
      });
    } catch (error: any) {
      logger.error('Create video event error:', error);
      res.status(400).json({ error: getErrorMessage(error) || 'Failed to create video event' });
    }
  }
);

/**
 * PATCH /api/video/events/:id
 * Update video event details
 */
router.patch(
  '/events/:id',
  csrfProtection,
  requirePermission('video_event:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        severity: z.string().optional(),
        markedAsEvidence: z.boolean().optional(),
        notes: z.string().optional()
      });

      const data = schema.parse(req.body);
      await videoEventRepository.updateVideoEvent(Number(req.params.id), data, req.user!.tenant_id);

      res.json({ message: 'Video event updated successfully' });
    } catch (error: any) {
      logger.error('Update video event error:', error);
      res.status(400).json({ error: getErrorMessage(error) || 'Failed to update video event' });
    }
  }
);

// ============================================================================
// Evidence Locker
// ============================================================================

/**
 * GET /api/video/evidence
 * List all evidence items
 */
router.get(
  '/evidence',
  requirePermission('evidence_locker:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'evidence' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const evidenceItems = await evidenceLockerRepository.getAllEvidenceItems(req.user!.tenant_id);
      res.json({ evidenceItems });
    } catch (error: any) {
      logger.error('Get evidence items error:', error);
      res.status(500).json({ error: 'Failed to fetch evidence items' });
    }
  }
);

/**
 * POST /api/video/evidence
 * Add a new evidence item
 */
router.post(
  '/evidence',
  csrfProtection,
  requirePermission('evidence_locker:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'evidence' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        videoEventId: z.number(),
        notes: z.string().optional()
      });

      const data = schema.parse(req.body);
      const evidenceId = await evidenceLockerRepository.addEvidenceItem(data, req.user!.tenant_id);

      res.status(201).json({
        message: 'Evidence item added successfully',
        evidenceId
      });
    } catch (error: any) {
      logger.error('Add evidence item error:', error);
      res.status(400).json({ error: getErrorMessage(error) || 'Failed to add evidence item' });
    }
  }
);

// ============================================================================
// AI Analysis
// ============================================================================

/**
 * GET /api/video/ai/analysis
 * Get AI safety analysis results
 */
router.get(
  '/ai/analysis',
  requirePermission('ai_analysis:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'ai_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { videoEventId } = req.query;

      if (videoEventId) {
        const analysis = await aiSafetyAnalysisRepository.getAnalysisForEvent(Number(videoEventId), req.user!.tenant_id);
        return res.json({ analysis });
      }

      // List all analysis results
      const analysisResults = await aiSafetyAnalysisRepository.getAllAnalysisResults(req.user!.tenant_id);
      res.json({ analysisResults });
    } catch (error: any) {
      logger.error('Get AI analysis error:', error);
      res.status(500).json({ error: 'Failed to fetch AI analysis results' });
    }
  }
);

export default router;


This refactored version of the `video-telematics.routes.ts` file eliminates all direct database queries by using repository methods. The necessary repositories are imported at the top of the file, and each database operation is replaced with a corresponding repository method call. The tenant_id filtering is maintained in all repository calls.

Note that some repository methods (like `getAllCameras`, `registerCamera`, etc.) are assumed to exist. If they don't, you'll need to implement them in their respective repository files. The `logger` is assumed to be imported from a centralized logger file, as per the comment in the original code.

All business logic has been maintained, and the structure of the routes and their middleware usage remains the same.