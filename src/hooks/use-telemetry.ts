/**
 * Use Telemetry Hook
 * Provides easy access to telemetry tracking throughout the application
 */

import { useCallback, useEffect } from 'react'

import telemetryService from '@/lib/telemetry'

interface TelemetryHook {
  trackEvent: (name: string, properties?: Record<string, any>) => void
  trackPageView: (name?: string, properties?: Record<string, any>) => void
  trackException: (error: Error, severityLevel?: number, properties?: Record<string, any>) => void
  trackMetric: (name: string, value: number, properties?: Record<string, any>) => void
  trackButtonClick: (buttonName: string, properties?: Record<string, any>) => void
  trackFormSubmission: (formName: string, success: boolean, properties?: Record<string, any>) => void
  trackSearch: (searchTerm: string, resultsCount: number, properties?: Record<string, any>) => void
  trackFilterApplied: (filterType: string, filterValue: any, properties?: Record<string, any>) => void
  trackVehicleSelected: (vehicleId: string, properties?: Record<string, any>) => void
  trackApiCall: (endpoint: string, method: string, statusCode: number, duration: number) => void
  trackPerformance: () => void
  setUser: (userId: string, accountId?: string) => void
  clearUser: () => void
  isActive: boolean
}

interface WebVitalsMetric {
  id: string
  value: number
}

/**
 * Hook to track telemetry events throughout the application
 */
export function useTelemetry(): TelemetryHook {
  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    telemetryService.trackEvent(name, properties)
  }, [])

  const trackPageView = useCallback((name?: string, properties?: Record<string, any>) => {
    telemetryService.trackPageView(name, properties)
  }, [])

  const trackException = useCallback((error: Error, severityLevel?: number, properties?: Record<string, any>) => {
    telemetryService.trackException(error, severityLevel, properties)
  }, [])

  const trackMetric = useCallback((name: string, value: number, properties?: Record<string, any>) => {
    telemetryService.trackMetric(name, value, properties)
  }, [])

  const trackButtonClick = useCallback((buttonName: string, properties?: Record<string, any>) => {
    telemetryService.trackButtonClick(buttonName, properties)
  }, [])

  const trackFormSubmission = useCallback((formName: string, success: boolean, properties?: Record<string, any>) => {
    telemetryService.trackFormSubmission(formName, success, properties)
  }, [])

  const trackSearch = useCallback((searchTerm: string, resultsCount: number, properties?: Record<string, any>) => {
    telemetryService.trackSearch(searchTerm, resultsCount, properties)
  }, [])

  const trackFilterApplied = useCallback((filterType: string, filterValue: any, properties?: Record<string, any>) => {
    telemetryService.trackFilterApplied(filterType, filterValue, properties)
  }, [])

  const trackVehicleSelected = useCallback((vehicleId: string, properties?: Record<string, any>) => {
    telemetryService.trackVehicleSelected(vehicleId, properties)
  }, [])

  const trackApiCall = useCallback((endpoint: string, method: string, statusCode: number, duration: number) => {
    telemetryService.trackApiCall(endpoint, method, statusCode, duration)
  }, [])

  const trackPerformance = useCallback(() => {
    telemetryService.trackPerformance()
  }, [])

  const setUser = useCallback((userId: string, accountId?: string) => {
    telemetryService.setAuthenticatedUser(userId, accountId)
  }, [])

  const clearUser = useCallback(() => {
    telemetryService.clearAuthenticatedUser()
  }, [])

  // Track performance metrics when hook is first used
  useEffect(() => {
    // Track Web Vitals
    if (typeof window !== 'undefined') {
      // Import web-vitals dynamically if available
      import('web-vitals')
        .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS?.((metric: WebVitalsMetric) => trackMetric('CLS', metric.value, { id: metric.id }));
          getFID?.((metric: WebVitalsMetric) => trackMetric('FID', metric.value, { id: metric.id }));
          getFCP?.((metric: WebVitalsMetric) => trackMetric('FCP', metric.value, { id: metric.id }));
          getLCP?.((metric: WebVitalsMetric) => trackMetric('LCP', metric.value, { id: metric.id }));
          getTTFB?.((metric: WebVitalsMetric) => trackMetric('TTFB', metric.value, { id: metric.id }));
        })
        .catch(() => {
          // web-vitals not available, use basic performance tracking
          trackPerformance()
        })
    } else {
      trackPerformance()
    }
  }, [trackMetric, trackPerformance])

  return {
    trackEvent,
    trackPageView,
    trackException,
    trackMetric,
    trackButtonClick,
    trackFormSubmission,
    trackSearch,
    trackFilterApplied,
    trackVehicleSelected,
    trackApiCall,
    trackPerformance,
    setUser,
    clearUser,
    isActive: telemetryService.isActive()
  }
}

/**
 * Hook to track component mount/unmount
 */
export function useComponentTracking(componentName: string, properties?: Record<string, any>) {
  const { trackEvent } = useTelemetry()

  useEffect(() => {
    const startTime = performance.now()
    trackEvent('ComponentMounted', {
      component: componentName,
      ...properties
    })

    return () => {
      const duration = performance.now() - startTime
      trackEvent('ComponentUnmounted', {
        component: componentName,
        duration: Math.round(duration),
        ...properties
      })
    }
  }, [componentName, trackEvent, properties])
}

/**
 * Hook to track user interactions with a component
 */
export function useInteractionTracking(componentName: string) {
  const { trackEvent } = useTelemetry()

  const trackClick = useCallback((elementName: string, properties?: Record<string, any>) => {
    trackEvent('UserClick', {
      component: componentName,
      element: elementName,
      ...properties
    })
  }, [componentName, trackEvent])

  const trackHover = useCallback((elementName: string, properties?: Record<string, any>) => {
    trackEvent('UserHover', {
      component: componentName,
      element: elementName,
      ...properties
    })
  }, [componentName, trackEvent])

  const trackFocus = useCallback((elementName: string, properties?: Record<string, any>) => {
    trackEvent('UserFocus', {
      component: componentName,
      element: elementName,
      ...properties
    })
  }, [componentName, trackEvent])

  return {
    trackClick,
    trackHover,
    trackFocus
  }
}

/**
 * Hook to track API calls with automatic timing
 */
export function useApiTracking() {
  const { trackApiCall } = useTelemetry()

  const trackCall = useCallback(async <T,>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()
    try {
      const result = await apiCall()
      const duration = performance.now() - startTime
      trackApiCall(endpoint, method, 200, duration)
      return result
    } catch (error: any) {
      const duration = performance.now() - startTime
      const statusCode = error?.response?.status || 500
      trackApiCall(endpoint, method, statusCode, duration)
      throw error
    }
  }, [trackApiCall])

  return { trackCall }
}