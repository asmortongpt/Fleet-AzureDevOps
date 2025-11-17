/**
 * Map Service Health Check System
 *
 * Features:
 * - Periodic health checks for map services
 * - Detect API rate limiting
 * - Monitor service availability
 * - Preemptive error detection
 * - Service status tracking
 * - Performance monitoring
 */

import { useState, useEffect } from 'react'
import { retryFetch, categorizeError, ErrorCategory } from './retry'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Service health status
 */
export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Map service provider type
 */
export type MapServiceProvider = 'google' | 'leaflet' | 'arcgis'

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Service provider */
  provider: MapServiceProvider

  /** Health status */
  status: HealthStatus

  /** Response time in milliseconds */
  responseTime: number

  /** Whether rate limiting is detected */
  rateLimited: boolean

  /** Error if any */
  error: Error | null

  /** Timestamp of check */
  timestamp: number

  /** Additional metadata */
  metadata?: {
    statusCode?: number
    remainingQuota?: number
    resetTime?: number
    region?: string
  }
}

/**
 * Service health statistics
 */
export interface HealthStatistics {
  /** Total checks performed */
  totalChecks: number

  /** Number of successful checks */
  successfulChecks: number

  /** Number of failed checks */
  failedChecks: number

  /** Average response time */
  averageResponseTime: number

  /** Uptime percentage */
  uptime: number

  /** Last check timestamp */
  lastCheck: number

  /** Recent check history */
  history: HealthCheckResult[]
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Check interval in milliseconds (default: 60000 - 1 minute) */
  interval?: number

  /** Enable automatic health checks (default: true) */
  enabled?: boolean

  /** Maximum history size (default: 10) */
  maxHistorySize?: number

  /** Timeout for health checks (default: 5000) */
  timeout?: number

  /** Callback when status changes */
  onStatusChange?: (provider: MapServiceProvider, status: HealthStatus) => void

  /** Callback when rate limiting detected */
  onRateLimitDetected?: (provider: MapServiceProvider, resetTime?: number) => void
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<HealthCheckConfig, 'onStatusChange' | 'onRateLimitDetected'>> = {
  interval: 60000, // 1 minute
  enabled: true,
  maxHistorySize: 10,
  timeout: 5000,
}

/**
 * Health check endpoints for each provider
 */
const HEALTH_CHECK_ENDPOINTS: Record<MapServiceProvider, string> = {
  google: 'https://maps.googleapis.com/maps/api/js',
  leaflet: 'https://tile.openstreetmap.org/0/0/0.png',
  arcgis: 'https://services.arcgisonline.com/ArcGIS/rest/info',
}

/**
 * Response time thresholds (ms)
 */
const RESPONSE_TIME_THRESHOLDS = {
  HEALTHY: 2000,
  DEGRADED: 5000,
}

// ============================================================================
// Health Check Manager
// ============================================================================

/**
 * Manager for map service health checks
 */
export class MapHealthCheckManager {
  private config: Required<Omit<HealthCheckConfig, 'onStatusChange' | 'onRateLimitDetected'>> & HealthCheckConfig
  private statistics: Map<MapServiceProvider, HealthStatistics> = new Map()
  private intervalIds: Map<MapServiceProvider, NodeJS.Timeout> = new Map()
  private abortControllers: Map<MapServiceProvider, AbortController> = new Map()

  constructor(config: HealthCheckConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeStatistics()
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  /**
   * Initialize statistics for all providers
   */
  private initializeStatistics(): void {
    const providers: MapServiceProvider[] = ['google', 'leaflet', 'arcgis']

    providers.forEach(provider => {
      this.statistics.set(provider, {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        uptime: 100,
        lastCheck: 0,
        history: [],
      })
    })
  }

  // --------------------------------------------------------------------------
  // Health Checks
  // --------------------------------------------------------------------------

  /**
   * Perform health check for a specific provider
   */
  async checkHealth(provider: MapServiceProvider): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const endpoint = HEALTH_CHECK_ENDPOINTS[provider]

    // Create abort controller for this check
    const abortController = new AbortController()
    this.abortControllers.set(provider, abortController)

    try {
      // Perform health check request
      const response = await retryFetch(endpoint, {
        method: 'HEAD',
        signal: abortController.signal,
        retryConfig: {
          maxAttempts: 1, // No retries for health checks
          timeout: this.config.timeout,
        },
      })

      const responseTime = Date.now() - startTime

      // Check for rate limiting
      const rateLimited = this.isRateLimited(response)
      const metadata = this.extractMetadata(response)

      // Determine health status
      let status: HealthStatus
      if (rateLimited) {
        status = HealthStatus.DEGRADED
      } else if (responseTime > RESPONSE_TIME_THRESHOLDS.DEGRADED) {
        status = HealthStatus.DEGRADED
      } else if (responseTime > RESPONSE_TIME_THRESHOLDS.HEALTHY) {
        status = HealthStatus.DEGRADED
      } else {
        status = HealthStatus.HEALTHY
      }

      const result: HealthCheckResult = {
        provider,
        status,
        responseTime,
        rateLimited,
        error: null,
        timestamp: Date.now(),
        metadata,
      }

      // Update statistics
      this.updateStatistics(provider, result)

      // Call callbacks
      if (rateLimited) {
        this.config.onRateLimitDetected?.(provider, metadata.resetTime)
      }

      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const categorized = categorizeError(err)
      const responseTime = Date.now() - startTime

      // Determine if rate limited based on error
      const rateLimited = categorized.category === ErrorCategory.RATE_LIMIT

      const result: HealthCheckResult = {
        provider,
        status: HealthStatus.UNHEALTHY,
        responseTime,
        rateLimited,
        error: err,
        timestamp: Date.now(),
      }

      // Update statistics
      this.updateStatistics(provider, result)

      return result
    } finally {
      this.abortControllers.delete(provider)
    }
  }

