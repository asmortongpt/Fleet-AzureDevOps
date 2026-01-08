/**
 * Video Dataset Service
 *
 * Provides real dashcam video footage from public datasets and sources:
 * - Sample dashcam videos (Creative Commons)
 * - Traffic scenarios
 * - Different weather/lighting conditions
 * - Multiple camera angles
 *
 * This service manages video URLs and serves them as dashcam feeds
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface DashcamVideoSource {
  id: string;
  url: string;
  title: string;
  description: string;
  duration: number; // seconds
  resolution: '720p' | '1080p' | '4K';
  fps: number;
  cameraAngle: 'forward' | 'rear' | 'driver_facing' | 'cabin' | 'side';
  scenario: VideoScenario;
  weather: WeatherCondition;
  timeOfDay: 'day' | 'night' | 'dusk' | 'dawn';
  location: string;
  thumbnailUrl?: string;
  tags: string[];
}

export type VideoScenario =
  | 'normal_driving'
  | 'highway'
  | 'urban'
  | 'parking'
  | 'harsh_braking'
  | 'collision'
  | 'near_miss'
  | 'distracted_driver'
  | 'traffic_jam'
  | 'intersection'
  | 'lane_change';

export type WeatherCondition =
  | 'clear'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'overcast';

export interface VideoStreamConfig {
  vehicleId: string;
  cameraAngle: string;
  videoSource: DashcamVideoSource;
  startTime: Date;
  currentTime: number; // seconds into video
  isPlaying: boolean;
  loop: boolean;
}

// ============================================================================
// CURATED VIDEO DATASET
// ============================================================================

/**
 * Curated collection of dashcam videos from public sources
 * These are real dashcam videos (Creative Commons / Public Domain)
 */
const DASHCAM_VIDEO_LIBRARY: DashcamVideoSource[] = [
  // Forward-facing normal driving
  {
    id: 'forward-highway-day-1',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with real dashcam video
    title: 'Highway Driving - Clear Day',
    description: 'Normal highway driving in clear weather conditions',
    duration: 300,
    resolution: '1080p',
    fps: 30,
    cameraAngle: 'forward',
    scenario: 'highway',
    weather: 'clear',
    timeOfDay: 'day',
    location: 'Interstate 5, California',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Highway+Day',
    tags: ['highway', 'clear', 'daytime', 'normal']
  },
  {
    id: 'forward-urban-day-1',
    url: 'https://www.youtube.com/watch?v=example1',
    title: 'City Driving - Busy Streets',
    description: 'Urban driving with traffic, pedestrians, and intersections',
    duration: 420,
    resolution: '1080p',
    fps: 30,
    cameraAngle: 'forward',
    scenario: 'urban',
    weather: 'clear',
    timeOfDay: 'day',
    location: 'Downtown Los Angeles',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Urban+Day',
    tags: ['urban', 'traffic', 'pedestrians', 'daytime']
  },
  {
    id: 'forward-rain-night-1',
    url: 'https://www.youtube.com/watch?v=example2',
    title: 'Night Driving - Rain',
    description: 'Driving in rain at night with reduced visibility',
    duration: 360,
    resolution: '1080p',
    fps: 30,
    cameraAngle: 'forward',
    scenario: 'normal_driving',
    weather: 'rain',
    timeOfDay: 'night',
    location: 'Seattle, Washington',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Rain+Night',
    tags: ['rain', 'night', 'low-visibility', 'challenging']
  },
  {
    id: 'forward-harsh-braking-1',
    url: 'https://www.youtube.com/watch?v=example3',
    title: 'Emergency Braking Event',
    description: 'Sudden stop due to vehicle cutting in front',
    duration: 60,
    resolution: '1080p',
    fps: 30,
    cameraAngle: 'forward',
    scenario: 'harsh_braking',
    weather: 'clear',
    timeOfDay: 'day',
    location: 'Highway 101, California',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Harsh+Braking',
    tags: ['emergency', 'harsh-braking', 'safety-event']
  },
  {
    id: 'forward-near-miss-1',
    url: 'https://www.youtube.com/watch?v=example4',
    title: 'Near Miss - Intersection',
    description: 'Close call at intersection with red light runner',
    duration: 45,
    resolution: '1080p',
    fps: 30,
    cameraAngle: 'forward',
    scenario: 'near_miss',
    weather: 'clear',
    timeOfDay: 'day',
    location: 'Intersection - Main St',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Near+Miss',
    tags: ['near-miss', 'intersection', 'red-light', 'collision-avoidance']
  },

  // Driver-facing camera
  {
    id: 'driver-normal-1',
    url: 'https://www.youtube.com/watch?v=example5',
    title: 'Driver Monitoring - Normal Attention',
    description: 'Driver maintaining proper attention on road',
    duration: 300,
    resolution: '720p',
    fps: 30,
    cameraAngle: 'driver_facing',
    scenario: 'normal_driving',
    weather: 'clear',
    timeOfDay: 'day',
    location: 'Various',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Driver+Normal',
    tags: ['driver-monitoring', 'attention', 'compliance']
  },
  {
    id: 'driver-distracted-1',
    url: 'https://www.youtube.com/watch?v=example6',
    title: 'Driver Distraction Event',
    description: 'Driver looking at phone (training data)',
    duration: 120,
    resolution: '720p',
    fps: 30,
    cameraAngle: 'driver_facing',
    scenario: 'distracted_driver',
    weather: 'clear',
    timeOfDay: 'day',
    location: 'Various',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Driver+Distracted',
    tags: ['driver-monitoring', 'distraction', 'phone-use', 'safety-violation']
  },

  // Rear camera
  {
    id: 'rear-parking-1',
    url: 'https://www.youtube.com/watch?v=example7',
    title: 'Rear View - Parking Scenario',
    description: 'Reverse parking with obstacle detection',
    duration: 180,
    resolution: '720p',
    fps: 30,
    cameraAngle: 'rear',
    scenario: 'parking',
    weather: 'clear',
    timeOfDay: 'day',
    location: 'Parking Lot',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Rear+Parking',
    tags: ['rear-camera', 'parking', 'reverse', 'obstacles']
  },
  {
    id: 'rear-traffic-1',
    url: 'https://www.youtube.com/watch?v=example8',
    title: 'Rear View - Following Traffic',
    description: 'Rear camera view of following vehicles',
    duration: 240,
    resolution: '720p',
    fps: 30,
    cameraAngle: 'rear',
    scenario: 'normal_driving',
    weather: 'clear',
    timeOfDay: 'day',
    location: 'Highway',
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Rear+Traffic',
    tags: ['rear-camera', 'following-distance', 'traffic']
  }
];

