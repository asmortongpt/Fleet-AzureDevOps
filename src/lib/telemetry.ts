import { ReactPlugin } from '@microsoft/applicationinsights-react-js'
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

import logger from '@/utils/logger';
/**
 * Telemetry service for frontend Application Insights
 */
class TelemetryService {
  private appInsights: ApplicationInsights | null = null
  private reactPlugin: ReactPlugin | null = null
  private isInitialized = false

  /**
   * Initialize Application Insights for the browser
   */
  initialize(): ReactPlugin | null {
    const connectionString = import.meta.env.VITE_APPLICATION_INSIGHTS_CONNECTION_STRING ||
                            import.meta.env.VITE_APPLICATIONINSIGHTS_CONNECTION_STRING

    if (!connectionString) {
      logger.warn('⚠️ Application Insights connection string not found. Frontend telemetry disabled.')
      logger.warn('Set VITE_APPLICATION_INSIGHTS_CONNECTION_STRING in your .env file')
      return null
    }

    try {
      // Create React plugin
      this.reactPlugin = new ReactPlugin()

      // Initialize Application Insights
      this.appInsights = new ApplicationInsights({
        config: {
          connectionString,
          enableAutoRouteTracking: true,
          enableRequestHeaderTracking: true,
          enableResponseHeaderTracking: true,
          enableAjaxPerfTracking: true,
          enableAjaxErrorStatusText: true,
          enableUnhandledPromiseRejectionTracking: true,
          autoTrackPageVisitTime: true,
          enableCorsCorrelation: true,
          correlationHeaderExcludedDomains: ['127.0.0.1', 'localhost'],
          disableTelemetry: false,
          verboseLogging: import.meta.env.DEV,
          diagnosticLogInterval: import.meta.env.DEV ? 10000 : 0,
          samplingPercentage: 100,
          disableCookiesUsage: false,
          cookieDomain: window.location.hostname,
          extensions: [this.reactPlugin],
          extensionConfig: {
            [this.reactPlugin.identifier]: {}
          }
        }
      })

      // Load Application Insights
      this.appInsights.loadAppInsights()

      // Set authenticated user context if available
      const userId = this.getUserId()
      if (userId) {
        this.appInsights.setAuthenticatedUserContext(userId, undefined, true)
      }

      // Add telemetry initializer to filter sensitive data
      this.appInsights.addTelemetryInitializer(this.telemetryInitializer)

      // Track initial page view
      this.trackPageView(window.location.pathname)

      this.isInitialized = true
      logger.debug('✅ Frontend Application Insights initialized')

      // Track app startup
      this.trackEvent('FrontendStartup', {
        environment: import.meta.env.MODE,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        buildId: import.meta.env.VITE_BUILD_ID || 'local',
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      })

      return this.reactPlugin
    } catch (error) {
      logger.error('❌ Failed to initialize frontend Application Insights:', error)
      return null
    }
  }

  /**
   * Telemetry initializer to filter sensitive data
   */
  private telemetryInitializer = (envelope: any): boolean => {
    // Filter sensitive data from URLs
    if (envelope.baseData?.uri) {
      envelope.baseData.uri = this.maskSensitiveUrl(envelope.baseData.uri)
    }

    if (envelope.baseData?.refUri) {
      envelope.baseData.refUri = this.maskSensitiveUrl(envelope.baseData.refUri)
    }

    // Add custom properties
    envelope.baseData = envelope.baseData || {}
    envelope.baseData.properties = envelope.baseData.properties || {}
    envelope.baseData.properties['app.version'] = import.meta.env.VITE_APP_VERSION || '1.0.0'
    envelope.baseData.properties['app.environment'] = import.meta.env.MODE

    // Remove sensitive headers
    if (envelope.baseData?.properties) {
      delete envelope.baseData.properties['authorization']
      delete envelope.baseData.properties['cookie']
      delete envelope.baseData.properties['x-csrf-token']
    }

    return true
  }

  /**
   * Mask sensitive parts of URLs
   */
  private maskSensitiveUrl(url: string): string {
    if (!url) return url

    // Mask tokens
    url = url.replace(/token=[^&]+/gi, 'token=***')
    // Mask API keys
    url = url.replace(/key=[^&]+/gi, 'key=***')
    // Mask user IDs in paths
    url = url.replace(/\/users\/[^\/]+/gi, '/users/***')
    // Mask email addresses
    url = url.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***')

    return url
  }

