/**
 * Video Emulator Service
 *
 * Centralized service for managing all video-related emulators:
 * - DashCam emulators (per vehicle)
 * - Mobile app video uploads
 * - Video telematics events
 *
 * Provides unified API for starting, stopping, and monitoring video emulators
 */

import { EventEmitter } from 'events';

import { DashCamEmulator, DashCamConfig, VideoFile, EventTrigger } from '../emulators/video/DashCamEmulator';
import { VideoTelematicsEmulator, VideoEvent } from '../emulators/video/VideoTelematicsEmulator';

export interface VideoEmulatorServiceConfig {
  defaultDashCamConfig: Partial<DashCamConfig>;
  enableAutoStart: boolean;
  maxConcurrentEmulators: number;
  telemeticsConfig: {
    updateIntervalMs: number;
    eventProbability: number;
    enableAIAnalysis: boolean;
  };
}

export interface EmulatorStatus {
  vehicleId: string;
  type: 'dashcam' | 'telematics' | 'mobile';
  isRunning: boolean;
  isPaused: boolean;
  startedAt: Date | null;
  statistics: any;
  health: 'healthy' | 'warning' | 'error' | 'stopped';
  lastUpdate: Date;
}

export interface MobileVideoUpload {
  id: string;
  vehicleId: string;
  driverId: string;
  uploadedAt: Date;
  fileSize: number;
  duration: number;
  description?: string;
  category: 'damage_report' | 'incident' | 'inspection' | 'other';
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string;
  videoUrl?: string;
}

export class VideoEmulatorService extends EventEmitter {
  private config: VideoEmulatorServiceConfig;

  // Emulator instances
  private dashCamEmulators: Map<string, DashCamEmulator> = new Map();
  private telematicsEmulator: VideoTelematicsEmulator | null = null;

  // Mobile uploads simulation
  private mobileUploads: MobileVideoUpload[] = [];
  private uploadCounter = 0;

  // Service state
  private isInitialized = false;
  private serviceStartTime: Date | null = null;

  constructor(config: VideoEmulatorServiceConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the video emulator service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[VideoEmulatorService] Already initialized');
      return;
    }

    console.log('[VideoEmulatorService] Initializing...');

    // Initialize video telematics emulator
    this.telematicsEmulator = new VideoTelematicsEmulator({
      updateIntervalMs: this.config.telemeticsConfig.updateIntervalMs,
      eventProbability: this.config.telemeticsConfig.eventProbability,
      severityDistribution: {
        low: 0.60,
        medium: 0.30,
        high: 0.08,
        critical: 0.02
      },
      enableAIAnalysis: this.config.telemeticsConfig.enableAIAnalysis,
      cameraViews: ['forward', 'driver', 'rear']
    });

    // Set up event listeners
    this.setupTelematicsListeners();

    this.isInitialized = true;
    this.serviceStartTime = new Date();

    console.log('[VideoEmulatorService] Initialized successfully');

