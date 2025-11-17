/**
 * Enhanced Universal Map with Advanced Error Recovery
 *
 * This component wraps UniversalMap with comprehensive error recovery:
 * - Circuit breaker pattern to prevent cascading failures
 * - Automatic retry with exponential backoff
 * - Health monitoring for map services
 * - Graceful degradation and fallback providers
 * - Offline mode detection and handling
 * - User-friendly error messages and recovery actions
 */

import { useState, useEffect, useCallback } from 'react'
import { UniversalMap, UniversalMapProps, MapProvider } from './UniversalMap'
import { MapErrorBoundary } from './MapErrorBoundary'
import { useErrorRecovery } from '@/hooks/useErrorRecovery'
import { useMapHealthCheck, HealthStatus } from '@/utils/mapHealthCheck'
import { toast } from '@/utils/toast'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Enhanced map props with error recovery options
 */
export interface EnhancedUniversalMapProps extends Omit<UniversalMapProps, 'onMapError' | 'onMapReady'> {
  /** Enable error recovery (default: true) */
  enableErrorRecovery?: boolean

  /** Enable health monitoring (default: true) */
  enableHealthMonitoring?: boolean

  /** Enable offline mode detection (default: true) */
  enableOfflineDetection?: boolean

  /** Show health status badge (default: false) */
  showHealthStatus?: boolean

  /** Show recovery controls (default: true) */
  showRecoveryControls?: boolean

  /** Callback when map is ready */
  onMapReady?: (provider: MapProvider) => void

  /** Callback when error occurs */
  onMapError?: (error: Error, provider: MapProvider) => void

  /** Callback when recovery succeeds */
  onRecoverySuccess?: () => void

  /** Callback when provider switches */
  onProviderSwitch?: (from: MapProvider, to: MapProvider) => void
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Enhanced Universal Map with comprehensive error recovery
 */
export function EnhancedUniversalMap(props: EnhancedUniversalMapProps) {
  const {
    enableErrorRecovery = true,
    enableHealthMonitoring = true,
    enableOfflineDetection = true,
    showHealthStatus = false,
    showRecoveryControls = true,
    onMapReady,
    onMapError,
    onRecoverySuccess,
    onProviderSwitch,
    forceProvider,
    ...mapProps
  } = props

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [currentProvider, setCurrentProvider] = useState<MapProvider>(forceProvider || 'leaflet')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [mapKey, setMapKey] = useState(0)

  // --------------------------------------------------------------------------
  // Error Recovery Hook
  // --------------------------------------------------------------------------

  const errorRecovery = useErrorRecovery({
    enabled: enableErrorRecovery,
    failureThreshold: 3,
    recoveryTimeout: 30000,
    maxRecoveryAttempts: 3,
    enableNotifications: true,
    enableAutoRecovery: true,
    onError: (error) => {
      console.error('Map error:', error)
      onMapError?.(error, currentProvider)
    },
    onRecovery: () => {
      console.log('Map recovered successfully')
      toast.success('Map service restored')
      onRecoverySuccess?.()
    },
    onCircuitStateChange: (state) => {
      console.log('Circuit breaker state:', state)
      if (state === 'OPEN') {
        toast.error('Map service temporarily unavailable. Will retry automatically.')
      }
    },
    fallback: async () => {
      // Fallback to Leaflet if using Google Maps
      if (currentProvider === 'google') {
        console.log('Falling back to Leaflet...')
        handleProviderSwitch('leaflet')
      }
    },
  })

  // --------------------------------------------------------------------------
  // Health Monitoring Hook
  // --------------------------------------------------------------------------

  const healthCheck = useMapHealthCheck(
    enableHealthMonitoring ? ['google', 'leaflet'] : [],
    {
      enabled: enableHealthMonitoring,
      interval: 60000, // Check every minute
      onStatusChange: (provider, status) => {
        console.log(`${provider} status changed to:`, status)
        if (status === HealthStatus.UNHEALTHY && provider === currentProvider) {
          toast.warning(`${provider} map service is experiencing issues`)
        }
      },
      onRateLimitDetected: (provider, resetTime) => {
        console.warn(`Rate limit detected for ${provider}`, resetTime)
        toast.warning('Rate limit reached. Switching to alternative provider...')
        if (provider === currentProvider) {
          handleProviderSwitch(provider === 'google' ? 'leaflet' : 'google')
        }
      },
    }
  )

  // --------------------------------------------------------------------------
  // Offline Detection
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!enableOfflineDetection) return

    const handleOnline = () => {
      setIsOffline(false)
      toast.success('Connection restored')
      // Trigger map refresh
      setMapKey(prev => prev + 1)
    }

