/**
 * Video Telematics Service
 * Multi-camera video processing, storage, and evidence management
 */

import { Pool } from 'pg';
import axios from 'axios';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { logger } from '../utils/logger';
import { safeGet, validateURL, SSRFError } from '../utils/safe-http-request';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_VIDEO_CONTAINER || 'video-telematics';
const VIDEO_RETENTION_DAYS_STANDARD = 90;
const VIDEO_RETENTION_DAYS_EXTENDED = 365;

interface VideoClip {
  videoEventId: number;
  url: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  fileSizeMb: number;
  resolution: string;
  cameraType: string;
}

interface CameraConfig {
  vehicleId: number;
  cameraType: string;
  resolution?: string;
  recordingMode?: string;
  preEventBufferSeconds?: number;
  postEventBufferSeconds?: number;
  privacyBlurFaces?: boolean;
  privacyBlurPlates?: boolean;
}

interface VideoEvent {
  vehicleId: number;
  driverId?: number;
  cameraId?: number;
  eventType: string;
  severity: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  speedMph?: number;
  gForce?: number;
  eventTimestamp: Date;
  videoRequestId?: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  markedAsEvidence?: boolean;
  retentionPolicy?: string;
}

class VideoTelematicsService {
  private db: Pool;
  private blobService: BlobServiceClient | null = null;
  private containerClient: ContainerClient | null = null;

  constructor(db: Pool) {
    this.db = db;
    this.initializeAzureStorage();
  }

  /**
   * Initialize Azure Blob Storage for video archival
   */
  private async initializeAzureStorage() {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      logger.warn('Azure Storage connection string not configured - video archival disabled');
      return;
    }

