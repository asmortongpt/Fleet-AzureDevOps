/**
 * Application Insights Telemetry Configuration (BACKEND-12)
 *
 * Centralized telemetry configuration for monitoring and observability.
 * Automatically collects:
 * - HTTP requests and responses
 * - Dependencies (database, external APIs)
 * - Exceptions and errors
 * - Performance metrics
 * - Custom events and metrics
 */

import * as appInsights from 'applicationinsights'

// Track if telemetry is initialized
let isInitialized = false

/**
 * Initialize Application Insights with comprehensive monitoring
 */
export function initializeTelemetry(): void {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
                           process.env.APPLICATION_INSIGHTS_CONNECTION_STRING

  if (!connectionString) {
    console.warn('⚠️  Application Insights connection string not found')
    console.warn('   Set APPLICATIONINSIGHTS_CONNECTION_STRING to enable telemetry')
    console.warn('   Monitoring features will be disabled')
    return
  }

  try {
    // Configure Application Insights
    appInsights.setup(connectionString)
      // Correlation
      .setAutoDependencyCorrelation(true)

      // Auto-collection features
      .setAutoCollectRequests(true)          // HTTP requests
      .setAutoCollectPerformance(true, true) // Performance counters and native metrics
      .setAutoCollectExceptions(true)        // Unhandled exceptions
      .setAutoCollectDependencies(true)      // External dependencies (DB, HTTP)
      .setAutoCollectConsole(true, true)     // Console logs
      .setAutoCollectPreAggregatedMetrics(true) // Pre-aggregated metrics

      // Advanced features
      .setUseDiskRetryCaching(true)          // Retry on network failures
      .setSendLiveMetrics(true)              // Live Metrics Stream
      .setAutoCollectHeartbeat(true)         // Periodic heartbeat

      // Internal logging (errors only in production)
      .setInternalLogging(process.env.NODE_ENV !== 'production', true)

    // Configure sampling (reduce telemetry volume in production)
    if (process.env.NODE_ENV === 'production') {
      appInsights.defaultClient.config.samplingPercentage = 50 // Sample 50% of telemetry
    }

    // Add custom telemetry processors
    appInsights.defaultClient.addTelemetryProcessor(filterSensitiveData)
    appInsights.defaultClient.addTelemetryProcessor(enrichTelemetry)

    // Start collecting telemetry
    appInsights.start()

    isInitialized = true

    console.log('✅ Application Insights telemetry initialized')
    console.log(`   Connection String: ${connectionString.substring(0, 50)}...`)
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`   Live Metrics: enabled`)
    console.log(`   Sampling: ${process.env.NODE_ENV === 'production' ? '50%' : '100%'}`)

  } catch (error) {
    console.error('❌ Failed to initialize Application Insights:', error)
  }
}

/**
 * Telemetry processor to filter sensitive data
 */
