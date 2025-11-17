/**
 * Fleet Mobile Photo Capture System - Type Definitions
 *
 * Comprehensive type safety for photo capture, annotation, and inspection workflows
 */

import { GeoCoordinates, GeoPosition } from 'react-native-geolocation-service';

// ============================================================================
// Core Photo Types
// ============================================================================

export interface PhotoMetadata {
  id: string;
  uri: string;
  filename: string;
  timestamp: Date;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  compressed: boolean;
  originalSize?: number;
}

export interface PhotoWithGPS extends PhotoMetadata {
  location?: GeoLocation;
  exifData?: ExifData;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface ExifData {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  timestamp?: string;
  make?: string;
  model?: string;
  orientation?: number;
  software?: string;
  [key: string]: any;
}

// ============================================================================
// Damage Report Types
// ============================================================================

export enum DamageAngle {
  FRONT = 'front',
  REAR = 'rear',
  LEFT_SIDE = 'left_side',
  RIGHT_SIDE = 'right_side',
  INTERIOR = 'interior',
  ODOMETER = 'odometer',
  VIN = 'vin',
  LICENSE_PLATE = 'license_plate',
  DAMAGE_CLOSEUP = 'damage_closeup',
  OTHER = 'other',
}

export enum DamageSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export interface DamageLocation {
  x: number; // Percentage from left
  y: number; // Percentage from top
  label?: string;
}

export interface DamageReport {
  id: string;
  vehicleId: string;
  reportedBy: string;
  reportedAt: Date;
  photos: DamagePhoto[];
  severity: DamageSeverity;
  description: string;
  voiceTranscription?: string;
  damageLocations: DamageLocation[];
  estimatedCost?: number;
  status: DamageReportStatus;
  syncStatus: SyncStatus;
}

export interface DamagePhoto extends PhotoWithGPS {
  angle: DamageAngle;
  severity?: DamageSeverity;
  damageLocations?: DamageLocation[];
  notes?: string;
  annotations?: Annotation[];
}

export enum DamageReportStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ============================================================================
// Inspection Types
// ============================================================================

export enum InspectionType {
  PRE_TRIP = 'pre_trip',
  POST_TRIP = 'post_trip',
  MAINTENANCE = 'maintenance',
  ANNUAL = 'annual',
  DOT = 'dot',
  CUSTOM = 'custom',
}

export enum InspectionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REQUIRES_REVIEW = 'requires_review',
}

export enum PassFailStatus {
  PASS = 'pass',
  FAIL = 'fail',
  NA = 'na',
  REQUIRES_ATTENTION = 'requires_attention',
}

export interface InspectionChecklistItem {
  id: string;
  category: string;
  item: string;
  description?: string;
  required: boolean;
  requiresPhoto: boolean;
  minPhotos?: number;
  maxPhotos?: number;
  passFail: PassFailStatus | null;
  notes?: string;
  photos: InspectionPhoto[];
  defects: Defect[];
}

export interface InspectionPhoto extends PhotoWithGPS {
  checklistItemId: string;
  passFail?: PassFailStatus;
  annotations?: Annotation[];
  defects?: Defect[];
}

export interface Defect {
  id: string;
  severity: DamageSeverity;
  description: string;
  location?: DamageLocation;
  requiresImmediateAction: boolean;
  estimatedCost?: number;
  photo?: InspectionPhoto;
}

export interface InspectionReport {
  id: string;
  vehicleId: string;
  inspectorId: string;
  type: InspectionType;
  startedAt: Date;
  completedAt?: Date;
  status: InspectionStatus;
  checklist: InspectionChecklistItem[];
  overallResult: PassFailStatus | null;
  signature?: string;
  notes?: string;
  syncStatus: SyncStatus;
}

// ============================================================================
// Annotation Types
// ============================================================================

export enum AnnotationType {
  ARROW = 'arrow',
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  FREEHAND = 'freehand',
  TEXT = 'text',
  MARKER = 'marker',
}

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  color: string;
  strokeWidth: number;
  timestamp: Date;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: AnnotationType.ARROW;
  start: AnnotationPoint;
  end: AnnotationPoint;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: AnnotationType.CIRCLE;
  center: AnnotationPoint;
  radius: number;
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: AnnotationType.RECTANGLE;
  topLeft: AnnotationPoint;
  bottomRight: AnnotationPoint;
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: AnnotationType.FREEHAND;
  points: AnnotationPoint[];
}

