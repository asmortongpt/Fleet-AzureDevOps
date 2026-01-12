/**
 * LiDAR 3D Scanning Types
 *
 * Types for LiDAR point cloud processing, 3D model generation,
 * volume calculation, and AR integration for vehicle damage assessment
 */

import { z } from 'zod';

/**
 * LiDAR Point Cloud Data Structure
 */
export interface LiDARPoint {
  x: number;
  y: number;
  z: number;
  intensity?: number;
  rgb?: {
    r: number;
    g: number;
    b: number;
  };
  normal?: {
    nx: number;
    ny: number;
    nz: number;
  };
  timestamp?: number;
}

/**
 * LiDAR Scan Metadata
 */
export interface LiDARScanMetadata {
  scanId: string;
  vehicleId: number;
  damageReportId?: string;
  scannerId: string;
  scannerType: 'iphone_lidar' | 'ipad_pro' | 'standalone' | 'industrial';
  scanDate: Date;
  scanDurationMs: number;
  pointCount: number;
  resolution: number; // points per meter
  accuracy: number; // meters
  captureDevice: {
    model: string;
    osVersion: string;
    appVersion: string;
  };
  environmentalConditions?: {
    lighting: 'indoor' | 'outdoor' | 'mixed';
    temperature?: number;
    humidity?: number;
  };
  boundingBox: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  };
}

/**
 * 3D Model Generation Request
 */
export interface Model3DGenerationRequest {
  scanId: string;
  format: '3d_model_format';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  optimizeForAR: boolean;
  includeDamageMarkers: boolean;
  colorize: boolean;
}

export type Model3DFormat = 'glb' | 'usdz' | 'obj' | 'ply' | 'stl' | 'fbx';

/**
 * Generated 3D Model
 */
export interface Generated3DModel {
  modelId: string;
  scanId: string;
  format: Model3DFormat;
  fileUrl: string;
  fileSize: number;
  polygonCount: number;
  vertexCount: number;
  textureUrls?: string[];
  damageAnnotations?: DamageAnnotation[];
  generatedAt: Date;
  processingTimeMs: number;
  metadata: {
    software: string;
    version: string;
    algorithm: string;
  };
}

/**
 * Damage Annotation on 3D Model
 */
export interface DamageAnnotation {
  annotationId: string;
  damageType: 'dent' | 'scratch' | 'crack' | 'hole' | 'rust' | 'paint_damage' | 'structural';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  location: {
    x: number;
    y: number;
    z: number;
  };
  area: number; // square meters
  volume?: number; // cubic meters (for dents/holes)
  depth?: number; // meters (for dents)
  length?: number; // meters (for scratches/cracks)
  width?: number; // meters
  confidence: number; // 0-1
  detectionMethod: 'manual' | 'ai' | 'lidar_analysis';
  boundingBox?: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  };
  affectedParts?: string[]; // e.g., ['front_bumper', 'hood']
  estimatedRepairCost?: number;
  photos?: string[]; // URLs to damage photos
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

/**
 * Volume Calculation Result
 */
export interface VolumeCalculation {
  calculationId: string;
  scanId: string;
  method: 'convex_hull' | 'delaunay' | 'marching_cubes' | 'voxel';
  totalVolume: number; // cubic meters
  surfaceArea: number; // square meters
  damageVolumes: Array<{
    annotationId: string;
    volume: number;
    surfaceArea: number;
    depth: number;
    severity: string;
  }>;
  calculatedAt: Date;
  computeTimeMs: number;
}

/**
 * ARKit Integration Data
 */
export interface ARKitModelData {
  usdzUrl: string;
  glbUrl: string;
  scale: {
    x: number;
    y: number;
    z: number;
  };
  initialPosition: {
    x: number;
    y: number;
    z: number;
  };
  initialRotation: {
    x: number;
    y: number;
    z: number;
    w: number; // quaternion
  };
  physicsEnabled: boolean;
  occlusionEnabled: boolean;
  shadowsEnabled: boolean;
  planeDetection: 'horizontal' | 'vertical' | 'both';
  lightingMode: 'realistic' | 'flat' | 'custom';
  damageOverlays: Array<{
    annotationId: string;
    overlayType: 'highlight' | 'label' | 'measurement';
    color: string;
    opacity: number;
  }>;
}