    try {
      this.blobService = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      this.containerClient = this.blobService.getContainerClient(AZURE_STORAGE_CONTAINER);

      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists({
        access: 'private'
      });

      logger.info(`Azure Blob Storage initialized: container=${AZURE_STORAGE_CONTAINER}`);
    } catch (error: any) {
      logger.error('Failed to initialize Azure Storage:', error.message);
      this.blobService = null;
      this.containerClient = null;
    }
  }

  /**
   * Register vehicle cameras
   */
  async registerCamera(config: CameraConfig): Promise<number> {
    const result = await this.db.query(
      `INSERT INTO vehicle_cameras
       (vehicle_id, camera_type, camera_name, resolution, recording_mode,
        pre_event_buffer_seconds, post_event_buffer_seconds,
        privacy_blur_faces, privacy_blur_plates)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (vehicle_id, camera_type)
       DO UPDATE SET
         resolution = EXCLUDED.resolution,
         recording_mode = EXCLUDED.recording_mode,
         pre_event_buffer_seconds = EXCLUDED.pre_event_buffer_seconds,
         post_event_buffer_seconds = EXCLUDED.post_event_buffer_seconds,
         privacy_blur_faces = EXCLUDED.privacy_blur_faces,
         privacy_blur_plates = EXCLUDED.privacy_blur_plates,
         updated_at = NOW()
       RETURNING id`,
      [
        config.vehicleId,
        config.cameraType,
        `${config.cameraType.replace('_', ' ').toUpperCase()} Camera`,
        config.resolution || '1080p',
        config.recordingMode || 'event_triggered',
        config.preEventBufferSeconds || 10,
        config.postEventBufferSeconds || 30,
        config.privacyBlurFaces !== undefined ? config.privacyBlurFaces : true,
        config.privacyBlurPlates !== undefined ? config.privacyBlurPlates : true
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Get all cameras for a vehicle
   */
  async getVehicleCameras(vehicleId: number) {
    const result = await this.db.query(
      `SELECT id, vehicle_id, camera_type, camera_name, resolution, recording_mode,
              pre_event_buffer_seconds, post_event_buffer_seconds, privacy_blur_faces,
              privacy_blur_plates, status, last_ping_at, firmware_version, created_at, updated_at
       FROM vehicle_cameras
       WHERE vehicle_id = $1
       ORDER BY camera_type`,
      [vehicleId]
    );

    return result.rows;
  }

  /**
   * Update camera health status
   */
  async updateCameraHealth(cameraId: number, status: string, firmwareVersion?: string) {
    await this.db.query(
      `UPDATE vehicle_cameras
       SET status = $1, last_ping_at = NOW(), firmware_version = $2, updated_at = NOW()
       WHERE id = $3',
      [status, firmwareVersion, cameraId]
    );
  }

  /**
   * Create video safety event
   */
  async createVideoEvent(event: VideoEvent): Promise<number> {
    const retentionDays = event.retentionPolicy === 'extended'
      ? VIDEO_RETENTION_DAYS_EXTENDED
      : VIDEO_RETENTION_DAYS_STANDARD;

    const retentionExpiresAt = new Date();
    retentionExpiresAt.setDate(retentionExpiresAt.getDate() + retentionDays);

    const result = await this.db.query(
      `INSERT INTO video_safety_events
       (vehicle_id, driver_id, camera_id, event_type, severity,
        latitude, longitude, address, speed_mph, g_force,
        event_timestamp, video_request_id, video_url, video_thumbnail_url,
        marked_as_evidence, retention_policy, retention_expires_at, delete_after_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      [
        event.vehicleId,
        event.driverId,
        event.cameraId,
        event.eventType,
        event.severity,
        event.latitude,
        event.longitude,
        event.address,
        event.speedMph,
        event.gForce,
        event.eventTimestamp,
        event.videoRequestId,
        event.videoUrl,
        event.videoThumbnailUrl,
        event.markedAsEvidence || false,
        event.retentionPolicy || 'standard',
        retentionExpiresAt,
        retentionDays
      ]
    );

    const eventId = result.rows[0].id;
    logger.info(`Video safety event created: id=${eventId}, type=${event.eventType}, severity=${event.severity}`);

    return eventId;
  }

  /**
   * Get video events with filtering
   */
  async getVideoEvents(filters: {
    vehicleId?: number;
    driverId?: number;
    eventType?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    markedAsEvidence?: boolean;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.vehicleId) {
      conditions.push(`vse.vehicle_id = $${paramIndex++}`);
      params.push(filters.vehicleId);
    }

    if (filters.driverId) {
      conditions.push(`vse.driver_id = $${paramIndex++}`);
      params.push(filters.driverId);
    }

    if (filters.eventType) {
      conditions.push(`vse.event_type = $${paramIndex++}`);
      params.push(filters.eventType);
    }

    if (filters.severity) {
      conditions.push(`vse.severity = $${paramIndex++}`);
      params.push(filters.severity);
    }

    if (filters.startDate) {
      conditions.push(`vse.event_timestamp >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`vse.event_timestamp <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    if (filters.markedAsEvidence !== undefined) {
      conditions.push(`vse.marked_as_evidence = $${paramIndex++}`);
      params.push(filters.markedAsEvidence);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        vse.*,
        v.name as vehicle_name,
        v.vin,
        d.first_name || ' ' || d.last_name as driver_name,
        vc.camera_type,
        vc.camera_name
      FROM video_safety_events vse
      JOIN vehicles v ON vse.vehicle_id = v.id
      LEFT JOIN drivers d ON vse.driver_id = d.id
      LEFT JOIN vehicle_cameras vc ON vse.camera_id = vc.id
      ${whereClause}
      ORDER BY vse.event_timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await this.db.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM video_safety_events vse
      ${whereClause}
    `;

    const countResult = await this.db.query(countQuery, params.slice(0, -2));

    return {
      events: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }

  /**
   * Download video clip from provider and archive to Azure Storage
   */
  async downloadAndArchiveVideo(eventId: number, videoUrl: string): Promise<string | null> {
    if (!this.containerClient) {
      logger.warn('Azure Storage not configured - video will not be archived');
      return null;
    }

    try {
      logger.info(`Downloading video for event ${eventId} from ${videoUrl}`);

      // SSRF Protection: Validate video URL before downloading
      try {
        validateURL(videoUrl, {
          allowedDomains: [
            // Samsara video URLs
            'api.samsara.com',
            'samsara-fleet-videos.s3.amazonaws.com',
            'videos.samsara.com',

            // Smartcar/telematics providers
            'api.smartcar.com',

            // Add other trusted video providers here
          ]
        });
      } catch (error) {
        if (error instanceof SSRFError) {
          logger.error(`SSRF Protection blocked video download from ${videoUrl}`, {
            eventId,
            reason: error.reason
          });
          throw new Error(`Unauthorized video URL: ${error.reason}`);
        }
        throw error;
      }

      // Download video from provider URL
      const response = await safeGet(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minutes
        allowedDomains: [
          'api.samsara.com',
          'samsara-fleet-videos.s3.amazonaws.com',
          'videos.samsara.com',
          'api.smartcar.com',
        ]
      });

      const videoBuffer = Buffer.from(response.data);
      const fileSizeMb = videoBuffer.length / (1024 * 1024);

      // Generate blob name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const blobName = `events/${eventId}/video-${timestamp}.mp4`;

      // Upload to Azure Blob Storage
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(videoBuffer, videoBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'video/mp4'
        }
      });

      const storagePath = `${AZURE_STORAGE_CONTAINER}/${blobName}`;

      // Update event with storage path
      await this.db.query(
        `UPDATE video_safety_events
         SET video_storage_path = $1,
             video_file_size_mb = $2,
             video_download_status = 'ready',
             updated_at = NOW()
         WHERE id = $3',
        [storagePath, fileSizeMb, eventId]
      );

      logger.info(`Video archived for event ${eventId}: ${storagePath} (${fileSizeMb.toFixed(2)} MB)`);

      return storagePath;
    } catch (error: any) {
      logger.error(`Failed to download/archive video for event ${eventId}:`, error.message);

      await this.db.query(
        `UPDATE video_safety_events
         SET video_download_status = 'failed',
             updated_at = NOW()
         WHERE id = $1',
        [eventId]
      );

      return null;
    }
  }

  /**
   * Get video playback URL (generates SAS token for Azure Storage)
   */
  async getVideoPlaybackUrl(eventId: number): Promise<string | null> {
    const result = await this.db.query(
      `SELECT video_url, video_storage_path, video_download_status
       FROM video_safety_events
       WHERE id = $1',
      [eventId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const event = result.rows[0];

    // If video is archived in Azure Storage, generate SAS URL
    if (event.video_storage_path && this.containerClient) {
      try {
        const blobName = event.video_storage_path.replace(`${AZURE_STORAGE_CONTAINER}/`, '');
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

        // Generate SAS token (valid for 1 hour)
        const expiresOn = new Date();
        expiresOn.setHours(expiresOn.getHours() + 1);

        const sasUrl = await blockBlobClient.generateSasUrl({
          permissions: { read: true },
          expiresOn
        } as any);

        return sasUrl;
      } catch (error: any) {
        logger.error(`Failed to generate SAS URL for event ${eventId}:`, error.message);
      }
    }

    // Fall back to original provider URL
    return event.video_url;
  }

  /**
   * Create evidence locker case
   */
  async createEvidenceLocker(data: {
    lockerName: string;
    lockerType: string;
    caseNumber?: string;
    incidentDate?: Date;
    incidentDescription?: string;
    createdBy: number;
    assignedTo?: number;
    legalHold?: boolean;
    legalHoldReason?: string;
  }): Promise<number> {
    const result = await this.db.query(
      `INSERT INTO evidence_locker
       (locker_name, locker_type, case_number, incident_date, incident_description,
        created_by, assigned_to, legal_hold, legal_hold_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        data.lockerName,
        data.lockerType,
        data.caseNumber,
        data.incidentDate,
        data.incidentDescription,
        data.createdBy,
        data.assignedTo,
        data.legalHold || false,
        data.legalHoldReason
      ]
    );

    const lockerId = result.rows[0].id;

    // If legal hold, set extended retention
    if (data.legalHold) {
      await this.db.query(
        `UPDATE evidence_locker
         SET retention_policy = 'permanent',
             legal_hold_started_at = NOW()
         WHERE id = $1',
        [lockerId]
      );
    }

    logger.info(`Evidence locker created: id=${lockerId}, case=${data.caseNumber}`);

    return lockerId;
  }

  /**
   * Add video event to evidence locker
   */
  async addToEvidenceLocker(eventId: number, lockerId: number, userId: number) {
    await this.db.query(
      `UPDATE video_safety_events
       SET evidence_locker_id = $1,
           marked_as_evidence = true,
           retention_policy = 'extended',
           updated_at = NOW()
       WHERE id = $2',
      [lockerId, eventId]
    );

    // Audit log
    await this.db.query(
      `INSERT INTO video_privacy_audit
       (video_event_id, accessed_by, access_type, access_reason)
       VALUES ($1, $2, 'share', 'Added to evidence locker')`,
      [eventId, userId]
    );

    logger.info(`Event ${eventId} added to evidence locker ${lockerId}`);
  }

  /**
   * Get evidence locker with videos
   */
  async getEvidenceLocker(lockerId: number) {
    const lockerResult = await this.db.query(
      `SELECT el.*,
              u.username as created_by_name,
              u2.username as assigned_to_name
       FROM evidence_locker el
       LEFT JOIN users u ON el.created_by = u.id
       LEFT JOIN users u2 ON el.assigned_to = u2.id
       WHERE el.id = $1',
      [lockerId]
    );

    if (lockerResult.rows.length === 0) {
      return null;
    }

    const locker = lockerResult.rows[0];

    // Get associated videos
    const videosResult = await this.db.query(
      `SELECT vse.*,
              v.name as vehicle_name,
              d.first_name || ' ' || d.last_name as driver_name
       FROM video_safety_events vse
       JOIN vehicles v ON vse.vehicle_id = v.id
       LEFT JOIN drivers d ON vse.driver_id = d.id
       WHERE vse.evidence_locker_id = $1
       ORDER BY vse.event_timestamp DESC`,
      [lockerId]
    );

    return {
      ...locker,
      videos: videosResult.rows
    };
  }

  /**
   * Search evidence locker
   */
  async searchEvidenceLocker(filters: {
    status?: string;
    lockerType?: string;
    legalHold?: boolean;
    page?: number;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`el.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.lockerType) {
      conditions.push(`el.locker_type = $${paramIndex++}`);
      params.push(filters.lockerType);
    }

    if (filters.legalHold !== undefined) {
      conditions.push(`el.legal_hold = $${paramIndex++}`);
      params.push(filters.legalHold);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const result = await this.db.query(
      `SELECT el.*,
              COUNT(vse.id) as video_count,
              u.username as created_by_name
       FROM evidence_locker el
       LEFT JOIN video_safety_events vse ON vse.evidence_locker_id = el.id
       LEFT JOIN users u ON el.created_by = u.id
       ${whereClause}
       GROUP BY el.id, u.username
       ORDER BY el.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      lockers: result.rows,
      pagination: { page, limit }
    };
  }

  /**
   * Mark event for coaching
   */
  async markForCoaching(eventId: number, userId: number) {
    await this.db.query(
      `UPDATE video_safety_events
       SET coaching_required = true,
           updated_at = NOW()
       WHERE id = $1',
      [eventId]
    );

    logger.info(`Event ${eventId} marked for coaching by user ${userId}`);
  }

  /**
   * Create coaching session
   */
  async createCoachingSession(data: {
    driverId: number;
    videoEventId?: number;
    sessionType: string;
    coachingTopic: string;
    coachId: number;
    coachNotes?: string;
    scheduledAt?: Date;
  }): Promise<number> {
    const result = await this.db.query(
      `INSERT INTO driver_coaching_sessions
       (driver_id, video_event_id, session_type, coaching_topic, coach_id, coach_notes, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        data.driverId,
        data.videoEventId,
        data.sessionType,
        data.coachingTopic,
        data.coachId,
        data.coachNotes,
        data.scheduledAt
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Complete coaching session
   */
  async completeCoachingSession(
    sessionId: number,
    outcome: string,
    actionItems?: string,
    driverAcknowledgment?: string
  ) {
    await this.db.query(
      `UPDATE driver_coaching_sessions
       SET conducted_at = NOW(),
           outcome = $1,
           action_items = $2,
           driver_acknowledgment = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [outcome, actionItems, driverAcknowledgment, sessionId]
    );

    // Mark associated video event as coaching completed
    await this.db.query(
      `UPDATE video_safety_events
       SET coaching_completed = true,
           coaching_completed_at = NOW()
       WHERE id = (SELECT video_event_id FROM driver_coaching_sessions WHERE id = $1)`,
      [sessionId]
    );

    logger.info(`Coaching session ${sessionId} completed with outcome: ${outcome}`);
  }

  /**
   * Clean up expired videos
   */
  async cleanupExpiredVideos(): Promise<number> {
    logger.info('Starting video cleanup process...');

    // Find expired videos (not in evidence locker or legal hold)
    const result = await this.db.query(
      `SELECT id, video_storage_path
       FROM video_safety_events
       WHERE retention_expires_at < NOW()
         AND marked_as_evidence = false
         AND video_storage_path IS NOT NULL
         AND video_download_status = 'ready'
       LIMIT 100`
    );

    let deleted = 0;

    for (const event of result.rows) {
      try {
        // Delete from Azure Storage
        if (this.containerClient && event.video_storage_path) {
          const blobName = event.video_storage_path.replace(`${AZURE_STORAGE_CONTAINER}/`, '');
          const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
          await blockBlobClient.deleteIfExists();
        }

        // Mark as deleted in database
        await this.db.query(
          `UPDATE video_safety_events
           SET video_storage_path = NULL,
               video_url = NULL,
               video_download_status = 'deleted',
               updated_at = NOW()
           WHERE id = $1',
          [event.id]
        );

        deleted++;
      } catch (error: any) {
        logger.error(`Failed to delete video for event ${event.id}:`, error.message);
      }
    }

    logger.info(`Video cleanup complete: ${deleted} videos deleted`);

    return deleted;
  }
}

export default VideoTelematicsService;
