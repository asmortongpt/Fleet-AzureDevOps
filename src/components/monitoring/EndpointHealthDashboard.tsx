/**
 * Endpoint Health Dashboard
 * Real-time monitoring of all REST endpoints and WebSocket connections
 * Features: Status indicators, response times, collapsible categories, dark mode support
 */

import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Wifi,
  WifiOff,
  Radio,
  Server,
  Clock
} from 'lucide-react'
import { useState, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { API_ENDPOINT_CATEGORIES } from '@/config/endpoints'
import { useEndpointMonitoring } from '@/hooks/useEndpointMonitoring'
import { cn } from '@/lib/utils'
import { EndpointStatus, SocketStatus } from '@/types/endpoint-monitor'
import { formatTime } from '@/utils/format-helpers'

interface EndpointHealthDashboardProps {
  className?: string
  autoRefresh?: boolean
  compactMode?: boolean
}

export function EndpointHealthDashboard({
  className,
  autoRefresh = true,
  compactMode = false
}: EndpointHealthDashboardProps) {
  const {
    endpoints,
    endpointSummary,
    testAllEndpoints,
    sockets,
    socketSummary,
    isLoading,
    lastCheck
  } = useEndpointMonitoring({ enabled: autoRefresh })

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showSockets, setShowSockets] = useState(true)

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

  // Expand all categories
  const expandAll = () => {
    const allCategories = API_ENDPOINT_CATEGORIES.map(c => c.name)
    setExpandedCategories(new Set(allCategories))
  }

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  // Get status icon and color
  const getStatusDisplay = (status: EndpointStatus) => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950',
          label: 'Healthy'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          label: 'Warning'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950',
          label: 'Error'
        }
      case 'unknown':
      default:
        return {
          icon: HelpCircle,
          color: 'text-[var(--text-primary)] dark:text-[var(--text-tertiary)]',
          bgColor: 'bg-white/[0.03] dark:bg-[var(--surface-0)]',
          label: 'Unknown'
        }
    }
  }

  // Get socket status display
  const getSocketStatusDisplay = (status: SocketStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950',
          label: 'Connected'
        }
      case 'connecting':
        return {
          icon: Activity,
          color: 'text-emerald-800 dark:text-emerald-700',
          bgColor: 'bg-emerald-500/5 dark:bg-emerald-950',
          label: 'Connecting'
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-[var(--text-primary)] dark:text-[var(--text-tertiary)]',
          bgColor: 'bg-white/[0.03] dark:bg-[var(--surface-0)]',
          label: 'Disconnected'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950',
          label: 'Error'
        }
      default:
        return {
          icon: HelpCircle,
          color: 'text-[var(--text-primary)] dark:text-[var(--text-tertiary)]',
          bgColor: 'bg-white/[0.03] dark:bg-[var(--surface-0)]',
          label: 'Unknown'
        }
    }
  }

  // Calculate overall health score
  const overallHealth = useMemo(() => {
    const score = endpointSummary.healthScore
    if (score >= 80) return 'healthy'
    if (score >= 50) return 'warning'
    return 'error'
  }, [endpointSummary])

  const overallDisplay = getStatusDisplay(overallHealth as EndpointStatus)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Summary Card */}
      <Card className="border-[var(--border-default)] dark:border-white/[0.06]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]" />
              <CardTitle className="text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                System Health Monitor
              </CardTitle>
            </div>
            <Button
              onClick={() => testAllEndpoints()}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-[var(--border-default)] dark:border-[var(--border-default)] text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          <CardDescription className="text-[var(--text-primary)] dark:text-[var(--text-tertiary)]">
            Real-time monitoring of REST endpoints and WebSocket connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Overall Health Score */}
          <div className={cn('rounded-lg p-2 mb-2', overallDisplay.bgColor)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <overallDisplay.icon className={cn('h-6 w-6', overallDisplay.color)} />
                <div>
                  <h3 className={cn('font-semibold', overallDisplay.color)}>
                    Overall System Status: {overallDisplay.label}
                  </h3>
                  <p className="text-sm text-[var(--text-primary)] dark:text-[var(--text-tertiary)]">
                    Health Score: {endpointSummary.healthScore}%
                  </p>
                </div>
              </div>
              {lastCheck && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] dark:text-[var(--text-tertiary)]">
                  <Clock className="h-4 w-4" />
                  <span>Last check: {formatTime(lastCheck)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* REST Endpoints */}
            <StatCard
              label="Total Endpoints"
              value={endpointSummary.totalEndpoints}
              icon={Server}
              color="text-emerald-800 dark:text-emerald-700"
            />
            <StatCard
              label="Healthy"
              value={endpointSummary.healthyCount}
              icon={CheckCircle2}
              color="text-green-600 dark:text-green-400"
            />
            <StatCard
              label="Warnings"
              value={endpointSummary.warningCount}
              icon={AlertTriangle}
              color="text-yellow-600 dark:text-yellow-400"
            />
            <StatCard
              label="Errors"
              value={endpointSummary.errorCount}
              icon={XCircle}
              color="text-red-600 dark:text-red-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* WebSocket Connections */}
      <Card className="border-[var(--border-default)] dark:border-white/[0.06]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]" />
              <CardTitle className="text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                WebSocket Connections
              </CardTitle>
            </div>
            <Button
              onClick={() => setShowSockets(!showSockets)}
              size="sm"
              variant="ghost"
              className="text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]"
            >
              {showSockets ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
          <CardDescription className="text-[var(--text-primary)] dark:text-[var(--text-tertiary)]">
            {socketSummary.connected} of {socketSummary.total} connected
          </CardDescription>
        </CardHeader>
        {showSockets && (
          <CardContent>
            <div className="space-y-2">
              {Array.from(sockets.values()).map(socket => {
                const display = getSocketStatusDisplay(socket.status)
                const StatusIcon = display.icon

                return (
                  <div
                    key={socket.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      display.bgColor
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <StatusIcon className={cn('h-5 w-5 flex-shrink-0', display.color)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)] truncate">
                            {socket.category}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn('text-xs flex-shrink-0', display.color)}
                          >
                            {display.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] dark:text-[var(--text-tertiary)] truncate">
                          {socket.description}
                        </p>
                      </div>
                    </div>
                    {socket.errorMessage && (
                      <span className="text-xs text-red-600 dark:text-red-400 ml-2">
                        {socket.errorMessage}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* REST Endpoints by Category */}
      <Card className="border-[var(--border-default)] dark:border-white/[0.06]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]" />
              <CardTitle className="text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                REST API Endpoints
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={expandAll}
                size="sm"
                variant="ghost"
                className="text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]"
              >
                Expand All
              </Button>
              <Button
                onClick={collapseAll}
                size="sm"
                variant="ghost"
                className="text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]"
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-2">
            <div className="space-y-2">
              {API_ENDPOINT_CATEGORIES.map(category => {
                const isExpanded = expandedCategories.has(category.name)
                const categoryEndpoints = category.endpoints.map(e =>
                  endpoints.get(e.id)
                ).filter(Boolean)

                const healthyCount = categoryEndpoints.filter(e => e?.status === 'healthy').length
                const errorCount = categoryEndpoints.filter(e => e?.status === 'error').length
                const warningCount = categoryEndpoints.filter(e => e?.status === 'warning').length

                return (
                  <Collapsible
                    key={category.name}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category.name)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] dark:bg-[var(--surface-1)] hover:bg-white/[0.05] dark:hover:bg-[var(--surface-3)] transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]" />
                          )}
                          <h3 className="font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                            {category.name}
                          </h3>
                          <span className="text-sm text-[var(--text-primary)] dark:text-[var(--text-tertiary)]">
                            ({categoryEndpoints.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {healthyCount > 0 && (
                            <Badge variant="outline" className="text-green-600 dark:text-green-400">
                              {healthyCount} healthy
                            </Badge>
                          )}
                          {warningCount > 0 && (
                            <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
                              {warningCount} warning
                            </Badge>
                          )}
                          {errorCount > 0 && (
                            <Badge variant="outline" className="text-red-600 dark:text-red-400">
                              {errorCount} error
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-7 mt-2 space-y-1">
                        {categoryEndpoints.map(endpoint => {
                          if (!endpoint) return null
                          const display = getStatusDisplay(endpoint.status)
                          const StatusIcon = display.icon

                          return (
                            <div
                              key={endpoint.id}
                              className={cn(
                                'flex items-center justify-between p-2 rounded text-sm',
                                compactMode ? 'py-1' : 'py-2',
                                display.bgColor
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <StatusIcon className={cn('h-4 w-4 flex-shrink-0', display.color)} />
                                <code className="text-xs font-mono bg-white dark:bg-[var(--surface-0)] px-2 py-0.5 rounded border border-[var(--border-default)] dark:border-white/[0.06] text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                                  {endpoint.method}
                                </code>
                                <span className="text-[var(--text-tertiary)] dark:text-[var(--text-secondary)] truncate">
                                  {endpoint.path}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                {endpoint.responseTime && (
                                  <span className="text-xs text-[var(--text-primary)] dark:text-[var(--text-tertiary)]">
                                    {endpoint.responseTime.toFixed(0)}ms
                                  </span>
                                )}
                                {endpoint.errorMessage && (
                                  <span className="text-xs text-red-600 dark:text-red-400">
                                    {endpoint.errorMessage}
                                  </span>
                                )}
                                {endpoint.lastChecked && (
                                  <span className="text-xs text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)]">
                                    {formatTime(endpoint.lastChecked)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for stat cards
function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string
  value: number
  icon: any
  color: string
}) {
  return (
    <div className="bg-white dark:bg-[var(--surface-0)] border border-[var(--border-default)] dark:border-white/[0.06] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-xs font-medium text-[var(--text-primary)] dark:text-[var(--text-tertiary)]">
          {label}
        </span>
      </div>
      <div className={cn('text-sm font-bold', color)}>{value}</div>
    </div>
  )
}

export default EndpointHealthDashboard