/**
 * LiDAR Scan Session
 */
export interface LiDARScanSession {
  sessionId: string;
  vehicleId: number;
  userId: string;
  tenantId: string;
  status: 'initiated' | 'scanning' | 'processing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  scans: string[]; // scan IDs
  models: string[]; // model IDs
  damageReportId?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Point Cloud Processing Options
 */
export interface PointCloudProcessingOptions {
  denoise: boolean;
  denoiseRadius?: number;
  denoiseThreshold?: number;
  downsample: boolean;
  downsampleVoxelSize?: number;
  removeOutliers: boolean;
  outlierNeighbors?: number;
  outlierStdRatio?: number;
  smoothing: boolean;
  smoothingIterations?: number;
  normalEstimation: boolean;
  normalSearchRadius?: number;
  segmentation: boolean;
  segmentationMethod?: 'region_growing' | 'euclidean_clustering' | 'ransac';
}

/**
 * Mesh Generation Options
 */
export interface MeshGenerationOptions {
  algorithm: 'poisson' | 'ball_pivoting' | 'marching_cubes' | 'delaunay';
  depth?: number; // for Poisson
  scale?: number;
  linearFit?: boolean;
  triangleSize?: number;
  decimation?: boolean;
  targetFaceCount?: number;
  smoothing?: boolean;
  texturing?: boolean;
  textureResolution?: number;
}

/**
 * LiDAR Comparison Result
 */
export interface LiDARComparisonResult {
  comparisonId: string;
  baseScanId: string;
  compareScanId: string;
  differenceMap: {
    pointsAdded: number;
    pointsRemoved: number;
    pointsChanged: number;
    maxDeviation: number;
    averageDeviation: number;
    rmsDeviation: number;
  };
  newDamageDetected: DamageAnnotation[];
  progressedDamage: Array<{
    originalAnnotationId: string;
    newVolume: number;
    volumeChange: number;
    volumeChangePercent: number;
  }>;
  comparisonDate: Date;
  visualizationUrl?: string;
}

/**
 * Zod Validation Schemas
 */

export const LiDARPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  intensity: z.number().optional(),
  rgb: z.object({
    r: z.number().min(0).max(255),
    g: z.number().min(0).max(255),
    b: z.number().min(0).max(255),
  }).optional(),
  normal: z.object({
    nx: z.number(),
    ny: z.number(),
    nz: z.number(),
  }).optional(),
  timestamp: z.number().optional(),
});

export const LiDARScanMetadataSchema = z.object({
  scanId: z.string().uuid(),
  vehicleId: z.number().int().positive(),
  damageReportId: z.string().uuid().optional(),
  scannerId: z.string(),
  scannerType: z.enum(['iphone_lidar', 'ipad_pro', 'standalone', 'industrial']),
  scanDate: z.date().or(z.string().transform(str => new Date(str))),
  scanDurationMs: z.number().int().positive(),
  pointCount: z.number().int().positive(),
  resolution: z.number().positive(),
  accuracy: z.number().positive(),
  captureDevice: z.object({
    model: z.string(),
    osVersion: z.string(),
    appVersion: z.string(),
  }),
  environmentalConditions: z.object({
    lighting: z.enum(['indoor', 'outdoor', 'mixed']),
    temperature: z.number().optional(),
    humidity: z.number().optional(),
  }).optional(),
  boundingBox: z.object({
    minX: z.number(),
    minY: z.number(),
    minZ: z.number(),
    maxX: z.number(),
    maxY: z.number(),
    maxZ: z.number(),
  }),
});

export const Model3DGenerationRequestSchema = z.object({
  scanId: z.string().uuid(),
  format: z.enum(['glb', 'usdz', 'obj', 'ply', 'stl', 'fbx']),
  quality: z.enum(['low', 'medium', 'high', 'ultra']),
  optimizeForAR: z.boolean(),
  includeDamageMarkers: z.boolean(),
  colorize: z.boolean(),
});

