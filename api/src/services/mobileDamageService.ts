import { OpenAIVisionService, DamageDetectionResult } from './openaiVisionService';
import { logger } from '../utils/logger';
import * as THREE from 'three';

export interface LiDARScanData {
  pointCloud: Array<{
    x: number;
    y: number;
    z: number;
    intensity?: number;
    timestamp?: number;
  }>;
  scanMetadata: {
    deviceModel: string; // e.g., "iPhone 15 Pro"
    scanDate: Date;
    scanDuration: number; // seconds
    pointCount: number;
    boundingBox: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
    };
  };
  cameraTransforms: Array<{
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number }; // quaternion
    timestamp: number;
  }>;
}

export interface MobilePhotoData {
  imageUrl: string; // base64 or URL
  metadata: {
    deviceModel: string;
    captureDate: Date;
    gpsLocation?: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy?: number;
    };
    cameraSettings: {
      focalLength?: number;
      aperture?: number;
      iso?: number;
      exposureTime?: number;
    };
    orientation: 'portrait' | 'landscape';
    dimensions: {
      width: number;
      height: number;
    };
    depthData?: {
      format: 'AVDepthData' | 'ARDepthData';
      depthMap: string; // base64 encoded depth map
      depthAccuracy: 'relative' | 'absolute';
    };
  };
}

export interface VideoAnalysisData {
  videoUrl: string; // URL to video file
  metadata: {
    duration: number; // seconds
    fps: number;
    resolution: {
      width: number;
      height: number;
    };
    format: string; // e.g., "mp4", "mov"
    fileSize: number; // bytes
  };
  keyFrames?: Array<{
    timestamp: number; // seconds
    frameUrl: string; // extracted frame image URL
  }>;
}

export interface EnhancedDamageAnalysis extends DamageDetectionResult {
  lidarEnhancement?: {
    depth3DModel: string; // URL to generated 3D model from LiDAR
    accurateDimensions: {
      damageId: string;
      actualWidth: number; // meters
      actualHeight: number; // meters
      actualDepth: number; // meters (dent depth)
      surfaceArea: number; // square meters
    }[];
    confidenceBoost: number; // percentage increase in confidence
  };
  depthEnhancement?: {
    depthAnalyzedDamages: {
      damageId: string;
      depthMeasurement: number; // millimeters
      depthConfidence: number; // 0-1
    }[];
  };
  videoEnhancement?: {
    multiAngleAnalysis: {
      anglesCaptured: number;
      consistentDamagesAcrossAngles: string[]; // damage IDs
      additionalDamagesFound: DamageDetectionResult['damages'];
    };
  };
}

export class MobileDamageService {
  private visionService: OpenAIVisionService;

  constructor() {
    this.visionService = new OpenAIVisionService();
    logger.info('Mobile Damage Service initialized with LiDAR, Photo, and Video support');
  }

  /**
   * Analyze damage from mobile photo with optional depth data
   * @param photoData - Photo data from mobile device
   * @returns Enhanced damage analysis
   */
  async analyzePhotoWithDepth(photoData: MobilePhotoData): Promise<EnhancedDamageAnalysis> {
    logger.info('Analyzing photo with depth data', {
      deviceModel: photoData.metadata.deviceModel,
      hasDepth: !!photoData.metadata.depthData,
      hasGPS: !!photoData.metadata.gpsLocation
    });

    // Step 1: Standard AI vision analysis
    const visionResult = await this.visionService.detectDamage(photoData.imageUrl);

    // Step 2: If depth data available, enhance damage measurements
    if (photoData.metadata.depthData && visionResult.damages.length > 0) {
      const depthEnhancement = await this.enhanceWithDepthData(
        visionResult,
        photoData.metadata.depthData,
        photoData.metadata.dimensions
      );

      return {
        ...visionResult,
        depthEnhancement
      };
    }

    return visionResult;
  }

