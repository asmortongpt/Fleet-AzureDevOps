import * as appInsights from 'applicationinsights'

/**
 * Custom metrics interface for Application Insights
 */
export interface CustomMetrics {
  trackAPICall(endpoint: string, duration: number, statusCode: number): void
  trackEmulatorUpdate(emulatorName: string, recordCount: number): void
  trackError(error: Error, context?: any): void
  trackEvent(name: string, properties?: any): void
}

/**
 * Application Insights monitoring service
 */
class ApplicationInsightsService implements CustomMetrics {
  private client: typeof appInsights | null = null
  private isInitialized = false

  /**
   * Initialize Application Insights
   */
  initialize(): void {
    const connectionString = process.env.APPLICATION_INSIGHTS_CONNECTION_STRING ||
                             process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

    if (!connectionString) {
      console.warn('⚠️ Application Insights connection string not found. Telemetry will be disabled.')
      console.warn('To enable telemetry, set APPLICATION_INSIGHTS_CONNECTION_STRING in your .env file')
      return
    }

    try {
      // Setup Application Insights
      appInsights.setup(connectionString)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, false)
        .setUseDiskRetryCaching(true)
        .setAutoCollectPreAggregatedMetrics(true)
        .setSendLiveMetrics(true)
        .setAutoCollectHeartbeat(true)
        .setInternalLogging(false, true)

      // Configure telemetry processor to filter sensitive data
      appInsights.defaultClient.addTelemetryProcessor(this.telemetryProcessor)

      // Start collecting telemetry
      appInsights.start()

      this.client = appInsights
      this.isInitialized = true

      console.log('✅ Application Insights initialized successfully')

      // Track startup event
      this.trackEvent('ServerStarted', {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001
      })
    } catch (error) {
      console.error('❌ Failed to initialize Application Insights:', error)
    }
  }

  /**
   * Telemetry processor to filter sensitive data
   */
  private telemetryProcessor = (envelope: appInsights.Contracts.Envelope): boolean => {
    // Filter out sensitive headers
    if (envelope.data && 'baseData' in envelope.data) {
      const baseData = envelope.data.baseData as any

      // Remove sensitive headers
      if (baseData?.properties?.requestHeaders) {
        delete baseData.properties.requestHeaders['authorization']
        delete baseData.properties.requestHeaders['cookie']
        delete baseData.properties.requestHeaders['x-csrf-token']
      }

      // Remove sensitive response headers
      if (baseData?.properties?.responseHeaders) {
        delete baseData.properties.responseHeaders['set-cookie']
      }

      // Mask sensitive URLs
      if (baseData?.url) {
        baseData.url = this.maskSensitiveUrl(baseData.url)
      }

      // Remove sensitive data from exceptions
      if (baseData?.exceptions) {
        baseData.exceptions.forEach((exception: any) => {
          if (exception.parsedStack) {
            // Keep stack traces but remove local file paths
            exception.parsedStack = exception.parsedStack.map((frame: any) => ({
              ...frame,
              fileName: frame.fileName?.replace(/.*\/src\//, 'src/')
            }))
          }
        })
      }
    }

    return true
  }

  /**
   * Mask sensitive parts of URLs
   */
  private maskSensitiveUrl(url: string): string {
    // Mask JWT tokens in URLs
    url = url.replace(/token=[^&]+/gi, 'token=***')
    // Mask API keys
    url = url.replace(/key=[^&]+/gi, 'key=***')
    // Mask passwords
    url = url.replace(/password=[^&]+/gi, 'password=***')

    return url
  }

  /**
   * Track API call metrics
   */
  trackAPICall(endpoint: string, duration: number, statusCode: number): void {
    if (!this.isInitialized) return

    const success = statusCode >= 200 && statusCode < 400

    this.client?.defaultClient.trackMetric({
      name: 'API_Response_Time',
      value: duration,
      properties: {
        endpoint,
        statusCode: statusCode.toString(),
        success: success.toString()
      }
    })

    // Track error rate
    if (!success) {
      this.client?.defaultClient.trackMetric({
        name: 'API_Error_Rate',
        value: 1,
        properties: {
          endpoint,
          statusCode: statusCode.toString()
        }
      })
    }

    // Track specific endpoint performance
    this.client?.defaultClient.trackMetric({
      name: `API_${endpoint.replace(/\//g, '_')}_Duration`,
      value: duration
    })
  }

  /**
   * Track emulator update metrics
   */
  trackEmulatorUpdate(emulatorName: string, recordCount: number): void {
    if (!this.isInitialized) return

    this.client?.defaultClient.trackEvent({
      name: 'EmulatorUpdate',
      properties: {
        emulatorName,
        recordCount: recordCount.toString(),
        timestamp: new Date().toISOString()
      }
    })

    this.client?.defaultClient.trackMetric({
      name: `Emulator_${emulatorName}_RecordCount`,
      value: recordCount
    })
  }

  /**
   * Track errors with context
   */
  trackError(error: Error, context?: any): void {
    if (!this.isInitialized) return

    const telemetryError = {
      exception: error,
      properties: {
        ...context,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      }
    }

    this.client?.defaultClient.trackException(telemetryError)

    // Also track as an event for better visibility
    this.client?.defaultClient.trackEvent({
      name: 'ApplicationError',
      properties: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        ...context
      }
    })
  }

  /**
   * Track custom events
   */
  trackEvent(name: string, properties?: any): void {
    if (!this.isInitialized) return

    this.client?.defaultClient.trackEvent({
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    })
  }

  /**
   * Track dependencies (external service calls)
   */
  trackDependency(name: string, data: string, duration: number, success: boolean, resultCode?: number): void {
    if (!this.isInitialized) return

    this.client?.defaultClient.trackDependency({
      target: name,
      name: data,
      data,
      duration,
      resultCode: resultCode || (success ? 200 : 500),
      success,
      dependencyTypeName: 'HTTP'
    })
  }

  /**
   * Track page views (for server-side rendered pages if any)
   */
  trackPageView(name: string, url: string, properties?: any): void {
    if (!this.isInitialized) return

    this.client?.defaultClient.trackPageView({
      name,
      url,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Flush telemetry data
   */
  async flush(): Promise<void> {
    if (!this.isInitialized) return

    return new Promise((resolve) => {
      this.client?.defaultClient.flush({
        callback: () => resolve()
      })
    })
  }

  /**
   * Get telemetry client for advanced usage
   */
  getClient(): typeof appInsights | null {
    return this.client
  }

  /**
   * Check if Application Insights is initialized
   */
  isActive(): boolean {
    return this.isInitialized
  }
}

// Create singleton instance
const telemetryService = new ApplicationInsightsService()

// Export service and interface
export { telemetryService, ApplicationInsightsService }
export default telemetryService