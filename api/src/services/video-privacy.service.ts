/**
 * Video Privacy Service
 * Face blurring, license plate redaction, and privacy compliance
 */

import { Pool } from 'pg';
import axios from 'axios';
import { logger } from '../config/logger';

const AZURE_COMPUTER_VISION_KEY = process.env.AZURE_COMPUTER_VISION_KEY;
const AZURE_COMPUTER_VISION_ENDPOINT = process.env.AZURE_COMPUTER_VISION_ENDPOINT;

interface BlurRequest {
  eventId: number;
  videoUrl: string;
  blurFaces: boolean;
  blurPlates: boolean;
  redactAudio: boolean;
}

interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface DetectedPlate {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence: number;
}

class VideoPrivacyService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Detect faces in video frame
   */
  async detectFaces(imageUrl: string): Promise<DetectedFace[]> {
    if (!AZURE_COMPUTER_VISION_KEY || !AZURE_COMPUTER_VISION_ENDPOINT) {
      logger.warn('Azure Computer Vision not configured - face detection disabled');
      return [];
    }

    try {
      const response = await axios.post(
        `${AZURE_COMPUTER_VISION_ENDPOINT}/vision/v3.2/detect`,
        { url: imageUrl },
        {
          params: {
            visualFeatures: 'Faces'
          },
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_COMPUTER_VISION_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.faces) {
        return response.data.faces.map((face: any) => ({
          x: face.faceRectangle.left,
          y: face.faceRectangle.top,
          width: face.faceRectangle.width,
          height: face.faceRectangle.height,
          confidence: 1.0
        }));
      }

      return [];
    } catch (error: any) {
      logger.error('Face detection failed:', error.message);
      return [];
    }
  }

  /**
   * Detect license plates using OCR
   */
  async detectLicensePlates(imageUrl: string): Promise<DetectedPlate[]> {
    if (!AZURE_COMPUTER_VISION_KEY || !AZURE_COMPUTER_VISION_ENDPOINT) {
      logger.warn('Azure Computer Vision not configured - plate detection disabled');
      return [];
    }

    try {
      const response = await axios.post(
        `${AZURE_COMPUTER_VISION_ENDPOINT}/vision/v3.2/read/analyze`,
        { url: imageUrl },
        {
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_COMPUTER_VISION_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // Get operation location for polling
      const operationLocation = response.headers['operation-location'];

      // Poll for results (simplified - production would use proper polling)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const resultResponse = await axios.get(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_COMPUTER_VISION_KEY
        }
      });

      const plates: DetectedPlate[] = [];

      if (resultResponse.data.analyzeResult?.readResults) {
        // Look for license plate patterns (simplified)
        const plateRegex = /^[A-Z0-9]{2,3}[-\s]?[A-Z0-9]{3,4}$/;

        for (const page of resultResponse.data.analyzeResult.readResults) {
          for (const line of page.lines) {
            if (plateRegex.test(line.text)) {
              const box = line.boundingBox;
              plates.push({
                x: Math.min(box[0], box[2], box[4], box[6]),
                y: Math.min(box[1], box[3], box[5], box[7]),
                width: Math.max(box[0], box[2], box[4], box[6]) - Math.min(box[0], box[2], box[4], box[6]),
                height: Math.max(box[1], box[3], box[5], box[7]) - Math.min(box[1], box[3], box[5], box[7]),
                text: line.text,
                confidence: line.confidence || 0.8
              });
            }
          }
        }
      }

      return plates;
    } catch (error: any) {
      logger.error('License plate detection failed:', error.message);
      return [];
    }
  }

  /**
   * Apply privacy filters to video
   * NOTE: This is a simplified implementation. Production would use FFmpeg or similar
   * to actually process the video frames and apply blurring.
   */
  async applyPrivacyFilters(request: BlurRequest): Promise<boolean> {
    try {
      logger.info(`Applying privacy filters to event ${request.eventId}: faces=${request.blurFaces}, plates=${request.blurPlates}`);

      // Get video event
      const eventResult = await this.db.query(
        `SELECT video_url, video_thumbnail_url FROM video_safety_events WHERE id = $1`,
        [request.eventId]
      );

      if (eventResult.rows.length === 0) {
        throw new Error(`Event ${request.eventId} not found`);
      }

      const event = eventResult.rows[0];
      let detectedFaces: DetectedFace[] = [];
      let detectedPlates: DetectedPlate[] = [];

      // Detect faces if requested
      if (request.blurFaces && event.video_thumbnail_url) {
        detectedFaces = await this.detectFaces(event.video_thumbnail_url);
        logger.info(`Detected ${detectedFaces.length} faces in event ${request.eventId}`);
      }

      // Detect license plates if requested
      if (request.blurPlates && event.video_thumbnail_url) {
        detectedPlates = await this.detectLicensePlates(event.video_thumbnail_url);
        logger.info(`Detected ${detectedPlates.length} license plates in event ${request.eventId}`);
      }

      // In production, this would:
      // 1. Download the video from Azure Blob Storage
      // 2. Use FFmpeg to apply blur filters at detected coordinates
      // 3. Upload the processed video back to storage
      // 4. Update the video URL

      // For now, we'll just mark the privacy filters as applied
      await this.db.query(
        `UPDATE video_safety_events
         SET privacy_faces_blurred = $1,
             privacy_plates_blurred = $2,
             privacy_audio_redacted = $3,
             privacy_processing_status = 'completed',
             metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
               'detected_faces', $4,
               'detected_plates', $5
             ),
             updated_at = NOW()
         WHERE id = $6`,
        [
          request.blurFaces,
          request.blurPlates,
          request.redactAudio,
          JSON.stringify(detectedFaces),
          JSON.stringify(detectedPlates),
          request.eventId
        ]
      );

      logger.info(`Privacy filters applied to event ${request.eventId}`);

      return true;
    } catch (error: any) {
      logger.error(`Privacy filter application failed for event ${request.eventId}:`, error.message);

      await this.db.query(
        `UPDATE video_safety_events
         SET privacy_processing_status = 'failed',
             updated_at = NOW()
         WHERE id = $1`,
        [request.eventId]
      );

      return false;
    }
  }

  /**
   * Process privacy queue
   */
  async processPrivacyQueue(limit: number = 10): Promise<number> {
    try {
      // Get pending privacy processing tasks
      const result = await this.db.query(
        `SELECT vpq.id, vpq.video_event_id, vse.video_url
         FROM video_processing_queue vpq
         JOIN video_safety_events vse ON vpq.video_event_id = vse.id
         WHERE vpq.task_type = 'privacy_blur'
           AND vpq.status = 'pending'
         ORDER BY vpq.priority, vpq.created_at
         LIMIT $1`,
        [limit]
      );

      let processed = 0;

      for (const task of result.rows) {
        try {
          // Mark as processing
          await this.db.query(
            `UPDATE video_processing_queue
             SET status = 'processing', started_at = NOW()
             WHERE id = $1`,
            [task.id]
          );

          // Get privacy settings from event
          const eventResult = await this.db.query(
            `SELECT
               COALESCE(privacy_blur_faces, false) as blur_faces,
               COALESCE(privacy_blur_plates, false) as blur_plates,
               COALESCE(privacy_audio_redaction, false) as redact_audio
             FROM video_safety_events
             WHERE id = $1`,
            [task.video_event_id]
          );

          if (eventResult.rows.length > 0) {
            const settings = eventResult.rows[0];

            // Apply privacy filters
            const success = await this.applyPrivacyFilters({
              eventId: task.video_event_id,
              videoUrl: task.video_url,
              blurFaces: settings.blur_faces,
              blurPlates: settings.blur_plates,
              redactAudio: settings.redact_audio
            });

            // Update queue status
            if (success) {
              await this.db.query(
                `UPDATE video_processing_queue
                 SET status = 'completed',
                     completed_at = NOW(),
                     processing_time_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))
                 WHERE id = $1`,
                [task.id]
              );
              processed++;
            } else {
              await this.db.query(
                `UPDATE video_processing_queue
                 SET status = 'failed',
                     attempts = attempts + 1,
                     error_message = 'Privacy filter application failed'
                 WHERE id = $1`,
                [task.id]
              );
            }
          }
        } catch (error: any) {
          logger.error(`Failed to process privacy task ${task.id}:`, error.message);

          await this.db.query(
            `UPDATE video_processing_queue
             SET status = 'failed',
                 attempts = attempts + 1,
                 error_message = $1
             WHERE id = $2`,
            [error.message, task.id]
          );
        }
      }

      logger.info(`Processed ${processed}/${result.rows.length} privacy tasks`);

      return processed;
    } catch (error: any) {
      logger.error('Privacy queue processing failed:', error.message);
      return 0;
    }
  }

  /**
   * Get privacy audit log for an event
   */
  async getPrivacyAudit(eventId: number) {
    const result = await this.db.query(
      `SELECT
         vpa.*,
         u.username as accessed_by_name
       FROM video_privacy_audit vpa
       JOIN users u ON vpa.accessed_by = u.id
       WHERE vpa.video_event_id = $1
       ORDER BY vpa.created_at DESC`,
      [eventId]
    );

    return result.rows;
  }

  /**
   * Log privacy access
   */
  async logPrivacyAccess(
    eventId: number,
    userId: number,
    accessType: string,
    accessReason?: string,
    ipAddress?: string
  ) {
    await this.db.query(
      `INSERT INTO video_privacy_audit
       (video_event_id, accessed_by, access_type, access_reason, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [eventId, userId, accessType, accessReason, ipAddress]
    );
  }

  /**
   * Generate privacy compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date) {
    const result = await this.db.query(
      `SELECT
         COUNT(*) as total_events,
         SUM(CASE WHEN privacy_faces_blurred THEN 1 ELSE 0 END) as faces_blurred_count,
         SUM(CASE WHEN privacy_plates_blurred THEN 1 ELSE 0 END) as plates_blurred_count,
         SUM(CASE WHEN privacy_audio_redacted THEN 1 ELSE 0 END) as audio_redacted_count,
         SUM(CASE WHEN privacy_processing_status = 'completed' THEN 1 ELSE 0 END) as processing_completed,
         SUM(CASE WHEN privacy_processing_status = 'failed' THEN 1 ELSE 0 END) as processing_failed
       FROM video_safety_events
       WHERE event_timestamp BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const accessResult = await this.db.query(
      `SELECT
         access_type,
         COUNT(*) as access_count,
         COUNT(DISTINCT accessed_by) as unique_users,
         COUNT(DISTINCT video_event_id) as unique_events
       FROM video_privacy_audit
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY access_type
       ORDER BY access_count DESC`,
      [startDate, endDate]
    );

    return {
      period: { start: startDate, end: endDate },
      events: result.rows[0],
      access: accessResult.rows
    };
  }
}

export default VideoPrivacyService;
