/**
 * Fleet Application Telemetry Module
 *
 * Azure Application Insights integration providing:
 * - Application performance monitoring
 * - Error tracking and diagnostics
 * - Custom business event tracking
 * - Core Web Vitals monitoring
 *
 * Usage:
 * ```typescript
 * import { initializeTelemetry, trackVehicleCreated, captureException } from '@/telemetry';
 *
 * // Initialize at app startup
 * initializeTelemetry();
 *
 * // Track custom events
 * trackVehicleCreated({ vehicleId: '123', vehicleType: 'truck' });
 *
 * // Handle errors
 * try { ... } catch (error) { captureException(error, { category: ErrorCategory.API }); }
 * ```
 */

// Core Application Insights
export {
  initializeAppInsights,
  getAppInsights,
  setAuthenticatedUser,
  clearAuthenticatedUser,
  trackPageView,
  trackEvent,
  trackException,
  trackTrace,
  trackMetric,
  startOperation,
  flushTelemetry,
  isTelemetryEnabled,
  SeverityLevel,
} from './appInsights';

export type {
  TelemetryConfig,
  AuthenticatedUser,
  IExceptionTelemetry,
  IPageViewTelemetry,
  ITraceTelemetry,
  IMetricTelemetry,
  IEventTelemetry,
} from './appInsights';

// Error Tracking
export {
  setupGlobalErrorHandlers,
  captureException,
  trackReactErrorBoundary,
  trackApiError,
  trackNetworkError,
  trackValidationError,
  trackResourceLoadError,
  withErrorTracking,
  createApiErrorInterceptor,
  ErrorCategory,
  ErrorSeverity,
} from './errorTracking';

export type { ErrorContext, ApiErrorDetails } from './errorTracking';

// Custom Event Tracking
export {
  FleetEvents,
  // Vehicle events
  trackVehicleCreated,
  trackVehicleUpdated,
  trackVehicleDeleted,
  trackVehicleStatusChanged,
  trackVehicleAssignment,
  // Maintenance events
  trackMaintenanceScheduled,
  trackMaintenanceCompleted,
  trackMaintenanceCancelled,
  trackInspectionCompleted,
  // User events
  trackUserLogin,
  trackUserLogout,
  trackUserLoginFailed,
  trackSessionExpired,
  // Search events
  trackSearchPerformed,
  trackSearchFilterApplied,
  trackSearchExported,
  // Driver events
  trackDriverCreated,
  trackDriverUpdated,
  // Trip events
  trackTripStarted,
  trackTripCompleted,
  // Document events
  trackDocumentUploaded,
  trackDocumentDownloaded,
  // Report events
  trackReportGenerated,
  trackReportExported,
  // Map events
  trackMapViewed,
  trackRouteCalculated,
  // Feature usage
  trackFeatureUsed,
  trackAIAssistantUsed,
  // Performance helpers
  createOperationTimer,
  trackPageLoad,
} from './eventTracking';

export type {
  FleetEventName,
  VehicleEventData,
  MaintenanceEventData,
  UserEventData,
  SearchEventData,
  DriverEventData,
  TripEventData,
  DocumentEventData,
  ReportEventData,
} from './eventTracking';

// Web Vitals
export {
  initializeWebVitals,
  trackPerformanceTiming,
  observeLongTasks,
  observeResourceTiming,
  getNavigationTiming,
  trackNavigationTiming,
  trackMemoryUsage,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  getWebVitalsSummary,
} from './webVitals';

export type { WebVitalReport, VitalRating, WebVitalsSummary } from './webVitals';

// =============================================================================
// Initialization Helper
// =============================================================================

import { initializeAppInsights } from './appInsights';
import { setupGlobalErrorHandlers } from './errorTracking';
import {
  initializeWebVitals,
  observeLongTasks,
  trackNavigationTiming,
  startPerformanceMonitoring,
} from './webVitals';

export interface TelemetryInitOptions {
  connectionString?: string;
  enableWebVitals?: boolean;
  enableLongTaskObserver?: boolean;
  enablePerformanceMonitoring?: boolean;
  performanceMonitoringInterval?: number;
  samplingPercentage?: number;
}

/**
 * Initialize all telemetry systems
 *
 * This is the main entry point for telemetry initialization.
 * Call this once at application startup (in main.tsx).
 *
 * @param options Configuration options
 * @returns Whether initialization was successful
 */
export function initializeTelemetry(options: TelemetryInitOptions = {}): boolean {
  const {
    connectionString,
    enableWebVitals = true,
    enableLongTaskObserver = true,
    enablePerformanceMonitoring = false,
    performanceMonitoringInterval = 60000,
    samplingPercentage,
  } = options;

  try {
    // Initialize Application Insights
    const ai = initializeAppInsights({
      connectionString: connectionString || import.meta.env.VITE_APPLICATION_INSIGHTS_CONNECTION_STRING,
      samplingPercentage,
    });

    if (!ai) {
      console.warn('[Telemetry] Application Insights not initialized - telemetry disabled');
      return false;
    }

    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Initialize Web Vitals tracking
    if (enableWebVitals) {
      initializeWebVitals();
      trackNavigationTiming();
    }

    // Setup long task observer
    if (enableLongTaskObserver) {
      observeLongTasks();
    }

    // Start periodic performance monitoring (disabled by default)
    if (enablePerformanceMonitoring) {
      startPerformanceMonitoring(performanceMonitoringInterval);
    }

    // Setup page unload handler to flush telemetry
    window.addEventListener('beforeunload', () => {
      ai.flush();
    });

    // Also flush on visibility change (mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        ai.flush();
      }
    });

    console.info('[Telemetry] All telemetry systems initialized successfully');
    return true;
  } catch (error) {
    console.error('[Telemetry] Failed to initialize:', error);
    return false;
  }
}
