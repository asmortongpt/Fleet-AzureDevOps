/**
 * Video Dataset Service
 *
 * Manages dashcam video library and streaming for emulation
 * Best practices:
 * - Parameterized queries for database access
 * - Secure credential handling via Key Vault
 * - Comprehensive error handling
 * - Event-driven architecture
 * - Type-safe implementation
 */

import { EventEmitter } from 'events';

import logger from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type VideoScenario =
  | 'highway'
  | 'urban'
  | 'parking'
  | 'rural'
  | 'incident'
  | 'weather'
  | 'night'
  | 'construction';

export type WeatherCondition = 'clear' | 'rain' | 'snow' | 'fog' | 'overcast';

export type CameraAngle =
  | 'forward'
  | 'rear'
  | 'driver_facing'
  | 'cabin'
  | 'side_left'
  | 'side_right';

export interface DashcamVideoSource {
  id: string;
  url: string;
  title: string;
  description?: string;
  cameraAngle: CameraAngle;
  scenario: VideoScenario;
  weather: WeatherCondition;
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk';
  duration: number; // in seconds
  resolution: string;
  fps: number;
  tags: string[];
  dataset?: 'BDD100K' | 'Waymo' | 'nuScenes' | 'custom';
}

export interface VideoStreamConfig {
  vehicleId: string;
  cameraAngle: CameraAngle;
  videoId: string;
  videoUrl: string;
  isActive: boolean;
  startedAt: Date;
  metadata?: Record<string, any>;
}

export interface VideoLibraryFilter {
  cameraAngle?: CameraAngle;
  scenario?: VideoScenario;
  weather?: WeatherCondition;
  timeOfDay?: string;
  tags?: string[];
}

// ============================================================================
// VIDEO DATASET SERVICE
// ============================================================================

export class VideoDatasetService extends EventEmitter {
  private videoLibrary: DashcamVideoSource[] = [];
  private activeStreams: Map<string, VideoStreamConfig> = new Map();
  private initialized = false;