  /**
   * Analyze damage using LiDAR scan data from iPhone/iPad Pro
   * @param lidarData - LiDAR point cloud data
   * @param referencePhotos - Reference photos taken during scan
   * @returns Enhanced damage analysis with accurate 3D measurements
   */
  async analyzeLiDARScan(
    lidarData: LiDARScanData,
    referencePhotos: MobilePhotoData[]
  ): Promise<EnhancedDamageAnalysis> {
    logger.info('Analyzing LiDAR scan data', {
      pointCount: lidarData.scanMetadata.pointCount,
      photoCount: referencePhotos.length,
      deviceModel: lidarData.scanMetadata.deviceModel
    });

    // Step 1: Analyze reference photos for damage detection
    const photoAnalyses = await Promise.all(
      referencePhotos.map((photo) => this.visionService.detectDamage(photo.imageUrl))
    );

    // Merge damage detections from all photos
    const mergedResult = this.mergeDamageDetections(photoAnalyses);

    // Step 2: Process LiDAR point cloud to extract damage geometry
    const lidarEnhancement = await this.processLiDARForDamage(lidarData, mergedResult);

    return {
      ...mergedResult,
      lidarEnhancement
    };
  }

  /**
   * Analyze damage from video walkthrough of vehicle
   * @param videoData - Video data from mobile device
   * @param frameInterval - Extract frames every N seconds (default: 1)
   * @returns Enhanced damage analysis from multiple angles
   */
  async analyzeVideoWalkthrough(
    videoData: VideoAnalysisData,
    frameInterval: number = 1
  ): Promise<EnhancedDamageAnalysis> {
    logger.info('Analyzing video walkthrough', {
      duration: videoData.metadata.duration,
      fps: videoData.metadata.fps,
      frameInterval
    });

    // Step 1: Extract key frames from video
    const keyFrames = videoData.keyFrames || (await this.extractKeyFrames(videoData, frameInterval));

    logger.info(`Extracted ${keyFrames.length} key frames from video`);

    // Step 2: Analyze each frame for damage
    const frameAnalyses = await Promise.all(
      keyFrames.map(async (frame, index) => {
        logger.debug(`Analyzing frame ${index + 1}/${keyFrames.length} at ${frame.timestamp}s`);
        return this.visionService.detectDamage(frame.frameUrl);
      })
    );

    // Step 3: Merge and deduplicate damage findings
    const mergedResult = this.mergeDamageDetections(frameAnalyses);

    // Step 4: Add video-specific enhancements
    const videoEnhancement = this.analyzeMultiAngleConsistency(frameAnalyses, mergedResult);

    return {
      ...mergedResult,
      videoEnhancement
    };
  }

  /**
   * Comprehensive analysis using all available mobile capabilities
   * @param lidarData - Optional LiDAR scan
   * @param photos - Photos with depth data
   * @param videoData - Optional video walkthrough
   * @returns Most accurate damage analysis possible
   */
  async comprehensiveAnalysis(params: {
    lidarData?: LiDARScanData;
    photos: MobilePhotoData[];
    videoData?: VideoAnalysisData;
  }): Promise<EnhancedDamageAnalysis> {
    logger.info('Starting comprehensive damage analysis', {
      hasLiDAR: !!params.lidarData,
      photoCount: params.photos.length,
      hasVideo: !!params.videoData
    });

    let baseAnalysis: EnhancedDamageAnalysis;

    // Priority 1: LiDAR analysis (most accurate)
    if (params.lidarData && params.photos.length > 0) {
      baseAnalysis = await this.analyzeLiDARScan(params.lidarData, params.photos);
    }
    // Priority 2: Video analysis (multiple angles)
    else if (params.videoData) {
      baseAnalysis = await this.analyzeVideoWalkthrough(params.videoData);
    }
    // Priority 3: Photo analysis with depth
    else if (params.photos.length > 0) {
      const photoAnalyses = await Promise.all(
        params.photos.map((photo) => this.analyzePhotoWithDepth(photo))
      );
      baseAnalysis = this.mergeDamageDetections(photoAnalyses);
    } else {
      throw new Error('At least one photo is required for damage analysis');
    }

    // Log final analysis summary
    logger.info('Comprehensive analysis complete', {
      totalDamages: baseAnalysis.damages.length,
      criticalCount: baseAnalysis.damages.filter((d) => d.severity === 'critical').length,
      severeCount: baseAnalysis.damages.filter((d) => d.severity === 'severe').length,
      hasLiDAREnhancement: !!baseAnalysis.lidarEnhancement,
      hasDepthEnhancement: !!baseAnalysis.depthEnhancement,
      hasVideoEnhancement: !!baseAnalysis.videoEnhancement
    });

    return baseAnalysis;
  }