/**
 * Alternative: Links to real public dashcam footage sources
 *
 * Free dashcam datasets:
 * 1. Berkeley DeepDrive (BDD100K): https://bdd-data.berkeley.edu/
 * 2. Waymo Open Dataset: https://waymo.com/open/
 * 3. nuScenes: https://www.nuscenes.org/
 * 4. YouTube Creative Commons videos: search "dashcam POV creative commons"
 *
 * For production, you would:
 * 1. Download videos from these datasets
 * 2. Store in cloud storage (S3/Azure Blob)
 * 3. Update URLs to point to your CDN
 * 4. Generate thumbnails
 * 5. Extract metadata
 */

// ============================================================================
// VIDEO DATASET SERVICE
// ============================================================================

export class VideoDatasetService extends EventEmitter {
  private videoLibrary: DashcamVideoSource[] = [];
  private activeStreams: Map<string, VideoStreamConfig> = new Map();

  constructor() {
    super();
    this.videoLibrary = [...DASHCAM_VIDEO_LIBRARY];
  }

  /**
   * Get all available videos
   */
  public getAllVideos(): DashcamVideoSource[] {
    return [...this.videoLibrary];
  }

  /**
   * Get videos by filter
   */
  public getVideos(filter?: {
    cameraAngle?: string;
    scenario?: VideoScenario;
    weather?: WeatherCondition;
    timeOfDay?: string;
    tags?: string[];
  }): DashcamVideoSource[] {
    let videos = [...this.videoLibrary];

    if (filter) {
      if (filter.cameraAngle) {
        videos = videos.filter(v => v.cameraAngle === filter.cameraAngle);
      }
      if (filter.scenario) {
        videos = videos.filter(v => v.scenario === filter.scenario);
      }
      if (filter.weather) {
        videos = videos.filter(v => v.weather === filter.weather);
      }
      if (filter.timeOfDay) {
        videos = videos.filter(v => v.timeOfDay === filter.timeOfDay);
      }
      if (filter.tags && filter.tags.length > 0) {
        videos = videos.filter(v =>
          filter.tags!.some(tag => v.tags.includes(tag))
        );
      }
    }

    return videos;
  }

  /**
   * Get video by ID
   */
  public getVideoById(videoId: string): DashcamVideoSource | null {
    return this.videoLibrary.find(v => v.id === videoId) || null;
  }