    this.emit('service-initialized', {
      timestamp: new Date()
    });
  }

  /**
   * Start dashcam emulator for a vehicle
   */
  async startDashCam(vehicleId: string, customConfig?: Partial<DashCamConfig>): Promise<DashCamEmulator> {
    if (this.dashCamEmulators.has(vehicleId)) {
      throw new Error(`DashCam emulator already running for vehicle ${vehicleId}`);
    }

    if (this.dashCamEmulators.size >= this.config.maxConcurrentEmulators) {
      throw new Error(`Maximum concurrent emulators (${this.config.maxConcurrentEmulators}) reached`);
    }

    // Merge configs
    const config: DashCamConfig = {
      vehicleId,
      cameraPositions: ['forward', 'rear', 'driver_facing'],
      recordingQuality: '1080p',
      fps: 30,
      continuousRecording: true,
      bufferSizeGB: 32,
      eventPreBufferSeconds: 10,
      eventPostBufferSeconds: 10,
      autoUploadEnabled: true,
      gpsOverlayEnabled: true,
      nightModeEnabled: true,
      motionDetectionEnabled: true,
      parkingModeEnabled: true,
      updateIntervalMs: 5000,
      ...this.config.defaultDashCamConfig,
      ...customConfig,
      // @ts-expect-error - Build compatibility fix
      vehicleId, // Ensure vehicleId is not overridden
    };

    const emulator = new DashCamEmulator(config);

    // Set up event listeners
    this.setupDashCamListeners(emulator, vehicleId);

    // Start the emulator
    await emulator.start();

    // Store the emulator
    this.dashCamEmulators.set(vehicleId, emulator);

    console.log(`[VideoEmulatorService] Started DashCam for vehicle ${vehicleId}`);

    // Register vehicle with telematics
    if (this.telematicsEmulator) {
      this.telematicsEmulator.registerVehicle({
        id: vehicleId,
        currentSpeed: 0,
        speedLimit: 45
      });
    }

    this.emit('dashcam-started', {
      vehicleId,
      config,
      timestamp: new Date()
    });

    return emulator;
  }

  /**
   * Stop dashcam emulator for a vehicle
   */
  async stopDashCam(vehicleId: string): Promise<void> {
    const emulator = this.dashCamEmulators.get(vehicleId);
    if (!emulator) {
      throw new Error(`No DashCam emulator found for vehicle ${vehicleId}`);
    }

    await emulator.stop();
    this.dashCamEmulators.delete(vehicleId);

    console.log(`[VideoEmulatorService] Stopped DashCam for vehicle ${vehicleId}`);

    this.emit('dashcam-stopped', {
      vehicleId,
      timestamp: new Date()
    });
  }

  /**
   * Trigger event on dashcam
   */
  async triggerDashCamEvent(
    vehicleId: string,
    eventType: EventTrigger,
    eventId?: string
  ): Promise<VideoFile[]> {
    const emulator = this.dashCamEmulators.get(vehicleId);
    if (!emulator) {
      throw new Error(`No DashCam emulator found for vehicle ${vehicleId}`);
    }

    const videos = emulator.triggerEvent(eventType, eventId);

    console.log(`[VideoEmulatorService] Triggered ${eventType} event on vehicle ${vehicleId}`);

    this.emit('dashcam-event-triggered', {
      vehicleId,
      eventType,
      eventId,
      videos,
      timestamp: new Date()
    });

    return videos;
  }

  /**
   * Start video telematics emulator
   */
  async startTelematics(): Promise<void> {
    if (!this.telematicsEmulator) {
      throw new Error('Telematics emulator not initialized');
    }

    this.telematicsEmulator.start();

    console.log('[VideoEmulatorService] Started Video Telematics emulator');

    this.emit('telematics-started', {
      timestamp: new Date()
    });
  }

  /**
   * Stop video telematics emulator
   */
  async stopTelematics(): Promise<void> {
    if (!this.telematicsEmulator) {
      throw new Error('Telematics emulator not initialized');
    }

    this.telematicsEmulator.stop();

    console.log('[VideoEmulatorService] Stopped Video Telematics emulator');

    this.emit('telematics-stopped', {
      timestamp: new Date()
    });
  }

  /**
   * Simulate mobile app video upload
   */
  async simulateMobileUpload(upload: Omit<MobileVideoUpload, 'id' | 'uploadedAt' | 'status'>): Promise<MobileVideoUpload> {
    this.uploadCounter++;

    const mobileUpload: MobileVideoUpload = {
      id: `mobile-${Date.now()}-${this.uploadCounter}`,
      uploadedAt: new Date(),
      status: 'uploading',
      ...upload
    };

    this.mobileUploads.push(mobileUpload);

    console.log(`[VideoEmulatorService] Simulating mobile upload: ${mobileUpload.id}`);

    this.emit('mobile-upload-started', {
      upload: mobileUpload,
      timestamp: new Date()
    });

    // Simulate upload progress
    setTimeout(() => {
      mobileUpload.status = 'processing';
      this.emit('mobile-upload-processing', { upload: mobileUpload, timestamp: new Date() });
    }, 2000);

    setTimeout(() => {
      mobileUpload.status = 'completed';
      mobileUpload.thumbnailUrl = `https://storage.fleet.com/mobile/${mobileUpload.id}/thumbnail.jpg`;
      mobileUpload.videoUrl = `https://storage.fleet.com/mobile/${mobileUpload.id}/video.mp4`;

      this.emit('mobile-upload-completed', { upload: mobileUpload, timestamp: new Date() });
    }, 5000);

    return mobileUpload;
  }

  /**
   * Get status of all emulators
   */
  getAllStatus(): EmulatorStatus[] {
    const statuses: EmulatorStatus[] = [];

    // DashCam emulators
    this.dashCamEmulators.forEach((emulator, vehicleId) => {
      const stats = emulator.getStatistics();
      const storage = emulator.getStorageStatus();

      let health: EmulatorStatus['health'] = 'healthy';
      if (storage.utilizationPercent > 90) health = 'error';
      else if (storage.utilizationPercent > 80) health = 'warning';

      statuses.push({
        vehicleId,
        type: 'dashcam',
        isRunning: stats.recordingStartTime !== null,
        isPaused: false, // TODO: Track pause state
        startedAt: stats.recordingStartTime,
        statistics: stats,
        health,
        lastUpdate: new Date()
      });
    });

    // Telematics emulator
    if (this.telematicsEmulator) {
      const status = this.telematicsEmulator.getStatus();

      statuses.push({
        vehicleId: 'all', // Telematics monitors all vehicles
        type: 'telematics',
        isRunning: status.isRunning,
        isPaused: false,
        startedAt: this.serviceStartTime,
        statistics: status,
        health: 'healthy',
        lastUpdate: new Date()
      });
    }

    return statuses;
  }

  /**
   * Get status for specific vehicle
   */
  getVehicleStatus(vehicleId: string): EmulatorStatus | null {
    const emulator = this.dashCamEmulators.get(vehicleId);
    if (!emulator) {
      return null;
    }

    const stats = emulator.getStatistics();
    const storage = emulator.getStorageStatus();

    let health: EmulatorStatus['health'] = 'healthy';
    if (storage.utilizationPercent > 90) health = 'error';
    else if (storage.utilizationPercent > 80) health = 'warning';

    return {
      vehicleId,
      type: 'dashcam',
      isRunning: stats.recordingStartTime !== null,
      isPaused: false,
      startedAt: stats.recordingStartTime,
      statistics: stats,
      health,
      lastUpdate: new Date()
    };
  }

  /**
   * Get dashcam emulator for vehicle
   */
  getDashCam(vehicleId: string): DashCamEmulator | null {
    return this.dashCamEmulators.get(vehicleId) || null;
  }

  /**
   * Get all mobile uploads
   */
  getMobileUploads(filter?: {
    vehicleId?: string;
    driverId?: string;
    status?: MobileVideoUpload['status'];
    category?: MobileVideoUpload['category'];
  }): MobileVideoUpload[] {
    let uploads = [...this.mobileUploads];

    if (filter) {
      if (filter.vehicleId) {
        uploads = uploads.filter(u => u.vehicleId === filter.vehicleId);
      }
      if (filter.driverId) {
        uploads = uploads.filter(u => u.driverId === filter.driverId);
      }
      if (filter.status) {
        uploads = uploads.filter(u => u.status === filter.status);
      }
      if (filter.category) {
        uploads = uploads.filter(u => u.category === filter.category);
      }
    }

    return uploads;
  }

  /**
   * Get service statistics
   */
  getServiceStatistics() {
    const dashCamStats = Array.from(this.dashCamEmulators.values()).map(e => e.getStatistics());

    return {
      serviceUptime: this.serviceStartTime ? Date.now() - this.serviceStartTime.getTime() : 0,
      activeEmulators: {
        dashcam: this.dashCamEmulators.size,
        telematics: this.telematicsEmulator?.getStatus().isRunning ? 1 : 0,
        total: this.dashCamEmulators.size + (this.telematicsEmulator?.getStatus().isRunning ? 1 : 0)
      },
      totalRecordings: dashCamStats.reduce((sum, s) => sum + s.totalRecorded, 0),
      totalEvents: dashCamStats.reduce((sum, s) => sum + s.totalEvents, 0),
      totalUploads: dashCamStats.reduce((sum, s) => sum + s.totalUploaded, 0),
      mobileUploads: {
        total: this.mobileUploads.length,
        uploading: this.mobileUploads.filter(u => u.status === 'uploading').length,
        processing: this.mobileUploads.filter(u => u.status === 'processing').length,
        completed: this.mobileUploads.filter(u => u.status === 'completed').length,
        failed: this.mobileUploads.filter(u => u.status === 'failed').length
      },
      storageUsage: dashCamStats.reduce((sum, s) => sum + s.storage.usedSpaceGB, 0)
    };
  }

  /**
   * Stop all emulators
   */
  async stopAll(): Promise<void> {
    console.log('[VideoEmulatorService] Stopping all emulators...');

    // Stop all dashcams
    const stopPromises: Promise<void>[] = [];
    this.dashCamEmulators.forEach((emulator, vehicleId) => {
      stopPromises.push(this.stopDashCam(vehicleId));
    });

    // Stop telematics
    if (this.telematicsEmulator?.getStatus().isRunning) {
      stopPromises.push(this.stopTelematics());
    }

    await Promise.all(stopPromises);

    console.log('[VideoEmulatorService] All emulators stopped');

    this.emit('all-stopped', {
      timestamp: new Date()
    });
  }

  /**
   * Set up event listeners for dashcam emulator
   */
  private setupDashCamListeners(emulator: DashCamEmulator, vehicleId: string): void {
    emulator.on('recording-started', (data) => {
      this.emit('recording-started', { vehicleId, ...data });
    });

    emulator.on('recording-completed', (data) => {
      this.emit('recording-completed', { vehicleId, ...data });
    });

    emulator.on('event-triggered', (data) => {
      this.emit('event-triggered', { vehicleId, ...data });
    });

    emulator.on('upload-started', (data) => {
      this.emit('upload-started', { vehicleId, ...data });
    });

    emulator.on('upload-completed', (data) => {
      this.emit('upload-completed', { vehicleId, ...data });
    });

    emulator.on('camera-warning', (data) => {
      this.emit('camera-warning', { vehicleId, ...data });
    });

    emulator.on('camera-error', (data) => {
      this.emit('camera-error', { vehicleId, ...data });
    });
  }

  /**
   * Set up event listeners for telematics emulator
   */
  private setupTelematicsListeners(): void {
    if (!this.telematicsEmulator) return;

    this.telematicsEmulator.on('video-event-detected', (data) => {
      this.emit('telematics-event-detected', data);

      // Optionally trigger dashcam recording
      const event = data.event as VideoEvent;
      if (this.dashCamEmulators.has(event.vehicleId)) {
        // Map telematics event to dashcam trigger
        const triggerMap: Record<string, EventTrigger> = {
          'harsh_braking': 'harsh_braking',
          'harsh_acceleration': 'harsh_acceleration',
          'collision': 'collision',
          'speeding': 'speeding',
          'lane_departure': 'lane_departure'
        };

        const trigger = triggerMap[event.eventType];
        if (trigger) {
          this.triggerDashCamEvent(event.vehicleId, trigger, event.id).catch(err => {
            console.error(`Failed to trigger dashcam event:`, err);
          });
        }
      }
    });

    this.telematicsEmulator.on('video-event-cleared', (data) => {
      this.emit('telematics-event-cleared', data);
    });
  }
}

// Singleton instance
let videoEmulatorServiceInstance: VideoEmulatorService | null = null;

export function getVideoEmulatorService(config?: VideoEmulatorServiceConfig): VideoEmulatorService {
  if (!videoEmulatorServiceInstance) {
    if (!config) {
      throw new Error('VideoEmulatorService not initialized. Provide config on first call.');
    }
    videoEmulatorServiceInstance = new VideoEmulatorService(config);
  }
  return videoEmulatorServiceInstance;
}

export function resetVideoEmulatorService(): void {
  if (videoEmulatorServiceInstance) {
    videoEmulatorServiceInstance.stopAll().catch(console.error);
    videoEmulatorServiceInstance = null;
  }
}
