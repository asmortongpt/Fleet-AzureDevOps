/**
 * Fleet Mobile Photo Capture System - Main Export
 *
 * Central export point for all components, services, utilities, and types
 */

// ============================================================================
// Components
// ============================================================================

export { DamageReportCamera } from './components/DamageReportCamera';
export { InspectionPhotoCapture } from './components/InspectionPhotoCapture';
export { PhotoAnnotation } from './components/PhotoAnnotation';

// ============================================================================
// Services
// ============================================================================

export { default as CameraService } from './services/CameraService';

// ============================================================================
// Utilities
// ============================================================================

export {
  NetworkMonitor,
  OfflineStorageManager,
  SyncQueueManager,
  ConflictResolver,
  BatchOperations,
  SyncStats,
  networkMonitor,
  syncQueue,
} from './utils/offlineSync';

export type { ConflictResolution, SyncStatistics } from './utils/offlineSync';

export {
  GPSService,
  DistanceCalculator,
  GeofenceManager,
  RouteTracker,
  CoordinateUtils,
  gpsService,
  geofenceManager,
  routeTracker,
} from './utils/gpsUtils';

export type { Geofence, GeofenceEvent, RoutePoint, Route } from './utils/gpsUtils';

// ============================================================================
// Types
// ============================================================================

export type {
  // Core Photo Types
  PhotoMetadata,
  PhotoWithGPS,
  GeoLocation,
  ExifData,

  // Damage Report Types
  DamageReport,
  DamagePhoto,
  DamageLocation,

  // Inspection Types
  InspectionReport,
  InspectionChecklistItem,
  InspectionPhoto,
  Defect,

  // Annotation Types
  Annotation,
  AnnotatedPhoto,
  AnnotationPoint,
  ArrowAnnotation,
  CircleAnnotation,
  RectangleAnnotation,
  FreehandAnnotation,
  TextAnnotation,
  MarkerAnnotation,

  // Camera Service Types
  CameraOptions,
  CameraPermissionStatus,
  LocationPermissionStatus,
  CompressionOptions,

  // Offline Queue Types
  QueueItem,
  OfflineQueue,

  // API Types
  ApiResponse,
  UploadProgress,
  SyncResult,

  // Component Props Types
  DamageReportCameraProps,
  InspectionPhotoCaptureProps,
  PhotoAnnotationProps,
} from './types';

// Export Enums
export {
  DamageAngle,
  DamageSeverity,
  DamageReportStatus,
  InspectionType,
  InspectionStatus,
  PassFailStatus,
  AnnotationType,
  FlashMode,
  SyncStatus,
  QueueItemType,
  CameraErrorCode,
  LocationErrorCode,
  STORAGE_KEYS,
} from './types';

// Export Error Classes
export { CameraError, LocationError } from './types';
