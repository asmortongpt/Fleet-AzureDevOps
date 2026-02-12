/**
 * Video Stream Processing Service
 * Real-time video frame processing, multi-camera stream handling, and event-triggered recording
 */

import { EventEmitter } from 'events';

import { Pool } from 'pg';

import logger from '../config/logger';

import DriverSafetyAIService from './driver-safety-ai.service';
import VideoTelematicsService from './video-telematics.service';

interface StreamConfig {
  vehicleId: number;
  cameraId: number;
  streamUrl: string;
  resolution: string;
  frameRate: number;
  bitrate: number;
}

interface ProcessedFrame {
  frameId: string;
  timestamp: Date;
  cameraId: number;
  vehicleId: number;
  imageData: Buffer;
  analysisResults?: any;
}

interface EventTrigger {
  eventType: string;
  severity: string;
  confidence: number;
  timestamp: Date;
  preBufferSeconds: number;
  postBufferSeconds: number;
}

class VideoStreamProcessorService extends EventEmitter {
  private db: Pool;
  private aiService: DriverSafetyAIService;
  private videoService: VideoTelematicsService;
  private activeStreams: Map<number, StreamSession>;
  private frameBuffers: Map<number, ProcessedFrame[]>;
  private processingQueue: ProcessedFrame[];
  private isProcessing: boolean;

  constructor(db: Pool) {
    super();
    this.db = db;
    this.aiService = new DriverSafetyAIService(db);
    this.videoService = new VideoTelematicsService(db);
    this.activeStreams = new Map();
    this.frameBuffers = new Map();
    this.processingQueue = [];
    this.isProcessing = false;

    // Start background processing
    this.startBackgroundProcessing();
  }

  /**
   * Start video stream for a camera
   */
  async startStream(config: StreamConfig): Promise<string> {
    try {
      logger.info(`Starting video stream for camera ${config.cameraId}`);

      // Validate camera exists and is configured
      const cameras = await this.videoService.getVehicleCameras(config.vehicleId);
      const camera = cameras.find(c => c.id === config.cameraId);

      if (!camera) {
        throw new Error(`Camera ${config.cameraId} not found`);
      }

      // Create stream session
      const sessionId = `stream_${config.cameraId}_${Date.now()}`;
      const session: StreamSession = {
        sessionId,
        cameraId: config.cameraId,
        vehicleId: config.vehicleId,
        streamUrl: config.streamUrl,
        startedAt: new Date(),
        isActive: true,
        frameCount: 0,
        lastFrameAt: null,
        config: {
          resolution: config.resolution,
          frameRate: config.frameRate,
          bitrate: config.bitrate,
          preEventBuffer: camera.pre_event_buffer_seconds || 10,
          postEventBuffer: camera.post_event_buffer_seconds || 30
        }
      };

      this.activeStreams.set(config.cameraId, session);
      this.frameBuffers.set(config.cameraId, []);

      // Update camera status
      await this.videoService.updateCameraHealth(config.cameraId, 'streaming');

      logger.info(`Video stream started: ${sessionId}`);
      return sessionId;
    } catch (error: any) {
      logger.error(`Failed to start stream for camera ${config.cameraId}:`, error.message);
      throw error;
    }
  }

  /**
   * Stop video stream
   */
  async stopStream(cameraId: number): Promise<void> {
    const session = this.activeStreams.get(cameraId);

    if (!session) {
      logger.warn(`No active stream found for camera ${cameraId}`);
      return;
    }

    session.isActive = false;
    session.stoppedAt = new Date();

    // Clear frame buffer
    this.frameBuffers.delete(cameraId);

    // Update camera status
    await this.videoService.updateCameraHealth(cameraId, 'online');

    this.activeStreams.delete(cameraId);

    logger.info(`Video stream stopped: ${session.sessionId}`);
  }

  /**
   * Process incoming video frame
   */
  async processFrame(cameraId: number, frameData: Buffer, metadata?: any): Promise<void> {
    const session = this.activeStreams.get(cameraId);

    if (!session || !session.isActive) {
      logger.warn(`Received frame for inactive stream: camera ${cameraId}`);
      return;
    }

    // Create processed frame
    const frame: ProcessedFrame = {
      frameId: `frame_${cameraId}_${Date.now()}_${session.frameCount}`,
      timestamp: new Date(),
      cameraId,
      vehicleId: session.vehicleId,
      imageData: frameData
    };

    // Update session stats
    session.frameCount++;
    session.lastFrameAt = new Date();

    // Add to frame buffer (circular buffer with size limit)
    const buffer = this.frameBuffers.get(cameraId) || [];
    buffer.push(frame);

    // Keep only last N seconds of frames (based on pre-event buffer)
    const maxFrames = session.config.frameRate * session.config.preEventBuffer;
    if (buffer.length > maxFrames) {
      buffer.shift(); // Remove oldest frame
    }

    this.frameBuffers.set(cameraId, buffer);

    // Queue frame for AI analysis (every Nth frame to manage load)
    const analyzeInterval = Math.max(1, Math.floor(session.config.frameRate / 2)); // Analyze 2 frames per second
    if (session.frameCount % analyzeInterval === 0) {
      this.processingQueue.push(frame);
    }
  }

