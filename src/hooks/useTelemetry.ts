/**
 * Telemetry Hook
 *
 * React hook for tracking component usage, map interactions, errors,
 * and performance metrics. Privacy-conscious with configurable tracking.
 *
 * Features:
 * - Automatic component lifecycle tracking
 * - Map interaction tracking
 * - Error boundary integration
 * - Performance monitoring
 * - Privacy-safe data collection
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { analytics, trackEvent, trackError, trackPerformance } from '../services/analytics';
import { getTelemetryConfig } from '../config/telemetry';
import { PrivacyManager } from '../utils/privacy';

/**
 * Map interaction types
 */
export enum MapInteractionType {
  ZOOM = 'map_zoom',
  PAN = 'map_pan',
  ROTATE = 'map_rotate',
  MARKER_CLICK = 'marker_click',
  MARKER_HOVER = 'marker_hover',
  POPUP_OPEN = 'popup_open',
  POPUP_CLOSE = 'popup_close',
  LAYER_TOGGLE = 'layer_toggle',
  PROVIDER_CHANGE = 'map_provider_change',
  SEARCH = 'map_search',
  FILTER_APPLY = 'filter_apply',
  ROUTE_CALCULATE = 'route_calculate',
  EXPORT = 'map_export',
  IMPORT = 'map_import',
}

/**
 * Map telemetry data
 */
export interface MapTelemetryData {
  provider?: string;
  zoom?: number;
  center?: [number, number];
  markerCount?: number;
  layerCount?: number;
  filterCount?: number;
  duration?: number;
  [key: string]: any;
}

/**
 * Performance timing
 */
export interface PerformanceTiming {
  start: number;
  componentName?: string;
  operationName?: string;
}

/**
 * Telemetry hook options
 */
export interface UseTelemetryOptions {
  componentName: string;
  trackMount?: boolean;
  trackUnmount?: boolean;
  trackRender?: boolean;
  category?: string;
}

/**
 * Telemetry hook return type
 */
export interface TelemetryHook {
  // Event tracking
  track: (eventName: string, properties?: Record<string, any>) => void;

  // Map-specific tracking
  trackMapInteraction: (type: MapInteractionType, data?: MapTelemetryData) => void;
  trackMapLoaded: (provider: string, loadTime: number, data?: MapTelemetryData) => void;
  trackMapError: (error: Error, context?: Record<string, any>) => void;

  // Performance tracking
  startTiming: (operationName?: string) => PerformanceTiming;
  endTiming: (timing: PerformanceTiming) => void;
  trackMetric: (name: string, value: number, unit?: string) => void;

  // Error tracking
  trackError: (error: Error, context?: Record<string, any>) => void;

  // State
  isEnabled: boolean;
  sessionId: string;
}

/**
 * Main telemetry hook
 */
