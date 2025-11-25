/**
 * Driver Safety AI Service
 * Real-time AI analysis for driver behavior, distraction detection, and drowsiness monitoring
 */

import { Pool } from 'pg';
import axios from 'axios';
// TODO: Install @azure/cognitiveservices-computervision and @azure/ms-rest-js
// import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
// import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { logger } from '../utils/logger';

const AZURE_COMPUTER_VISION_KEY = process.env.AZURE_COMPUTER_VISION_KEY;
const AZURE_COMPUTER_VISION_ENDPOINT = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
const AZURE_FACE_API_KEY = process.env.AZURE_FACE_API_KEY;
const AZURE_FACE_API_ENDPOINT = process.env.AZURE_FACE_API_ENDPOINT;

interface AIAnalysisResult {
  detectedBehaviors: DetectedBehavior[];
  objectDetections: ObjectDetection[];
  faceAnalysis: FaceAnalysis | null;
  vehicleAnalysis: VehicleAnalysis | null;
  overallRiskScore: number;
  confidenceScore: number;
}

interface DetectedBehavior {
  behavior: string;
  confidence: number;
  timestamp: number;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
}

interface ObjectDetection {
  object: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

interface FaceAnalysis {
  eyesClosed: boolean;
  yawning: boolean;
  lookingAway: boolean;
  drowsinessScore: number;
  distractionScore: number;
}

interface VehicleAnalysis {
  laneDeparture: boolean;
  followingDistance: number;
  speedVariance: number;
}

class DriverSafetyAIService {
  private db: Pool;
  private computerVisionClient: ComputerVisionClient | null = null;

  constructor(db: Pool) {
    this.db = db;
    this.initializeAzureVision();
  }

  /**
   * Initialize Azure Computer Vision
   */
  private initializeAzureVision() {
    if (!AZURE_COMPUTER_VISION_KEY || !AZURE_COMPUTER_VISION_ENDPOINT) {
      logger.warn('Azure Computer Vision not configured - AI analysis disabled');
      return;
    }

    try {
      const credentials = new ApiKeyCredentials({
        inHeader: { 'Ocp-Apim-Subscription-Key': AZURE_COMPUTER_VISION_KEY }
      });
      this.computerVisionClient = new ComputerVisionClient(
        credentials,
        AZURE_COMPUTER_VISION_ENDPOINT
      );
      logger.info('Azure Computer Vision initialized');
    } catch (error: any) {
      logger.error('Failed to initialize Azure Computer Vision:', error.message);
    }
  }

