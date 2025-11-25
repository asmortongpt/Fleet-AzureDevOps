/**
 * Video Telematics API Routes
 * Camera management, video events, evidence locker, and AI analysis
 */

import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission, rateLimit } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import pool from '../config/database';
import VideoTelematicsService from '../services/video-telematics.service';
import DriverSafetyAIService from '../services/driver-safety-ai.service';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router();
router.use(authenticateJWT);

const videoService = new VideoTelematicsService(pool);
const aiService = new DriverSafetyAIService(pool);

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
        const cameras = await videoService.getVehicleCameras(Number(vehicleId));
        return res.json({ cameras });
      }

      // List all cameras
      const result = await pool.query(
        `SELECT vc.*, v.name as vehicle_name, v.vin
         FROM vehicle_cameras vc
         JOIN vehicles v ON vc.vehicle_id = v.id
         WHERE v.tenant_id = $1
         ORDER BY v.name, vc.camera_type`,
        [req.user!.tenant_id]
      );

      res.json({ cameras: result.rows });
    } catch (error: any) {
      console.error('Get cameras error:', error);
      res.status(500).json({ error: 'Failed to fetch cameras' });
    }
  }
);

/**
 * POST /api/video/cameras
 * Register a new camera
 */
router.post(
  '/cameras',
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
      const cameraId = await videoService.registerCamera(data);

      res.status(201).json({
        message: 'Camera registered successfully',
        cameraId
      });
    } catch (error: any) {
      console.error('Register camera error:', error);
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
  requirePermission('video_event:create:global'),
  auditLog({ action: 'UPDATE', resourceType: 'camera_health' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, firmwareVersion } = req.body;
      await videoService.updateCameraHealth(Number(req.params.id), status, firmwareVersion);

      res.json({ message: 'Camera health updated' });
    } catch (error: any) {
      console.error('Update camera health error:', error);
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

      const result = await videoService.getVideoEvents(filters);
      res.json(result);
    } catch (error: any) {
      console.error('Get video events error:', error);
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
      const result = await pool.query(
        `SELECT vse.*,
                v.name as vehicle_name,
                v.vin,
                d.first_name || ' ' || d.last_name as driver_name,
                vc.camera_type,
                vc.camera_name
         FROM video_safety_events vse
         JOIN vehicles v ON vse.vehicle_id = v.id
         LEFT JOIN drivers d ON vse.driver_id = d.id
         LEFT JOIN vehicle_cameras vc ON vse.camera_id = vc.id
         WHERE vse.id = $1 AND v.tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Video event not found' });
      }

      // Log access for audit
      await pool.query(
        `INSERT INTO video_privacy_audit
         (video_event_id, accessed_by, access_type, ip_address)
         VALUES ($1, $2, 'view', $3)',
        [req.params.id, req.user!.id, req.ip]
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Get video event error:', error);
      res.status(500).json({ error: 'Failed to fetch video event' });
    }
  }
);

/**
 * GET /api/video/events/:id/clip
 * Get video clip playback URL
 */