    const handleOffline = () => {
      setIsOffline(true)
      toast.error('You are offline. Map functionality may be limited.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enableOfflineDetection])

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  /**
   * Handle provider switch with error recovery
   */
  const handleProviderSwitch = useCallback(
    (newProvider: MapProvider) => {
      const oldProvider = currentProvider
      console.log(`Switching from ${oldProvider} to ${newProvider}`)

      setCurrentProvider(newProvider)
      setMapKey(prev => prev + 1)
      errorRecovery.reset()

      onProviderSwitch?.(oldProvider, newProvider)
      toast.info(`Switched to ${newProvider === 'google' ? 'Google Maps' : 'OpenStreetMap'}`)
    },
    [currentProvider, errorRecovery, onProviderSwitch]
  )

  /**
   * Handle map ready with error recovery
   */
  const handleMapReady = useCallback(
    (provider: MapProvider) => {
      console.log(`Map ready: ${provider}`)
      errorRecovery.clearError()
      onMapReady?.(provider)
    },
    [errorRecovery, onMapReady]
  )

  /**
   * Handle map error with error recovery
   */
  const handleMapError = useCallback(
    async (error: Error, provider: MapProvider) => {
      console.error(`Map error in ${provider}:`, error)

      // Use error recovery system
      await errorRecovery.execute(async () => {
        // Attempt to recover by reloading the map
        setMapKey(prev => prev + 1)
      })

      onMapError?.(error, provider)
    },
    [errorRecovery, onMapError]
  )

  /**
   * Manually trigger recovery
   */
  const handleManualRecovery = useCallback(() => {
    errorRecovery.recover()
    setMapKey(prev => prev + 1)
  }, [errorRecovery])

  /**
   * Get health status color
   */
  const getHealthStatusColor = useCallback((status: HealthStatus) => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return 'bg-green-500'
      case HealthStatus.DEGRADED:
        return 'bg-yellow-500'
      case HealthStatus.UNHEALTHY:
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }, [])

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="relative w-full h-full">
      {/* Map Error Boundary with Advanced Recovery */}
      <MapErrorBoundary
        provider={currentProvider}
        onError={(error, errorInfo) => {
          console.error('Error boundary caught:', error, errorInfo)
          handleMapError(error, currentProvider)
        }}
        onFallbackProvider={handleProviderSwitch}
        enableAutoRetry={enableErrorRecovery}
        maxRetries={3}
        enableErrorReporting={true}
        enableProviderFallback={true}
      >
        {/* Main Map Component */}
        <UniversalMap
          key={`map-${currentProvider}-${mapKey}`}
          {...mapProps}
          forceProvider={currentProvider}
          onMapReady={handleMapReady}
          onMapError={handleMapError}
        />
      </MapErrorBoundary>

      {/* Offline Indicator */}
      {isOffline && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="bg-yellow-50 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700">
            <CardContent className="py-2 px-4">
              <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="font-medium">Offline Mode</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Status Badge */}
      {showHealthStatus && enableHealthMonitoring && (
        <div className="absolute top-4 right-4 z-40 space-y-2">
          {['google', 'leaflet'].map((provider) => {
            const status = healthCheck.getStatus(provider as MapProvider)
            const stats = healthCheck.statistics.get(provider as MapProvider)
            const isActive = provider === currentProvider

            return (
              <div
                key={provider}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md shadow-md text-xs ${
                  isActive
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-gray-100 dark:bg-gray-900 opacity-60'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${getHealthStatusColor(status)}`}
                  title={status}
                />
                <span className="font-medium">
                  {provider === 'google' ? 'Google' : 'OSM'}
                </span>
                {stats && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {Math.round(stats.averageResponseTime)}ms
                  </span>
                )}
                {isActive && <Badge variant="outline" className="ml-1">Active</Badge>}
              </div>
            )
          })}
        </div>
      )}

      {/* Recovery Controls */}
      {showRecoveryControls && errorRecovery.error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Map service issue detected
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleManualRecovery}
                    disabled={errorRecovery.isRecovering}
                  >
                    {errorRecovery.isRecovering ? 'Recovering...' : 'Retry'}
                  </Button>
                  {currentProvider === 'google' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProviderSwitch('leaflet')}
                    >
                      Use Free Map
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={errorRecovery.clearError}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Circuit Breaker Status (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 z-40 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono space-y-1">
          <div>Circuit: {errorRecovery.circuitState}</div>
          <div>Failures: {errorRecovery.failureCount}</div>
          <div>Recoveries: {errorRecovery.recoveryAttempts}</div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Exports
// ============================================================================

export default EnhancedUniversalMap