export const DamageAnnotationSchema = z.object({
  annotationId: z.string().uuid().optional(),
  damageType: z.enum(['dent', 'scratch', 'crack', 'hole', 'rust', 'paint_damage', 'structural']),
  severity: z.enum(['minor', 'moderate', 'severe', 'critical']),
  location: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  area: z.number().nonnegative(),
  volume: z.number().nonnegative().optional(),
  depth: z.number().nonnegative().optional(),
  length: z.number().nonnegative().optional(),
  width: z.number().nonnegative().optional(),
  confidence: z.number().min(0).max(1),
  detectionMethod: z.enum(['manual', 'ai', 'lidar_analysis']),
  boundingBox: z.object({
    minX: z.number(),
    minY: z.number(),
    minZ: z.number(),
    maxX: z.number(),
    maxY: z.number(),
    maxZ: z.number(),
  }).optional(),
  affectedParts: z.array(z.string()).optional(),
  estimatedRepairCost: z.number().nonnegative().optional(),
  photos: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});

export const PointCloudProcessingOptionsSchema = z.object({
  denoise: z.boolean().default(true),
  denoiseRadius: z.number().positive().optional(),
  denoiseThreshold: z.number().positive().optional(),
  downsample: z.boolean().default(false),
  downsampleVoxelSize: z.number().positive().optional(),
  removeOutliers: z.boolean().default(true),
  outlierNeighbors: z.number().int().positive().optional(),
  outlierStdRatio: z.number().positive().optional(),
  smoothing: z.boolean().default(false),
  smoothingIterations: z.number().int().positive().optional(),
  normalEstimation: z.boolean().default(true),
  normalSearchRadius: z.number().positive().optional(),
  segmentation: z.boolean().default(false),
  segmentationMethod: z.enum(['region_growing', 'euclidean_clustering', 'ransac']).optional(),
});

export const MeshGenerationOptionsSchema = z.object({
  algorithm: z.enum(['poisson', 'ball_pivoting', 'marching_cubes', 'delaunay']).default('poisson'),
  depth: z.number().int().positive().optional(),
  scale: z.number().positive().optional(),
  linearFit: z.boolean().optional(),
  triangleSize: z.number().positive().optional(),
  decimation: z.boolean().default(false),
  targetFaceCount: z.number().int().positive().optional(),
  smoothing: z.boolean().default(true),
  texturing: z.boolean().default(true),
  textureResolution: z.number().int().positive().optional(),
});

/**
 * API Request/Response Types
 */

export interface ProcessLiDARScanRequest {
  vehicleId: number;
  pointCloudData: LiDARPoint[] | string; // array or URL to cloud file
  metadata: Omit<LiDARScanMetadata, 'scanId'>;
  processingOptions?: PointCloudProcessingOptions;
  meshOptions?: MeshGenerationOptions;
  generateModels?: Model3DFormat[];
  detectDamage?: boolean;
}

export interface ProcessLiDARScanResponse {
  scanId: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
  estimatedCompletionTime?: number; // seconds
  metadata?: LiDARScanMetadata;
  models?: Generated3DModel[];
  damageDetected?: DamageAnnotation[];
  volumeCalculation?: VolumeCalculation;
}

export interface GetScanResponse {
  scan: LiDARScanMetadata;
  models: Generated3DModel[];
  damageAnnotations: DamageAnnotation[];
  volumeCalculations: VolumeCalculation[];
  arData?: ARKitModelData;
}

export interface ListScansResponse {
  scans: Array<LiDARScanMetadata & { modelCount: number; damageCount: number }>;
  total: number;
  page: number;
  pageSize: number;
}

export interface CalculateVolumeRequest {
  scanId: string;
  method?: 'convex_hull' | 'delaunay' | 'marching_cubes' | 'voxel';
  damageAnnotations?: string[]; // annotation IDs to calculate volume for
}

export interface CompareSc ansRequest {
  baseScanId: string;
  compareScanId: string;
  tolerance?: number; // meters
  generateVisualization?: boolean;
}

/**
 * Error Types
 */

export class LiDARProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LiDARProcessingError';
  }
}

export class InvalidPointCloudError extends LiDARProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'INVALID_POINT_CLOUD', details);
    this.name = 'InvalidPointCloudError';
  }
}

export class ModelGenerationError extends LiDARProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'MODEL_GENERATION_FAILED', details);
    this.name = 'ModelGenerationError';
  }
}

export class VolumeCalculationError extends LiDARProcessingError {
  constructor(message: string, details?: any) {
    super(message, 'VOLUME_CALCULATION_FAILED', details);
    this.name = 'VolumeCalculationError';
  }
}
