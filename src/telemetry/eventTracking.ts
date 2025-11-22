/**
 * Custom Event Tracking Module for Fleet Management Application
 *
 * Provides tracking for Fleet-specific business events:
 * - Vehicle CRUD operations
 * - Maintenance scheduling and completion
 * - User authentication events
 * - Search operations
 * - Driver assignments
 * - Document management
 */

import { trackEvent, trackMetric, startOperation } from './appInsights';

// Event name constants for consistency
export const FleetEvents = {
  // Vehicle Events
  VEHICLE_CREATED: 'Vehicle_Created',
  VEHICLE_UPDATED: 'Vehicle_Updated',
  VEHICLE_DELETED: 'Vehicle_Deleted',
  VEHICLE_VIEWED: 'Vehicle_Viewed',
  VEHICLE_STATUS_CHANGED: 'Vehicle_StatusChanged',
  VEHICLE_ASSIGNED: 'Vehicle_Assigned',
  VEHICLE_UNASSIGNED: 'Vehicle_Unassigned',

  // Maintenance Events
  MAINTENANCE_SCHEDULED: 'Maintenance_Scheduled',
  MAINTENANCE_COMPLETED: 'Maintenance_Completed',
  MAINTENANCE_CANCELLED: 'Maintenance_Cancelled',
  MAINTENANCE_OVERDUE: 'Maintenance_Overdue',
  MAINTENANCE_REMINDER_SENT: 'Maintenance_ReminderSent',
  INSPECTION_COMPLETED: 'Inspection_Completed',

  // User Events
  USER_LOGIN: 'User_Login',
  USER_LOGOUT: 'User_Logout',
  USER_LOGIN_FAILED: 'User_LoginFailed',
  USER_SESSION_EXPIRED: 'User_SessionExpired',
  USER_PASSWORD_RESET: 'User_PasswordReset',
  USER_PROFILE_UPDATED: 'User_ProfileUpdated',

  // Search Events
  SEARCH_PERFORMED: 'Search_Performed',
  SEARCH_FILTER_APPLIED: 'Search_FilterApplied',
  SEARCH_RESULTS_EXPORTED: 'Search_ResultsExported',

  // Driver Events
  DRIVER_CREATED: 'Driver_Created',
  DRIVER_UPDATED: 'Driver_Updated',
  DRIVER_CERTIFIED: 'Driver_Certified',
  DRIVER_LICENSE_EXPIRING: 'Driver_LicenseExpiring',

  // Trip Events
  TRIP_STARTED: 'Trip_Started',
  TRIP_COMPLETED: 'Trip_Completed',
  TRIP_CANCELLED: 'Trip_Cancelled',

  // Document Events
  DOCUMENT_UPLOADED: 'Document_Uploaded',
  DOCUMENT_DOWNLOADED: 'Document_Downloaded',
  DOCUMENT_SHARED: 'Document_Shared',

  // Report Events
  REPORT_GENERATED: 'Report_Generated',
  REPORT_EXPORTED: 'Report_Exported',
  REPORT_SCHEDULED: 'Report_Scheduled',

  // Map Events
  MAP_VIEWED: 'Map_Viewed',
  MAP_ROUTE_CALCULATED: 'Map_RouteCalculated',
  MAP_GEOFENCE_CREATED: 'Map_GeofenceCreated',

  // Feature Usage
  FEATURE_USED: 'Feature_Used',
  AI_ASSISTANT_USED: 'AI_Assistant_Used',
} as const;

export type FleetEventName = (typeof FleetEvents)[keyof typeof FleetEvents];

// =============================================================================
// Vehicle Event Tracking
// =============================================================================

export interface VehicleEventData {
  vehicleId: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  status?: string;
  previousStatus?: string;
  assignedTo?: string;
  facility?: string;
}

export function trackVehicleCreated(data: VehicleEventData): void {
  trackEvent({
    name: FleetEvents.VEHICLE_CREATED,
    properties: {
      vehicleId: hashId(data.vehicleId),
      vehicleType: data.vehicleType || 'unknown',
      make: data.make || 'unknown',
      model: data.model || 'unknown',
      year: data.year?.toString() || 'unknown',
      facility: data.facility || 'unknown',
    },
  });
}

