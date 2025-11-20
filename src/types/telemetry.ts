/**
 * Telemetry Type Definitions
 *
 * Centralized type definitions for the telemetry system.
 * Import from here for type safety across the application.
 */

// Import and re-export from config
import { TelemetryLevel, AnalyticsProvider } from '../config/telemetry';
export {
  TelemetryLevel,
  AnalyticsProvider,
  type TelemetryConfig,
  EventLevelMapping,
} from '../config/telemetry';

// Import and re-export from privacy utils
import { PrivacyCategory } from '../utils/privacy';
export {
  ConsentStatus,
  PrivacyCategory,
  type ConsentRecord,
} from '../utils/privacy';

// Re-export from analytics service
export {
  type AnalyticsEvent,
  type UserProperties,
  type SessionData,
  type PerformanceMetric,
  type ErrorEvent,
} from '../services/analytics';

// Re-export from error reporting
export {
  ErrorSeverity,
  type ErrorContext,
  type Breadcrumb,
  type UserFeedback,
} from '../services/errorReporting';

// Re-export from telemetry hook
export {
  MapInteractionType,
  type MapTelemetryData,
  type PerformanceTiming,
  type UseTelemetryOptions,
  type TelemetryHook,
} from '../hooks/useTelemetry';

/**
 * Telemetry event categories
 */
export enum TelemetryCategory {
  NAVIGATION = 'navigation',
  USER_ACTION = 'user_action',
  MAP_INTERACTION = 'map_interaction',
  DATA_OPERATION = 'data_operation',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  LIFECYCLE = 'lifecycle',
}

/**
 * Map event types for easier typing
 */
export type MapEventType =
  | 'map_loaded'
  | 'map_error'
  | 'map_zoom'
  | 'map_pan'
  | 'map_rotate'
  | 'marker_click'
  | 'marker_hover'
  | 'popup_open'
  | 'popup_close'
  | 'layer_toggle'
  | 'map_provider_change'
  | 'map_search'
  | 'filter_apply'
  | 'route_calculate'
  | 'map_export'
  | 'map_import';

/**
 * Common event properties interface
 */
export interface BaseEventProperties {
  component?: string;
  category?: string;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * Map provider types
 */
export type MapProvider = 'mapbox' | 'google' | 'arcgis' | 'leaflet';

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'geojson' | 'csv' | 'kml' | 'shapefile';

/**
 * Import format types
 */
export type ImportFormat = 'json' | 'geojson' | 'csv' | 'kml';

/**
 * Telemetry status
 */
export interface TelemetryStatus {
  enabled: boolean;
  level: string;
  providers: string[];
  hasConsent: boolean;
  sessionId: string;
  eventsTracked: number;
}

/**
 * Performance metrics summary
 */
export interface PerformanceSummary {
  avgLoadTime: number;
  avgRenderTime: number;
  avgApiResponseTime: number;
  slowOperations: Array<{
    name: string;
    duration: number;
    timestamp: number;
  }>;
}

/**
 * Error summary
 */
export interface ErrorSummary {
  totalErrors: number;
  criticalErrors: number;
  errorRate: number;
  topErrors: Array<{
    name: string;
    count: number;
    lastOccurrence: number;
  }>;
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  totalEvents: number;
  uniqueSessions: number;
  avgSessionDuration: number;
  topEvents: Array<{
    name: string;
    count: number;
  }>;
  performance: PerformanceSummary;
  errors: ErrorSummary;
}

/**
 * Telemetry configuration update
 */
export interface TelemetryConfigUpdate {
  enabled?: boolean;
  level?: TelemetryLevel;
  providers?: AnalyticsProvider[];
  eventSamplingRate?: number;
  errorSamplingRate?: number;
  performanceSamplingRate?: number;
}

/**
 * User preferences for telemetry
 */
export interface TelemetryPreferences {
  enabled: boolean;
  categories: Record<PrivacyCategory, boolean>;
  level?: TelemetryLevel;
  consentGivenAt?: number;
  lastUpdated?: number;
}

export default {};
