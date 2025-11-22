/**
 * Azure Application Insights Telemetry Module
 *
 * Provides comprehensive monitoring for the Fleet Management application including:
 * - Page view tracking
 * - AJAX request monitoring
 * - JavaScript exception tracking
 * - Performance metrics collection
 * - Authenticated user tracking
 * - 10% sampling for production
 */

import {
  ApplicationInsights,
  IExceptionTelemetry,
  IPageViewTelemetry,
  ITraceTelemetry,
  IMetricTelemetry,
  IEventTelemetry,
  ITelemetryItem,
  SeverityLevel,
} from '@microsoft/applicationinsights-web';

// Type definitions for telemetry configuration
export interface TelemetryConfig {
  connectionString: string;
  samplingPercentage: number;
  enableAutoPageViewTracking: boolean;
  enableAjaxTracking: boolean;
  enableExceptionTracking: boolean;
  enablePerformanceTracking: boolean;
  maxBatchSize: number;
  maxBatchInterval: number;
}

export interface AuthenticatedUser {
  userId: string;
  accountId?: string;
  email?: string;
  roles?: string[];
}

// Singleton instance
let appInsightsInstance: ApplicationInsights | null = null;
let isInitialized = false;

/**
 * Get default telemetry configuration based on environment
 */
function getDefaultConfig(): TelemetryConfig {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;

  return {
    connectionString: import.meta.env.VITE_APPLICATION_INSIGHTS_CONNECTION_STRING || '',
    // 10% sampling for production, 100% for development
    samplingPercentage: isProduction ? 10 : 100,
    enableAutoPageViewTracking: true,
    enableAjaxTracking: true,
    enableExceptionTracking: true,
    enablePerformanceTracking: true,
    // Batch settings for production efficiency
    maxBatchSize: isProduction ? 250 : 100,
    maxBatchInterval: isProduction ? 15000 : 5000, // ms
  };
}

/**
 * Initialize Azure Application Insights
 * Should be called once at application startup
 */
export function initializeAppInsights(customConfig?: Partial<TelemetryConfig>): ApplicationInsights | null {
  if (isInitialized && appInsightsInstance) {
    console.warn('[AppInsights] Already initialized. Returning existing instance.');
    return appInsightsInstance;
  }

  const config = { ...getDefaultConfig(), ...customConfig };

  // Skip initialization if no connection string is provided
  if (!config.connectionString) {
    console.warn('[AppInsights] No connection string provided. Telemetry disabled.');
    return null;
  }

  try {
    appInsightsInstance = new ApplicationInsights({
      config: {
        connectionString: config.connectionString,

        // Auto-collection configuration
        enableAutoRouteTracking: config.enableAutoPageViewTracking,
        disableAjaxTracking: !config.enableAjaxTracking,
        disableExceptionTracking: !config.enableExceptionTracking,

        // Performance tracking
        enableCorsCorrelation: true,
        correlationHeaderExcludedDomains: ['*.queue.core.windows.net'],

        // Sampling configuration - 10% for production
        samplingPercentage: config.samplingPercentage,

        // Batch configuration for efficient network usage
        maxBatchSizeInBytes: config.maxBatchSize * 1024,
        maxBatchInterval: config.maxBatchInterval,

        // Disable telemetry initializers that might expose PII
        disableTelemetry: false,

        // Automatic dependency tracking (AJAX, fetch)
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,

        // W3C distributed tracing is enabled by default in v2.x+
        // distributedTracingMode is the correct property for tracing config

        // Session configuration
        sessionRenewalMs: 30 * 60 * 1000, // 30 minutes
        sessionExpirationMs: 24 * 60 * 60 * 1000, // 24 hours

        // Cookie settings for better privacy
        cookieCfg: {
          enabled: true,
          domain: undefined, // Use current domain
        },

        // Extensions and plugins
        extensions: [],
        extensionConfig: {},
      },
    });

    // Load the Application Insights module
    appInsightsInstance.loadAppInsights();

    // Add telemetry initializer for custom properties
    appInsightsInstance.addTelemetryInitializer((envelope: ITelemetryItem) => {
      // Add environment tag to all telemetry
      if (envelope.tags) {
        envelope.tags['ai.cloud.role'] = 'fleet-webapp';
        envelope.tags['ai.cloud.roleInstance'] = window.location.hostname;
      }

      // Add custom properties
      if (envelope.data) {
        const baseData = envelope.data as Record<string, unknown>;
        baseData.environment = import.meta.env.MODE || 'production';
        baseData.appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
        baseData.buildId = import.meta.env.VITE_BUILD_ID || 'unknown';
      }

      // Scrub potential PII from URLs
      if (envelope.baseData && typeof envelope.baseData.uri === 'string') {
        envelope.baseData.uri = scrubPiiFromUrl(envelope.baseData.uri);
      }

      return true; // Allow the telemetry item to be sent
    });

    // Track initial page view
    if (config.enableAutoPageViewTracking) {
      appInsightsInstance.trackPageView();
    }

    isInitialized = true;
    console.info('[AppInsights] Initialized successfully with sampling rate:', config.samplingPercentage + '%');

    return appInsightsInstance;
  } catch (error) {
    console.error('[AppInsights] Failed to initialize:', error);
    return null;
  }
}