  /**
   * Background processing of queued frames
   */
  private async startBackgroundProcessing() {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) {
        return;
      }

      this.isProcessing = true;

      try {
        const frame = this.processingQueue.shift();
        if (frame) {
          await this.analyzeFrame(frame);
        }
      } catch (error: any) {
        logger.error(`Frame processing error:`, error.message);
      } finally {
        this.isProcessing = false;
      }
    }, 500); // Process every 500ms
  }

  /**
   * Analyze frame with AI safety detection
   */
  private async analyzeFrame(frame: ProcessedFrame): Promise<void> {
    try {
      // Convert buffer to base64 data URL for AI analysis
      const base64Image = `data:image/jpeg;base64,${frame.imageData.toString('base64')}`;

      // Run AI analysis
      const analysis = await this.aiService.analyzeVideoFrame(base64Image);

      frame.analysisResults = analysis;

      // Check for safety events
      if (analysis.detectedBehaviors.length > 0) {
        const highRiskBehaviors = analysis.detectedBehaviors.filter(
          b => b.severity === 'critical' || b.severity === 'severe'
        );

        if (highRiskBehaviors.length > 0) {
          await this.triggerSafetyEvent(frame, highRiskBehaviors);
        }
      }

      // Emit analysis result event
      this.emit('frameAnalyzed', {
        cameraId: frame.cameraId,
        vehicleId: frame.vehicleId,
        timestamp: frame.timestamp,
        behaviors: analysis.detectedBehaviors,
        riskScore: analysis.overallRiskScore
      });
    } catch (error: any) {
      logger.error(`Frame analysis failed for ${frame.frameId}:`, error.message);
    }
  }

  /**
   * Trigger safety event and capture video clip
   */
  private async triggerSafetyEvent(frame: ProcessedFrame, behaviors: any[]): Promise<void> {
    try {
      const session = this.activeStreams.get(frame.cameraId);
      if (!session) {
        return;
      }

      logger.info(`Safety event triggered for camera ${frame.cameraId}: ${behaviors.map(b => b.behavior).join(', ')}`);

      // Get pre-event buffer frames
      const buffer = this.frameBuffers.get(frame.cameraId) || [];
      const preEventFrames = buffer.slice();

      // Determine event type and severity
      const primaryBehavior = behaviors.reduce((max, b) =>
        this.getSeverityWeight(b.severity) > this.getSeverityWeight(max.severity) ? b : max
      );

      // Get vehicle/driver context
      const vehicleResult = await this.db.query(
        `SELECT v.*, d.id as driver_id, d.first_name, d.last_name
         FROM vehicles v
         LEFT JOIN vehicle_assignments va ON v.id = va.vehicle_id AND va.end_date IS NULL
         LEFT JOIN drivers d ON va.driver_id = d.id
         WHERE v.id = $1`,
        [frame.vehicleId]
      );

      const vehicle = vehicleResult.rows[0];

      // Create video event
      const eventId = await this.videoService.createVideoEvent({
        vehicleId: frame.vehicleId,
        driverId: vehicle?.driver_id,
        cameraId: frame.cameraId,
        eventType: primaryBehavior.behavior,
        severity: primaryBehavior.severity,
        eventTimestamp: frame.timestamp,
        markedAsEvidence: primaryBehavior.severity === 'critical',
        retentionPolicy: primaryBehavior.severity === 'critical' ? 'extended' : 'standard'
      });

      // Start capturing post-event buffer
      this.captureEventClip(frame.cameraId, eventId, preEventFrames, session.config.postEventBuffer);

      // Emit event
      this.emit('safetyEvent', {
        eventId,
        cameraId: frame.cameraId,
        vehicleId: frame.vehicleId,
        driverId: vehicle?.driver_id,
        eventType: primaryBehavior.behavior,
        severity: primaryBehavior.severity,
        timestamp: frame.timestamp
      });
    } catch (error: any) {
      logger.error(`Failed to trigger safety event:`, error.message);
    }
  }

  /**
   * Capture event clip with pre/post buffer
   */
  private async captureEventClip(
    cameraId: number,
    eventId: number,
    preEventFrames: ProcessedFrame[],
    postBufferSeconds: number
  ): Promise<void> {
    try {
      const session = this.activeStreams.get(cameraId);
      if (!session) {
        return;
      }

      logger.info(`Capturing event clip for event ${eventId}: ${preEventFrames.length} pre-event frames, ${postBufferSeconds}s post-buffer`);

      // Collect post-event frames
      const postEventFrames: ProcessedFrame[] = [];
      const targetFrames = session.config.frameRate * postBufferSeconds;

      const captureInterval = setInterval(() => {
        const buffer = this.frameBuffers.get(cameraId);
        if (buffer && buffer.length > 0) {
          const latestFrame = buffer[buffer.length - 1];
          postEventFrames.push(latestFrame);

          if (postEventFrames.length >= targetFrames) {
            clearInterval(captureInterval);
            this.finalizeEventClip(eventId, preEventFrames, postEventFrames);
          }
        }
      }, 1000 / session.config.frameRate);

      // Timeout after post buffer duration + 5 seconds
      setTimeout(() => {
        clearInterval(captureInterval);
        if (postEventFrames.length > 0) {
          this.finalizeEventClip(eventId, preEventFrames, postEventFrames);
        }
      }, (postBufferSeconds + 5) * 1000);
    } catch (error: any) {
      logger.error(`Failed to capture event clip:`, error.message);
    }
  }

  /**
   * Finalize and store event video clip
   */
  private async finalizeEventClip(
    eventId: number,
    preEventFrames: ProcessedFrame[],
    postEventFrames: ProcessedFrame[]
  ): Promise<void> {
    try {
      const allFrames = [...preEventFrames, ...postEventFrames];

      logger.info(`Finalizing event clip for event ${eventId}: ${allFrames.length} total frames`);

      // In production, would encode frames to video file (H.264/MP4)
      // For now, store metadata about the clip
      const clipDuration = allFrames.length / (allFrames.length > 0 ? 30 : 1); // Assume 30 FPS

      await this.db.query(
        `UPDATE video_safety_events
         SET video_clip_frame_count = $1,
             video_clip_duration_seconds = $2,
             video_clip_captured_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [allFrames.length, clipDuration, eventId]
      );

      logger.info(`Event clip finalized for event ${eventId}: ${clipDuration.toFixed(1)}s, ${allFrames.length} frames`);

      // In production, would upload video to Azure Blob Storage
      // const videoUrl = await this.uploadVideoClip(eventId, allFrames);
      // await this.videoService.downloadAndArchiveVideo(eventId, videoUrl);
    } catch (error: any) {
      logger.error(`Failed to finalize event clip:`, error.message);
    }
  }

  /**
   * Get severity weight for comparison
   */
  private getSeverityWeight(severity: string): number {
    const weights: Record<string, number> = {
      minor: 1,
      moderate: 2,
      severe: 4,
      critical: 8
    };
    return weights[severity] || 0;
  }

  /**
   * Get stream status
   */
  getStreamStatus(cameraId: number): StreamSession | null {
    return this.activeStreams.get(cameraId) || null;
  }

  /**
   * Get all active streams
   */
  getActiveStreams(): StreamSession[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    const activeStreams = this.getActiveStreams();

    return {
      activeStreams: activeStreams.length,
      totalFramesProcessed: activeStreams.reduce((sum, s) => sum + s.frameCount, 0),
      queuedFrames: this.processingQueue.length,
      isProcessing: this.isProcessing,
      bufferSizes: Array.from(this.frameBuffers.entries()).map(([cameraId, buffer]) => ({
        cameraId,
        bufferSize: buffer.length
      }))
    };
  }

  /**
   * Cleanup inactive streams
   */
  async cleanupInactiveStreams(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [cameraId, session] of this.activeStreams.entries()) {
      if (!session.lastFrameAt) {
        continue;
      }

      const inactiveDuration = (now.getTime() - session.lastFrameAt.getTime()) / 1000;

      // Stop stream if no frames received in 5 minutes
      if (inactiveDuration > 300) {
        logger.warn(`Stopping inactive stream for camera ${cameraId} (inactive for ${inactiveDuration.toFixed(0)}s)`);
        await this.stopStream(cameraId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

interface StreamSession {
  sessionId: string;
  cameraId: number;
  vehicleId: number;
  streamUrl: string;
  startedAt: Date;
  stoppedAt?: Date;
  isActive: boolean;
  frameCount: number;
  lastFrameAt: Date | null;
  config: {
    resolution: string;
    frameRate: number;
    bitrate: number;
    preEventBuffer: number;
    postEventBuffer: number;
  };
}

export default VideoStreamProcessorService;
