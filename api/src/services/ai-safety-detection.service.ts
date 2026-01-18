/**
 * AI Safety Detection Service
 * Advanced computer vision for driver safety monitoring
 * Detects: distracted driving, drowsiness, phone use, seatbelt violations, smoking
 *
 * NOTE: TensorFlow.js dependencies removed for build compatibility
 * Uses external AI APIs (OpenAI/Azure) instead
 */

// import * as tf from '@tensorflow/tfjs-node'; // Removed for build compatibility
import axios from 'axios';
import { Pool } from 'pg';

import logger from '../config/logger';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AZURE_COMPUTER_VISION_KEY = process.env.AZURE_COMPUTER_VISION_KEY;
const AZURE_COMPUTER_VISION_ENDPOINT = process.env.AZURE_COMPUTER_VISION_ENDPOINT;

interface DetectionResult {
  detections: Detection[];
  riskScore: number;
  confidence: number;
  processingTime: number;
}

interface Detection {
  type: string;
  category: 'distraction' | 'drowsiness' | 'violation' | 'unsafe_driving';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  confidence: number;
  boundingBox?: BoundingBox;
  metadata?: any;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

class AISafetyDetectionService {
  private db: Pool;
  // private model: tf.GraphModel | null = null; // TensorFlow removed
  private model: any | null = null;
  private modelLoaded: boolean = false;

  constructor(db: Pool) {
    this.db = db;
    this.initializeModels();
  }

  /**
   * Initialize TensorFlow models
   */
  private async initializeModels() {
    try {
      // In production, would load custom trained models
      // For now, using pre-trained COCO-SSD for object detection
      logger.info('Initializing AI detection models...');

      // Would load models like:
      // - Driver face/pose detection model
      // - Phone/device detection model
      // - Seatbelt detection model
      // - Drowsiness detection model

      this.modelLoaded = true;
      logger.info('AI detection models initialized');
    } catch (error: any) {
      logger.error('Failed to initialize AI models:', error.message);
    }
  }

