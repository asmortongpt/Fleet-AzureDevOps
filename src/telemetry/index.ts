/**
 * Fleet Application Telemetry Module - STUB IMPLEMENTATION
 *
 * Azure Application Insights has been DISABLED due to incompatibility with React 19.
 * The SDK crashes with: "Cannot set properties of undefined (setting 'Activity')"
 *
 * This module provides no-op stub implementations that maintain the same API surface
 * so that existing code continues to work without modification.
 *
 * TODO: Re-enable when Microsoft updates ApplicationInsights SDK to support React 19
 */

// =============================================================================
// INITIALIZATION STATE TRACKING
// =============================================================================

let _telemetryInitialized = false;
let _telemetryInitializing = false;

export function isTelemetryInitialized(): boolean {
  return _telemetryInitialized;
}

export function isTelemetryInitializing(): boolean {
  return _telemetryInitializing;
}

// =============================================================================
// STUB TYPES - No actual SDK imports to avoid bundling the broken SDK
// =============================================================================

export const SeverityLevel = {
  Verbose: 0,
  Information: 1,
  Warning: 2,
  Error: 3,
  Critical: 4,
} as const;

export interface TelemetryConfig {
  connectionString?: string;
  samplingPercentage?: number;
  enableAutoPageViewTracking?: boolean;
  enableAjaxTracking?: boolean;
  enableExceptionTracking?: boolean;
  enablePerformanceTracking?: boolean;
  maxBatchSize?: number;
  maxBatchInterval?: number;
}

export interface AuthenticatedUser {
  userId: string;
  accountId?: string;
  email?: string;
  roles?: string[];
}

// Stub telemetry types (not importing from SDK to avoid crash)
export interface IExceptionTelemetry {
  exception?: Error;
  severityLevel?: number;
  properties?: Record<string, unknown>;
}

export interface IPageViewTelemetry {
  name?: string;
  uri?: string;
  properties?: Record<string, unknown>;
}

export interface ITraceTelemetry {
  message?: string;
  severityLevel?: number;
  properties?: Record<string, unknown>;
}

export interface IMetricTelemetry {
  name?: string;
  average?: number;
  sampleCount?: number;
  properties?: Record<string, unknown>;
}