export function trackVehicleUpdated(
  data: VehicleEventData,
  fieldsChanged: string[]
): void {
  trackEvent({
    name: FleetEvents.VEHICLE_UPDATED,
    properties: {
      vehicleId: hashId(data.vehicleId),
      vehicleType: data.vehicleType || 'unknown',
      fieldsChanged: fieldsChanged.join(','),
      fieldCount: fieldsChanged.length.toString(),
    },
    measurements: {
      fieldCount: fieldsChanged.length,
    },
  });
}

export function trackVehicleDeleted(data: VehicleEventData): void {
  trackEvent({
    name: FleetEvents.VEHICLE_DELETED,
    properties: {
      vehicleId: hashId(data.vehicleId),
      vehicleType: data.vehicleType || 'unknown',
    },
  });
}

export function trackVehicleStatusChanged(
  data: VehicleEventData,
  newStatus: string
): void {
  trackEvent({
    name: FleetEvents.VEHICLE_STATUS_CHANGED,
    properties: {
      vehicleId: hashId(data.vehicleId),
      previousStatus: data.previousStatus || 'unknown',
      newStatus,
    },
  });
}

export function trackVehicleAssignment(
  vehicleId: string,
  driverId: string | null,
  isAssigning: boolean
): void {
  trackEvent({
    name: isAssigning
      ? FleetEvents.VEHICLE_ASSIGNED
      : FleetEvents.VEHICLE_UNASSIGNED,
    properties: {
      vehicleId: hashId(vehicleId),
      hasDriver: (!!driverId).toString(),
    },
  });
}

// =============================================================================
// Maintenance Event Tracking
// =============================================================================

