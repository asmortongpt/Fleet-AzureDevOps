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

import { Circle, ChevronDown, ChevronUp, Activity, AlertCircle, CheckCircle, XCircle, RefreshCw, Zap, Radio, Globe, Clock } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

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

  // WebSocket connection (DB-backed emulator stream)
  const [emulatorStream, setEmulatorStream] = useState<Pick<WebSocketStatus,
    'isConnected' | 'lastConnected' | 'lastDisconnected' | 'reconnectAttempts' | 'messagesReceived' | 'latency'
  >>({
    isConnected: false,
    lastConnected: null,
    lastDisconnected: null,
    reconnectAttempts: 0,
    messagesReceived: 0,
    latency: null,
  })

  // Define all REST endpoints to monitor
  const endpointDefinitions: Omit<EndpointStatus, 'status' | 'latency' | 'lastChecked' | 'uptime' | 'errorCount'>[] = [
    // Core endpoints
    { endpoint: '/api/dashboard/stats', name: 'Dashboard Stats', category: 'core' },
    { endpoint: '/api/auth/me', name: 'Current Session', category: 'core' },
    { endpoint: '/api/vehicles?limit=1', name: 'Vehicles API', category: 'core' },
    { endpoint: '/api/drivers?limit=1', name: 'Drivers API', category: 'core' },
    { endpoint: '/api/incidents?limit=1', name: 'Incidents API', category: 'core' },

    // Management endpoints
    { endpoint: '/api/work-orders?limit=1', name: 'Work Orders', category: 'management' },
    { endpoint: '/api/maintenance-schedules?limit=1', name: 'Maintenance', category: 'management' },
    { endpoint: '/api/inspections?limit=1', name: 'Inspections', category: 'management' },
    { endpoint: '/api/fuel-transactions?limit=1', name: 'Fuel Tracking', category: 'management' },
    { endpoint: '/api/service-bays', name: 'Service Bays', category: 'management' },

    // Analytics endpoints
    { endpoint: '/api/routes?limit=1', name: 'Routes', category: 'analytics' },
    { endpoint: '/api/geofences?limit=1', name: 'Geofences', category: 'analytics' },
    { endpoint: '/api/hazard-zones', name: 'Hazard Zones', category: 'analytics' },
  ]

  // Keep a lightweight WS to the emulator stream so the UI reflects real demo connectivity.
  useEffect(() => {
    let ws: WebSocket | null = null
    let cancelled = false
    let attempts = 0

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname || 'localhost'
    const url = `${protocol}//${host}:3004/emulator/stream`

    const connect = () => {
      if (cancelled) return
      attempts += 1
      setEmulatorStream((s) => ({ ...s, reconnectAttempts: attempts - 1 }))

      try {
        ws = new WebSocket(url)
      } catch {
        ws = null
        return
      }

      ws.onopen = () => {
        if (cancelled) return
        setEmulatorStream((s) => ({
          ...s,
          isConnected: true,
          lastConnected: new Date(),
          latency: 0,
        }))
      }

      ws.onmessage = () => {
        if (cancelled) return
        setEmulatorStream((s) => ({ ...s, messagesReceived: s.messagesReceived + 1 }))
      }

      ws.onclose = () => {
        if (cancelled) return
        setEmulatorStream((s) => ({
          ...s,
          isConnected: false,
          lastDisconnected: new Date(),
        }))
        // Retry with simple backoff.
        window.setTimeout(connect, Math.min(10_000, 500 + attempts * 500))
      }

      ws.onerror = () => {
        try {
          ws?.close()
        } catch {
          // ignore
        }
      }
    }

    connect()
    return () => {
      cancelled = true
      try {
        ws?.close()
      } catch {
        // ignore
      }
    }
  }, [])

  // WebSocket status
  const webSocketStatuses: WebSocketStatus[] = useMemo(() => [
    {
      name: 'Emulator Stream',
      url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname || 'localhost'}:3004/emulator/stream`,
      port: 3004,
      ...emulatorStream,
    }
  ], [emulatorStream])

  // Check endpoint health
  const checkEndpointHealth = useCallback(async (endpoint: string): Promise<Partial<EndpointStatus>> => {
    const startTime = performance.now()
    try {
      const response = await fetch(`${window.location.origin}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
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
        return { variant: 'default' as const, className: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', icon: AlertCircle }
      case 'down':
        return { variant: 'destructive' as const, className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: XCircle }
      default:
        return { variant: 'outline' as const, className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-700 dark:border-gray-700', icon: Circle }
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
    <div className="space-y-2">
      {/* Header with Overall Status */}
      <Card className="border-border/50 bg-card dark:bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-3 h-3 text-primary" />
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
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isMonitoring ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-2">
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
              <div className="text-sm font-bold text-green-700 dark:text-green-400">{healthMetrics.healthy}</div>
              <div className="text-xs text-green-600 dark:text-green-500">Healthy</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{healthMetrics.degraded}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-500">Degraded</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="text-sm font-bold text-red-700 dark:text-red-400">{healthMetrics.down}</div>
              <div className="text-xs text-red-600 dark:text-red-500">Down</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-bold text-blue-700 dark:text-blue-700">{Math.round(healthMetrics.avgLatency)}ms</div>
              <div className="text-xs text-blue-800 dark:text-blue-800">Avg Latency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WebSocket Connections */}
      <Card className="border-border/50 bg-card dark:bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-800 dark:text-blue-700" />
            WebSocket Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-2">
          {webSocketStatuses.map((ws) => (
            <div
              key={ws.name}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30 dark:bg-muted/10 hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${ws.isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Zap
                    className={`w-4 h-4 ${ws.isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-slate-700'}`}
                   
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium dark:text-foreground">{ws.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 ${ws.isConnected ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-slate-700 border-gray-300 dark:bg-gray-800 dark:text-gray-700 dark:border-gray-700'}`}
                    >
                      <Circle className={`w-2 h-2 mr-1 ${ws.isConnected ? 'fill-green-500 animate-pulse' : 'fill-gray-400'}`} />
                      {ws.isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
                    {ws.url} • Port {ws.port}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
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
                          <Globe className="w-4 h-4 text-primary dark:text-primary" />
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
                            <ChevronUp className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-2">
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
                                <StatusIcon className="w-4 h-4 flex-shrink-0" />
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