export interface IEventTelemetry {
  name?: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

// =============================================================================
// STUB IMPLEMENTATIONS - AppInsights
// =============================================================================

export function initializeAppInsights(_config?: Partial<TelemetryConfig>): null {
  console.info('[Telemetry] DISABLED - ApplicationInsights incompatible with React 19');
  return null;
}

export function getAppInsights(): null {
  return null;
}

export function setAuthenticatedUser(_user: AuthenticatedUser): void {
  // No-op stub
}

export function clearAuthenticatedUser(): void {
  // No-op stub
}

export function trackPageView(_pageView?: IPageViewTelemetry): void {
  if (!_telemetryInitialized) {
    console.debug('[Telemetry] Skipping pageView - not initialized');
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track pageView:', error);
  }
}

export function trackEvent(_event: IEventTelemetry): void {
  if (!_telemetryInitialized) {
    console.debug('[Telemetry] Skipping event - not initialized:', _event?.name);
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track event:', error);
  }
}

export function trackException(_exception: IExceptionTelemetry): void {
  if (!_telemetryInitialized) {
    console.debug('[Telemetry] Skipping exception - not initialized');
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track exception:', error);
  }
}

export function trackTrace(_trace: ITraceTelemetry): void {
  if (!_telemetryInitialized) {
    console.debug('[Telemetry] Skipping trace - not initialized');
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track trace:', error);
  }
}

export function trackMetric(_metric: IMetricTelemetry): void {
  if (!_telemetryInitialized) {
    console.debug('[Telemetry] Skipping metric - not initialized');
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track metric:', error);
  }
}

export function startOperation(_operationName: string): () => void {
  if (!_telemetryInitialized) {
    return () => {};
  }
  try {
    return () => {}; // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to start operation:', error);
    return () => {};
  }
}

export function flushTelemetry(): void {
  if (!_telemetryInitialized) {
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to flush telemetry:', error);
  }
}

export function isTelemetryEnabled(): boolean {
  return false; // Always disabled
}

// =============================================================================
// STUB IMPLEMENTATIONS - Error Tracking
// =============================================================================

export enum ErrorCategory {
  UNHANDLED = 'unhandled',
  REACT_BOUNDARY = 'react_error_boundary',
  API = 'api_error',
  NETWORK = 'network_error',
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'auth_error',
  PERMISSION = 'permission_error',
  TIMEOUT = 'timeout_error',
  RESOURCE_LOAD = 'resource_load_error',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  category: ErrorCategory;
  severity?: ErrorSeverity;
  component?: string;
  action?: string;
  userId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  responseBody?: string;
  additionalData?: Record<string, unknown>;
}

export interface ApiErrorDetails {
  url: string;
  method: string;
  statusCode: number;
  statusText?: string;
  requestBody?: unknown;
  responseBody?: unknown;
  duration?: number;
  requestId?: string;
}

export function setupGlobalErrorHandlers(): void {
  if (!_telemetryInitialized) {
    console.debug('[Telemetry] Skipping global error handlers - not initialized');
    return;
  }
  try {
    console.info('[Telemetry] Global error handlers: DISABLED (AppInsights incompatible with React 19)');
  } catch (error) {
    console.warn('[Telemetry] Failed to setup global error handlers:', error);
  }
}

export function captureException(error: Error | unknown, _context?: Partial<ErrorContext>): void {
  if (!_telemetryInitialized) {
    // Still log in dev mode even if not initialized
    if (import.meta.env.DEV) {
      console.error('[Telemetry Stub] Exception (not initialized):', error);
    }
    return;
  }
  try {
    // Log to console instead of AppInsights
    if (import.meta.env.DEV) {
      console.error('[Telemetry Stub] Exception:', error);
    }
  } catch (captureError) {
    console.warn('[Telemetry] Failed to capture exception:', captureError);
  }
}

export function trackReactErrorBoundary(
  error: Error,
  errorInfo: React.ErrorInfo,
  _componentName?: string
): void {
  if (!_telemetryInitialized) {
    console.error('[Telemetry Stub] React Error Boundary caught (not initialized):', error, errorInfo);
    return;
  }
  try {
    console.error('[Telemetry Stub] React Error Boundary caught:', error, errorInfo);
  } catch (trackError) {
    console.warn('[Telemetry] Failed to track React error boundary:', trackError);
  }
}

export function trackApiError(_error: Error | unknown, _details: ApiErrorDetails): void {
  if (!_telemetryInitialized) {
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track API error:', error);
  }
}

export function trackNetworkError(_error: Error | unknown, _url: string, _method: string): void {
  if (!_telemetryInitialized) {
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track network error:', error);
  }
}

export function trackValidationError(_field: string, _message: string, _formName?: string): void {
  if (!_telemetryInitialized) {
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track validation error:', error);
  }
}

export function trackResourceLoadError(_resourceUrl: string, _resourceType: string): void {
  if (!_telemetryInitialized) {
    return;
  }
  try {
    // No-op stub
  } catch (error) {
    console.warn('[Telemetry] Failed to track resource load error:', error);
  }
}

export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  _context?: Partial<ErrorContext>
): T {
  return fn; // Return the function unchanged
}

export function createApiErrorInterceptor() {
  return {
    onError: (_error: unknown, _config: { url: string; method: string }) => {},
    onResponseError: (_error: unknown, _response: unknown) => {},
  };
}

// =============================================================================
// STUB IMPLEMENTATIONS - Event Tracking
// =============================================================================

export const FleetEvents = {
  VEHICLE_CREATED: 'Vehicle_Created',
  VEHICLE_UPDATED: 'Vehicle_Updated',
  VEHICLE_DELETED: 'Vehicle_Deleted',
  VEHICLE_VIEWED: 'Vehicle_Viewed',
  VEHICLE_STATUS_CHANGED: 'Vehicle_StatusChanged',
  VEHICLE_ASSIGNED: 'Vehicle_Assigned',
  VEHICLE_UNASSIGNED: 'Vehicle_Unassigned',
  MAINTENANCE_SCHEDULED: 'Maintenance_Scheduled',
  MAINTENANCE_COMPLETED: 'Maintenance_Completed',
  MAINTENANCE_CANCELLED: 'Maintenance_Cancelled',
  MAINTENANCE_OVERDUE: 'Maintenance_Overdue',
  MAINTENANCE_REMINDER_SENT: 'Maintenance_ReminderSent',
  INSPECTION_COMPLETED: 'Inspection_Completed',
  USER_LOGIN: 'User_Login',
  USER_LOGOUT: 'User_Logout',
  USER_LOGIN_FAILED: 'User_LoginFailed',
  USER_SESSION_EXPIRED: 'User_SessionExpired',
  USER_PASSWORD_RESET: 'User_PasswordReset',
  USER_PROFILE_UPDATED: 'User_ProfileUpdated',
  SEARCH_PERFORMED: 'Search_Performed',
  SEARCH_FILTER_APPLIED: 'Search_FilterApplied',
  SEARCH_RESULTS_EXPORTED: 'Search_ResultsExported',
  DRIVER_CREATED: 'Driver_Created',
  DRIVER_UPDATED: 'Driver_Updated',
  DRIVER_CERTIFIED: 'Driver_Certified',
  DRIVER_LICENSE_EXPIRING: 'Driver_LicenseExpiring',
  TRIP_STARTED: 'Trip_Started',
  TRIP_COMPLETED: 'Trip_Completed',
  TRIP_CANCELLED: 'Trip_Cancelled',
  DOCUMENT_UPLOADED: 'Document_Uploaded',
  DOCUMENT_DOWNLOADED: 'Document_Downloaded',
  DOCUMENT_SHARED: 'Document_Shared',
  REPORT_GENERATED: 'Report_Generated',
  REPORT_EXPORTED: 'Report_Exported',
  REPORT_SCHEDULED: 'Report_Scheduled',
  MAP_VIEWED: 'Map_Viewed',
  MAP_ROUTE_CALCULATED: 'Map_RouteCalculated',
  MAP_GEOFENCE_CREATED: 'Map_GeofenceCreated',
  FEATURE_USED: 'Feature_Used',
  AI_ASSISTANT_USED: 'AI_Assistant_Used',
} as const;