export interface MaintenanceEventData {
  maintenanceId: string;
  vehicleId: string;
  maintenanceType: string;
  scheduledDate?: string;
  completedDate?: string;
  cost?: number;
  vendor?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export function trackMaintenanceScheduled(data: MaintenanceEventData): void {
  trackEvent({
    name: FleetEvents.MAINTENANCE_SCHEDULED,
    properties: {
      maintenanceId: hashId(data.maintenanceId),
      vehicleId: hashId(data.vehicleId),
      maintenanceType: data.maintenanceType,
      priority: data.priority || 'medium',
      hasVendor: (!!data.vendor).toString(),
    },
  });
}

export function trackMaintenanceCompleted(data: MaintenanceEventData): void {
  trackEvent({
    name: FleetEvents.MAINTENANCE_COMPLETED,
    properties: {
      maintenanceId: hashId(data.maintenanceId),
      vehicleId: hashId(data.vehicleId),
      maintenanceType: data.maintenanceType,
      priority: data.priority || 'medium',
    },
    measurements: {
      cost: data.cost || 0,
    },
  });

  // Also track cost as a metric for aggregation
  if (data.cost) {
    trackMetric({
      name: 'MaintenanceCost',
      average: data.cost,
      sampleCount: 1,
      properties: {
        maintenanceType: data.maintenanceType,
      },
    });
  }
}

export function trackMaintenanceCancelled(
  maintenanceId: string,
  reason?: string
): void {
  trackEvent({
    name: FleetEvents.MAINTENANCE_CANCELLED,
    properties: {
      maintenanceId: hashId(maintenanceId),
      hasReason: (!!reason).toString(),
    },
  });
}

export function trackInspectionCompleted(
  vehicleId: string,
  inspectionType: string,
  passed: boolean
): void {
  trackEvent({
    name: FleetEvents.INSPECTION_COMPLETED,
    properties: {
      vehicleId: hashId(vehicleId),
      inspectionType,
      passed: passed.toString(),
    },
  });
}

// =============================================================================
// User Authentication Event Tracking
// =============================================================================

export interface UserEventData {
  userId?: string;
  method?: 'azure_ad' | 'email' | 'sso' | 'mfa';
  role?: string;
  tenantId?: string;
}

export function trackUserLogin(data: UserEventData): void {
  trackEvent({
    name: FleetEvents.USER_LOGIN,
    properties: {
      method: data.method || 'unknown',
      role: data.role || 'unknown',
      hasTenant: (!!data.tenantId).toString(),
    },
  });
}

export function trackUserLogout(data: UserEventData): void {
  trackEvent({
    name: FleetEvents.USER_LOGOUT,
    properties: {
      method: data.method || 'unknown',
    },
  });
}

export function trackUserLoginFailed(
  data: UserEventData,
  errorCode?: string
): void {
  trackEvent({
    name: FleetEvents.USER_LOGIN_FAILED,
    properties: {
      method: data.method || 'unknown',
      errorCode: errorCode || 'unknown',
    },
  });
}

export function trackSessionExpired(): void {
  trackEvent({
    name: FleetEvents.USER_SESSION_EXPIRED,
    properties: {},
  });
}

// =============================================================================
// Search Event Tracking
// =============================================================================

export interface SearchEventData {
  searchType: 'vehicle' | 'driver' | 'maintenance' | 'document' | 'global';
  queryLength?: number;
  resultCount?: number;
  duration?: number;
  filters?: string[];
  sortBy?: string;
}

export function trackSearchPerformed(data: SearchEventData): void {
  trackEvent({
    name: FleetEvents.SEARCH_PERFORMED,
    properties: {
      searchType: data.searchType,
      hasFilters: ((data.filters?.length || 0) > 0).toString(),
      filterCount: (data.filters?.length || 0).toString(),
      sortBy: data.sortBy || 'relevance',
    },
    measurements: {
      queryLength: data.queryLength || 0,
      resultCount: data.resultCount || 0,
      duration: data.duration || 0,
    },
  });

  // Track search performance as a metric
  if (data.duration) {
    trackMetric({
      name: 'SearchDuration',
      average: data.duration,
      sampleCount: 1,
      properties: {
        searchType: data.searchType,
      },
    });
  }
}

export function trackSearchFilterApplied(
  filterType: string,
  filterValue: string
): void {
  trackEvent({
    name: FleetEvents.SEARCH_FILTER_APPLIED,
    properties: {
      filterType,
      // Don't log actual filter values for privacy
      hasValue: (!!filterValue).toString(),
    },
  });
}

export function trackSearchExported(
  searchType: string,
  exportFormat: string,
  recordCount: number
): void {
  trackEvent({
    name: FleetEvents.SEARCH_RESULTS_EXPORTED,
    properties: {
      searchType,
      exportFormat,
    },
    measurements: {
      recordCount,
    },
  });
}

// =============================================================================
// Driver Event Tracking
// =============================================================================

export interface DriverEventData {
  driverId: string;
  licenseClass?: string;
  certifications?: string[];
}

export function trackDriverCreated(data: DriverEventData): void {
  trackEvent({
    name: FleetEvents.DRIVER_CREATED,
    properties: {
      driverId: hashId(data.driverId),
      licenseClass: data.licenseClass || 'unknown',
      certificationCount: (data.certifications?.length || 0).toString(),
    },
  });
}

export function trackDriverUpdated(
  data: DriverEventData,
  fieldsChanged: string[]
): void {
  trackEvent({
    name: FleetEvents.DRIVER_UPDATED,
    properties: {
      driverId: hashId(data.driverId),
      fieldsChanged: fieldsChanged.join(','),
    },
    measurements: {
      fieldCount: fieldsChanged.length,
    },
  });
}

// =============================================================================
// Trip Event Tracking
// =============================================================================

export interface TripEventData {
  tripId: string;
  vehicleId: string;
  driverId?: string;
  distance?: number;
  duration?: number;
  purpose?: string;
}

export function trackTripStarted(data: TripEventData): void {
  trackEvent({
    name: FleetEvents.TRIP_STARTED,
    properties: {
      tripId: hashId(data.tripId),
      vehicleId: hashId(data.vehicleId),
      hasDriver: (!!data.driverId).toString(),
      purpose: data.purpose || 'unspecified',
    },
  });
}

export function trackTripCompleted(data: TripEventData): void {
  trackEvent({
    name: FleetEvents.TRIP_COMPLETED,
    properties: {
      tripId: hashId(data.tripId),
      vehicleId: hashId(data.vehicleId),
      purpose: data.purpose || 'unspecified',
    },
    measurements: {
      distance: data.distance || 0,
      duration: data.duration || 0,
    },
  });

  // Track trip metrics
  if (data.distance) {
    trackMetric({
      name: 'TripDistance',
      average: data.distance,
      sampleCount: 1,
    });
  }
}

// =============================================================================
// Document Event Tracking
// =============================================================================

export interface DocumentEventData {
  documentId: string;
  documentType: string;
  fileSize?: number;
  relatedEntity?: string;
}

export function trackDocumentUploaded(data: DocumentEventData): void {
  trackEvent({
    name: FleetEvents.DOCUMENT_UPLOADED,
    properties: {
      documentId: hashId(data.documentId),
      documentType: data.documentType,
      hasRelatedEntity: (!!data.relatedEntity).toString(),
    },
    measurements: {
      fileSize: data.fileSize || 0,
    },
  });
}

export function trackDocumentDownloaded(data: DocumentEventData): void {
  trackEvent({
    name: FleetEvents.DOCUMENT_DOWNLOADED,
    properties: {
      documentId: hashId(data.documentId),
      documentType: data.documentType,
    },
  });
}

// =============================================================================
// Report Event Tracking
// =============================================================================

export interface ReportEventData {
  reportType: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recordCount?: number;
  generationTime?: number;
}

export function trackReportGenerated(data: ReportEventData): void {
  trackEvent({
    name: FleetEvents.REPORT_GENERATED,
    properties: {
      reportType: data.reportType,
      format: data.format,
    },
    measurements: {
      recordCount: data.recordCount || 0,
      generationTime: data.generationTime || 0,
    },
  });
}

export function trackReportExported(data: ReportEventData): void {
  trackEvent({
    name: FleetEvents.REPORT_EXPORTED,
    properties: {
      reportType: data.reportType,
      format: data.format,
    },
  });
}

// =============================================================================
// Map Event Tracking
// =============================================================================

export function trackMapViewed(provider: string, vehicleCount: number): void {
  trackEvent({
    name: FleetEvents.MAP_VIEWED,
    properties: {
      provider,
    },
    measurements: {
      vehicleCount,
    },
  });
}

export function trackRouteCalculated(
  origin: string,
  destination: string,
  distance: number,
  duration: number
): void {
  trackEvent({
    name: FleetEvents.MAP_ROUTE_CALCULATED,
    properties: {
      // Don't log actual addresses
      hasOrigin: (!!origin).toString(),
      hasDestination: (!!destination).toString(),
    },
    measurements: {
      distance,
      duration,
    },
  });
}

// =============================================================================
// Feature Usage Tracking
// =============================================================================

export function trackFeatureUsed(
  featureName: string,
  action?: string,
  metadata?: Record<string, string | number | boolean>
): void {
  trackEvent({
    name: FleetEvents.FEATURE_USED,
    properties: {
      featureName,
      action: action || 'used',
      ...Object.fromEntries(
        Object.entries(metadata || {}).map(([k, v]) => [k, String(v)])
      ),
    },
  });
}

export function trackAIAssistantUsed(
  queryType: string,
  responseTime?: number,
  wasHelpful?: boolean
): void {
  trackEvent({
    name: FleetEvents.AI_ASSISTANT_USED,
    properties: {
      queryType,
      wasHelpful: wasHelpful?.toString() || 'unknown',
    },
    measurements: {
      responseTime: responseTime || 0,
    },
  });
}

// =============================================================================
// Performance Tracking Helpers
// =============================================================================

/**
 * Create a timed operation tracker for measuring feature performance
 */
export function createOperationTimer(operationName: string) {
  return startOperation(operationName);
}

/**
 * Track a page load time
 */
export function trackPageLoad(pageName: string, loadTime: number): void {
  trackMetric({
    name: 'PageLoadTime',
    average: loadTime,
    sampleCount: 1,
    properties: {
      pageName,
    },
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Hash an ID for privacy (don't send raw IDs to telemetry)
 */
function hashId(id: string): string {
  if (!id) return 'unknown';

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