  /**
   * Check if response indicates rate limiting
   */
  private isRateLimited(response: Response): boolean {
    // Check status code
    if (response.status === 429) {
      return true
    }

    // Check headers
    const remaining = response.headers.get('X-RateLimit-Remaining')
    if (remaining !== null && parseInt(remaining, 10) === 0) {
      return true
    }

    return false
  }

  /**
   * Extract metadata from response
   */
  private extractMetadata(response: Response): HealthCheckResult['metadata'] {
    const metadata: HealthCheckResult['metadata'] = {
      statusCode: response.status,
    }

    // Extract rate limit information
    const remaining = response.headers.get('X-RateLimit-Remaining')
    if (remaining !== null) {
      metadata.remainingQuota = parseInt(remaining, 10)
    }

    const reset = response.headers.get('X-RateLimit-Reset')
    if (reset !== null) {
      metadata.resetTime = parseInt(reset, 10)
    }

    // Extract region information
    const region = response.headers.get('X-Served-By') || response.headers.get('Server-Region')
    if (region) {
      metadata.region = region
    }

    return metadata
  }

  /**
   * Update statistics after health check
   */
  private updateStatistics(provider: MapServiceProvider, result: HealthCheckResult): void {
    const stats = this.statistics.get(provider)
    if (!stats) return

    // Update counters
    stats.totalChecks++
    if (result.status === HealthStatus.HEALTHY || result.status === HealthStatus.DEGRADED) {
      stats.successfulChecks++
    } else {
      stats.failedChecks++
    }

    // Update average response time
    stats.averageResponseTime =
      (stats.averageResponseTime * (stats.totalChecks - 1) + result.responseTime) / stats.totalChecks

    // Update uptime
    stats.uptime = (stats.successfulChecks / stats.totalChecks) * 100

    // Update last check
    stats.lastCheck = result.timestamp

    // Add to history
    stats.history.push(result)
    if (stats.history.length > this.config.maxHistorySize) {
      stats.history.shift()
    }

    // Detect status change
    if (stats.history.length >= 2) {
      const previousStatus = stats.history[stats.history.length - 2].status
      if (previousStatus !== result.status) {
        this.config.onStatusChange?.(provider, result.status)
      }
    }
  }

  // --------------------------------------------------------------------------
  // Continuous Monitoring
  // --------------------------------------------------------------------------

  /**
   * Start periodic health checks for a provider
   */
  startMonitoring(provider: MapServiceProvider): void {
    if (!this.config.enabled) return

    // Stop existing monitoring
    this.stopMonitoring(provider)

    // Initial check
    this.checkHealth(provider).catch(err => {
      console.error(`Health check failed for ${provider}:`, err)
    })

    // Set up periodic checks
    const intervalId = setInterval(() => {
      this.checkHealth(provider).catch(err => {
        console.error(`Health check failed for ${provider}:`, err)
      })
    }, this.config.interval)

    this.intervalIds.set(provider, intervalId)
  }

  /**
   * Stop periodic health checks for a provider
   */
  stopMonitoring(provider: MapServiceProvider): void {
    const intervalId = this.intervalIds.get(provider)
    if (intervalId) {
      clearInterval(intervalId)
      this.intervalIds.delete(provider)
    }

    // Abort any in-flight checks
    const abortController = this.abortControllers.get(provider)
    if (abortController) {
      abortController.abort()
      this.abortControllers.delete(provider)
    }
  }

  /**
   * Start monitoring all providers
   */
  startMonitoringAll(): void {
    const providers: MapServiceProvider[] = ['google', 'leaflet', 'arcgis']
    providers.forEach(provider => this.startMonitoring(provider))
  }

