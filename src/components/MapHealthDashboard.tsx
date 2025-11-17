/**
 * Map Health Status Dashboard
 *
 * Real-time dashboard showing health status of map services:
 * - Service availability
 * - Response times
 * - Error rates
 * - Rate limiting status
 * - Uptime statistics
 */

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import {
  useMapHealthCheck,
  HealthStatus,
  MapServiceProvider,
  HealthStatistics,
} from '@/utils/mapHealthCheck'

// ============================================================================
// Types & Interfaces
// ============================================================================

interface MapHealthDashboardProps {
  /** Providers to monitor (default: ['google', 'leaflet', 'arcgis']) */
  providers?: MapServiceProvider[]

  /** Show detailed statistics (default: true) */
  showDetails?: boolean

  /** Enable manual health check (default: true) */
  enableManualCheck?: boolean

  /** Callback when provider is selected */
  onProviderSelect?: (provider: MapServiceProvider) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status badge variant
 */
function getStatusVariant(status: HealthStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case HealthStatus.HEALTHY:
      return 'default'
    case HealthStatus.DEGRADED:
      return 'secondary'
    case HealthStatus.UNHEALTHY:
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * Get status color
 */
function getStatusColor(status: HealthStatus): string {
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
}

/**
 * Format response time
 */
function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Get provider display name
 */
function getProviderName(provider: MapServiceProvider): string {
  switch (provider) {
    case 'google':
      return 'Google Maps'
    case 'leaflet':
      return 'OpenStreetMap'
    case 'arcgis':
      return 'ArcGIS'
    default:
      return provider
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Map Health Dashboard Component
 */
export function MapHealthDashboard(props: MapHealthDashboardProps) {
  const {
    providers = ['google', 'leaflet', 'arcgis'],
    showDetails = true,
    enableManualCheck = true,
    onProviderSelect,
  } = props

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [selectedProvider, setSelectedProvider] = useState<MapServiceProvider | null>(null)
  const [isChecking, setIsChecking] = useState<Record<string, boolean>>({})

  // --------------------------------------------------------------------------
  // Health Check Hook
  // --------------------------------------------------------------------------

  const healthCheck = useMapHealthCheck(providers, {
    enabled: true,
    interval: 60000, // Check every minute
  })

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleManualCheck = async (provider: MapServiceProvider) => {
    setIsChecking({ ...isChecking, [provider]: true })
    try {
      await healthCheck.checkHealth(provider)
    } finally {
      setIsChecking({ ...isChecking, [provider]: false })
    }
  }

  const handleProviderClick = (provider: MapServiceProvider) => {
    setSelectedProvider(provider === selectedProvider ? null : provider)
    onProviderSelect?.(provider)
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Map Service Health</CardTitle>
            <CardDescription>
              Real-time monitoring of map service availability and performance
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">
            Recommended: {getProviderName(healthCheck.recommendedProvider)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Provider Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => {
            const status = healthCheck.getStatus(provider)
            const stats = healthCheck.statistics.get(provider)
            const isSelected = selectedProvider === provider
            const checking = isChecking[provider]

            return (
              <Card
                key={provider}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
                onClick={() => handleProviderClick(provider)}
              >
                <CardContent className="pt-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                      <h3 className="font-semibold">{getProviderName(provider)}</h3>
                    </div>
                    <Badge variant={getStatusVariant(status)}>{status}</Badge>
                  </div>

                  {/* Statistics */}
                  {stats && (
                    <div className="space-y-2 text-sm">
                      {/* Response Time */}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Avg Response</span>
                        <span className="font-medium">
                          {formatResponseTime(stats.averageResponseTime)}
                        </span>
                      </div>

                      {/* Uptime */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Uptime</span>
                          <span className="font-medium">{stats.uptime.toFixed(1)}%</span>
                        </div>
                        <Progress value={stats.uptime} className="h-2" />
                      </div>

                      {/* Success Rate */}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Success Rate</span>
                        <span className="font-medium">
                          {stats.successfulChecks}/{stats.totalChecks}
                        </span>
                      </div>

                      {/* Manual Check Button */}
                      {enableManualCheck && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleManualCheck(provider)
                          }}
                          disabled={checking}
                        >
                          {checking ? (
                            <>
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Checking...
                            </>
                          ) : (
                            'Check Now'
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Detailed Statistics */}
        {showDetails && selectedProvider && (
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-lg">
                {getProviderName(selectedProvider)} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const stats = healthCheck.statistics.get(selectedProvider)
                if (!stats) return <div>No data available</div>

                return (
                  <div className="space-y-4">
                    {/* Recent Checks */}
                    <div>
                      <h4 className="font-semibold mb-2">Recent Health Checks</h4>
                      <div className="space-y-2">
                        {stats.history.slice(-5).reverse().map((check, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getStatusColor(
                                  check.status
                                )}`}
                              />
                              <span className="text-sm">
                                {new Date(check.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {check.rateLimited && (
                                <Badge variant="destructive" className="text-xs">
                                  Rate Limited
                                </Badge>
                              )}
                              <span className="text-sm font-medium">
                                {formatResponseTime(check.responseTime)}
                              </span>
                              <Badge variant={getStatusVariant(check.status)}>
                                {check.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overall Statistics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded">
                        <div className="text-sm text-gray-500">Total Checks</div>
                        <div className="text-2xl font-bold">{stats.totalChecks}</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded">
                        <div className="text-sm text-gray-500">Failed Checks</div>
                        <div className="text-2xl font-bold text-red-500">
                          {stats.failedChecks}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded">
                        <div className="text-sm text-gray-500">Avg Response</div>
                        <div className="text-2xl font-bold">
                          {formatResponseTime(stats.averageResponseTime)}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded">
                        <div className="text-sm text-gray-500">Last Check</div>
                        <div className="text-sm font-medium">
                          {stats.lastCheck
                            ? new Date(stats.lastCheck).toLocaleString()
                            : 'Never'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

export default MapHealthDashboard