export interface TextAnnotation extends BaseAnnotation {
  type: AnnotationType.TEXT;
  position: AnnotationPoint;
  text: string;
  fontSize: number;
  fontFamily?: string;
}

export interface MarkerAnnotation extends BaseAnnotation {
  type: AnnotationType.MARKER;
  position: AnnotationPoint;
  label?: string;
}

export type Annotation =
  | ArrowAnnotation
  | CircleAnnotation
  | RectangleAnnotation
  | FreehandAnnotation
  | TextAnnotation
  | MarkerAnnotation;

export interface AnnotatedPhoto extends PhotoWithGPS {
  annotations: Annotation[];
  originalPhotoId: string;
}

// ============================================================================
// Camera Service Types
// ============================================================================

export interface CameraOptions {
  quality?: number; // 0-100
  maxWidth?: number;
  maxHeight?: number;
  includeGPS?: boolean;
  includeExif?: boolean;
  saveToGallery?: boolean;
  useFrontCamera?: boolean;
  flashMode?: FlashMode;
}

export enum FlashMode {
  ON = 'on',
  OFF = 'off',
  AUTO = 'auto',
}

export interface CompressionOptions {
  quality: number; // 0-100
  maxWidth?: number;
  maxHeight?: number;
  format?: 'JPEG' | 'PNG';
}

export interface CameraPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'blocked' | 'unavailable';
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'blocked' | 'unavailable';
}

// ============================================================================
// Offline Queue Types
// ============================================================================

export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
  CONFLICT = 'conflict',
}

export interface QueueItem<T = any> {
  id: string;
  type: QueueItemType;
  data: T;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: SyncStatus;
  error?: string;
  priority: number;
}

export enum QueueItemType {
  DAMAGE_REPORT = 'damage_report',
  INSPECTION_REPORT = 'inspection_report',
  PHOTO_UPLOAD = 'photo_upload',
  ANNOTATION = 'annotation',
}

export interface OfflineQueue {
  items: QueueItem[];
  isProcessing: boolean;
  lastSyncAttempt?: Date;
  lastSuccessfulSync?: Date;
}

// ============================================================================
// Voice Recognition Types
// ============================================================================

export interface VoiceRecognitionResult {
  transcription: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface VoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  maxDuration?: number;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface DamageReportCameraProps {
  vehicleId: string;
  onComplete: (report: DamageReport) => void;
  onCancel: () => void;
  existingReport?: Partial<DamageReport>;
}

export interface InspectionPhotoCaptureProps {
  vehicleId: string;
  inspectionType: InspectionType;
  checklist: InspectionChecklistItem[];
  onComplete: (report: InspectionReport) => void;
  onCancel: () => void;
  existingReport?: Partial<InspectionReport>;
}

export interface PhotoAnnotationProps {
  photo: PhotoMetadata;
  existingAnnotations?: Annotation[];
  onSave: (annotatedPhoto: AnnotatedPhoto) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadProgress {
  photoId: string;
  loaded: number;
  total: number;
  percentage: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageKeys {
  DAMAGE_REPORTS: string;
  INSPECTION_REPORTS: string;
  OFFLINE_QUEUE: string;
  PHOTOS: string;
  SETTINGS: string;
}

export const STORAGE_KEYS: StorageKeys = {
  DAMAGE_REPORTS: '@fleet/damage_reports',
  INSPECTION_REPORTS: '@fleet/inspection_reports',
  OFFLINE_QUEUE: '@fleet/offline_queue',
  PHOTOS: '@fleet/photos',
  SETTINGS: '@fleet/settings',
};

// ============================================================================
// Error Types
// ============================================================================

export class CameraError extends Error {
  constructor(
    message: string,
    public code: CameraErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CameraError';
  }
}

export enum CameraErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CAMERA_UNAVAILABLE = 'CAMERA_UNAVAILABLE',
  CAPTURE_FAILED = 'CAPTURE_FAILED',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  SAVE_FAILED = 'SAVE_FAILED',
  GPS_UNAVAILABLE = 'GPS_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN',
}

export class LocationError extends Error {
  constructor(
    message: string,
    public code: LocationErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

export enum LocationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}