export type FleetEventName = (typeof FleetEvents)[keyof typeof FleetEvents];

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

export interface UserEventData {
  userId?: string;
  method?: 'azure_ad' | 'email' | 'sso' | 'mfa';
  role?: string;
  tenantId?: string;
}

export interface SearchEventData {
  searchType: 'vehicle' | 'driver' | 'maintenance' | 'document' | 'global';
  queryLength?: number;
  resultCount?: number;
  duration?: number;
  filters?: string[];
  sortBy?: string;
}

export interface DriverEventData {
  driverId: string;
  licenseClass?: string;
  certifications?: string[];
}

export interface TripEventData {
  tripId: string;
  vehicleId: string;
  driverId?: string;
  distance?: number;
  duration?: number;
  purpose?: string;
}

export interface DocumentEventData {
  documentId: string;
  documentType: string;
  fileSize?: number;
  relatedEntity?: string;
}

export interface ReportEventData {
  reportType: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recordCount?: number;
  generationTime?: number;
}

// All event tracking functions with safety wrappers
export function trackVehicleCreated(_data: VehicleEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track vehicle created:', e); }
}
export function trackVehicleUpdated(_data: VehicleEventData, _fieldsChanged: string[]): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track vehicle updated:', e); }
}
export function trackVehicleDeleted(_data: VehicleEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track vehicle deleted:', e); }
}
export function trackVehicleStatusChanged(_data: VehicleEventData, _newStatus: string): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track vehicle status changed:', e); }
}
export function trackVehicleAssignment(_vehicleId: string, _driverId: string | null, _isAssigning: boolean): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track vehicle assignment:', e); }
}
export function trackMaintenanceScheduled(_data: MaintenanceEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track maintenance scheduled:', e); }
}
export function trackMaintenanceCompleted(_data: MaintenanceEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track maintenance completed:', e); }
}
export function trackMaintenanceCancelled(_maintenanceId: string, _reason?: string): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track maintenance cancelled:', e); }
}
export function trackInspectionCompleted(_vehicleId: string, _inspectionType: string, _passed: boolean): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track inspection completed:', e); }
}
export function trackUserLogin(_data: UserEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track user login:', e); }
}
export function trackUserLogout(_data: UserEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track user logout:', e); }
}
export function trackUserLoginFailed(_data: UserEventData, _errorCode?: string): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track user login failed:', e); }
}
export function trackSessionExpired(): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track session expired:', e); }
}
export function trackSearchPerformed(_data: SearchEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track search performed:', e); }
}
export function trackSearchFilterApplied(_filterType: string, _filterValue: string): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track search filter applied:', e); }
}
export function trackSearchExported(_searchType: string, _exportFormat: string, _recordCount: number): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track search exported:', e); }
}
export function trackDriverCreated(_data: DriverEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track driver created:', e); }
}
export function trackDriverUpdated(_data: DriverEventData, _fieldsChanged: string[]): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track driver updated:', e); }
}
export function trackTripStarted(_data: TripEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track trip started:', e); }
}
export function trackTripCompleted(_data: TripEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track trip completed:', e); }
}
export function trackDocumentUploaded(_data: DocumentEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track document uploaded:', e); }
}
export function trackDocumentDownloaded(_data: DocumentEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track document downloaded:', e); }
}
export function trackReportGenerated(_data: ReportEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track report generated:', e); }
}
export function trackReportExported(_data: ReportEventData): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track report exported:', e); }
}
export function trackMapViewed(_provider: string, _vehicleCount: number): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track map viewed:', e); }
}
export function trackRouteCalculated(_origin: string, _destination: string, _distance: number, _duration: number): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track route calculated:', e); }
}
export function trackFeatureUsed(_featureName: string, _action?: string, _metadata?: Record<string, string | number | boolean>): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track feature used:', e); }
}
export function trackAIAssistantUsed(_queryType: string, _responseTime?: number, _wasHelpful?: boolean): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track AI assistant used:', e); }
}
export function createOperationTimer(_operationName: string): () => void {
  if (!_telemetryInitialized) return () => {};
  try {
    return () => {};
  } catch (e) {
    console.warn('[Telemetry] Failed to create operation timer:', e);
    return () => {};
  }
}
export function trackPageLoad(_pageName: string, _loadTime: number): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track page load:', e); }
}