/**
 * Scrub potential PII from URLs
 */
function scrubPiiFromUrl(url: string): string {
  // Remove email patterns
  let scrubbedUrl = url.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[REDACTED_EMAIL]');

  // Remove UUID/GUID patterns that might be user IDs
  scrubbedUrl = scrubbedUrl.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '[REDACTED_ID]'
  );

  // Remove potential token parameters
  scrubbedUrl = scrubbedUrl.replace(/token=[^&]+/gi, 'token=[REDACTED]');
  scrubbedUrl = scrubbedUrl.replace(/access_token=[^&]+/gi, 'access_token=[REDACTED]');
  scrubbedUrl = scrubbedUrl.replace(/id_token=[^&]+/gi, 'id_token=[REDACTED]');

  return scrubbedUrl;
}

/**
 * Get the Application Insights instance
 */
export function getAppInsights(): ApplicationInsights | null {
  if (!isInitialized) {
    console.warn('[AppInsights] Not initialized. Call initializeAppInsights first.');
    return null;
  }
  return appInsightsInstance;
}

/**
 * Set authenticated user context
 * Call this after user login
 */
export function setAuthenticatedUser(user: AuthenticatedUser): void {
  const ai = getAppInsights();
  if (!ai) return;

  try {
    // Set the authenticated user context
    // Using a hash of the userId for privacy
    const hashedUserId = hashString(user.userId);
    ai.setAuthenticatedUserContext(hashedUserId, user.accountId, true);

    // Track user properties
    ai.context.user.id = hashedUserId;

    // Add custom user properties without PII
    ai.addTelemetryInitializer((envelope: ITelemetryItem) => {
      if (envelope.data) {
        const baseData = envelope.data as Record<string, unknown>;
        baseData.userRoles = user.roles?.join(',') || 'unknown';
        baseData.hasAccount = !!user.accountId;
      }
      return true;
    });

    console.info('[AppInsights] Authenticated user context set');
  } catch (error) {
    console.error('[AppInsights] Failed to set authenticated user:', error);
  }
}

/**
 * Clear authenticated user context
 * Call this on user logout
 */
export function clearAuthenticatedUser(): void {
  const ai = getAppInsights();
  if (!ai) return;

  try {
    ai.clearAuthenticatedUserContext();
    console.info('[AppInsights] Authenticated user context cleared');
  } catch (error) {
    console.error('[AppInsights] Failed to clear authenticated user:', error);
  }
}

/**
 * Simple string hashing for user IDs (privacy-preserving)
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Track a page view manually
 */
export function trackPageView(pageView?: IPageViewTelemetry): void {
  const ai = getAppInsights();
  if (!ai) return;

  ai.trackPageView({
    ...pageView,
    uri: pageView?.uri ? scrubPiiFromUrl(pageView.uri) : undefined,
  });
}

/**
 * Track a custom event
 */
export function trackEvent(event: IEventTelemetry): void {
  const ai = getAppInsights();
  if (!ai) return;

  ai.trackEvent(event);
}

/**
 * Track an exception
 */
export function trackException(exception: IExceptionTelemetry): void {
  const ai = getAppInsights();
  if (!ai) return;

  ai.trackException(exception);
}

/**
 * Track a trace message
 */
export function trackTrace(trace: ITraceTelemetry): void {
  const ai = getAppInsights();
  if (!ai) return;

  ai.trackTrace(trace);
}

/**
 * Track a metric
 */
export function trackMetric(metric: IMetricTelemetry): void {
  const ai = getAppInsights();
  if (!ai) return;

  ai.trackMetric(metric);
}

/**
 * Start a timed operation for performance tracking
 */
export function startOperation(operationName: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    trackMetric({
      name: `Operation_${operationName}`,
      average: duration,
      sampleCount: 1,
    });
  };
}

/**
 * Flush all pending telemetry
 * Useful before page unload
 */
export function flushTelemetry(): void {
  const ai = getAppInsights();
  if (!ai) return;

  ai.flush();
}

/**
 * Check if telemetry is enabled
 */
export function isTelemetryEnabled(): boolean {
  return isInitialized && appInsightsInstance !== null;
}

// Export SeverityLevel for external use
export { SeverityLevel };

// Export types
export type {
  IExceptionTelemetry,
  IPageViewTelemetry,
  ITraceTelemetry,
  IMetricTelemetry,
  IEventTelemetry,
};