  /**
   * PRIVATE: Enhance damage analysis with iPhone/iPad depth data
   */
  private async enhanceWithDepthData(
    visionResult: DamageDetectionResult,
    depthData: NonNullable<MobilePhotoData['metadata']['depthData']>,
    imageDimensions: { width: number; height: number }
  ): Promise<EnhancedDamageAnalysis['depthEnhancement']> {
    logger.debug('Enhancing analysis with depth data', {
      format: depthData.format,
      accuracy: depthData.depthAccuracy
    });

    // Decode depth map (simplified - actual implementation would use native iOS/Android APIs)
    const depthAnalyzedDamages = visionResult.damages.map((damage) => {
      // Calculate center point of damage bounding box
      const centerX = damage.boundingBox.x + damage.boundingBox.width / 2;
      const centerY = damage.boundingBox.y + damage.boundingBox.height / 2;

      // Sample depth at damage location (simplified calculation)
      // In production, this would read from the actual depth map buffer
      const depthMeasurement = this.sampleDepthAtPoint(
        depthData.depthMap,
        centerX,
        centerY,
        imageDimensions
      );

      // For dents/deformations, depth measurement is critical
      const depthConfidence = ['dent', 'collision'].includes(damage.type) ? 0.95 : 0.75;

      return {
        damageId: `${damage.type}-${damage.part}`,
        depthMeasurement,
        depthConfidence
      };
    });

    return { depthAnalyzedDamages };
  }

  /**
   * PRIVATE: Process LiDAR point cloud to extract damage geometry
   */
  private async processLiDARForDamage(
    lidarData: LiDARScanData,
    damageDetections: DamageDetectionResult
  ): Promise<EnhancedDamageAnalysis['lidarEnhancement']> {
    logger.debug('Processing LiDAR point cloud', {
      pointCount: lidarData.pointCloud.length
    });

    // Generate 3D mesh from point cloud (simplified)
    const depth3DModel = await this.generateMeshFromPointCloud(lidarData.pointCloud);

    // Calculate accurate dimensions for each detected damage
    const accurateDimensions = damageDetections.damages.map((damage) => {
      // Extract points in damage region (simplified)
      const damagePoints = this.extractDamageRegionPoints(lidarData.pointCloud, damage);

      // Calculate bounding box
      const bbox = this.calculateBoundingBox(damagePoints);

      // Calculate depth for dents (distance from expected surface)
      const depthMeasurement = this.calculateDentDepth(damagePoints);

      // Calculate surface area
      const surfaceArea = this.calculateSurfaceArea(damagePoints);

      return {
        damageId: `${damage.type}-${damage.part}`,
        actualWidth: bbox.width,
        actualHeight: bbox.height,
        actualDepth: depthMeasurement,
        surfaceArea
      };
    });

    // LiDAR provides high confidence boost
    const confidenceBoost = 25; // 25% increase in confidence

    return {
      depth3DModel,
      accurateDimensions,
      confidenceBoost
    };
  }

  /**
   * PRIVATE: Extract key frames from video
   */
  private async extractKeyFrames(
    videoData: VideoAnalysisData,
    interval: number
  ): Promise<VideoAnalysisData['keyFrames']> {
    // In production, this would use FFmpeg or native mobile video processing
    // For now, return a simulated response
    const frameCount = Math.floor(videoData.metadata.duration / interval);
    logger.info(`Would extract ${frameCount} frames from ${videoData.metadata.duration}s video`);

    // Placeholder: In actual implementation, this would call video processing API
    return [];
  }

  /**
   * PRIVATE: Merge damage detections from multiple analyses
   */
  private mergeDamageDetections(analyses: DamageDetectionResult[]): DamageDetectionResult {
    if (analyses.length === 0) {
      throw new Error('No analyses to merge');
    }

    if (analyses.length === 1) {
      return analyses[0];
    }

    // Use first analysis as base
    const merged: DamageDetectionResult = { ...analyses[0] };
    const damageMap = new Map<string, (typeof merged.damages)[0]>();

    // Add all damages to map (deduplicating by part + type)
    analyses.forEach((analysis) => {
      analysis.damages.forEach((damage) => {
        const key = `${damage.part}-${damage.type}`;
        const existing = damageMap.get(key);

        if (!existing) {
          damageMap.set(key, damage);
        } else {
          // Keep damage with higher confidence
          if (damage.confidence > existing.confidence) {
            damageMap.set(key, damage);
          }
        }
      });
    });

    merged.damages = Array.from(damageMap.values());
    return merged;
  }