router.get(
  '/events/:id/clip',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'video_clip' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const playbackUrl = await videoService.getVideoPlaybackUrl(Number(req.params.id));

      if (!playbackUrl) {
        return res.status(404).json({ error: 'Video clip not available' });
      }

      // Log video access
      await pool.query(
        `INSERT INTO video_privacy_audit
         (video_event_id, accessed_by, access_type, ip_address)
         VALUES ($1, $2, 'view', $3)',
        [req.params.id, req.user!.id, req.ip]
      );

      res.json({ url: playbackUrl });
    } catch (error: any) {
      console.error('Get video clip error:', error);
      res.status(500).json({ error: 'Failed to get video clip' });
    }
  }
);

/**
 * POST /api/video/events
 * Create video safety event (typically called by webhook)
 */
router.post(
  '/events',
  requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        vehicleId: z.number(),
        driverId: z.number().optional(),
        cameraId: z.number().optional(),
        eventType: z.string(),
        severity: z.enum(['minor', 'moderate', 'severe', 'critical']),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        address: z.string().optional(),
        speedMph: z.number().optional(),
        gForce: z.number().optional(),
        eventTimestamp: z.string().transform(s => new Date(s)),
        videoRequestId: z.string().optional(),
        videoUrl: z.string().optional(),
        videoThumbnailUrl: z.string().optional(),
        markedAsEvidence: z.boolean().optional(),
        retentionPolicy: z.string().optional()
      });

      const data = schema.parse(req.body);
      const eventId = await videoService.createVideoEvent(data);

      res.status(201).json({
        message: 'Video event created successfully',
        eventId
      });
    } catch (error: any) {
      console.error('Create video event error:', error);
      res.status(400).json({ error: getErrorMessage(error) || 'Failed to create video event' });
    }
  }
);

/**
 * POST /api/video/analyze
 * Trigger AI analysis for a video event
 */
router.post(
  '/analyze',
  requirePermission('video_event:create:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.body;

      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      // Process asynchronously
      aiService.processVideoEvent(eventId).catch(error => {
        console.error(`AI analysis failed for event ${eventId}:`, error);
      });

      res.json({
        message: 'AI analysis queued',
        eventId,
        status: 'processing'
      });
    } catch (error: any) {
      console.error('Trigger AI analysis error:', error);
      res.status(500).json({ error: 'Failed to trigger AI analysis' });
    }
  }
);

/**
 * PATCH /api/video/events/:id/review
 * Review and update video event
 */
router.patch(
  '/events/:id/review',
  requirePermission('video_event:create:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { reviewed, reviewNotes, falsePositive, coachingRequired } = req.body;

      await pool.query(
        `UPDATE video_safety_events
         SET reviewed = $1,
             reviewed_by = $2,
             reviewed_at = NOW(),
             review_notes = $3,
             false_positive = $4,
             coaching_required = $5,
             updated_at = NOW()
         WHERE id = $6`,
        [
          reviewed,
          req.user!.id,
          reviewNotes,
          falsePositive,
          coachingRequired,
          req.params.id
        ]
      );

      if (falsePositive) {
        await aiService.markFalsePositive(Number(req.params.id), req.user!.id, reviewNotes);
      }

      res.json({ message: 'Video event reviewed successfully' });
    } catch (error: any) {
      console.error('Review video event error:', error);
      res.status(500).json({ error: 'Failed to review video event' });
    }
  }
);

// ============================================================================
// Evidence Locker
// ============================================================================

/**
 * GET /api/video/evidence-locker
 * Search evidence locker cases
 */
router.get(
  '/evidence-locker',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'evidence_locker' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        lockerType: req.query.lockerType as string,
        legalHold: req.query.legalHold === 'true',
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20
      };

      const result = await videoService.searchEvidenceLocker(filters);
      res.json(result);
    } catch (error: any) {
      console.error('Search evidence locker error:', error);
      res.status(500).json({ error: 'Failed to search evidence locker' });
    }
  }
);

/**
 * GET /api/video/evidence-locker/:id
 * Get evidence locker case with videos
 */
router.get(
  '/evidence-locker/:id',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'evidence_locker' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const locker = await videoService.getEvidenceLocker(Number(req.params.id));

      if (!locker) {
        return res.status(404).json({ error: 'Evidence locker not found' });
      }

      res.json(locker);
    } catch (error: any) {
      console.error('Get evidence locker error:', error);
      res.status(500).json({ error: 'Failed to fetch evidence locker' });
    }
  }
);

/**
 * POST /api/video/evidence-locker
 * Create new evidence locker case
 */
router.post(
  '/evidence-locker',
  requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'evidence_locker' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        lockerName: z.string(),
        lockerType: z.string(),
        caseNumber: z.string().optional(),
        incidentDate: z.string().optional().transform(s => s ? new Date(s) : undefined),
        incidentDescription: z.string().optional(),
        assignedTo: z.number().optional(),
        legalHold: z.boolean().optional(),
        legalHoldReason: z.string().optional()
      });

      const data = schema.parse(req.body);

      const lockerId = await videoService.createEvidenceLocker({
        ...data,
        createdBy: req.user!.id
      });

      res.status(201).json({
        message: 'Evidence locker created successfully',
        lockerId
      });
    } catch (error: any) {
      console.error('Create evidence locker error:', error);
      res.status(400).json({ error: getErrorMessage(error) || 'Failed to create evidence locker' });
    }
  }
);

/**
 * POST /api/video/evidence-locker/:id/add-event
 * Add video event to evidence locker
 */
router.post(
  '/evidence-locker/:id/add-event',
  requirePermission('video_event:create:global'),
  auditLog({ action: 'UPDATE', resourceType: 'evidence_locker' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.body;

      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      await videoService.addToEvidenceLocker(
        eventId,
        Number(req.params.id),
        req.user!.id
      );

      res.json({ message: 'Video event added to evidence locker' });
    } catch (error: any) {
      console.error('Add to evidence locker error:', error);
      res.status(500).json({ error: 'Failed to add video to evidence locker' });
    }
  }
);

// ============================================================================
// Driver Coaching
// ============================================================================

/**
 * GET /api/video/coaching/events
 * Get events requiring coaching
 */
router.get(
  '/coaching/events',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'coaching_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, driver_id, event_type, severity, date_time FROM events_requiring_coaching
         WHERE vehicle_id IN (SELECT id FROM vehicles WHERE tenant_id = $1)
         LIMIT 100`,
        [req.user!.tenant_id]
      );

      res.json({ events: result.rows });
    } catch (error: any) {
      console.error('Get coaching events error:', error);
      res.status(500).json({ error: 'Failed to fetch coaching events' });
    }
  }
);

