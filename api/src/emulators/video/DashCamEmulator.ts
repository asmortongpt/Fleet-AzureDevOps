/**
 * Dashboard Camera Video Emulator
 *
 * Simulates live dashboard camera video streams and event-triggered recordings
 * Features:
 * - Multi-camera support (forward, rear, driver, cabin)
 * - Continuous recording with circular buffer
 * - Event-triggered clip extraction
 * - Video quality settings (720p, 1080p, 4K)
 * - GPS overlay simulation
 * - Night mode detection
 * - Storage management (SD card simulation)
 * - Cloud upload simulation
 *
 * This emulator generates VIDEO FILE METADATA (not actual video files)
 * It simulates the behavior of real dashcam hardware like:
 * - Garmin Dash Cam
 * - Lytx DriveCam
 * - Samsara CM32
 * - BlackVue DR900X
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface DashCamConfig {
  vehicleId: string;
  cameraPositions: CameraPosition[];
  recordingQuality: VideoQuality;
  fps: number; // Frames per second (15, 30, 60)
  continuousRecording: boolean;
  bufferSizeGB: number; // Circular buffer size
  eventPreBufferSeconds: number; // Seconds before event to save
  eventPostBufferSeconds: number; // Seconds after event to save
  autoUploadEnabled: boolean;
  gpsOverlayEnabled: boolean;
  nightModeEnabled: boolean;
  motionDetectionEnabled: boolean;
  parkingModeEnabled: boolean;
  updateIntervalMs: number;
}

export type CameraPosition = 'forward' | 'rear' | 'driver_facing' | 'cabin' | 'side_left' | 'side_right';

export type VideoQuality = '720p' | '1080p' | '4K' | '1440p';

export type EventTrigger =
  | 'harsh_braking'
  | 'harsh_acceleration'
  | 'collision'
  | 'motion_detected'
  | 'manual'
  | 'speeding'
  | 'lane_departure'
  | 'driver_alert'
  | 'parking_impact';

export interface VideoFile {
  id: string;
  vehicleId: string;
  cameraPosition: CameraPosition;
  fileName: string;
  fileSize: number; // bytes
  duration: number; // seconds
  timestamp: Date;
  quality: VideoQuality;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  format: 'mp4' | 'mov' | 'avi';
  codec: 'h264' | 'h265' | 'vp9';
  gpsData?: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
  };
  metadata: {
    trigger: EventTrigger | 'continuous';
    eventId?: string;
    isNightMode: boolean;
    hasAudio: boolean;
    bitrate: number; // kbps
    storageLocation: 'local' | 'uploading' | 'cloud';
    uploadProgress?: number; // 0-100
    checksumMD5?: string;
  };
}

export interface StorageStatus {
  totalCapacityGB: number;
  usedSpaceGB: number;
  availableSpaceGB: number;
  utilizationPercent: number;
  oldestFileTimestamp: Date | null;
  newestFileTimestamp: Date | null;
  totalFiles: number;
  needsCleanup: boolean;
}

export interface CameraStatus {
  position: CameraPosition;
  isRecording: boolean;
  currentQuality: VideoQuality;
  temperature: number; // Celsius
  health: 'ok' | 'warning' | 'error';
  errors: string[];
  lastFrameTimestamp: Date;
  framesRecorded: number;
}

export class DashCamEmulator extends EventEmitter {
  private config: DashCamConfig;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private intervalId?: NodeJS.Timeout;

  // Recording state
  private recordingFiles: Map<CameraPosition, VideoFile> = new Map();
  private completedFiles: VideoFile[] = [];
  private eventQueue: Array<{ trigger: EventTrigger; timestamp: Date; eventId?: string }> = [];

  // Storage simulation
  private storageUsedGB: number = 0;
  private readonly BYTES_PER_GB = 1024 * 1024 * 1024;

  // Camera health
  private cameraStatus: Map<CameraPosition, CameraStatus> = new Map();

  // Statistics
  private stats = {
    totalRecorded: 0,
    totalUploaded: 0,
    totalEvents: 0,
    recordingStartTime: null as Date | null,
  };

  constructor(config: DashCamConfig) {
    super();
    this.config = config;
    this.initializeCameras();
  }

  /**
   * Initialize camera status for all configured positions
   */
  private initializeCameras(): void {
    this.config.cameraPositions.forEach(position => {
      this.cameraStatus.set(position, {
        position,
        isRecording: false,
        currentQuality: this.config.recordingQuality,
        temperature: 25 + Math.random() * 10, // 25-35°C
        health: 'ok',
        errors: [],
        lastFrameTimestamp: new Date(),
        framesRecorded: 0,
      });
    });
  }

  /**
   * Start dashcam recording
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('DashCam emulator is already running');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.stats.recordingStartTime = new Date();

    console.log(`[DashCam] Starting emulator for vehicle ${this.config.vehicleId}`);
    console.log(`[DashCam] Cameras: ${this.config.cameraPositions.join(', ')}`);
    console.log(`[DashCam] Quality: ${this.config.recordingQuality} @ ${this.config.fps} FPS`);

    // Start continuous recording if enabled
    if (this.config.continuousRecording) {
      this.startContinuousRecording();
    }

    // Main update loop
    this.intervalId = setInterval(() => {
      this.update();
    }, this.config.updateIntervalMs);

    this.emit('started', {
      vehicleId: this.config.vehicleId,
      timestamp: new Date(),
    });
  }

  /**
   * Stop dashcam recording
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(`[DashCam] Stopping emulator for vehicle ${this.config.vehicleId}`);

    // Stop all cameras
    this.config.cameraPositions.forEach(position => {
      this.stopCamera(position);
    });

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.isRunning = false;
    this.isPaused = false;

    this.emit('stopped', {
      vehicleId: this.config.vehicleId,
      timestamp: new Date(),
      stats: this.getStatistics(),
    });
  }

  /**
   * Pause recording (parking mode)
   */
  async pause(): Promise<void> {
    this.isPaused = true;

    // Switch to parking mode if enabled
    if (this.config.parkingModeEnabled) {
      console.log(`[DashCam] Entering parking mode`);
      this.emit('parking-mode-enabled', {
        vehicleId: this.config.vehicleId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Resume recording
   */
  async resume(): Promise<void> {
    this.isPaused = false;
    console.log(`[DashCam] Resuming normal recording`);

    this.emit('parking-mode-disabled', {
      vehicleId: this.config.vehicleId,
      timestamp: new Date(),
    });
  }

  /**
   * Main update loop
   */
  private update(): void {
    if (this.isPaused && !this.config.parkingModeEnabled) {
      return;
    }

    // Update camera health
    this.updateCameraHealth();

    // Process event queue
    this.processEventQueue();

    // Simulate ongoing recordings
    this.updateOngoingRecordings();

    // Simulate cloud uploads
    this.simulateCloudUploads();

    // Clean up old files if storage is full
    this.manageStorage();

    // Emit status update
    this.emit('update', {
      vehicleId: this.config.vehicleId,
      recording: this.recordingFiles.size,
      completed: this.completedFiles.length,
      storage: this.getStorageStatus(),
      timestamp: new Date(),
    });
  }

  /**
   * Start continuous recording for all cameras
   */
  private startContinuousRecording(): void {
    this.config.cameraPositions.forEach(position => {
      this.startRecording(position, 'continuous');
    });
  }

  /**
   * Start recording from a specific camera
   */
  private startRecording(position: CameraPosition, trigger: EventTrigger | 'continuous', eventId?: string): VideoFile {
    // Stop existing recording if any
    const existingFile = this.recordingFiles.get(position);
    if (existingFile) {
      this.stopRecording(position);
    }

    // Create new video file
    const videoFile = this.createVideoFile(position, trigger, eventId);

    this.recordingFiles.set(position, videoFile);

    const camera = this.cameraStatus.get(position);
    if (camera) {
      camera.isRecording = true;
      camera.lastFrameTimestamp = new Date();
      camera.framesRecorded = 0;
    }

    console.log(`[DashCam] Started recording: ${videoFile.fileName}`);

    this.emit('recording-started', {
      videoFile,
      camera: position,
      trigger,
      timestamp: new Date(),
    });

    return videoFile;
  }

  /**
   * Stop recording from a specific camera
   */
  private stopRecording(position: CameraPosition): VideoFile | null {
    const videoFile = this.recordingFiles.get(position);
    if (!videoFile) {
      return null;
    }

    // Calculate final duration and file size
    const duration = (Date.now() - videoFile.timestamp.getTime()) / 1000;
    videoFile.duration = duration;
    videoFile.fileSize = this.calculateFileSize(duration, videoFile.quality, videoFile.fps);

    // Generate checksum
    videoFile.metadata.checksumMD5 = crypto.randomBytes(16).toString('hex');

    // Move to completed files
    this.recordingFiles.delete(position);
    this.completedFiles.push(videoFile);
    this.storageUsedGB += videoFile.fileSize / this.BYTES_PER_GB;
    this.stats.totalRecorded++;

    const camera = this.cameraStatus.get(position);
    if (camera) {
      camera.isRecording = false;
    }

    console.log(`[DashCam] Stopped recording: ${videoFile.fileName} (${videoFile.duration.toFixed(1)}s, ${(videoFile.fileSize / (1024 * 1024)).toFixed(1)} MB)`);

    this.emit('recording-completed', {
      videoFile,
      camera: position,
      timestamp: new Date(),
    });

    // Start cloud upload if enabled
    if (this.config.autoUploadEnabled && videoFile.metadata.trigger !== 'continuous') {
      this.startUpload(videoFile);
    }

    return videoFile;
  }

  /**
   * Create a new video file metadata
   */
  private createVideoFile(position: CameraPosition, trigger: EventTrigger | 'continuous', eventId?: string): VideoFile {
    const timestamp = new Date();
    const quality = this.config.recordingQuality;
    const fps = this.config.fps;
    const resolution = this.getResolution(quality);
    const isNightMode = this.isNightTime();

    const fileName = `${this.config.vehicleId}_${position}_${timestamp.getTime()}_${trigger}.mp4`;

    return {
      id: crypto.randomUUID(),
      vehicleId: this.config.vehicleId,
      cameraPosition: position,
      fileName,
      fileSize: 0, // Will be calculated when recording stops
      duration: 0, // Will be calculated when recording stops
      timestamp,
      quality,
      fps,
      resolution,
      format: 'mp4',
      codec: quality === '4K' ? 'h265' : 'h264',
      gpsData: this.config.gpsOverlayEnabled ? this.getGPSData() : undefined,
      metadata: {
        trigger,
        eventId,
        isNightMode,
        hasAudio: position !== 'driver_facing', // Driver camera usually has no audio
        bitrate: this.calculateBitrate(quality, fps),
        storageLocation: 'local',
      },
    };
  }

  /**
   * Trigger event recording
   */
  triggerEvent(trigger: EventTrigger, eventId?: string): VideoFile[] {
    console.log(`[DashCam] Event triggered: ${trigger}${eventId ? ` (${eventId})` : ''}`);

    this.stats.totalEvents++;

    // Queue the event for processing
    this.eventQueue.push({ trigger, timestamp: new Date(), eventId });

    // Immediately start recording from all cameras
    const videos: VideoFile[] = [];

    this.config.cameraPositions.forEach(position => {
      const videoFile = this.startRecording(position, trigger, eventId);
      videos.push(videoFile);

      // Schedule stop after duration
      const duration = this.config.eventPreBufferSeconds + this.config.eventPostBufferSeconds + 10;
      setTimeout(() => {
        this.stopRecording(position);

        // Resume continuous recording if enabled
        if (this.config.continuousRecording) {
          this.startRecording(position, 'continuous');
        }
      }, duration * 1000);
    });

    this.emit('event-triggered', {
      trigger,
      eventId,
      cameras: this.config.cameraPositions,
      videos,
      timestamp: new Date(),
    });

    return videos;
  }

  /**
   * Process event queue
   */
  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) break;

      // Events are already processed when triggered
      // This is just for cleanup
    }
  }

  /**
   * Update ongoing recordings
   */
  private updateOngoingRecordings(): void {
    this.recordingFiles.forEach((videoFile, position) => {
      const camera = this.cameraStatus.get(position);
      if (!camera) return;

      // Update frame count
      const elapsedSeconds = (Date.now() - videoFile.timestamp.getTime()) / 1000;
      camera.framesRecorded = Math.floor(elapsedSeconds * videoFile.fps);
      camera.lastFrameTimestamp = new Date();

      // For continuous recordings, rotate after reaching buffer size
      if (videoFile.metadata.trigger === 'continuous') {
        const currentSizeGB = this.calculateFileSize(elapsedSeconds, videoFile.quality, videoFile.fps) / this.BYTES_PER_GB;

        if (currentSizeGB >= this.config.bufferSizeGB / this.config.cameraPositions.length) {
          // Rotate the file
          this.stopRecording(position);
          this.startRecording(position, 'continuous');
        }
      }
    });
  }

  /**
   * Update camera health
   */
  private updateCameraHealth(): void {
    this.cameraStatus.forEach((camera, position) => {
      // Simulate temperature variation
      camera.temperature += (Math.random() - 0.5) * 2;
      camera.temperature = Math.max(20, Math.min(70, camera.temperature));

      // Check for overheating
      if (camera.temperature > 60) {
        camera.health = 'warning';
        camera.errors.push('High temperature detected');

        this.emit('camera-warning', {
          position,
          warning: 'high_temperature',
          temperature: camera.temperature,
          timestamp: new Date(),
        });
      } else if (camera.temperature > 65) {
        camera.health = 'error';
        camera.errors.push('Critical temperature - stopping recording');

        // Stop recording to prevent damage
        this.stopRecording(position);

        this.emit('camera-error', {
          position,
          error: 'critical_temperature',
          temperature: camera.temperature,
          timestamp: new Date(),
        });
      } else {
        camera.health = 'ok';
        camera.errors = [];
      }
    });
  }

  /**
   * Simulate cloud uploads
   */
  private simulateCloudUploads(): void {
    this.completedFiles.forEach(file => {
      if (file.metadata.storageLocation === 'uploading') {
        // Simulate upload progress
        file.metadata.uploadProgress = (file.metadata.uploadProgress || 0) + Math.random() * 10;

        if (file.metadata.uploadProgress >= 100) {
          file.metadata.uploadProgress = 100;
          file.metadata.storageLocation = 'cloud';
          this.stats.totalUploaded++;

          console.log(`[DashCam] Upload completed: ${file.fileName}`);

          this.emit('upload-completed', {
            videoFile: file,
            timestamp: new Date(),
          });
        }
      }
    });
  }

  /**
   * Start uploading a video file
   */
  private startUpload(file: VideoFile): void {
    file.metadata.storageLocation = 'uploading';
    file.metadata.uploadProgress = 0;

    console.log(`[DashCam] Starting upload: ${file.fileName}`);

    this.emit('upload-started', {
      videoFile: file,
      timestamp: new Date(),
    });
  }

  /**
   * Stop a specific camera
   */
  private stopCamera(position: CameraPosition): void {
    this.stopRecording(position);
    const camera = this.cameraStatus.get(position);
    if (camera) {
      camera.isRecording = false;
    }
  }

  /**
   * Manage storage - clean up old files if needed
   */
  private manageStorage(): void {
    const storage = this.getStorageStatus();

    if (storage.needsCleanup) {
      // Delete oldest continuous recordings first
      const continuousFiles = this.completedFiles
        .filter(f => f.metadata.trigger === 'continuous' && f.metadata.storageLocation !== 'cloud')
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (continuousFiles.length > 0) {
        const oldestFile = continuousFiles[0];
        this.deleteFile(oldestFile.id);

        console.log(`[DashCam] Deleted old file to free space: ${oldestFile.fileName}`);

        this.emit('file-deleted', {
          videoFile: oldestFile,
          reason: 'storage_cleanup',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Delete a video file
   */
  deleteFile(fileId: string): boolean {
    const index = this.completedFiles.findIndex(f => f.id === fileId);
    if (index === -1) return false;

    const file = this.completedFiles[index];
    this.storageUsedGB -= file.fileSize / this.BYTES_PER_GB;
    this.completedFiles.splice(index, 1);

    return true;
  }

  /**
   * Get storage status
   */
  getStorageStatus(): StorageStatus {
    const totalCapacityGB = this.config.bufferSizeGB;
    const usedSpaceGB = this.storageUsedGB;
    const availableSpaceGB = totalCapacityGB - usedSpaceGB;
    const utilizationPercent = (usedSpaceGB / totalCapacityGB) * 100;

    const timestamps = this.completedFiles.map(f => f.timestamp).sort((a, b) => a.getTime() - b.getTime());

    return {
      totalCapacityGB,
      usedSpaceGB: parseFloat(usedSpaceGB.toFixed(2)),
      availableSpaceGB: parseFloat(availableSpaceGB.toFixed(2)),
      utilizationPercent: parseFloat(utilizationPercent.toFixed(1)),
      oldestFileTimestamp: timestamps[0] || null,
      newestFileTimestamp: timestamps[timestamps.length - 1] || null,
      totalFiles: this.completedFiles.length,
      needsCleanup: utilizationPercent > 80,
    };
  }

  /**
   * Get emulator statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      currentlyRecording: this.recordingFiles.size,
      completedFiles: this.completedFiles.length,
      storage: this.getStorageStatus(),
      cameras: Array.from(this.cameraStatus.values()),
      uptime: this.stats.recordingStartTime
        ? Date.now() - this.stats.recordingStartTime.getTime()
        : 0,
    };
  }

  /**
   * Get camera status
   */
  getCameraStatus(position?: CameraPosition): CameraStatus | CameraStatus[] {
    if (position) {
      return this.cameraStatus.get(position) || ({} as CameraStatus);
    }
    return Array.from(this.cameraStatus.values());
  }

  /**
   * Get all video files
   */
  getVideoFiles(filter?: {
    trigger?: EventTrigger | 'continuous';
    camera?: CameraPosition;
    storageLocation?: 'local' | 'uploading' | 'cloud';
  }): VideoFile[] {
    let files = [...this.completedFiles];

    if (filter) {
      if (filter.trigger) {
        files = files.filter(f => f.metadata.trigger === filter.trigger);
      }
      if (filter.camera) {
        files = files.filter(f => f.cameraPosition === filter.camera);
      }
      if (filter.storageLocation) {
        files = files.filter(f => f.metadata.storageLocation === filter.storageLocation);
      }
    }

    return files;
  }

  /**
   * Get video file by ID
   */
  getVideoFile(fileId: string): VideoFile | null {
    return this.completedFiles.find(f => f.id === fileId) || null;
  }

  /**
   * Helper: Get resolution for quality
   */
  private getResolution(quality: VideoQuality): { width: number; height: number } {
    const resolutions: Record<VideoQuality, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '1440p': { width: 2560, height: 1440 },
      '4K': { width: 3840, height: 2160 },
    };
    return resolutions[quality];
  }

  /**
   * Helper: Calculate bitrate for quality/fps
   */
  private calculateBitrate(quality: VideoQuality, fps: number): number {
    const baseBitrates: Record<VideoQuality, number> = {
      '720p': 5000,   // 5 Mbps
      '1080p': 8000,  // 8 Mbps
      '1440p': 12000, // 12 Mbps
      '4K': 20000,    // 20 Mbps
    };

    const fpsMultiplier = fps / 30; // Base is 30fps
    return Math.floor(baseBitrates[quality] * fpsMultiplier);
  }

  /**
   * Helper: Calculate file size
   */
  private calculateFileSize(durationSeconds: number, quality: VideoQuality, fps: number): number {
    const bitrate = this.calculateBitrate(quality, fps);
    // Size in bytes = (bitrate in kbps * 1000 / 8) * duration
    return Math.floor((bitrate * 1000 / 8) * durationSeconds);
  }

  /**
   * Helper: Determine if it's night time (for night mode)
   */
  private isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 19 || hour <= 6;
  }

  /**
   * Helper: Get simulated GPS data
   */
  private getGPSData() {
    return {
      latitude: 28.5383 + (Math.random() - 0.5) * 0.1,
      longitude: -81.3792 + (Math.random() - 0.5) * 0.1,
      speed: Math.random() * 60, // 0-60 mph
      heading: Math.random() * 360,
    };
  }
}