  /**
   * Get user ID from local storage or session
   */
  private getUserId(): string | null {
    try {
      // Try to get from local storage
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        return userData.id || userData.email || null
      }

      // Try to get from session storage
      const session = sessionStorage.getItem('user')
      if (session) {
        const sessionData = JSON.parse(session)
        return sessionData.id || sessionData.email || null
      }
    } catch {
      // Ignore parse errors
    }
    return null
  }

  /**
   * Track page views
   */
  trackPageView(name?: string, properties?: { [key: string]: any }): void {
    if (!this.isInitialized || !this.appInsights) return

    this.appInsights.trackPageView({
      name: name || window.location.pathname,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Track user interactions
   */
  trackEvent(name: string, properties?: { [key: string]: any }): void {
    if (!this.isInitialized || !this.appInsights) return

    this.appInsights.trackEvent({
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userId: this.getUserId()
      }
    })
  }

  /**
   * Track exceptions and errors
   */
  trackException(error: Error, severityLevel?: number, properties?: { [key: string]: any }): void {
    if (!this.isInitialized || !this.appInsights) return

    this.appInsights.trackException({
      exception: error,
      severityLevel: severityLevel || 3, // Error level
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userId: this.getUserId(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    })
  }

  /**
   * Track custom metrics
   */
  trackMetric(name: string, value: number, properties?: { [key: string]: any }): void {
    if (!this.isInitialized || !this.appInsights) return

    this.appInsights.trackMetric({
      name,
      average: value,
      sampleCount: 1,
      min: value,
      max: value,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Track button clicks
   */
  trackButtonClick(buttonName: string, properties?: { [key: string]: any }): void {
    this.trackEvent('ButtonClick', {
      buttonName,
      ...properties
    })
  }

  /**
   * Track form submissions
   */
  trackFormSubmission(formName: string, success: boolean, properties?: { [key: string]: any }): void {
    this.trackEvent('FormSubmission', {
      formName,
      success,
      ...properties
    })
  }

  /**
   * Track search operations
   */
  trackSearch(searchTerm: string, resultsCount: number, properties?: { [key: string]: any }): void {
    this.trackEvent('Search', {
      searchTerm: searchTerm.substring(0, 100), // Limit search term length
      resultsCount,
      hasResults: resultsCount > 0,
      ...properties
    })
  }

  /**
   * Track filter applications
   */
  trackFilterApplied(filterType: string, filterValue: any, properties?: { [key: string]: any }): void {
    this.trackEvent('FilterApplied', {
      filterType,
      filterValue: typeof filterValue === 'object' ? JSON.stringify(filterValue) : filterValue,
      ...properties
    })
  }

  /**
   * Track vehicle selection
   */
  trackVehicleSelected(vehicleId: string, properties?: { [key: string]: any }): void {
    this.trackEvent('VehicleSelected', {
      vehicleId,
      ...properties
    })
  }

  /**
   * Track API calls
   */
  trackApiCall(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.trackEvent('APICall', {
      endpoint,
      method,
      statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 400
    })

    // Also track as metric
    this.trackMetric('API_Response_Time', duration, {
      endpoint,
      method,
      statusCode: statusCode.toString()
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformance(): void {
    if (!this.isInitialized || !window.performance) return

    // Get navigation timing
    const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (perfData) {
      // Track page load time
      const pageLoadTime = perfData.loadEventEnd - perfData.fetchStart
      this.trackMetric('PageLoadTime', pageLoadTime, {
        url: window.location.pathname
      })

      // Track DOM ready time
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.fetchStart
      this.trackMetric('DOMReadyTime', domReadyTime, {
        url: window.location.pathname
      })

      // Track time to first byte
      const ttfb = perfData.responseStart - perfData.fetchStart
      this.trackMetric('TimeToFirstByte', ttfb, {
        url: window.location.pathname
      })
    }

    // Track memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.trackMetric('JSHeapUsed', Math.round(memory.usedJSHeapSize / 1048576), { // MB
        unit: 'MB'
      })
    }
  }

  /**
   * Set authenticated user context
   */
  setAuthenticatedUser(userId: string, accountId?: string): void {
    if (!this.isInitialized || !this.appInsights) return

    this.appInsights.setAuthenticatedUserContext(userId, accountId, true)
  }

  /**
   * Clear authenticated user context
   */
  clearAuthenticatedUser(): void {
    if (!this.isInitialized || !this.appInsights) return

    this.appInsights.clearAuthenticatedUserContext()
  }

  /**
   * Flush telemetry data
   */
  flush(): void {
    if (!this.isInitialized || !this.appInsights) return

    this.appInsights.flush()
  }

  /**
   * Get the React plugin for use with React components
   */
  getReactPlugin(): ReactPlugin | null {
    return this.reactPlugin
  }

  /**
   * Check if telemetry is active
   */
  isActive(): boolean {
    return this.isInitialized
  }
}

// Create singleton instance
const telemetryService = new TelemetryService()

// Export service
export { telemetryService }
export default telemetryService