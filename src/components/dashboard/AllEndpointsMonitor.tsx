/**
 * All Endpoints Monitor Component
 * Displays and monitors ALL available API endpoints and emulator connections
 */

import {
  Circle,
  MagnifyingGlass,
  CaretDown,
  CaretRight,
  Play,
  ArrowClockwise,
  CheckCircle,
  Warning,
  XCircle,
  Question,
  Clock
} from '@phosphor-icons/react'
import { useState, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { API_ENDPOINT_CATEGORIES, WEBSOCKET_CONNECTIONS } from '@/config/endpoints'
import { useEndpointHealth } from '@/hooks/useEndpointHealth'
import { cn } from '@/lib/utils'
import { EndpointStatus, SocketStatus } from '@/types/endpoint-monitor'

interface AllEndpointsMonitorProps {
  className?: string
}

export function AllEndpointsMonitor({ className }: AllEndpointsMonitorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const {
    endpoints,
    
    summary,
    testEndpoint,
    testAllEndpoints,
    isLoading,
    lastCheck
  } = useEndpointHealth({
    enabled: true,
    pollInterval: 30000 // 30 seconds
  })

  // Filter endpoints by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return API_ENDPOINT_CATEGORIES

    const query = searchQuery.toLowerCase()
    return API_ENDPOINT_CATEGORIES.map(category => ({
      ...category,
      endpoints: category.endpoints.filter(
        endpoint =>
          endpoint.path.toLowerCase().includes(query) ||
          endpoint.description.toLowerCase().includes(query) ||
          endpoint.method.toLowerCase().includes(query)
      )
    })).filter(category => category.endpoints.length > 0)
  }, [searchQuery])

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  // Expand all categories
  const expandAll = () => {
    setExpandedCategories(new Set(API_ENDPOINT_CATEGORIES.map(c => c.name)))
  }

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  // Get status icon and color
  const getStatusIndicator = (status: EndpointStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-3 h-3 text-green-600" weight="fill" />
      case 'warning':
        return <Warning className="w-3 h-3 text-yellow-600" weight="fill" />
      case 'error':
        return <XCircle className="w-3 h-3 text-red-600" weight="fill" />
      default:
        return <Question className="w-3 h-3 text-gray-400" weight="fill" />
    }
  }

  // Get method badge color
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'POST':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'PUT':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'PATCH':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'DELETE':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  // Format response time
  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return '-'
    if (ms < 100) return `${ms.toFixed(0)}ms`
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Get socket status color
  const getSocketStatusColor = (status: SocketStatus) => {
    switch (status) {
      case 'connected':
        return 'text-green-600'
      case 'connecting':
        return 'text-yellow-600'
      case 'disconnected':
        return 'text-gray-400'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="h-7 text-xs px-2"
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="h-7 text-xs px-2"
          >
            Collapse All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testAllEndpoints()}
            disabled={isLoading}
            className="h-7 text-xs px-2"
          >
            <ArrowClockwise className={cn('w-3 h-3', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
          <Circle className="w-2 h-2 fill-blue-500 text-blue-500" weight="fill" />
          <div>
            <p className="text-[10px] text-muted-foreground">Total</p>
            <p className="text-sm font-semibold">{summary.totalEndpoints}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
          <CheckCircle className="w-3 h-3 text-green-600" weight="fill" />
          <div>
            <p className="text-[10px] text-muted-foreground">Healthy</p>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">{summary.healthyCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
          <Warning className="w-3 h-3 text-yellow-600" weight="fill" />
          <div>
            <p className="text-[10px] text-muted-foreground">Warning</p>
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{summary.warningCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
          <XCircle className="w-3 h-3 text-red-600" weight="fill" />
          <div>
            <p className="text-[10px] text-muted-foreground">Error</p>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{summary.errorCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-900">
          <Question className="w-3 h-3 text-gray-400" weight="fill" />
          <div>
            <p className="text-[10px] text-muted-foreground">Unknown</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-400">{summary.unknownCount}</p>
          </div>
        </div>
      </div>

      {lastCheck && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          Last checked: {lastCheck.toLocaleTimeString()}
        </div>
      )}

      {/* Endpoint Categories */}
      <ScrollArea className="h-[500px] pr-3">
        <div className="space-y-2">
          {filteredCategories.map(category => {
            const isExpanded = expandedCategories.has(category.name)
            const categoryEndpoints = category.endpoints.map(ep => endpoints.get(ep.id))
            const healthyCount = categoryEndpoints.filter(e => e?.status === 'healthy').length
            const errorCount = categoryEndpoints.filter(e => e?.status === 'error').length
            const warningCount = categoryEndpoints.filter(e => e?.status === 'warning').length

            return (
              <Collapsible
                key={category.name}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category.name)}
              >
                <Card className="border border-border/50">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
                      <CardTitle className="text-xs font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <CaretDown className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <CaretRight className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span>{category.name}</span>
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                            {category.endpoints.length}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {healthyCount > 0 && (
                            <Badge variant="default" className="h-4 px-1.5 text-[9px] bg-green-600">
                              {healthyCount}
                            </Badge>
                          )}
                          {warningCount > 0 && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-yellow-600 text-white">
                              {warningCount}
                            </Badge>
                          )}
                          {errorCount > 0 && (
                            <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                              {errorCount}
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="px-3 pb-2 pt-0">
                      <div className="space-y-1">
                        {category.endpoints.map(endpoint => {
                          const health = endpoints.get(endpoint.id)
                          if (!health) return null

                          return (
                            <div
                              key={endpoint.id}
                              className="flex items-center justify-between p-2 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors group"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getStatusIndicator(health.status)}
                                <Badge className={cn('h-4 px-1.5 text-[9px] font-mono', getMethodColor(endpoint.method))}>
                                  {endpoint.method}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-mono truncate text-foreground">
                                    {endpoint.path}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground truncate">
                                    {endpoint.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-2">
                                {health.responseTime !== null && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {formatResponseTime(health.responseTime)}
                                  </span>
                                )}
                                {health.requestCount > 0 && (
                                  <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                                    {health.successCount}/{health.requestCount}
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => testEndpoint(endpoint.id)}
                                  disabled={isLoading}
                                >
                                  <Play className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}

          {/* WebSocket Connections */}
          <Collapsible
            open={expandedCategories.has('WebSockets')}
            onOpenChange={() => toggleCategory('WebSockets')}
          >
            <Card className="border border-border/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
                  <CardTitle className="text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {expandedCategories.has('WebSockets') ? (
                        <CaretDown className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <CaretRight className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span>WebSockets</span>
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {WEBSOCKET_CONNECTIONS.length}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
            </Card>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  )
}