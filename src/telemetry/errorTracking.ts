/**
 * Error Tracking Module for Azure Application Insights
 *
 * Provides comprehensive error tracking including:
 * - Unhandled exceptions capture
 * - React error boundary integration
 * - API error logging with context
 * - Network failure capture
 * - Custom error categorization
 */

import {
  getAppInsights,
  trackException,
  trackEvent,
  trackTrace,
  SeverityLevel,
} from './appInsights';
import type { IExceptionTelemetry } from '@microsoft/applicationinsights-web';

// Error categories for better filtering in Application Insights
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

// Error severity mapping
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

/**
 * Setup global error handlers for unhandled exceptions and promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled JavaScript errors
  window.onerror = (message, source, lineno, colno, error) => {
    captureException(error || new Error(String(message)), {
      category: ErrorCategory.UNHANDLED,
      severity: ErrorSeverity.HIGH,
      additionalData: {
        message: String(message),
        source,
        lineno,
        colno,
      },
    });

    // Return false to allow the error to propagate to the console
    return false;
  };

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    captureException(error, {
      category: ErrorCategory.UNHANDLED,
      severity: ErrorSeverity.HIGH,
      additionalData: {
        type: 'unhandled_promise_rejection',
        reason: String(event.reason),
      },
    });
  };

  // Handle resource loading errors (images, scripts, stylesheets)
  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      // Check if this is a resource loading error (not a script error)
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'IMG' ||
          target.tagName === 'SCRIPT' ||
          target.tagName === 'LINK')
      ) {
        const resourceUrl =
          (target as HTMLImageElement).src ||
          (target as HTMLLinkElement).href ||
          'unknown';

        trackResourceLoadError(resourceUrl, target.tagName.toLowerCase());
      }
    },
    true // Use capture phase to catch resource errors
  );

  console.info('[ErrorTracking] Global error handlers installed');
}

/**
 * Capture and track an exception
 */
export function captureException(
  error: Error | unknown,
  context?: Partial<ErrorContext>
): void {
  const ai = getAppInsights();
  const actualError = error instanceof Error ? error : new Error(String(error));

  // Build exception telemetry
  const exceptionTelemetry: IExceptionTelemetry = {
    exception: actualError,
    severityLevel: mapSeverityLevel(context?.severity),
    properties: {
      category: context?.category || ErrorCategory.UNHANDLED,
      severity: context?.severity || ErrorSeverity.MEDIUM,
      component: context?.component || 'unknown',
      action: context?.action || 'unknown',
      url: scrubUrl(context?.url || window.location.href),
      method: context?.method,
      statusCode: context?.statusCode?.toString(),
      requestId: context?.requestId,
      ...sanitizeAdditionalData(context?.additionalData),
    },
  };

  if (ai) {
    trackException(exceptionTelemetry);
  }

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorTracking] Exception captured:', {
      error: actualError,
      context,
    });
  }
}

/**
 * Track React error boundary errors
 * Use this in your ErrorBoundary componentDidCatch
 */
export function trackReactErrorBoundary(
  error: Error,
  errorInfo: React.ErrorInfo,
  componentName?: string
): void {
  captureException(error, {
    category: ErrorCategory.REACT_BOUNDARY,
    severity: ErrorSeverity.HIGH,
    component: componentName || 'ErrorBoundary',
    additionalData: {
      componentStack: errorInfo.componentStack || 'unknown',
      errorBoundaryComponent: componentName,
    },
  });

  // Track as a custom event for easy filtering
  trackEvent({
    name: 'ReactErrorBoundary',
    properties: {
      errorMessage: error.message,
      componentName: componentName || 'unknown',
      hasComponentStack: !!errorInfo.componentStack,
    },
  });
}

/**
 * Track API errors with full context
 */
export function trackApiError(
  error: Error | unknown,
  details: ApiErrorDetails
): void {
  const actualError = error instanceof Error ? error : new Error(String(error));

  // Determine severity based on status code
  let severity = ErrorSeverity.MEDIUM;
  if (details.statusCode >= 500) {
    severity = ErrorSeverity.HIGH;
  } else if (details.statusCode === 401 || details.statusCode === 403) {
    severity = ErrorSeverity.MEDIUM;
  } else if (details.statusCode === 404) {
    severity = ErrorSeverity.LOW;
  }

  // Determine category based on status code
  let category = ErrorCategory.API;
  if (details.statusCode === 401) {
    category = ErrorCategory.AUTHENTICATION;
  } else if (details.statusCode === 403) {
    category = ErrorCategory.PERMISSION;
  } else if (details.statusCode === 408 || details.statusCode === 504) {
    category = ErrorCategory.TIMEOUT;
  }

  captureException(actualError, {
    category,
    severity,
    url: details.url,
    method: details.method,
    statusCode: details.statusCode,
    requestId: details.requestId,
    additionalData: {
      statusText: details.statusText,
      duration: details.duration,
      // Truncate response body to avoid large payloads
      responsePreview: truncateString(
        JSON.stringify(details.responseBody),
        500
      ),
    },
  });

  // Track as API event for metrics
  trackEvent({
    name: 'ApiError',
    properties: {
      endpoint: scrubUrl(details.url),
      method: details.method,
      statusCode: details.statusCode.toString(),
      category,
    },
    measurements: {
      duration: details.duration || 0,
    },
  });
}