function filterSensitiveData(envelope: appInsights.Contracts.Envelope): boolean {
  if (envelope.data && 'baseData' in envelope.data) {
    const baseData = envelope.data.baseData as any

    // Remove sensitive headers from requests
    if (baseData?.properties?.requestHeaders) {
      delete baseData.properties.requestHeaders['authorization']
      delete baseData.properties.requestHeaders['cookie']
      delete baseData.properties.requestHeaders['x-csrf-token']
      delete baseData.properties.requestHeaders['x-api-key']
    }

    // Remove sensitive headers from responses
    if (baseData?.properties?.responseHeaders) {
      delete baseData.properties.responseHeaders['set-cookie']
      delete baseData.properties.responseHeaders['authorization']
    }

    // Mask sensitive URL parameters
    if (baseData?.url) {
      baseData.url = maskSensitiveUrl(baseData.url)
    }

    if (baseData?.name) {
      baseData.name = maskSensitiveUrl(baseData.name)
    }

    // Remove sensitive data from custom properties
    if (baseData?.properties) {
      delete baseData.properties.password
      delete baseData.properties.token
      delete baseData.properties.apiKey
      delete baseData.properties.secret
    }

    // Clean stack traces in exceptions
    if (baseData?.exceptions) {
      baseData.exceptions.forEach((exception: any) => {
        if (exception.parsedStack) {
          // Remove absolute file paths, keep relative paths only
          exception.parsedStack = exception.parsedStack.map((frame: any) => ({
            ...frame,
            fileName: frame.fileName?.replace(/.*\/(api|src)\//, '$1/')
          }))
        }
      })
    }
  }

  return true // Always send telemetry
}

/**
 * Telemetry processor to enrich data with custom context
 */
function enrichTelemetry(envelope: appInsights.Contracts.Envelope): boolean {
  if (envelope.data && 'baseData' in envelope.data) {
    const baseData = envelope.data.baseData as any

    // Add custom properties to all telemetry
    if (!baseData.properties) {
      baseData.properties = {}
    }

    // Add environment info
    baseData.properties.environment = process.env.NODE_ENV || 'development'
    baseData.properties.nodeVersion = process.version

    // Add deployment info if available
    if (process.env.BUILD_ID) {
      baseData.properties.buildId = process.env.BUILD_ID
    }

    if (process.env.RELEASE_VERSION) {
      baseData.properties.releaseVersion = process.env.RELEASE_VERSION
    }

    // Add Azure-specific info if available
    if (process.env.WEBSITE_SITE_NAME) {
      baseData.properties.azureWebAppName = process.env.WEBSITE_SITE_NAME
    }
  }

  return true
}

/**
 * Mask sensitive parts of URLs
 */
function maskSensitiveUrl(url: string): string {
  if (!url) return url

  // Mask JWT tokens
  url = url.replace(/token=([^&]+)/gi, 'token=***')

  // Mask API keys
  url = url.replace(/api[_-]?key=([^&]+)/gi, 'api_key=***')

  // Mask passwords
  url = url.replace(/password=([^&]+)/gi, 'password=***')

  // Mask authorization codes
  url = url.replace(/code=([^&]+)/gi, 'code=***')

  // Mask session IDs
  url = url.replace(/session=([^&]+)/gi, 'session=***')

  return url
}

/**
 * Get the telemetry client for custom tracking
 */
export function getTelemetryClient() {
  return isInitialized ? appInsights.defaultClient : null
}

/**
 * Check if telemetry is active
 */
export function isTelemetryActive(): boolean {
  return isInitialized
}

/**
 * Flush telemetry data (useful for graceful shutdown)
 */
export async function flushTelemetry(): Promise<void> {
  if (!isInitialized) return

  return new Promise((resolve) => {
    appInsights.defaultClient.flush({
      callback: () => {
        console.log('📊 Telemetry data flushed')
        resolve()
      }
    })
  })
}

/**
 * Track a custom event
 */
export function trackEvent(name: string, properties?: Record<string, any>): void {
  if (!isInitialized) return

  appInsights.defaultClient.trackEvent({
    name,
    properties: {
      ...properties,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track a custom metric
 */
export function trackMetric(name: string, value: number, properties?: Record<string, any>): void {
  if (!isInitialized) return

  appInsights.defaultClient.trackMetric({
    name,
    value,
    properties
  })
}

/**
 * Track an error/exception
 */
export function trackException(error: Error, properties?: Record<string, any>): void {
  if (!isInitialized) {
    console.error('Exception (telemetry disabled):', error)
    return
  }

  appInsights.defaultClient.trackException({
    exception: error,
    properties: {
      ...properties,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track a dependency call (external service)
 */
export function trackDependency(
  name: string,
  data: string,
  duration: number,
  success: boolean,
  resultCode?: number
): void {
  if (!isInitialized) return

  appInsights.defaultClient.trackDependency({
    target: name,
    name: data,
    data,
    duration,
    resultCode: resultCode || (success ? 200 : 500),
    success,
    dependencyTypeName: 'HTTP'
  })
}

// Export the singleton client
export const telemetryClient = appInsights.defaultClient
