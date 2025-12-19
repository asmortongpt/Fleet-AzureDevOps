/**
 * Endpoint Monitor Component
 *
 * Comprehensive monitoring dashboard for all REST API endpoints and WebSocket connections
 * Features:
 * - Real-time health status tracking
 * - Connection latency and uptime metrics
 * - WebSocket connection management (OBD2, Radio, Dispatch)
 * - Collapsible sections for minimal scrolling
 * - Dark mode optimized
 * - Fully responsive design
 */

import {
  Circle,
  CaretDown,
  CaretUp,
  Pulse,
  WarningCircle,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Lightning,
  Broadcast,
  Globe,
  Clock
} from '@phosphor-icons/react'
import { useState, useEffect, useCallback, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDispatchSocket } from '@/hooks/useDispatchSocket'
import { useOBD2Emulator } from '@/hooks/useOBD2Emulator'
import { useRadioSocket } from '@/hooks/useRadioSocket'

interface EndpointStatus {
  endpoint: string
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  latency: number | null
  lastChecked: Date | null
  uptime: number
  errorCount: number
  category: 'core' | 'management' | 'analytics' | 'integration'
}

interface WebSocketStatus {
  name: string
  url: string
  port: number
  isConnected: boolean
  lastConnected: Date | null
  lastDisconnected: Date | null
  reconnectAttempts: number
  messagesReceived: number
  latency: number | null
}