export function useTelemetry(options: UseTelemetryOptions): TelemetryHook {
  const { componentName, trackMount = true, trackUnmount = true, trackRender = false, category } = options;

  const config = getTelemetryConfig();
  const isEnabled = config.enabled && PrivacyManager.hasConsent('analytics' as any);
  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  const [sessionId] = useState(() => analytics.getSessionId());

  // Track component mount
  useEffect(() => {
    if (!isEnabled || !trackMount) return;

    const mountTime = Date.now() - mountTimeRef.current;

    trackEvent(`${componentName}_mounted`, {
      category: category || 'component_lifecycle',
      mount_time: mountTime,
    });

    // Track component unmount
    return () => {
      if (!isEnabled || !trackUnmount) return;

      const lifetimeMs = Date.now() - mountTimeRef.current;

      trackEvent(`${componentName}_unmounted`, {
        category: category || 'component_lifecycle',
        lifetime_ms: lifetimeMs,
        render_count: renderCountRef.current,
      });
    };
  }, [isEnabled, componentName, trackMount, trackUnmount, category]);

  // Track renders (optional, can be noisy)
  useEffect(() => {
    if (!isEnabled || !trackRender) return;

    renderCountRef.current++;

    if (renderCountRef.current % 10 === 0) {
      // Only track every 10th render to reduce noise
      trackEvent(`${componentName}_render`, {
        category: 'component_lifecycle',
        render_count: renderCountRef.current,
      });
    }
  });

  /**
   * Track custom event
   */
  const track = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      if (!isEnabled) return;

      trackEvent(eventName, {
        ...properties,
        component: componentName,
        category: category || properties?.category,
      });
    },
    [isEnabled, componentName, category]
  );

  /**
   * Track map interaction
   */
  const trackMapInteraction = useCallback(
    (type: MapInteractionType, data?: MapTelemetryData) => {
      if (!isEnabled) return;

      trackEvent(type, {
        ...data,
        component: componentName,
        category: 'map_interaction',
      });
    },
    [isEnabled, componentName]
  );

  /**
   * Track map loaded event
   */
  const trackMapLoaded = useCallback(
    (provider: string, loadTime: number, data?: MapTelemetryData) => {
      if (!isEnabled) return;

      trackEvent('map_loaded', {
        provider,
        load_time: loadTime,
        ...data,
        component: componentName,
        category: 'map_lifecycle',
      });

      // Also track as performance metric
      trackPerformance('map_load_time', loadTime, 'ms', {
        provider,
        component: componentName,
      });
    },
    [isEnabled, componentName]
  );

  /**
   * Track map error
   */
  const trackMapError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      if (!isEnabled) return;

      trackError(error, {
        ...context,
        component: componentName,
        category: 'map_error',
      });
    },
    [isEnabled, componentName]
  );

  /**
   * Start performance timing
   */
  const startTiming = useCallback(
    (operationName?: string): PerformanceTiming => {
      return {
        start: performance.now(),
        componentName,
        operationName,
      };
    },
    [componentName]
  );

  /**
   * End performance timing
   */
  const endTiming = useCallback(
    (timing: PerformanceTiming) => {
      if (!isEnabled) return;

      const duration = performance.now() - timing.start;
      const metricName = timing.operationName || `${componentName}_operation`;

      trackPerformance(metricName, duration, 'ms', {
        component: componentName,
      });
    },
    [isEnabled, componentName]
  );

  /**
   * Track custom metric
   */
  const trackMetric = useCallback(
    (name: string, value: number, unit: string = 'count') => {
      if (!isEnabled) return;

      trackPerformance(name, value, unit, {
        component: componentName,
      });
    },
    [isEnabled, componentName]
  );

  /**
   * Track error wrapper
   */
  const trackErrorWrapper = useCallback(
    (error: Error, context?: Record<string, any>) => {
      if (!isEnabled) return;

      trackError(error, {
        ...context,
        component: componentName,
      });
    },
    [isEnabled, componentName]
  );

  return {
    track,
    trackMapInteraction,
    trackMapLoaded,
    trackMapError,
    startTiming,
    endTiming,
    trackMetric,
    trackError: trackErrorWrapper,
    isEnabled,
    sessionId,
  };
}

/**
 * Hook for tracking map-specific telemetry
 */