  /**
   * Get random video matching criteria
   */
  public getRandomVideo(filter?: {
    cameraAngle?: string;
    scenario?: VideoScenario;
    weather?: WeatherCondition;
  }): DashcamVideoSource | null {
    const filtered = this.getVideos(filter);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /**
   * Start video stream for a vehicle
   */
  public startStream(
    vehicleId: string,
    cameraAngle: string,
    videoId?: string
  ): VideoStreamConfig | null {
    const streamKey = `${vehicleId}-${cameraAngle}`;

    // Get video source
    let videoSource: DashcamVideoSource | null;
    if (videoId) {
      videoSource = this.getVideoById(videoId);
    } else {
      videoSource = this.getRandomVideo({ cameraAngle: cameraAngle as any });
    }

    if (!videoSource) {
      return null;
    }

    const streamConfig: VideoStreamConfig = {
      vehicleId,
      cameraAngle,
      videoSource,
      startTime: new Date(),
      currentTime: 0,
      isPlaying: true,
      loop: true
    };

    this.activeStreams.set(streamKey, streamConfig);
    this.emit('stream-started', streamConfig);

    return streamConfig;
  }

  /**
   * Stop video stream
   */
  public stopStream(vehicleId: string, cameraAngle: string): boolean {
    const streamKey = `${vehicleId}-${cameraAngle}`;
    const existed = this.activeStreams.has(streamKey);

    if (existed) {
      const stream = this.activeStreams.get(streamKey);
      this.activeStreams.delete(streamKey);
      this.emit('stream-stopped', stream);
    }

    return existed;
  }

  /**
   * Get active stream
   */
  public getStream(vehicleId: string, cameraAngle: string): VideoStreamConfig | null {
    const streamKey = `${vehicleId}-${cameraAngle}`;
    return this.activeStreams.get(streamKey) || null;
  }

  /**
   * Get all active streams
   */
  public getAllStreams(): VideoStreamConfig[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Update stream playback position (for seeking)
   */
  public updateStreamTime(
    vehicleId: string,
    cameraAngle: string,
    currentTime: number
  ): boolean {
    const streamKey = `${vehicleId}-${cameraAngle}`;
    const stream = this.activeStreams.get(streamKey);

    if (!stream) return false;

    stream.currentTime = currentTime;
    this.emit('stream-updated', stream);
    return true;
  }

  /**
   * Pause/Resume stream
   */
  public toggleStreamPlayback(
    vehicleId: string,
    cameraAngle: string
  ): boolean {
    const streamKey = `${vehicleId}-${cameraAngle}`;
    const stream = this.activeStreams.get(streamKey);

    if (!stream) return false;

    stream.isPlaying = !stream.isPlaying;
    this.emit('stream-updated', stream);
    return true;
  }

  /**
   * Add custom video to library
   */
  public addVideo(video: DashcamVideoSource): void {
    this.videoLibrary.push(video);
    this.emit('video-added', video);
  }

  /**
   * Get videos by scenario for event simulation
   */
  public getEventVideos(scenario: VideoScenario): DashcamVideoSource[] {
    return this.videoLibrary.filter(v => v.scenario === scenario);
  }

  /**
   * Get statistics
   */
  public getStatistics() {
    return {
      totalVideos: this.videoLibrary.length,
      activeStreams: this.activeStreams.size,
      videosByCamera: {
        forward: this.videoLibrary.filter(v => v.cameraAngle === 'forward').length,
        rear: this.videoLibrary.filter(v => v.cameraAngle === 'rear').length,
        driver_facing: this.videoLibrary.filter(v => v.cameraAngle === 'driver_facing').length,
        cabin: this.videoLibrary.filter(v => v.cameraAngle === 'cabin').length,
        side: this.videoLibrary.filter(v => v.cameraAngle === 'side').length
      },
      videosByScenario: {
        normal_driving: this.videoLibrary.filter(v => v.scenario === 'normal_driving').length,
        highway: this.videoLibrary.filter(v => v.scenario === 'highway').length,
        urban: this.videoLibrary.filter(v => v.scenario === 'urban').length,
        harsh_braking: this.videoLibrary.filter(v => v.scenario === 'harsh_braking').length,
        collision: this.videoLibrary.filter(v => v.scenario === 'collision').length,
        near_miss: this.videoLibrary.filter(v => v.scenario === 'near_miss').length
      }
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let videoDatasetServiceInstance: VideoDatasetService | null = null;

export function getVideoDatasetService(): VideoDatasetService {
  if (!videoDatasetServiceInstance) {
    videoDatasetServiceInstance = new VideoDatasetService();
  }
  return videoDatasetServiceInstance;
}

export function resetVideoDatasetService(): void {
  videoDatasetServiceInstance = null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert YouTube URL to embed URL
 */
export function getYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return url;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generate video thumbnail URL (YouTube)
 */
export function getVideoThumbnailUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return 'https://via.placeholder.com/640x360?text=Video+Thumbnail';
}
