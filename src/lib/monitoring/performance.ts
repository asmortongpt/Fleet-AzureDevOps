import { ApplicationInsights } from '@microsoft/applicationinsights-web'

let appInsights: ApplicationInsights | null = null

export function initializeMonitoring() {
  if (typeof window === 'undefined' || appInsights) return

  const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING
  if (!connectionString) {
    console.warn('Application Insights connection string not found')
    return
  }

  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      disableAjaxTracking: false,
      autoTrackPageVisitTime: true,
      enableCorsCorrelation: true,
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true
    }
  })

  appInsights.loadAppInsights()
  appInsights.trackPageView()
  
  // Expose for error boundary
  ;(window as any).appInsights = appInsights
}

export function trackEvent(name: string, properties?: Record<string, any>) {
  appInsights?.trackEvent({ name }, properties)
}

export function trackMetric(name: string, average: number, properties?: Record<string, any>) {
  appInsights?.trackMetric({ name, average }, properties)
}

export function trackException(error: Error, properties?: Record<string, any>) {
  appInsights?.trackException({ exception: error }, properties)
}

export function trackPerformance(name: string, duration: number) {
  appInsights?.trackMetric({ name: `performance.${name}`, average: duration })
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return

  // Track FCP, LCP, FID, CLS
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const metricName = entry.name
      const value = entry.startTime
      
      trackMetric(`webvital.${metricName}`, value)
    }
  })

  observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
}