  /**
   * Stop monitoring all providers
   */
  stopMonitoringAll(): void {
    const providers: MapServiceProvider[] = ['google', 'leaflet', 'arcgis']
    providers.forEach(provider => this.stopMonitoring(provider))
  }

  // --------------------------------------------------------------------------
  // Statistics & Status
  // --------------------------------------------------------------------------

  /**
   * Get statistics for a provider
   */
  getStatistics(provider: MapServiceProvider): HealthStatistics | undefined {
    return this.statistics.get(provider)
  }

  /**
   * Get current health status for a provider
   */
  getStatus(provider: MapServiceProvider): HealthStatus {
    const stats = this.statistics.get(provider)
    if (!stats || stats.history.length === 0) {
      return HealthStatus.UNKNOWN
    }

    return stats.history[stats.history.length - 1].status
  }

  /**
   * Get all statistics
   */
  getAllStatistics(): Map<MapServiceProvider, HealthStatistics> {
    return new Map(this.statistics)
  }

  /**
   * Check if provider is healthy
   */
  isHealthy(provider: MapServiceProvider): boolean {
    const status = this.getStatus(provider)
    return status === HealthStatus.HEALTHY || status === HealthStatus.DEGRADED
  }

  /**
   * Get recommended provider based on health
   */
  getRecommendedProvider(): MapServiceProvider {
    const providers: MapServiceProvider[] = ['google', 'leaflet', 'arcgis']

    // Sort by health status and response time
    const sorted = providers
      .map(provider => ({
        provider,
        status: this.getStatus(provider),
        stats: this.getStatistics(provider),
      }))
      .sort((a, b) => {
        // Prioritize healthy status
        const statusPriority = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2, UNKNOWN: 3 }
        const statusDiff = statusPriority[a.status] - statusPriority[b.status]
        if (statusDiff !== 0) return statusDiff

        // Then by response time
        const aTime = a.stats?.averageResponseTime || Infinity
        const bTime = b.stats?.averageResponseTime || Infinity
        return aTime - bTime
      })

    return sorted[0]?.provider || 'leaflet'
  }

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.stopMonitoringAll()
    this.statistics.clear()
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalHealthCheckManager: MapHealthCheckManager | null = null

/**
 * Get global health check manager instance
 */
export function getHealthCheckManager(config?: HealthCheckConfig): MapHealthCheckManager {
  if (!globalHealthCheckManager) {
    globalHealthCheckManager = new MapHealthCheckManager(config)
  }
  return globalHealthCheckManager
}

/**
 * Reset global health check manager
 */
export function resetHealthCheckManager(): void {
  if (globalHealthCheckManager) {
    globalHealthCheckManager.destroy()
    globalHealthCheckManager = null
  }
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * Hook for using health check manager in React components
 */
export function useMapHealthCheck(
  providers: MapServiceProvider[],
  config?: HealthCheckConfig
): {
  manager: MapHealthCheckManager
  statistics: Map<MapServiceProvider, HealthStatistics>
  getStatus: (provider: MapServiceProvider) => HealthStatus
  checkHealth: (provider: MapServiceProvider) => Promise<HealthCheckResult>
  recommendedProvider: MapServiceProvider
} {
  const [, forceUpdate] = useState({})
  const manager = getHealthCheckManager(config)

  // Start monitoring on mount
  useEffect(() => {
    providers.forEach(provider => manager.startMonitoring(provider))

    // Force re-render periodically to update UI
    const updateInterval = setInterval(() => {
      forceUpdate({})
    }, 5000)

    return () => {
      clearInterval(updateInterval)
      providers.forEach(provider => manager.stopMonitoring(provider))
    }
  }, [providers, manager])

  return {
    manager,
    statistics: manager.getAllStatistics(),
    getStatus: (provider: MapServiceProvider) => manager.getStatus(provider),
    checkHealth: (provider: MapServiceProvider) => manager.checkHealth(provider),
    recommendedProvider: manager.getRecommendedProvider(),
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check offline status
 */
export function isOffline(): boolean {
  return !navigator.onLine
}

/**
 * Wait for online status
 */
export function waitForOnline(timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve()
      return
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline)
      reject(new Error('Timeout waiting for online status'))
    }, timeout)

    const handleOnline = () => {
      clearTimeout(timeoutId)
      resolve()
    }

    window.addEventListener('online', handleOnline, { once: true })
  })
}

/**
 * Get network information (if available)
 */
export function getNetworkInfo(): {
  type?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
} {
  // @ts-ignore - NetworkInformation API is experimental
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (!connection) {
    return {}
  }

  return {
    type: connection.type,
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  MapHealthCheckManager,
  getHealthCheckManager,
  resetHealthCheckManager,
  useMapHealthCheck,
  isOffline,
  waitForOnline,
  getNetworkInfo,
}
