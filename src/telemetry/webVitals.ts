/**
 * Web Vitals Module - STUB IMPLEMENTATION
 *
 * DISABLED: ApplicationInsights SDK is incompatible with React 19
 * Error: "Cannot set properties of undefined (setting 'Activity')"
 *
 * This file re-exports stubs from the main index to maintain backwards compatibility.
 */

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
} from './index';

export type {
  WebVitalReport,
  VitalRating,
  WebVitalsSummary,
} from './index';