  constructor() {
    super();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Video Dataset Service...');

      // Load video library (in production, this would query a database)
      await this.loadVideoLibrary();

      this.initialized = true;

      logger.info('Video Dataset Service initialized', {
        videoCount: this.videoLibrary.length
      });

      this.emit('initialized');
    } catch (error: unknown) {
      logger.error('Failed to initialize Video Dataset Service', {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      throw error;
    }
  }

  /**
   * Load video library
   * In production, this would:
   * 1. Query database for video metadata
   * 2. Verify file availability in cloud storage
   * 3. Generate presigned URLs for streaming
   */
  private async loadVideoLibrary(): Promise<void> {
    // Curated dashcam video library
    // NOTE: These are placeholder URLs - in production, use real video files from:
    // - Azure Blob Storage with SAS tokens
    // - S3 with presigned URLs
    // - CDN endpoints
    // - Local file server with authentication

    const library: DashcamVideoSource[] = [
      // Forward camera - Highway scenarios
      {
        id: 'forward-highway-day-1',
        url: 'https://example.com/videos/highway-clear-day.mp4',
        title: 'Highway Driving - Clear Day',
        description: 'Highway driving with multiple vehicles, clear weather',
        cameraAngle: 'forward',
        scenario: 'highway',
        weather: 'clear',
        timeOfDay: 'day',
        duration: 180,
        resolution: '1920x1080',
        fps: 30,
        tags: ['highway', 'multiple_vehicles', 'lane_changes'],
        dataset: 'BDD100K'
      },
      {
        id: 'forward-highway-rain-1',
        url: 'https://example.com/videos/highway-rain.mp4',
        title: 'Highway Driving - Rain',
        description: 'Highway driving in rain with reduced visibility',
        cameraAngle: 'forward',
        scenario: 'weather',
        weather: 'rain',
        timeOfDay: 'day',
        duration: 240,
        resolution: '1920x1080',
        fps: 30,
        tags: ['highway', 'rain', 'poor_visibility', 'wet_roads'],
        dataset: 'Waymo'
      },

      // Forward camera - Urban scenarios
      {
        id: 'forward-urban-day-1',
        url: 'https://example.com/videos/urban-traffic.mp4',
        title: 'Urban Driving - Heavy Traffic',
        description: 'City driving with heavy traffic, pedestrians, cyclists',
        cameraAngle: 'forward',
        scenario: 'urban',
        weather: 'clear',
        timeOfDay: 'day',
        duration: 300,
        resolution: '1920x1080',
        fps: 30,
        tags: ['urban', 'traffic', 'pedestrians', 'traffic_lights'],
        dataset: 'nuScenes'
      },
      {
        id: 'forward-urban-night-1',
        url: 'https://example.com/videos/urban-night.mp4',
        title: 'Urban Driving - Night',
        description: 'City driving at night with street lights',
        cameraAngle: 'forward',
        scenario: 'night',
        weather: 'clear',
        timeOfDay: 'night',
        duration: 200,
        resolution: '1920x1080',
        fps: 30,
        tags: ['urban', 'night', 'street_lights', 'low_light'],
        dataset: 'BDD100K'
      },

      // Parking scenarios
      {
        id: 'forward-parking-day-1',
        url: 'https://example.com/videos/parking-lot.mp4',
        title: 'Parking Lot Maneuvering',
        description: 'Parking lot navigation with pedestrians and obstacles',
        cameraAngle: 'forward',
        scenario: 'parking',
        weather: 'clear',
        timeOfDay: 'day',
        duration: 120,
        resolution: '1920x1080',
        fps: 30,
        tags: ['parking', 'slow_speed', 'pedestrians', 'obstacles'],
        dataset: 'custom'
      },

      // Rear camera scenarios
      {
        id: 'rear-urban-day-1',
        url: 'https://example.com/videos/rear-urban.mp4',
        title: 'Rear View - Urban',
        description: 'Rear camera view during urban driving',
        cameraAngle: 'rear',
        scenario: 'urban',
        weather: 'clear',
        timeOfDay: 'day',
        duration: 180,
        resolution: '1280x720',
        fps: 30,
        tags: ['rear_view', 'following_vehicles', 'urban'],
        dataset: 'custom'
      },

      // Driver facing scenarios
      {
        id: 'driver-highway-day-1',
        url: 'https://example.com/videos/driver-alert.mp4',
        title: 'Driver Monitoring - Alert',
        description: 'Driver facial monitoring during highway driving',
        cameraAngle: 'driver_facing',
        scenario: 'highway',
        weather: 'clear',
        timeOfDay: 'day',
        duration: 240,
        resolution: '1280x720',
        fps: 15,
        tags: ['driver_monitoring', 'facial_recognition', 'alertness'],
        dataset: 'custom'
      },

      // Cabin camera scenarios
      {
        id: 'cabin-urban-day-1',
        url: 'https://example.com/videos/cabin-view.mp4',
        title: 'Cabin View - Passenger Activity',
        description: 'Cabin camera monitoring passenger area',
        cameraAngle: 'cabin',
        scenario: 'urban',
        weather: 'clear',
        timeOfDay: 'day',
        duration: 180,
        resolution: '1280x720',
        fps: 15,
        tags: ['cabin', 'passenger_safety', 'interior'],
        dataset: 'custom'
      },

      // Incident scenarios
      {
        id: 'forward-incident-1',
        url: 'https://example.com/videos/incident-near-miss.mp4',
        title: 'Near Miss Incident',
        description: 'Forward camera capturing near-miss collision event',
        cameraAngle: 'forward',
        scenario: 'incident',
        weather: 'clear',
        timeOfDay: 'day',
        duration: 60,
        resolution: '1920x1080',
        fps: 60,
        tags: ['incident', 'near_miss', 'emergency_braking', 'critical'],
        dataset: 'custom'
      }
    ];

    this.videoLibrary = library;

    logger.info(`Loaded ${library.length} videos into library`);
  }

  /**
   * Get videos from library with optional filtering
   */
  public getVideos(filter?: VideoLibraryFilter): DashcamVideoSource[] {
    let filtered = [...this.videoLibrary];

    if (filter) {
      if (filter.cameraAngle) {
        filtered = filtered.filter(v => v.cameraAngle === filter.cameraAngle);
      }

      if (filter.scenario) {
        filtered = filtered.filter(v => v.scenario === filter.scenario);
      }

      if (filter.weather) {
        filtered = filtered.filter(v => v.weather === filter.weather);
      }

      if (filter.timeOfDay) {
        filtered = filtered.filter(v => v.timeOfDay === filter.timeOfDay);
      }

      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter(v =>
          filter.tags!.some(tag => v.tags.includes(tag))
        );
      }
    }

    return filtered;
  }