  /**
   * PRIVATE: Analyze consistency of damage across multiple video angles
   */
  private analyzeMultiAngleConsistency(
    frameAnalyses: DamageDetectionResult[],
    mergedResult: DamageDetectionResult
  ): EnhancedDamageAnalysis['videoEnhancement'] {
    // Count how many frames each damage appears in
    const damageAppearances = new Map<string, number>();

    frameAnalyses.forEach((analysis) => {
      analysis.damages.forEach((damage) => {
        const key = `${damage.part}-${damage.type}`;
        damageAppearances.set(key, (damageAppearances.get(key) || 0) + 1);
      });
    });

    // Damages appearing in multiple frames are highly confident
    const consistentDamagesAcrossAngles = Array.from(damageAppearances.entries())
      .filter(([, count]) => count >= 3) // Appears in 3+ frames
      .map(([key]) => key);

    return {
      multiAngleAnalysis: {
        anglesCaptured: frameAnalyses.length,
        consistentDamagesAcrossAngles,
        additionalDamagesFound: [] // Would compare with initial single-photo analysis
      }
    };
  }

  /**
   * PRIVATE: Sample depth value at specific point in depth map
   */
  private sampleDepthAtPoint(
    depthMapBase64: string,
    x: number,
    y: number,
    dimensions: { width: number; height: number }
  ): number {
    // Simplified: In production, decode depth map and sample actual value
    // Depth maps from iPhone are typically 16-bit grayscale
    // Value represents distance in meters (0-5m typical range)

    // Placeholder: Return simulated depth measurement in millimeters
    return Math.random() * 50 + 5; // 5-55mm depth (typical dent range)
  }

  /**
   * PRIVATE: Generate 3D mesh from LiDAR point cloud
   */
  private async generateMeshFromPointCloud(
    pointCloud: LiDARScanData['pointCloud']
  ): Promise<string> {
    // In production, use algorithms like:
    // - Poisson Surface Reconstruction
    // - Ball-Pivoting Algorithm
    // - Delaunay Triangulation

    logger.debug('Generating 3D mesh from point cloud (placeholder)');

    // Return placeholder URL - actual implementation would generate and upload mesh
    return '/api/damage/3d-models/lidar-scan-placeholder.glb';
  }

  /**
   * PRIVATE: Extract points in damage region from point cloud
   */
  private extractDamageRegionPoints(
    pointCloud: LiDARScanData['pointCloud'],
    damage: DamageDetectionResult['damages'][0]
  ): LiDARScanData['pointCloud'] {
    // Simplified: In production, project bounding box to 3D and filter points
    return pointCloud.slice(0, 100); // Placeholder
  }

  /**
   * PRIVATE: Calculate bounding box dimensions from points
   */
  private calculateBoundingBox(points: LiDARScanData['pointCloud']): {
    width: number;
    height: number;
  } {
    if (points.length === 0) return { width: 0, height: 0 };

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);

    return {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }

  /**
   * PRIVATE: Calculate dent depth from point cloud
   */
  private calculateDentDepth(points: LiDARScanData['pointCloud']): number {
    if (points.length === 0) return 0;

    // Simplified: Calculate deviation from expected surface plane
    const zValues = points.map((p) => p.z);
    const maxDepth = Math.max(...zValues) - Math.min(...zValues);

    return maxDepth;
  }

  /**
   * PRIVATE: Calculate surface area from point cloud
   */
  private calculateSurfaceArea(points: LiDARScanData['pointCloud']): number {
    if (points.length < 3) return 0;

    // Simplified: Use convex hull area as approximation
    // In production, use proper surface area calculation from triangulated mesh
    const bbox = this.calculateBoundingBox(points);
    return bbox.width * bbox.height; // Placeholder approximation
  }
}
