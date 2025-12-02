/**
 * Real-Time Event Hub
 * Aggregates events from all modules into a unified stream
 *
 * Consolidates:
 * - Vehicle telemetry events
 * - Maintenance alerts
 * - Driver performance alerts
 * - Fuel anomalies
 * - System notifications
 * - Communication events (Teams, Outlook)
 *
 * Created: 2025-11-23
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Car, User, Wrench, GasPump, Warning,
  Lightning, Clock, MapPin, ChatCircle, Envelope,
  ArrowRight, X, Funnel, CaretDown, Check,
  Broadcast, Pulse, CheckCircle, XCircle
} from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useVehicleTelemetry, type TelemetryUpdate } from '@/hooks/useVehicleTelemetry'
import { useWebSocket, type WebSocketMessage } from '@/hooks/useWebSocket'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

// ============================================================================
// TYPES
// ============================================================================

export type EventCategory =
  | 'telemetry' | 'maintenance' | 'driver' | 'fuel'
  | 'alert' | 'system' | 'communication' | 'dispatch'

export type EventSeverity = 'info' | 'warning' | 'critical' | 'success'

export interface FleetEvent {
  id: string
  category: EventCategory
  severity: EventSeverity
  title: string
  description: string
  timestamp: Date
  entityType?: string
  entityId?: string
  entityLabel?: string
  metadata?: Record<string, any>
  acknowledged?: boolean
  source?: string
}

interface EventHubProps {
  className?: string
  maxEvents?: number
  autoConnect?: boolean
  showFilters?: boolean
  compact?: boolean
  onEventClick?: (event: FleetEvent) => void
}

// ============================================================================
// EVENT CONFIGURATION
// ============================================================================

const CATEGORY_CONFIG: Record<EventCategory, {
  icon: React.ElementType
  label: string
  color: string
}> = {
  telemetry: { icon: Pulse, label: 'Telemetry', color: 'text-blue-500' },
  maintenance: { icon: Wrench, label: 'Maintenance', color: 'text-orange-500' },
  driver: { icon: User, label: 'Driver', color: 'text-green-500' },
  fuel: { icon: GasPump, label: 'Fuel', color: 'text-amber-500' },
  alert: { icon: Warning, label: 'Alert', color: 'text-red-500' },
  system: { icon: Lightning, label: 'System', color: 'text-purple-500' },
  communication: { icon: ChatCircle, label: 'Comms', color: 'text-cyan-500' },
  dispatch: { icon: MapPin, label: 'Dispatch', color: 'text-indigo-500' }
}

const SEVERITY_CONFIG: Record<EventSeverity, {
  color: string
  bgColor: string
  borderColor: string
}> = {
  info: { color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  warning: { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  success: { color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
}

// ============================================================================
// EVENT ITEM COMPONENT
// ============================================================================

interface EventItemProps {
  event: FleetEvent
  compact?: boolean
  onAcknowledge?: (id: string) => void
  onClick?: () => void
}

function EventItem({ event, compact, onAcknowledge, onClick }: EventItemProps) {
  const categoryConfig = CATEGORY_CONFIG[event.category]
  const severityConfig = SEVERITY_CONFIG[event.severity]
  const Icon = categoryConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        "hover:shadow-md hover:border-primary/30",
        severityConfig.bgColor,
        severityConfig.borderColor,
        event.acknowledged && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-1.5 rounded-md",
          event.severity === 'critical' ? 'bg-red-100 animate-pulse' : 'bg-white/80'
        )}>
          <Icon className={cn("w-4 h-4", categoryConfig.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "font-medium truncate",
              compact ? "text-xs" : "text-sm",
              severityConfig.color
            )}>
              {event.title}
            </span>
            {event.severity === 'critical' && (
              <Badge variant="destructive" className="text-[10px] h-4">
                Critical
              </Badge>
            )}
          </div>

          {!compact && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {event.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(event.timestamp, { addSuffix: true })}
              </span>
              {event.entityLabel && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <Badge variant="outline" className="text-[10px] h-4">
                    {event.entityLabel}
                  </Badge>
                </>
              )}
            </div>

            {!event.acknowledged && onAcknowledge && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAcknowledge(event.id)
                }}
                className="h-5 w-5 p-0"
              >
                <Check className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RealTimeEventHub({
  className,
  maxEvents = 50,
  autoConnect = true,
  showFilters = true,
  compact = false,
  onEventClick
}: EventHubProps) {
  const { push: drilldownPush } = useDrilldown()
  const [events, setEvents] = useState<FleetEvent[]>([])
  const [filters, setFilters] = useState<Set<EventCategory>>(new Set())
  const [severityFilter, setSeverityFilter] = useState<Set<EventSeverity>>(new Set())
  const [showAcknowledged, setShowAcknowledged] = useState(true)

  // Real-time telemetry
  const { recentEvents: telemetryEvents, isConnected: telemetryConnected } = useVehicleTelemetry({
    enabled: autoConnect
  })

  // WebSocket for other events
  const { isConnected: wsConnected, subscribe } = useWebSocket({
    url: autoConnect ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/events/ws` : undefined
  })

  // Transform telemetry events
  useEffect(() => {
    telemetryEvents.forEach(wsEvent => {
      const newEvent = transformWebSocketEvent(wsEvent)
      if (newEvent) {
        addEvent(newEvent)
      }
    })
  }, [telemetryEvents])

  // Subscribe to various event types
  useEffect(() => {
    if (!wsConnected) return

    const eventTypes = [
      'maintenance:alert',
      'driver:alert',
      'fuel:anomaly',
      'system:notification',
      'dispatch:update',
      'teams:new-message',
      'outlook:new-email'
    ]

    const unsubscribers = eventTypes.map(type =>
      subscribe(type, (msg) => {
        const event = transformWebSocketEvent(msg)
        if (event) addEvent(event)
      })
    )

    return () => unsubscribers.forEach(unsub => unsub())
  }, [wsConnected, subscribe])

  // Add event to state
  const addEvent = useCallback((event: FleetEvent) => {
    setEvents(prev => {
      // Deduplicate by ID
      if (prev.some(e => e.id === event.id)) return prev
      return [event, ...prev].slice(0, maxEvents)
    })
  }, [maxEvents])

  // Acknowledge event
  const acknowledgeEvent = useCallback((id: string) => {
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, acknowledged: true } : e
    ))
  }, [])

  // Handle event click
  const handleEventClick = useCallback((event: FleetEvent) => {
    if (onEventClick) {
      onEventClick(event)
    } else if (event.entityType && event.entityId) {
      drilldownPush({
        id: `${event.entityType}-${event.entityId}`,
        type: event.entityType,
        label: event.entityLabel || event.title,
        data: event.metadata
      })
    }
  }, [onEventClick, drilldownPush])

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.size > 0 && !filters.has(event.category)) return false
      if (severityFilter.size > 0 && !severityFilter.has(event.severity)) return false
      if (!showAcknowledged && event.acknowledged) return false
      return true
    })
  }, [events, filters, severityFilter, showAcknowledged])

  // Count by severity
  const criticalCount = useMemo(() =>
    events.filter(e => e.severity === 'critical' && !e.acknowledged).length,
    [events]
  )

  // Toggle filter
  const toggleFilter = (category: EventCategory) => {
    setFilters(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Broadcast className={cn(
              "w-4 h-4",
              (telemetryConnected || wsConnected) ? "text-green-500 animate-pulse" : "text-muted-foreground"
            )} />
            Event Hub
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} critical
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  (telemetryConnected || wsConnected) ? "bg-green-500" : "bg-red-500"
                )} />
              </TooltipTrigger>
              <TooltipContent>
                {(telemetryConnected || wsConnected) ? 'Connected' : 'Disconnected'}
              </TooltipContent>
            </Tooltip>

            {/* Filter Dropdown */}
            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Funnel className="w-4 h-4 mr-1" />
                    {filters.size > 0 && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {filters.size}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={filters.has(key as EventCategory)}
                        onCheckedChange={() => toggleFilter(key as EventCategory)}
                      >
                        <Icon className={cn("w-4 h-4 mr-2", config.color)} />
                        {config.label}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={showAcknowledged}
                    onCheckedChange={setShowAcknowledged}
                  >
                    Show acknowledged
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className={compact ? "h-[300px]" : "h-[500px]"}>
          <div className="p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events to display</p>
                </motion.div>
              ) : (
                filteredEvents.map(event => (
                  <EventItem
                    key={event.id}
                    event={event}
                    compact={compact}
                    onAcknowledge={acknowledgeEvent}
                    onClick={() => handleEventClick(event)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformWebSocketEvent(wsEvent: WebSocketMessage): FleetEvent | null {
  const baseId = `${wsEvent.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`

  switch (wsEvent.type) {
    case 'vehicle:telemetry':
    case 'telemetry:update':
      return {
        id: baseId,
        category: 'telemetry',
        severity: wsEvent.data?.driver?.harshBraking ? 'warning' : 'info',
        title: 'Vehicle Telemetry Update',
        description: `Position updated for vehicle ${wsEvent.vehicleId}`,
        timestamp: new Date(wsEvent.timestamp || Date.now()),
        entityType: 'vehicle',
        entityId: wsEvent.vehicleId,
        entityLabel: wsEvent.vehicleId,
        metadata: wsEvent.data
      }

    case 'vehicle:alert':
    case 'alert':
      return {
        id: baseId,
        category: 'alert',
        severity: wsEvent.severity === 'critical' ? 'critical' : 'warning',
        title: wsEvent.alertType || 'Vehicle Alert',
        description: wsEvent.message || `Alert for vehicle ${wsEvent.vehicleId}`,
        timestamp: new Date(wsEvent.timestamp || Date.now()),
        entityType: 'vehicle',
        entityId: wsEvent.vehicleId,
        entityLabel: wsEvent.vehicleId,
        metadata: wsEvent
      }

    case 'maintenance:alert':
      return {
        id: baseId,
        category: 'maintenance',
        severity: wsEvent.urgency === 'immediate' ? 'critical' : 'warning',
        title: `Maintenance ${wsEvent.maintenanceType || 'Alert'}`,
        description: wsEvent.message || 'Maintenance required',
        timestamp: new Date(wsEvent.timestamp || Date.now()),
        entityType: 'vehicle',
        entityId: wsEvent.vehicleId,
        entityLabel: wsEvent.vehicleId
      }

    case 'fuel:update':
    case 'fuel:anomaly':
      return {
        id: baseId,
        category: 'fuel',
        severity: wsEvent.type === 'fuel:anomaly' ? 'warning' : 'info',
        title: 'Fuel Update',
        description: `Fuel level: ${wsEvent.fuelLevel}%`,
        timestamp: new Date(wsEvent.timestamp || Date.now()),
        entityType: 'vehicle',
        entityId: wsEvent.vehicleId,
        entityLabel: wsEvent.vehicleId
      }

    case 'teams:new-message':
      return {
        id: baseId,
        category: 'communication',
        severity: 'info',
        title: 'New Teams Message',
        description: wsEvent.subject || 'New message received',
        timestamp: new Date(wsEvent.timestamp || Date.now()),
        source: 'teams',
        metadata: wsEvent
      }

    case 'outlook:new-email':
      return {
        id: baseId,
        category: 'communication',
        severity: 'info',
        title: 'New Email',
        description: wsEvent.subject || 'New email received',
        timestamp: new Date(wsEvent.timestamp || Date.now()),
        source: 'outlook',
        metadata: wsEvent
      }

    case 'driver:alert':
      return {
        id: baseId,
        category: 'driver',
        severity: wsEvent.severity || 'warning',
        title: wsEvent.alertType || 'Driver Alert',
        description: wsEvent.message || 'Driver event detected',
        timestamp: new Date(wsEvent.timestamp || Date.now()),
        entityType: 'driver',
        entityId: wsEvent.driverId,
        entityLabel: wsEvent.driverName
      }

    case 'dispatch:update':
      return {
        id: baseId,
        category: 'dispatch',
        severity: 'info',
        title: 'Dispatch Update',
        description: wsEvent.message || 'Route/dispatch updated',
        timestamp: new Date(wsEvent.timestamp || Date.now()),
        entityType: 'route',
        entityId: wsEvent.routeId,
        metadata: wsEvent
      }

    case 'emulator:started':
      return {
        id: baseId,
        category: 'system',
        severity: 'success',
        title: 'Emulator Started',
        description: 'Vehicle telemetry emulator is now running',
        timestamp: new Date()
      }

    case 'emulator:stopped':
      return {
        id: baseId,
        category: 'system',
        severity: 'info',
        title: 'Emulator Stopped',
        description: 'Vehicle telemetry emulator has stopped',
        timestamp: new Date()
      }

    default:
      return null
  }
}

// ============================================================================
// COMPACT BADGE VERSION
// ============================================================================

interface EventBadgeProps {
  className?: string
}

export function EventBadge({ className }: EventBadgeProps) {
  const { recentEvents } = useVehicleTelemetry({ enabled: true })

  const criticalCount = useMemo(() =>
    recentEvents.filter(e =>
      e.type === 'vehicle:alert' || e.type === 'alert'
    ).length,
    [recentEvents]
  )

  if (criticalCount === 0) return null

  return (
    <Badge
      variant="destructive"
      className={cn("animate-pulse", className)}
    >
      {criticalCount}
    </Badge>
  )
}

export default RealTimeEventHub