export function useMapTelemetry(mapProvider: string) {
  const telemetry = useTelemetry({
    componentName: 'Map',
    category: 'map',
  });

  const trackZoom = useCallback(
    (zoom: number, previousZoom?: number) => {
      telemetry.trackMapInteraction(MapInteractionType.ZOOM, {
        provider: mapProvider,
        zoom,
        previousZoom,
        zoomDelta: previousZoom ? zoom - previousZoom : undefined,
      });
    },
    [telemetry, mapProvider]
  );

  const trackPan = useCallback(
    (center: [number, number], previousCenter?: [number, number]) => {
      telemetry.trackMapInteraction(MapInteractionType.PAN, {
        provider: mapProvider,
        center,
        previousCenter,
      });
    },
    [telemetry, mapProvider]
  );

  const trackMarkerClick = useCallback(
    (markerId: string, markerType?: string, metadata?: Record<string, any>) => {
      telemetry.trackMapInteraction(MapInteractionType.MARKER_CLICK, {
        provider: mapProvider,
        markerId,
        markerType,
        ...metadata,
      });
    },
    [telemetry, mapProvider]
  );

  const trackProviderChange = useCallback(
    (newProvider: string, oldProvider: string) => {
      telemetry.trackMapInteraction(MapInteractionType.PROVIDER_CHANGE, {
        newProvider,
        oldProvider,
      });
    },
    [telemetry]
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number, duration?: number) => {
      telemetry.trackMapInteraction(MapInteractionType.SEARCH, {
        provider: mapProvider,
        queryLength: query.length,
        resultsCount,
        duration,
        // Don't send actual query to protect privacy
      });
    },
    [telemetry, mapProvider]
  );

  const trackFilter = useCallback(
    (filterType: string, filterValue: any, resultsCount?: number) => {
      telemetry.trackMapInteraction(MapInteractionType.FILTER_APPLY, {
        provider: mapProvider,
        filterType,
        filterValue: typeof filterValue === 'object' ? 'complex' : filterValue,
        resultsCount,
      });
    },
    [telemetry, mapProvider]
  );

  const trackRouteCalculation = useCallback(
    (waypoints: number, distance?: number, duration?: number) => {
      telemetry.trackMapInteraction(MapInteractionType.ROUTE_CALCULATE, {
        provider: mapProvider,
        waypointCount: waypoints,
        distance,
        calculationDuration: duration,
      });
    },
    [telemetry, mapProvider]
  );

  const trackExport = useCallback(
    (format: string, itemCount: number) => {
      telemetry.trackMapInteraction(MapInteractionType.EXPORT, {
        provider: mapProvider,
        format,
        itemCount,
      });
    },
    [telemetry, mapProvider]
  );

  const trackImport = useCallback(
    (format: string, itemCount: number, success: boolean) => {
      telemetry.trackMapInteraction(MapInteractionType.IMPORT, {
        provider: mapProvider,
        format,
        itemCount,
        success,
      });
    },
    [telemetry, mapProvider]
  );

  return {
    ...telemetry,
    trackZoom,
    trackPan,
    trackMarkerClick,
    trackProviderChange,
    trackSearch,
    trackFilter,
    trackRouteCalculation,
    trackExport,
    trackImport,
  };
}

/**
 * Hook for tracking performance metrics
 */
export function usePerformanceTelemetry(componentName: string) {
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  const recordMetric = useCallback((name: string, value: number) => {
    setMetrics(prev => ({ ...prev, [name]: value }));
    trackPerformance(`${componentName}_${name}`, value, 'ms');
  }, [componentName]);

  const measureAsync = useCallback(
    async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
      const start = performance.now();
      try {
        const result = await fn();
        recordMetric(name, performance.now() - start);
        return result;
      } catch (error) {
        recordMetric(`${name}_error`, performance.now() - start);
        throw error;
      }
    },
    [recordMetric]
  );

  const measureSync = useCallback(
    <T,>(name: string, fn: () => T): T => {
      const start = performance.now();
      try {
        const result = fn();
        recordMetric(name, performance.now() - start);
        return result;
      } catch (error) {
        recordMetric(`${name}_error`, performance.now() - start);
        throw error;
      }
    },
    [recordMetric]
  );

  return {
    metrics,
    recordMetric,
    measureAsync,
    measureSync,
  };
}

/**
 * Hook for error boundary telemetry
 */
export function useErrorTelemetry(componentName: string) {
  const handleError = useCallback(
    (error: Error, errorInfo?: any) => {
      trackError(error, {
        component: componentName,
        errorInfo: errorInfo?.componentStack,
        category: 'error_boundary',
      });
    },
    [componentName]
  );

  return { handleError };
}

export default useTelemetry;