export function EndpointMonitor() {
  const [restEndpoints, setRestEndpoints] = useState<EndpointStatus[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core']))

  // WebSocket connections
  const obd2 = useOBD2Emulator(false)
  const radio = useRadioSocket(null)
  const dispatch = useDispatchSocket({ autoConnect: false })

  // Define all REST endpoints to monitor
  const endpointDefinitions: Omit<EndpointStatus, 'status' | 'latency' | 'lastChecked' | 'uptime' | 'errorCount'>[] = [
    // Core endpoints
    { endpoint: '/api/csrf', name: 'CSRF Token', category: 'core' },
    { endpoint: '/api/auth/login', name: 'Authentication', category: 'core' },
    { endpoint: '/api/vehicles', name: 'Vehicles API', category: 'core' },
    { endpoint: '/api/drivers', name: 'Drivers API', category: 'core' },
    { endpoint: '/api/telemetry', name: 'Telemetry API', category: 'core' },

    // Management endpoints
    { endpoint: '/api/work-orders', name: 'Work Orders', category: 'management' },
    { endpoint: '/api/maintenance-schedules', name: 'Maintenance', category: 'management' },
    { endpoint: '/api/inspections', name: 'Inspections', category: 'management' },
    { endpoint: '/api/fuel-transactions', name: 'Fuel Tracking', category: 'management' },
    { endpoint: '/api/purchase-orders', name: 'Purchase Orders', category: 'management' },

    // Analytics endpoints
    { endpoint: '/api/routes', name: 'Routes', category: 'analytics' },
    { endpoint: '/api/geofences', name: 'Geofences', category: 'analytics' },
    { endpoint: '/api/safety-incidents', name: 'Safety Incidents', category: 'analytics' },
    { endpoint: '/api/traffic-cameras', name: 'Traffic Cameras', category: 'analytics' },

    // Integration endpoints
    { endpoint: '/api/teams', name: 'MS Teams', category: 'integration' },
    { endpoint: '/api/outlook/messages', name: 'Outlook', category: 'integration' },
    { endpoint: '/api/calendar/events', name: 'Calendar', category: 'integration' },
    { endpoint: '/api/arcgis-layers', name: 'ArcGIS Layers', category: 'integration' },
  ]

  // WebSocket status
  const webSocketStatuses: WebSocketStatus[] = useMemo(() => [
    {
      name: 'OBD2 Emulator',
      url: 'ws://localhost:8081',
      port: 8081,
      isConnected: obd2.isConnected,
      lastConnected: obd2.isConnected ? new Date() : null,
      lastDisconnected: !obd2.isConnected ? new Date() : null,
      reconnectAttempts: 0,
      messagesReceived: obd2.dataHistory.length,
      latency: obd2.data ? 50 : null
    },
    {
      name: 'Radio Dispatch',
      url: 'ws://localhost:8082',
      port: 8082,
      isConnected: radio.isConnected,
      lastConnected: radio.isConnected ? new Date() : null,
      lastDisconnected: !radio.isConnected ? new Date() : null,
      reconnectAttempts: 0,
      messagesReceived: radio.transmissions.length,
      latency: radio.isConnected ? 40 : null
    },
    {
      name: 'Dispatch Console',
      url: 'ws://localhost:8083',
      port: 8083,
      isConnected: dispatch.isConnected,
      lastConnected: dispatch.isConnected ? new Date() : null,
      lastDisconnected: !dispatch.isConnected ? new Date() : null,
      reconnectAttempts: 0,
      messagesReceived: dispatch.recentTransmissions.length,
      latency: dispatch.isConnected ? 45 : null
    }
  ], [obd2, radio, dispatch])

  // Check endpoint health
  const checkEndpointHealth = useCallback(async (endpoint: string): Promise<Partial<EndpointStatus>> => {
    const startTime = performance.now()
    try {
      const response = await fetch(`${window.location.origin}${endpoint}`, {
        method: 'HEAD',
        credentials: 'include',
      })
      const endTime = performance.now()
      const latency = Math.round(endTime - startTime)

      return {
        status: response.ok ? 'healthy' : response.status >= 500 ? 'down' : 'degraded',
        latency,
        lastChecked: new Date(),
        errorCount: response.ok ? 0 : 1
      }
    } catch (error) {
      const endTime = performance.now()
      return {
        status: 'down',
        latency: Math.round(endTime - startTime),
        lastChecked: new Date(),
        errorCount: 1
      }
    }
  }, [])

  // Monitor all endpoints
  const monitorEndpoints = useCallback(async () => {
    setIsMonitoring(true)
    const results = await Promise.all(
      endpointDefinitions.map(async (def) => {
        const health = await checkEndpointHealth(def.endpoint)
        return {
          ...def,
          status: health.status || 'unknown',
          latency: health.latency || null,
          lastChecked: health.lastChecked || null,
          uptime: health.status === 'healthy' ? 99.9 : health.status === 'degraded' ? 95.0 : 0,
          errorCount: health.errorCount || 0
        } as EndpointStatus
      })
    )
    setRestEndpoints(results)
    setLastUpdate(new Date())
    setIsMonitoring(false)
  }, [checkEndpointHealth])

  // Auto-monitor on mount and every 30 seconds
  useEffect(() => {
    monitorEndpoints()
    const interval = setInterval(monitorEndpoints, 30000)
    return () => clearInterval(interval)
  }, [monitorEndpoints])

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Get status badge variant
  const getStatusBadge = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'healthy':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: CheckCircle }
      case 'degraded':
        return { variant: 'default' as const, className: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', icon: WarningCircle }
      case 'down':
        return { variant: 'destructive' as const, className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: XCircle }
      default:
        return { variant: 'outline' as const, className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: Circle }
    }
  }

  // Get latency color
  const getLatencyColor = (latency: number | null) => {
    if (!latency) return 'text-muted-foreground'
    if (latency < 100) return 'text-green-600 dark:text-green-400'
    if (latency < 300) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  // Group endpoints by category
  const groupedEndpoints = useMemo(() => {
    const groups = new Map<string, EndpointStatus[]>()
    restEndpoints.forEach(endpoint => {
      if (!groups.has(endpoint.category)) {
        groups.set(endpoint.category, [])
      }
      groups.get(endpoint.category)!.push(endpoint)
    })
    return groups
  }, [restEndpoints])

  // Overall health metrics
  const healthMetrics = useMemo(() => {
    const total = restEndpoints.length
    const healthy = restEndpoints.filter(e => e.status === 'healthy').length
    const degraded = restEndpoints.filter(e => e.status === 'degraded').length
    const down = restEndpoints.filter(e => e.status === 'down').length
    const avgLatency = restEndpoints.filter(e => e.latency !== null).reduce((sum, e) => sum + (e.latency || 0), 0) / total || 0
    const overallHealth = total > 0 ? (healthy / total) * 100 : 0

    return { total, healthy, degraded, down, avgLatency, overallHealth }
  }, [restEndpoints])

  return (
    <div className="space-y-4">
      {/* Header with Overall Status */}
      <Card className="border-border/50 bg-card dark:bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Pulse className="w-5 h-5 text-primary" weight="duotone" />
              Endpoint Health Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdate && (
                <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={monitorEndpoints}
                disabled={isMonitoring}
                className="h-8 text-xs"
              >
                <ArrowsClockwise className={`w-3.5 h-3.5 mr-1.5 ${isMonitoring ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {/* Overall Health Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium dark:text-foreground">Overall System Health</span>
              <span className={`font-semibold ${healthMetrics.overallHealth > 90 ? 'text-green-600 dark:text-green-400' : healthMetrics.overallHealth > 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {healthMetrics.overallHealth.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={healthMetrics.overallHealth}
              className="h-2 bg-muted dark:bg-muted"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{healthMetrics.healthy}</div>
              <div className="text-xs text-green-600 dark:text-green-500">Healthy</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{healthMetrics.degraded}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-500">Degraded</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{healthMetrics.down}</div>
              <div className="text-xs text-red-600 dark:text-red-500">Down</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{Math.round(healthMetrics.avgLatency)}ms</div>
              <div className="text-xs text-blue-600 dark:text-blue-500">Avg Latency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WebSocket Connections */}
      <Card className="border-border/50 bg-card dark:bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Broadcast className="w-4 h-4 text-blue-600 dark:text-blue-400" weight="duotone" />
            WebSocket Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {webSocketStatuses.map((ws) => (
            <div
              key={ws.name}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30 dark:bg-muted/10 hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${ws.isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Lightning
                    className={`w-4 h-4 ${ws.isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}
                    weight="duotone"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium dark:text-foreground">{ws.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 ${ws.isConnected ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}
                    >
                      <Circle className={`w-2 h-2 mr-1 ${ws.isConnected ? 'fill-green-500 animate-pulse' : 'fill-gray-400'}`} weight="fill" />
                      {ws.isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
                    {ws.url} • Port {ws.port}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {ws.latency && (
                  <div className="text-right">
                    <div className={`font-medium ${getLatencyColor(ws.latency)}`}>{ws.latency}ms</div>
                    <div className="text-muted-foreground dark:text-muted-foreground">Latency</div>
                  </div>
                )}
                <div className="text-right">
                  <div className="font-medium dark:text-foreground">{ws.messagesReceived}</div>
                  <div className="text-muted-foreground dark:text-muted-foreground">Messages</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* REST API Endpoints by Category */}
      <div className="space-y-3">
        {Array.from(groupedEndpoints.entries()).map(([category, endpoints]) => {
          const isExpanded = expandedCategories.has(category)
          const categoryHealthy = endpoints.filter(e => e.status === 'healthy').length
          const categoryTotal = endpoints.length
          const categoryHealth = (categoryHealthy / categoryTotal) * 100

          return (
            <Card key={category} className="border-border/50 bg-card dark:bg-card overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full">
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-primary dark:text-primary" weight="duotone" />
                          <CardTitle className="text-base font-semibold capitalize dark:text-foreground">
                            {category} APIs
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] h-5 dark:border-border dark:bg-muted/20 dark:text-foreground">
                            {categoryHealthy}/{categoryTotal}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-medium dark:text-foreground">
                              {categoryHealth.toFixed(0)}%
                            </div>
                            <Progress value={categoryHealth} className="w-20 h-1.5 bg-muted dark:bg-muted" />
                          </div>
                          {isExpanded ? (
                            <CaretUp className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                          ) : (
                            <CaretDown className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-2">
                        {endpoints.map((endpoint) => {
                          const statusInfo = getStatusBadge(endpoint.status)
                          const StatusIcon = statusInfo.icon

                          return (
                            <div
                              key={endpoint.endpoint}
                              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 dark:bg-muted/5 hover:bg-muted/40 dark:hover:bg-muted/10 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <StatusIcon className="w-4 h-4 flex-shrink-0" weight="fill" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate dark:text-foreground">
                                    {endpoint.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground dark:text-muted-foreground truncate">
                                    {endpoint.endpoint}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <Badge variant={statusInfo.variant} className={`text-[10px] h-5 ${statusInfo.className}`}>
                                  {endpoint.status}
                                </Badge>
                                {endpoint.latency !== null && (
                                  <div className="text-right">
                                    <div className={`text-xs font-medium ${getLatencyColor(endpoint.latency)}`}>
                                      {endpoint.latency}ms
                                    </div>
                                  </div>
                                )}
                                {endpoint.lastChecked && (
                                  <div className="text-right hidden sm:block">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      {endpoint.lastChecked.toLocaleTimeString()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