  /**
   * Analyze video frame for driver safety
   */
  async analyzeVideoFrame(imageUrl: string, eventType?: string): Promise<AIAnalysisResult> {
    if (!this.computerVisionClient) {
      throw new Error('Azure Computer Vision not configured');
    }

    try {
      const detectedBehaviors: DetectedBehavior[] = [];
      const objectDetections: ObjectDetection[] = [];
      let faceAnalysis: FaceAnalysis | null = null;

      // Analyze image for objects
      const objectAnalysis = await this.computerVisionClient.analyzeImage(imageUrl, {
        visualFeatures: ['Objects', 'Brands', 'Adult']
      });

      // Check for distracted driving objects
      if (objectAnalysis.objects) {
        for (const obj of objectAnalysis.objects) {
          const objName = obj.object.toLowerCase();
          const confidence = obj.confidence || 0;

          objectDetections.push({
            object: obj.object,
            confidence,
            boundingBox: obj.rectangle
          });

          // Phone detection
          if ((objName.includes('phone') || objName.includes('cell')) && confidence > 0.75) {
            detectedBehaviors.push({
              behavior: 'phone_use',
              confidence,
              timestamp: Date.now(),
              severity: 'severe'
            });
          }

          // Smoking detection
          if ((objName.includes('cigarette') || objName.includes('smoking')) && confidence > 0.70) {
            detectedBehaviors.push({
              behavior: 'smoking',
              confidence,
              timestamp: Date.now(),
              severity: 'moderate'
            });
          }

          // Food/drink detection
          if ((objName.includes('food') || objName.includes('drink') || objName.includes('cup')) && confidence > 0.70) {
            detectedBehaviors.push({
              behavior: 'eating_drinking',
              confidence,
              timestamp: Date.now(),
              severity: 'minor'
            });
          }
        }
      }

      // Analyze face for drowsiness and distraction
      faceAnalysis = await this.analyzeFace(imageUrl);

      if (faceAnalysis) {
        if (faceAnalysis.eyesClosed && faceAnalysis.drowsinessScore > 0.7) {
          detectedBehaviors.push({
            behavior: 'drowsiness',
            confidence: faceAnalysis.drowsinessScore,
            timestamp: Date.now(),
            severity: 'critical'
          });
        }

        if (faceAnalysis.yawning) {
          detectedBehaviors.push({
            behavior: 'yawning',
            confidence: 0.85,
            timestamp: Date.now(),
            severity: 'moderate'
          });
        }

        if (faceAnalysis.lookingAway && faceAnalysis.distractionScore > 0.75) {
          detectedBehaviors.push({
            behavior: 'distracted_driving',
            confidence: faceAnalysis.distractionScore,
            timestamp: Date.now(),
            severity: 'severe'
          });
        }
      }

      // Calculate overall risk score
      const overallRiskScore = this.calculateRiskScore(detectedBehaviors);

      // Calculate average confidence
      const confidenceScore =
        detectedBehaviors.length > 0
          ? detectedBehaviors.reduce((sum, b) => sum + b.confidence, 0) / detectedBehaviors.length
          : 0;

      return {
        detectedBehaviors,
        objectDetections,
        faceAnalysis,
        vehicleAnalysis: null, // Would require additional telemetry data
        overallRiskScore,
        confidenceScore
      };
    } catch (error: any) {
      logger.error('AI analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze face for drowsiness and attention
   */
  private async analyzeFace(imageUrl: string): Promise<FaceAnalysis | null> {
    if (!AZURE_FACE_API_KEY || !AZURE_FACE_API_ENDPOINT) {
      return null;
    }

    try {
      const response = await axios.post(
        `${AZURE_FACE_API_ENDPOINT}/face/v1.0/detect`,
        { url: imageUrl },
        {
          params: {
            returnFaceAttributes: 'headPose,facialHair,glasses,emotion',
            detectionModel: 'detection_03',
            recognitionModel: 'recognition_04'
          },
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_FACE_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const face = response.data[0];
      const headPose = face.faceAttributes?.headPose || {};
      const emotion = face.faceAttributes?.emotion || {};

      // Head pose analysis
      const yaw = Math.abs(headPose.yaw || 0);
      const pitch = Math.abs(headPose.pitch || 0);
      const lookingAway = yaw > 30 || pitch > 20;

      // Emotion analysis for drowsiness
      const neutral = emotion.neutral || 0;
      const sadness = emotion.sadness || 0;
      const drowsinessScore = (neutral + sadness) / 2;

      // Simplified drowsiness detection (would need more advanced model in production)
      const eyesClosed = pitch < -15; // Head tilted down significantly
      const yawning = pitch > 20 && neutral > 0.5; // Head tilted up, neutral expression

      // Distraction score based on head pose
      const distractionScore = Math.min((yaw + pitch) / 50, 1.0);

      return {
        eyesClosed,
        yawning,
        lookingAway,
        drowsinessScore,
        distractionScore
      };
    } catch (error: any) {
      logger.error('Face analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Calculate overall risk score from detected behaviors
   */
  private calculateRiskScore(behaviors: DetectedBehavior[]): number {
    if (behaviors.length === 0) return 0;

    const severityWeights = {
      minor: 1,
      moderate: 2,
      severe: 4,
      critical: 8
    };

    const totalScore = behaviors.reduce((sum, behavior) => {
      const weight = severityWeights[behavior.severity];
      return sum + behavior.confidence * weight;
    }, 0);

    const maxPossibleScore = behaviors.length * 8; // Max weight is 8
    return Math.min((totalScore / maxPossibleScore) * 100, 100);
  }

  /**
   * Process AI analysis for a video event
   */
  async processVideoEvent(eventId: number): Promise<void> {
    try {
      logger.info(`Processing AI analysis for event ${eventId}`);

      // Get event details
      const eventResult = await this.db.query(
        `SELECT vse.*, vc.camera_type
         FROM video_safety_events vse
         LEFT JOIN vehicle_cameras vc ON vse.camera_id = vc.id
         WHERE vse.id = $1',
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        throw new Error(`Event ${eventId} not found`);
      }

      const event = eventResult.rows[0];

      if (!event.video_thumbnail_url && !event.video_url) {
        throw new Error(`No video available for event ${eventId}`);
      }

      // Update status to processing
      await this.db.query(
        `UPDATE video_safety_events
         SET ai_processing_status = 'processing'
         WHERE id = $1',
        [eventId]
      );

      // Analyze thumbnail or extract frame from video
      const imageUrl = event.video_thumbnail_url || event.video_url;
      const analysis = await this.analyzeVideoFrame(imageUrl, event.event_type);

      // Store AI analysis results
      await this.db.query(
        `UPDATE video_safety_events
         SET ai_detected_behaviors = $1,
             ai_object_detections = $2,
             ai_face_analysis = $3,
             ai_vehicle_analysis = $4,
             confidence_score = $5,
             ai_processing_status = 'completed',
             ai_processed_at = NOW(),
             updated_at = NOW()
         WHERE id = $6`,
        [
          JSON.stringify(analysis.detectedBehaviors),
          JSON.stringify(analysis.objectDetections),
          JSON.stringify(analysis.faceAnalysis),
          JSON.stringify(analysis.vehicleAnalysis),
          analysis.confidenceScore,
          eventId
        ]
      );

      // Auto-flag for coaching if risk score is high
      if (analysis.overallRiskScore > 70) {
        await this.db.query(
          `UPDATE video_safety_events
           SET coaching_required = true
           WHERE id = $1',
          [eventId]
        );
      }

      // Check if event should be escalated based on AI findings
      const criticalBehaviors = analysis.detectedBehaviors.filter(b => b.severity === 'critical');
      if (criticalBehaviors.length > 0) {
        await this.escalateEvent(eventId, criticalBehaviors);
      }

      logger.info(`AI analysis completed for event ${eventId}: ${analysis.detectedBehaviors.length} behaviors detected, risk score: ${analysis.overallRiskScore.toFixed(1)}`);
    } catch (error: any) {
      logger.error(`AI processing failed for event ${eventId}:`, error.message);

      await this.db.query(
        `UPDATE video_safety_events
         SET ai_processing_status = 'failed',
             updated_at = NOW()
         WHERE id = $1',
        [eventId]
      );

      throw error;
    }
  }

  /**
   * Escalate critical events
   */
  private async escalateEvent(eventId: number, criticalBehaviors: DetectedBehavior[]) {
    try {
      // Update severity to critical
      await this.db.query(
        `UPDATE video_safety_events
         SET severity = 'critical',
             coaching_required = true,
             marked_as_evidence = true
         WHERE id = $1',
        [eventId]
      );

      logger.warn(`Event ${eventId} escalated to critical due to: ${criticalBehaviors.map(b => b.behavior).join(', ')}`);

      // Could send notifications here (email, SMS, etc.)
    } catch (error: any) {
      logger.error(`Failed to escalate event ${eventId}:`, error.message);
    }
  }

  /**
   * Batch process pending events
   */
  async processPendingEvents(limit: number = 10): Promise<number> {
    const result = await this.db.query(
      `SELECT id
       FROM video_safety_events
       WHERE ai_processing_status = 'pending'
         AND (video_thumbnail_url IS NOT NULL OR video_url IS NOT NULL)
       ORDER BY event_timestamp DESC
       LIMIT $1',
      [limit]
    );

    let processed = 0;

    for (const event of result.rows) {
      try {
        await this.processVideoEvent(event.id);
        processed++;
      } catch (error: any) {
        logger.error(`Failed to process event ${event.id}:`, error.message);
      }
    }

    return processed;
  }

  /**
   * Get AI model performance metrics
   */
  async getModelMetrics(modelName: string) {
    const result = await this.db.query(
      `SELECT
         model_name,
         model_version,
         accuracy_rate,
         false_positive_rate,
         avg_processing_time_ms,
         total_detections,
         enabled
       FROM ai_detection_models
       WHERE model_name = $1',
      [modelName]
    );

    return result.rows[0] || null;
  }

  /**
   * Update model performance metrics
   */
  async updateModelMetrics(modelName: string, metrics: {
    accuracyRate?: number;
    falsePositiveRate?: number;
    avgProcessingTimeMs?: number;
  }) {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (metrics.accuracyRate !== undefined) {
      updates.push(`accuracy_rate = $${paramIndex++}`);
      params.push(metrics.accuracyRate);
    }

    if (metrics.falsePositiveRate !== undefined) {
      updates.push(`false_positive_rate = $${paramIndex++}`);
      params.push(metrics.falsePositiveRate);
    }

    if (metrics.avgProcessingTimeMs !== undefined) {
      updates.push(`avg_processing_time_ms = $${paramIndex++}`);
      params.push(metrics.avgProcessingTimeMs);
    }

    updates.push(`total_detections = total_detections + 1`);
    params.push(modelName);

    await this.db.query(
      `UPDATE ai_detection_models
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE model_name = $${paramIndex}`,
      params
    );
  }

  /**
   * Mark event as false positive
   */
  async markFalsePositive(eventId: number, userId: number, reason?: string) {
    await this.db.query(
      `UPDATE video_safety_events
       SET false_positive = true,
           reviewed = true,
           reviewed_by = $1,
           reviewed_at = NOW(),
           review_notes = $2
       WHERE id = $3',
      [userId, reason || 'Marked as false positive', eventId]
    );

    // Update model false positive rate
    const eventResult = await this.db.query(
      `SELECT ai_detected_behaviors
       FROM video_safety_events
       WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length > 0 && eventResult.rows[0].ai_detected_behaviors) {
      // Would update specific model metrics here
      logger.info(`Event ${eventId} marked as false positive by user ${userId}`);
    }
  }

  /**
   * Get driver safety insights
   */
  async getDriverSafetyInsights(driverId: number, days: number = 30) {
    // SECURITY: Use parameterized interval to prevent SQL injection
    const result = await this.db.query(
      `SELECT
         COUNT(*) as total_events,
         SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
         SUM(CASE WHEN severity = 'severe' THEN 1 ELSE 0 END) as severe_count,
         SUM(CASE WHEN false_positive THEN 1 ELSE 0 END) as false_positive_count,
         AVG(confidence_score) as avg_confidence,
         json_agg(DISTINCT jsonb_array_elements(ai_detected_behaviors)->>'behavior') as common_behaviors
       FROM video_safety_events
       WHERE driver_id = $1
         AND event_timestamp >= CURRENT_DATE - ($2::integer * INTERVAL '1 day')
         AND ai_processing_status = 'completed'`,
      [driverId, days]
    );

    return result.rows[0] || {
      total_events: 0,
      critical_count: 0,
      severe_count: 0,
      false_positive_count: 0,
      avg_confidence: 0,
      common_behaviors: []
    };
  }

  /**
   * Generate driver safety report
   */
  async generateDriverSafetyReport(driverId: number, startDate: Date, endDate: Date) {
    const behaviorResult = await this.db.query(
      `SELECT
         jsonb_array_elements(ai_detected_behaviors)->>'behavior' as behavior,
         jsonb_array_elements(ai_detected_behaviors)->>'severity' as severity,
         COUNT(*) as count
       FROM video_safety_events
       WHERE driver_id = $1
         AND event_timestamp BETWEEN $2 AND $3
         AND ai_processing_status = 'completed'
         AND false_positive = false
       GROUP BY behavior, severity
       ORDER BY count DESC`,
      [driverId, startDate, endDate]
    );

    const coachingResult = await this.db.query(
      `SELECT
         COUNT(*) as sessions_conducted,
         json_agg(json_build_object(
           'date', conducted_at,
           'topic', coaching_topic,
           'outcome', outcome
         )) as sessions
       FROM driver_coaching_sessions
       WHERE driver_id = $1
         AND conducted_at BETWEEN $2 AND $3',
      [driverId, startDate, endDate]
    );

    return {
      driverId,
      period: { start: startDate, end: endDate },
      behaviors: behaviorResult.rows,
      coaching: coachingResult.rows[0] || { sessions_conducted: 0, sessions: [] }
    };
  }
}

export default DriverSafetyAIService;