/**
 * Track network failures (fetch errors, CORS, etc.)
 */
export function trackNetworkError(
  error: Error | unknown,
  url: string,
  method: string
): void {
  const actualError = error instanceof Error ? error : new Error(String(error));

  captureException(actualError, {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    url,
    method,
    additionalData: {
      errorType: 'network_failure',
      isOnline: navigator.onLine,
      connectionType: getConnectionType(),
    },
  });

  trackEvent({
    name: 'NetworkError',
    properties: {
      endpoint: scrubUrl(url),
      method,
      isOnline: navigator.onLine.toString(),
      errorMessage: actualError.message,
    },
  });
}

/**
 * Track validation errors
 */
export function trackValidationError(
  field: string,
  message: string,
  formName?: string
): void {
  trackTrace({
    message: `Validation error: ${field} - ${message}`,
    severityLevel: SeverityLevel.Warning,
    properties: {
      category: ErrorCategory.VALIDATION,
      field,
      validationMessage: message,
      formName: formName || 'unknown',
    },
  });

  trackEvent({
    name: 'ValidationError',
    properties: {
      field,
      formName: formName || 'unknown',
      // Don't include the actual message in properties to avoid PII
      hasMessage: !!message,
    },
  });
}

/**
 * Track resource load errors
 */
export function trackResourceLoadError(
  resourceUrl: string,
  resourceType: string
): void {
  trackTrace({
    message: `Resource load failed: ${resourceType}`,
    severityLevel: SeverityLevel.Warning,
    properties: {
      category: ErrorCategory.RESOURCE_LOAD,
      resourceType,
      resourceUrl: scrubUrl(resourceUrl),
    },
  });

  trackEvent({
    name: 'ResourceLoadError',
    properties: {
      resourceType,
      urlDomain: extractDomain(resourceUrl),
    },
  });
}

/**
 * Create an error tracking wrapper for async functions
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Partial<ErrorContext>
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, context);
      throw error; // Re-throw to maintain original behavior
    }
  }) as T;
}

/**
 * Create an axios/fetch interceptor for API error tracking
 */
export function createApiErrorInterceptor() {
  return {
    onError: (error: unknown, config: { url: string; method: string }) => {
      if (error instanceof Error) {
        // Check if it's a network error
        if (
          error.message.includes('Network Error') ||
          error.message.includes('fetch')
        ) {
          trackNetworkError(error, config.url, config.method);
        }
      }
    },

    onResponseError: (
      error: unknown,
      response: {
        status: number;
        statusText: string;
        data?: unknown;
        config: {
          url: string;
          method: string;
          headers?: Record<string, string>;
        };
      }
    ) => {
      trackApiError(error, {
        url: response.config.url,
        method: response.config.method,
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: response.data,
        requestId: response.config.headers?.['x-request-id'],
      });
    },
  };
}

// Helper functions

function mapSeverityLevel(severity?: ErrorSeverity): SeverityLevel {
  switch (severity) {
    case ErrorSeverity.LOW:
      return SeverityLevel.Information;
    case ErrorSeverity.MEDIUM:
      return SeverityLevel.Warning;
    case ErrorSeverity.HIGH:
      return SeverityLevel.Error;
    case ErrorSeverity.CRITICAL:
      return SeverityLevel.Critical;
    default:
      return SeverityLevel.Error;
  }
}

function scrubUrl(url: string): string {
  if (!url) return 'unknown';

  try {
    const urlObj = new URL(url, window.location.origin);

    // Remove sensitive query parameters
    const sensitiveParams = [
      'token',
      'access_token',
      'id_token',
      'refresh_token',
      'api_key',
      'apikey',
      'key',
      'secret',
      'password',
      'auth',
    ];

    sensitiveParams.forEach((param) => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    });

    return urlObj.pathname + urlObj.search;
  } catch {
    // If URL parsing fails, return just the pathname
    return url.split('?')[0];
  }
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}

function truncateString(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...[truncated]';
}

function sanitizeAdditionalData(
  data?: Record<string, unknown>
): Record<string, string | number | boolean | undefined> {
  if (!data) return {};

  const sanitized: Record<string, string | number | boolean | undefined> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip potentially sensitive keys
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
    ];
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Convert value to safe type
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = undefined;
    } else {
      sanitized[key] = truncateString(JSON.stringify(value), 200);
    }
  }

  return sanitized;
}

function getConnectionType(): string {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      type?: string;
    };
  };

  if (nav.connection) {
    return nav.connection.effectiveType || nav.connection.type || 'unknown';
  }
  return 'unknown';
}

// Types are already exported inline above