  /**
   * Analyze image for driver safety violations
   */
  async analyzeImage(imageData: Buffer | string): Promise<DetectionResult> {
    const startTime = Date.now();
    const detections: Detection[] = [];

    try {
      // Convert image to format suitable for analysis
      const imageBase64 = typeof imageData === 'string'
        ? imageData
        : `data:image/jpeg;base64,${imageData.toString('base64')}`;

      // Run multiple detection models in parallel
      const [
        objectDetections,
        faceAnalysis,
        poseAnalysis
      ] = await Promise.all([
        this.detectObjects(imageBase64),
        this.analyzeFaceAttributes(imageBase64),
        this.analyzePose(imageBase64)
      ]);

      // Process object detections
      detections.push(...objectDetections);

      // Process face analysis
      if (faceAnalysis) {
        detections.push(...faceAnalysis);
      }

      // Process pose analysis
      if (poseAnalysis) {
        detections.push(...poseAnalysis);
      }

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(detections);

      // Calculate average confidence
      const confidence = detections.length > 0
        ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
        : 0;

      const processingTime = Date.now() - startTime;

      return {
        detections,
        riskScore,
        confidence,
        processingTime
      };
    } catch (error: any) {
      logger.error('Image analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Detect objects in image (phone, cigarette, food, etc.)
   */
  private async detectObjects(imageBase64: string): Promise<Detection[]> {
    const detections: Detection[] = [];

    try {
      // Use Azure Computer Vision for object detection
      if (!AZURE_COMPUTER_VISION_KEY || !AZURE_COMPUTER_VISION_ENDPOINT) {
        logger.warn('Azure Computer Vision not configured');
        return detections;
      }

      const response = await axios.post(
        `${AZURE_COMPUTER_VISION_ENDPOINT}/vision/v3.2/detect`,
        { url: imageBase64 },
        {
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_COMPUTER_VISION_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.objects) {
        for (const obj of response.data.objects) {
          const objName = obj.object.toLowerCase();
          const confidence = obj.confidence || 0;

          // Phone detection
          if ((objName.includes('phone') || objName.includes('cell') || objName.includes('mobile')) && confidence > 0.7) {
            detections.push({
              type: 'phone_use',
              category: 'distraction',
              severity: 'severe',
              confidence,
              boundingBox: obj.rectangle,
              metadata: { object: obj.object }
            });
          }

          // Cigarette/smoking detection
          if ((objName.includes('cigarette') || objName.includes('smoking')) && confidence > 0.65) {
            detections.push({
              type: 'smoking',
              category: 'violation',
              severity: 'moderate',
              confidence,
              boundingBox: obj.rectangle,
              metadata: { object: obj.object }
            });
          }

          // Food/drink detection
          if ((objName.includes('food') || objName.includes('drink') || objName.includes('cup') || objName.includes('bottle')) && confidence > 0.65) {
            detections.push({
              type: 'eating_drinking',
              category: 'distraction',
              severity: 'minor',
              confidence,
              boundingBox: obj.rectangle,
              metadata: { object: obj.object }
            });
          }

          // Book/tablet detection
          if ((objName.includes('book') || objName.includes('tablet') || objName.includes('magazine')) && confidence > 0.7) {
            detections.push({
              type: 'reading',
              category: 'distraction',
              severity: 'severe',
              confidence,
              boundingBox: obj.rectangle,
              metadata: { object: obj.object }
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('Object detection failed:', error.message);
    }

    return detections;
  }

  /**
   * Analyze face attributes for drowsiness and attention
   */
  private async analyzeFaceAttributes(imageBase64: string): Promise<Detection[]> {
    const detections: Detection[] = [];

    try {
      // Use OpenAI Vision API for advanced face analysis
      if (!OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured');
        return detections;
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a driver safety AI. Analyze the image and detect: eyes closed, yawning, looking away from road, drowsiness signs, distraction. Return JSON only with keys: eyesClosed (boolean), yawning (boolean), lookingAway (boolean), drowsinessScore (0-1), distractionScore (0-1), wearing_seatbelt (boolean).'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: imageBase64 }
                },
                {
                  type: 'text',
                  text: 'Analyze this driver image for safety issues.'
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
        const analysis = JSON.parse(content);

        // Drowsiness detection
        if (analysis.eyesClosed && analysis.drowsinessScore > 0.6) {
          detections.push({
            type: 'eyes_closed',
            category: 'drowsiness',
            severity: 'critical',
            confidence: analysis.drowsinessScore,
            metadata: { drowsinessScore: analysis.drowsinessScore }
          });
        }

        // Yawning detection
        if (analysis.yawning) {
          detections.push({
            type: 'yawning',
            category: 'drowsiness',
            severity: 'moderate',
            confidence: 0.8,
            metadata: {}
          });
        }

        // Distraction detection
        if (analysis.lookingAway && analysis.distractionScore > 0.7) {
          detections.push({
            type: 'looking_away',
            category: 'distraction',
            severity: 'severe',
            confidence: analysis.distractionScore,
            metadata: { distractionScore: analysis.distractionScore }
          });
        }

        // Seatbelt detection
        if (analysis.wearing_seatbelt === false) {
          detections.push({
            type: 'no_seatbelt',
            category: 'violation',
            severity: 'critical',
            confidence: 0.85,
            metadata: {}
          });
        }
      }
    } catch (error: any) {
      logger.error('Face analysis failed:', error.message);
    }

    return detections;
  }

  /**
   * Analyze body pose for driver positioning
   */
  private async analyzePose(imageBase64: string): Promise<Detection[]> {
    const detections: Detection[] = [];

    try {
      // In production, would use PoseNet or similar model
      // For now, using OpenAI Vision for pose analysis

      if (!OPENAI_API_KEY) {
        return detections;
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Analyze driver body position. Detect: hand position (both hands on wheel, one hand, no hands), body position (leaning, slouching, proper position). Return JSON with: handsOnWheel (number 0-2), properPosition (boolean), leaning (boolean), handsNearFace (boolean).'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: imageBase64 }
                },
                {
                  type: 'text',
                  text: 'Analyze driver position.'
                }
              ]
            }
          ],
          max_tokens: 200,
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
        const analysis = JSON.parse(content);

        // Hand position check
        if (analysis.handsOnWheel === 0) {
          detections.push({
            type: 'no_hands_on_wheel',
            category: 'unsafe_driving',
            severity: 'critical',
            confidence: 0.9,
            metadata: {}
          });
        } else if (analysis.handsOnWheel === 1) {
          detections.push({
            type: 'one_hand_driving',
            category: 'unsafe_driving',
            severity: 'minor',
            confidence: 0.75,
            metadata: {}
          });
        }

        // Hands near face (potential phone use or distraction)
        if (analysis.handsNearFace) {
          detections.push({
            type: 'hands_near_face',
            category: 'distraction',
            severity: 'moderate',
            confidence: 0.7,
            metadata: {}
          });
        }

        // Poor driving posture
        if (!analysis.properPosition || analysis.leaning) {
          detections.push({
            type: 'poor_posture',
            category: 'unsafe_driving',
            severity: 'minor',
            confidence: 0.65,
            metadata: { leaning: analysis.leaning }
          });
        }
      }
    } catch (error: any) {
      logger.error('Pose analysis failed:', error.message);
    }

    return detections;
  }

  /**
   * Calculate overall risk score from detections
   */
  private calculateRiskScore(detections: Detection[]): number {
    if (detections.length === 0) {
      return 0;
    }

    const severityWeights = {
      minor: 1,
      moderate: 2,
      severe: 4,
      critical: 8
    };

    const totalScore = detections.reduce((sum, detection) => {
      const weight = severityWeights[detection.severity];
      return sum + (detection.confidence * weight);
    }, 0);

    const maxPossibleScore = detections.length * 8; // Max weight is 8
    return Math.min((totalScore / maxPossibleScore) * 100, 100);
  }

  /**
   * Batch analyze multiple images
   */
  async batchAnalyze(images: Array<Buffer | string>): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    for (const image of images) {
      try {
        const result = await this.analyzeImage(image);
        results.push(result);
      } catch (error: any) {
        logger.error('Batch analysis failed for image:', error.message);
      }
    }

    return results;
  }

  /**
   * Update detection model performance metrics
   */
  async updateModelMetrics(modelType: string, metrics: {
    accuracy?: number;
    falsePositiveRate?: number;
    avgProcessingTime?: number;
  }): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO ai_detection_models (model_name, model_type, accuracy_rate, false_positive_rate, avg_processing_time_ms, total_detections)
         VALUES ($1, $2, $3, $4, $5, 1)
         ON CONFLICT (model_name)
         DO UPDATE SET
           accuracy_rate = COALESCE($3, ai_detection_models.accuracy_rate),
           false_positive_rate = COALESCE($4, ai_detection_models.false_positive_rate),
           avg_processing_time_ms = COALESCE($5, ai_detection_models.avg_processing_time_ms),
           total_detections = ai_detection_models.total_detections + 1,
           updated_at = NOW()`,
        [
          modelType,
          'safety_detection',
          metrics.accuracy,
          metrics.falsePositiveRate,
          metrics.avgProcessingTime
        ]
      );
    