  /**
   * Get a specific video by ID
   */
  public getVideoById(videoId: string): DashcamVideoSource | null {
    const video = this.videoLibrary.find(v => v.id === videoId);
    return video || null;
  }

  /**
   * Start a video stream for a vehicle
   */
  public startStream(
    vehicleId: string,
    cameraAngle: CameraAngle,
    videoId?: string
  ): VideoStreamConfig | null {
    const streamKey = `${vehicleId}:${cameraAngle}`;

    // If no specific video ID, select a random one for this camera angle
    let video: DashcamVideoSource | null;

    if (videoId) {
      video = this.getVideoById(videoId);
    } else {
      const availableVideos = this.getVideos({ cameraAngle });
      if (availableVideos.length === 0) {
        logger.warn(`No videos available for camera angle: ${cameraAngle}`);
        return null;
      }
      video = availableVideos[Math.floor(Math.random() * availableVideos.length)];
    }

    if (!video) {
      logger.warn(`Video not found: ${videoId}`);
      return null;
    }

    const streamConfig: VideoStreamConfig = {
      vehicleId,
      cameraAngle,
      videoId: video.id,
      videoUrl: video.url,
      isActive: true,
      startedAt: new Date(),
      metadata: {
        title: video.title,
        scenario: video.scenario,
        weather: video.weather,
        timeOfDay: video.timeOfDay
      }
    };

    this.activeStreams.set(streamKey, streamConfig);

    logger.info(`Started video stream`, {
      vehicleId,
      cameraAngle,
      videoId: video.id
    });

    this.emit('stream:started', streamConfig);

    return streamConfig;
  }

  /**
   * Stop a video stream
   */
  public stopStream(vehicleId: string, cameraAngle: CameraAngle): boolean {
    const streamKey = `${vehicleId}:${cameraAngle}`;
    const stream = this.activeStreams.get(streamKey);

    if (!stream) {
      return false;
    }

    this.activeStreams.delete(streamKey);

    logger.info(`Stopped video stream`, {
      vehicleId,
      cameraAngle
    });

    this.emit('stream:stopped', { vehicleId, cameraAngle });

    return true;
  }

  /**
   * Get active stream for vehicle and camera
   */
  public getStream(vehicleId: string, cameraAngle: CameraAngle): VideoStreamConfig | null {
    const streamKey = `${vehicleId}:${cameraAngle}`;
    return this.activeStreams.get(streamKey) || null;
  }

  /**
   * Get all active streams
   */
  public getAllStreams(): VideoStreamConfig[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Get all active streams for a vehicle
   */
  public getVehicleStreams(vehicleId: string): VideoStreamConfig[] {
    return this.getAllStreams().filter(s => s.vehicleId === vehicleId);
  }

  /**
   * Stop all streams for a vehicle
   */
  public stopAllVehicleStreams(vehicleId: string): number {
    const streams = this.getVehicleStreams(vehicleId);
    let stopped = 0;

    for (const stream of streams) {
      if (this.stopStream(vehicleId, stream.cameraAngle)) {
        stopped++;
      }
    }

    return stopped;
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    totalVideos: number;
    activeStreams: number;
    videosByCameraAngle: Record<CameraAngle, number>;
    videosByScenario: Record<VideoScenario, number>;
  } {
    const videosByCameraAngle = this.videoLibrary.reduce((acc, v) => {
      acc[v.cameraAngle] = (acc[v.cameraAngle] || 0) + 1;
      return acc;
    }, {} as Record<CameraAngle, number>);

    const videosByScenario = this.videoLibrary.reduce((acc, v) => {
      acc[v.scenario] = (acc[v.scenario] || 0) + 1;
      return acc;
    }, {} as Record<VideoScenario, number>);

    return {
      totalVideos: this.videoLibrary.length,
      activeStreams: this.activeStreams.size,
      videosByCameraAngle,
      videosByScenario
    };
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown the service
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Video Dataset Service...');

    // Stop all active streams
    this.activeStreams.clear();

    this.emit('shutdown');

    logger.info('Video Dataset Service shut down');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let videoDatasetService: VideoDatasetService | null = null;

/**
 * Get or create the video dataset service instance
 */
export function getVideoDatasetService(): VideoDatasetService {
  if (!videoDatasetService) {
    videoDatasetService = new VideoDatasetService();
  }
  return videoDatasetService;
}

export default VideoDatasetService;
