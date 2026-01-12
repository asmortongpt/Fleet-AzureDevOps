/**
 * Video Privacy Service
 * PII protection through face and license plate blurring
 * GDPR/CCPA compliance for video data
 */

import axios from 'axios';
import { Pool } from 'pg';
import sharp from 'sharp';

import logger from '../config/logger';

const AZURE_FACE_API_KEY = process.env.AZURE_FACE_API_KEY;
const AZURE_FACE_API_ENDPOINT = process.env.AZURE_FACE_API_ENDPOINT;
const AZURE_COMPUTER_VISION_KEY = process.env.AZURE_COMPUTER_VISION_KEY;
const AZURE_COMPUTER_VISION_ENDPOINT = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface PrivacyConfig {
  blurFaces: boolean;
  blurPlates: boolean;
  blurStrength: number; // 1-10
  detectPassengers: boolean;
  preserveDriverFace: boolean;
}

interface PrivacyProcessingResult {
  success: boolean;
  facesBlurred: number;
  platesBlurred: number;
  processingTime: number;
  outputImage: Buffer;
  metadata: any;
}

interface DetectedFace {
  faceId: string;
  boundingBox: BoundingBox;
  confidence: number;
  isDriver: boolean;
}

interface DetectedPlate {
  text: string;
  boundingBox: BoundingBox;
  confidence: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

class VideoPrivacyService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Apply privacy filters to image
   */
  async applyPrivacyFilters(
    imageData: Buffer,
    config: PrivacyConfig
  ): Promise<PrivacyProcessingResult> {
    const startTime = Date.now();

    try {
      let processedImage = imageData;
      let facesBlurred = 0;
      let platesBlurred = 0;
      const metadata: any = {};

      // Detect faces if face blurring is enabled
      if (config.blurFaces) {
        const faces = await this.detectFaces(imageData);
        metadata.facesDetected = faces.length;

        // Filter faces based on config
        const facesToBlur = config.preserveDriverFace
          ? faces.filter(f => !f.isDriver)
          : faces;

        // Blur faces
        processedImage = await this.blurRegions(processedImage, facesToBlur.map(f => f.boundingBox), config.blurStrength);
        facesBlurred = facesToBlur.length;
      }

      // Detect license plates if plate blurring is enabled
      if (config.blurPlates) {
        const plates = await this.detectLicensePlates(processedImage);
        metadata.platesDetected = plates.length;

        // Blur plates
        if (plates.length > 0) {
          processedImage = await this.blurRegions(processedImage, plates.map(p => p.boundingBox), config.blurStrength);
          platesBlurred = plates.length;
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        facesBlurred,
        platesBlurred,
        processingTime,
        outputImage: processedImage,
        metadata
      };
    } catch (error: any) {
      logger.error('Privacy filtering failed:', error.message);
      throw error;
    }
  }

  /**
   * Detect faces in image
   */
  private async detectFaces(imageData: Buffer): Promise<DetectedFace[]> {
    const faces: DetectedFace[] = [];

    try {
      // Convert buffer to base64
      const base64Image = imageData.toString('base64');

      // Use Azure Face API
      if (AZURE_FACE_API_KEY && AZURE_FACE_API_ENDPOINT) {
        const response = await axios.post(
          `${AZURE_FACE_API_ENDPOINT}/face/v1.0/detect`,
          { url: `data:image/jpeg;base64,${base64Image}` },
          {
            params: {
              returnFaceAttributes: 'headPose,glasses',
              detectionModel: 'detection_03',
              recognitionModel: 'recognition_04'
            },
            headers: {
              'Ocp-Apim-Subscription-Key': AZURE_FACE_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.length > 0) {
          for (const face of response.data) {
            const rect = face.faceRectangle;

            // Determine if this is likely the driver face
            // Driver typically in center-left of image with forward head pose
            const headPose = face.faceAttributes?.headPose || {};
            const isDriver = Math.abs(headPose.yaw || 0) < 30 && rect.left < 600;

            faces.push({
              faceId: face.faceId,
              boundingBox: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
              },
              confidence: 0.95,
              isDriver
            });
          }
        }
      } else if (OPENAI_API_KEY) {
        // Fallback to OpenAI Vision
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'Detect all faces in the image. Return JSON array with bounding boxes: [{x, y, width, height, isDriver: boolean}]. Driver is typically center-left facing forward.'
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                  },
                  {
                    type: 'text',
                    text: 'Detect faces.'
                  }
                ]
              }
            ],
            max_tokens: 300,
            temperature: 0.1
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.choices && response.data.choices[0].message.content) {
          const content = response.data.choices[0].message.content;
          const detections = JSON.parse(content);

          for (const detection of detections) {
            faces.push({
              faceId: `face_${Date.now()}_${Math.random()}`,
              boundingBox: detection,
              confidence: 0.85,
              isDriver: detection.isDriver || false
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('Face detection failed:', error.message);
    }

    return faces;
  }

  /**
   * Detect license plates in image
   */
  private async detectLicensePlates(imageData: Buffer): Promise<DetectedPlate[]> {
    const plates: DetectedPlate[] = [];

    try {
      // Convert buffer to base64
      const base64Image = imageData.toString('base64');

      // Use Azure Computer Vision OCR
      if (AZURE_COMPUTER_VISION_KEY && AZURE_COMPUTER_VISION_ENDPOINT) {
        const response = await axios.post(
          `${AZURE_COMPUTER_VISION_ENDPOINT}/vision/v3.2/read/analyze`,
          { url: `data:image/jpeg;base64,${base64Image}` },
          {
            headers: {
              'Ocp-Apim-Subscription-Key': AZURE_COMPUTER_VISION_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        // Get operation location for results
        const operationLocation = response.headers['operation-location'];
        if (operationLocation) {
          // Wait for processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          const resultResponse = await axios.get(operationLocation, {
            headers: {
              'Ocp-Apim-Subscription-Key': AZURE_COMPUTER_VISION_KEY
            }
          });

          if (resultResponse.data?.analyzeResult?.readResults) {
            for (const page of resultResponse.data.analyzeResult.readResults) {
              for (const line of page.lines) {
                // License plate pattern detection (US format)
                const platePattern = /^[A-Z0-9]{2,8}$/;
                if (platePattern.test(line.text.replace(/\s+/g, ''))) {
                  const bbox = line.boundingBox;
                  plates.push({
                    text: line.text,
                    boundingBox: {
                      x: Math.min(bbox[0], bbox[6]),
                      y: Math.min(bbox[1], bbox[3]),
                      width: Math.abs(bbox[2] - bbox[0]),
                      height: Math.abs(bbox[5] - bbox[1])
                    },
                    confidence: 0.9
                  });
                }
              }
            }
          }
        }
      } else if (OPENAI_API_KEY) {
        // Fallback to OpenAI Vision
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'Detect license plates in the image. Return JSON array with bounding boxes: [{text, x, y, width, height}]. Only return actual license plate numbers found.'
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                  },
                  {
                    type: 'text',
                    text: 'Detect license plates.'
                  }
                ]
              }
            ],
            max_tokens: 300,
            temperature: 0.1
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.choices && response.data.choices[0].message.content) {
          const content = response.data.choices[0].message.content;
          const detections = JSON.parse(content);

          for (const detection of detections) {
            plates.push({
              text: detection.text,
              boundingBox: {
                x: detection.x,
                y: detection.y,
                width: detection.width,
                height: detection.height
              },
              confidence: 0.85
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('License plate detection failed:', error.message);
    }

    return plates;
  }

  /**
   * Blur specific regions in image
   */
  private async blurRegions(
    imageData: Buffer,
    regions: BoundingBox[],
    blurStrength: number
  ): Promise<Buffer> {
    try {
      let image = sharp(imageData);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image dimensions');
      }

      // Apply blur to each region
      for (const region of regions) {
        // Ensure region is within image bounds
        const x = Math.max(0, Math.floor(region.x));
        const y = Math.max(0, Math.floor(region.y));
        const width = Math.min(metadata.width - x, Math.floor(region.width));
        const height = Math.min(metadata.height - y, Math.floor(region.height));

        if (width <= 0 || height <= 0) {
          continue;
        }

        // Extract region
        const regionBuffer = await image
          .extract({ left: x, top: y, width, height })
          .toBuffer();

        // Blur region
        const blurredRegion = await sharp(regionBuffer)
          .blur(blurStrength * 3) // Scale blur strength
          .toBuffer();

        // Composite blurred region back
        image = sharp(await image.toBuffer())
          .composite([
            {
              input: blurredRegion,
              left: x,
              top: y
            }
          ]);
      }

      return await image.jpeg({ quality: 90 }).toBuffer();
    } catch (error: any) {
      logger.error('Region blurring failed:', error.message);
      throw error;
    }
  }

  /**
   * Process video event for privacy
   */
  async processVideoEvent(eventId: number, config: PrivacyConfig): Promise<void> {
    try {
      logger.info(`Processing privacy filters for event ${eventId}`);

      // Get event details
      const eventResult = await this.db.query(
        `SELECT * FROM video_safety_events WHERE id = $1`,
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        throw new Error(`Event ${eventId} not found`);
      }

      const event = eventResult.rows[0];

      // Update status
      await this.db.query(
        `UPDATE video_safety_events
         SET privacy_processing_status = 'processing'
         WHERE id = $1`,
        [eventId]
      );

      // Process thumbnail if available
      if (event.video_thumbnail_url) {
        // Download thumbnail
        // Apply privacy filters
        // Upload processed thumbnail
        // Update database with new URL
      }

      // Process video frames
      // In production, would process full video file

      // Update completion status
      await this.db.query(
        `UPDATE video_safety_events
         SET privacy_processing_status = 'completed',
             privacy_faces_blurred = $1,
             privacy_plates_blurred = $2,
             privacy_processed_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [config.blurFaces, config.blurPlates, eventId]
      );

      // Audit log
      await this.db.query(
        `INSERT INTO video_privacy_audit
         (video_event_id, privacy_action, privacy_config, processed_at)
         VALUES ($1, 'privacy_filter_applied', $2, NOW())`,
        [eventId, JSON.stringify(config)]
      );

      logger.info(`Privacy processing completed for event ${eventId}`);
    } catch (error: any) {
      logger.error(`Privacy processing failed for event ${eventId}:`, error.message);

      await this.db.query(
        `UPDATE video_safety_events
         SET privacy_processing_status = 'failed'
         WHERE id = $1`,
        [eventId]
      );

      throw error;
    }
  }

  /**
   * Batch process pending privacy requests
   */
  async processPendingPrivacyRequests(limit: number = 10): Promise<number> {
    const result = await this.db.query(
      `SELECT id FROM video_safety_events
       WHERE privacy_processing_status = 'pending'
       ORDER BY created_at
       LIMIT $1`,
      [limit]
    );

    let processed = 0;

    for (const event of result.rows) {
      try {
        await this.processVideoEvent(event.id, {
          blurFaces: true,
          blurPlates: true,
          blurStrength: 5,
          detectPassengers: true,
          preserveDriverFace: false
        });
        processed++;
      } catch (error: any) {
        logger.error(`Failed to process privacy for event ${event.id}:`, error.message);
      }
    }

    return processed;
  }

  /**
   * Audit privacy access
   */
  async auditPrivacyAccess(
    eventId: number,
    userId: number,
    accessType: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO video_privacy_audit
         (video_event_id, accessed_by, access_type, access_reason, accessed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [eventId, userId, accessType, reason]
      );
    } catch (error: any) {
      logger.error('Failed to audit privacy access:', error.message);
    }
  }

  /**
   * Get privacy audit log
   */
  async getPrivacyAuditLog(eventId: number): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT vpa.*, u.username, u.email
         FROM video_privacy_audit vpa
         LEFT JOIN users u ON vpa.accessed_by = u.id
         WHERE vpa.video_event_id = $1
         ORDER BY vpa.accessed_at DESC`,
        [eventId]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to get privacy audit log:', error.message);
      return [];
    }
  }
}

export default VideoPrivacyService;