// =============================================================================
// STUB IMPLEMENTATIONS - Web Vitals
// =============================================================================

export type VitalRating = 'good' | 'needs-improvement' | 'poor';

export interface WebVitalReport {
  name: string;
  value: number;
  rating: VitalRating;
  delta: number;
  id: string;
  navigationType?: string;
  entries?: PerformanceEntry[];
}

export interface WebVitalsSummary {
  LCP?: { value: number; rating: VitalRating };
  INP?: { value: number; rating: VitalRating };
  CLS?: { value: number; rating: VitalRating };
  FCP?: { value: number; rating: VitalRating };
  TTFB?: { value: number; rating: VitalRating };
  overallRating: VitalRating;
}

export function initializeWebVitals(): void {
  if (!_telemetryInitialized) {
    console.debug('[Telemetry] Skipping web vitals init - not initialized');
    return;
  }
  try {
    console.info('[Telemetry] Web Vitals: DISABLED (AppInsights incompatible with React 19)');
  } catch (error) {
    console.warn('[Telemetry] Failed to initialize web vitals:', error);
  }
}

export function trackPerformanceTiming(_name: string, _duration: number, _properties?: Record<string, string>): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track performance timing:', e); }
}
export function observeLongTasks(): PerformanceObserver | null {
  if (!_telemetryInitialized) return null;
  try { return null; } catch (e) { console.warn('[Telemetry] Failed to observe long tasks:', e); return null; }
}
export function observeResourceTiming(): PerformanceObserver | null {
  if (!_telemetryInitialized) return null;
  try { return null; } catch (e) { console.warn('[Telemetry] Failed to observe resource timing:', e); return null; }
}
export function getNavigationTiming(): Record<string, number> | null {
  if (!_telemetryInitialized) return null;
  try { return null; } catch (e) { console.warn('[Telemetry] Failed to get navigation timing:', e); return null; }
}
export function trackNavigationTiming(): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track navigation timing:', e); }
}
export function trackMemoryUsage(): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to track memory usage:', e); }
}
export function startPerformanceMonitoring(_intervalMs?: number): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to start performance monitoring:', e); }
}
export function stopPerformanceMonitoring(): void {
  if (!_telemetryInitialized) return;
  try { /* No-op stub */ } catch (e) { console.warn('[Telemetry] Failed to stop performance monitoring:', e); }
}
export function getWebVitalsSummary(): WebVitalsSummary {
  // Always return a safe default, even if not initialized
  try {
    return { overallRating: 'good' };
  } catch (e) {
    console.warn('[Telemetry] Failed to get web vitals summary:', e);
    return { overallRating: 'good' };
  }
}

// =============================================================================
// INITIALIZATION HELPER - Stub version
// =============================================================================

export interface TelemetryInitOptions {
  connectionString?: string;
  enableWebVitals?: boolean;
  enableLongTaskObserver?: boolean;
  enablePerformanceMonitoring?: boolean;
  performanceMonitoringInterval?: number;
  samplingPercentage?: number;
}

/**
 * Initialize all telemetry systems - STUB VERSION
 *
 * This is a no-op stub implementation due to ApplicationInsights
 * being incompatible with React 19.
 */
export function initializeTelemetry(_options: TelemetryInitOptions = {}): boolean {
  // Check if already initialized
  if (_telemetryInitialized) {
    console.debug('[Telemetry] Already initialized, skipping');
    return true;
  }

  // Check if currently initializing
  if (_telemetryInitializing) {
    console.debug('[Telemetry] Initialization in progress, skipping');
    return false;
  }

  _telemetryInitializing = true;

  try {
    console.info('[Telemetry] DISABLED - ApplicationInsights SDK incompatible with React 19');
    console.info('[Telemetry] Error: "Cannot set properties of undefined (setting \'Activity\')"');
    console.info('[Telemetry] TODO: Re-enable when Microsoft updates the SDK');

    // Mark as initialized (even though disabled) to prevent repeated init attempts
    _telemetryInitialized = true;
    return true;
  } catch (error) {
    console.warn('[Telemetry] Initialization failed:', error);
    return false;
  } finally {
    _telemetryInitializing = false;
  }
}
