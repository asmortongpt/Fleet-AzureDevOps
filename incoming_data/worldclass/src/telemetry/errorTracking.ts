/**
 * Error Tracking Module - STUB IMPLEMENTATION
 *
 * DISABLED: ApplicationInsights SDK is incompatible with React 19
 * Error: "Cannot set properties of undefined (setting 'Activity')"
 *
 * This file re-exports stubs from the main index to maintain backwards compatibility.
 */

export {
  ErrorCategory,
  ErrorSeverity,
  setupGlobalErrorHandlers,
  captureException,
  trackReactErrorBoundary,
  trackApiError,
  trackNetworkError,
  trackValidationError,
  trackResourceLoadError,
  withErrorTracking,
  createApiErrorInterceptor,
} from './index';

export type {
  ErrorContext,
  ApiErrorDetails,
} from './index';