/**
 * POST /api/video/coaching/sessions
 * Create coaching session
 */
router.post(
  '/coaching/sessions',
  requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'coaching_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        driverId: z.number(),
        videoEventId: z.number().optional(),
        sessionType: z.string(),
        coachingTopic: z.string(),
        coachNotes: z.string().optional(),
        scheduledAt: z.string().optional().transform(s => s ? new Date(s) : undefined)
      });

      const data = schema.parse(req.body);

      const sessionId = await videoService.createCoachingSession({
        ...data,
        coachId: req.user!.id
      });

      res.status(201).json({
        message: 'Coaching session created successfully',
        sessionId
      });
    } catch (error: any) {
      console.error('Create coaching session error:', error);
      res.status(400).json({ error: getErrorMessage(error) || 'Failed to create coaching session' });
    }
  }
);

/**
 * PATCH /api/video/coaching/sessions/:id/complete
 * Complete coaching session
 */
router.patch(
  '/coaching/sessions/:id/complete',
  requirePermission('video_event:create:global'),
  auditLog({ action: 'UPDATE', resourceType: 'coaching_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { outcome, actionItems, driverAcknowledgment } = req.body;

      await videoService.completeCoachingSession(
        Number(req.params.id),
        outcome,
        actionItems,
        driverAcknowledgment
      );

      res.json({ message: 'Coaching session completed successfully' });
    } catch (error: any) {
      console.error('Complete coaching session error:', error);
      res.status(500).json({ error: 'Failed to complete coaching session' });
    }
  }
);

// ============================================================================
// Privacy Controls
// ============================================================================

/**
 * POST /api/video/privacy/blur
 * Apply privacy filters (face/plate blurring)
 */
router.post(
  '/privacy/blur',
  requirePermission('video_event:delete:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_privacy' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { eventId, blurFaces, blurPlates } = req.body;

      // Queue privacy processing
      await pool.query(
        `INSERT INTO video_processing_queue (video_event_id, task_type, priority)
         VALUES ($1, 'privacy_blur', 2)',
        [eventId]
      );

      // Update event privacy settings
      await pool.query(
        `UPDATE video_safety_events
         SET privacy_faces_blurred = $1,
             privacy_plates_blurred = $2,
             privacy_processing_status = 'pending'
         WHERE id = $3',
        [blurFaces, blurPlates, eventId]
      );

      // Audit log
      await pool.query(
        `INSERT INTO video_privacy_audit
         (video_event_id, accessed_by, access_type, privacy_action)
         VALUES ($1, $2, 'privacy_filter', $3)',
        [
          eventId,
          req.user!.id,
          `blur_faces:${blurFaces}, blur_plates:${blurPlates}`
        ]
      );

      res.json({
        message: 'Privacy processing queued',
        eventId,
        status: 'pending'
      });
    } catch (error: any) {
      console.error('Apply privacy blur error:', error);
      res.status(500).json({ error: 'Failed to apply privacy filters' });
    }
  }
);

// ============================================================================
// Analytics & Reports
// ============================================================================

/**
 * GET /api/video/analytics/driver/:id
 * Get driver safety insights
 */
router.get(
  '/analytics/driver/:id',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'driver_analytics' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const insights = await aiService.getDriverSafetyInsights(Number(req.params.id), days);

      res.json(insights);
    } catch (error: any) {
      console.error('Get driver insights error:', error);
      res.status(500).json({ error: 'Failed to fetch driver insights' });
    }
  }
);

/**
 * GET /api/video/analytics/scorecard
 * Get driver video scorecard
 */
router.get(
  '/analytics/scorecard',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'video_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, driver_id, score, total_events, safe_events, violation_events FROM driver_video_scorecard
         WHERE driver_id IN (
           SELECT id FROM drivers WHERE tenant_id = $1
         )
         ORDER BY total_events_30d DESC
         LIMIT 50`,
        [req.user!.tenant_id]
      );

      res.json({ scorecard: result.rows });
    } catch (error: any) {
      console.error('Get scorecard error:', error);
      res.status(500).json({ error: 'Failed to fetch scorecard' });
    }
  }
);

/**
 * GET /api/video/health/cameras
 * Get camera health status
 */
router.get(
  '/health/cameras',
  requirePermission('video_event:view:global'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'camera_health' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, camera_status, last_sync, battery_level FROM camera_health_status
         WHERE vehicle_id IN (
           SELECT id FROM vehicles WHERE tenant_id = $1
         )
         ORDER BY health_status, vehicle_name`,
        [req.user!.tenant_id]
      );

      res.json({ cameras: result.rows });
    } catch (error: any) {
      console.error('Get camera health error:', error);
      res.status(500).json({ error: 'Failed to fetch camera health' });
    }
  }
);

export default router;
