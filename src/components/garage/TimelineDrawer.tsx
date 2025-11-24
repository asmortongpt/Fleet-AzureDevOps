/**
 * TimelineDrawer - Vehicle History & Records Panel
 *
 * Displays chronological timeline of vehicle events:
 * - Maintenance records
 * - Damage/crash reports
 * - Inspections
 * - Service history
 * - Mileage checkpoints
 *
 * Created: 2025-11-24
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Clock,
  Wrench,
  Warning,
  CheckCircle,
  Camera,
  CaretRight,
  CaretDown,
  Car,
  GasPump,
  Tire,
  Drop,
  Lightning,
  ShieldCheck,
  X,
  CaretDoubleRight
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Event types
type EventType = 'maintenance' | 'damage' | 'inspection' | 'service' | 'milestone' | 'recall'

interface TimelineEvent {
  id: string
  type: EventType
  title: string
  description?: string
  date: Date
  mileage?: number
  cost?: number
  status?: 'completed' | 'pending' | 'in_progress' | 'cancelled'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  photos?: string[]
  documents?: string[]
  technician?: string
  location?: string
  metadata?: Record<string, any>
}

interface TimelineDrawerProps {
  events: TimelineEvent[]
  isOpen: boolean
  onClose: () => void
  onEventClick?: (event: TimelineEvent) => void
  className?: string
}

// Event type colors and icons
const EVENT_CONFIG: Record<EventType, { icon: React.ElementType; color: string; bgColor: string }> = {
  maintenance: { icon: Wrench, color: 'text-blue-400', bgColor: 'bg-blue-950/50' },
  damage: { icon: Warning, color: 'text-red-400', bgColor: 'bg-red-950/50' },
  inspection: { icon: ShieldCheck, color: 'text-green-400', bgColor: 'bg-green-950/50' },
  service: { icon: GasPump, color: 'text-amber-400', bgColor: 'bg-amber-950/50' },
  milestone: { icon: CheckCircle, color: 'text-purple-400', bgColor: 'bg-purple-950/50' },
  recall: { icon: Warning, color: 'text-orange-400', bgColor: 'bg-orange-950/50' }
}

// Timeline Event Component
function TimelineEventCard({
  event,
  onClick,
  isExpanded,
  onToggle
}: {
  event: TimelineEvent
  onClick?: () => void
  isExpanded: boolean
  onToggle: () => void
}) {
  const config = EVENT_CONFIG[event.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'relative pl-8 pb-4',
        'before:absolute before:left-3 before:top-6 before:h-full before:w-px',
        'before:bg-gradient-to-b before:from-slate-600 before:to-transparent'
      )}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center',
          config.bgColor,
          'border border-slate-600'
        )}
      >
        <Icon className={cn('w-3 h-3', config.color)} />
      </div>

      {/* Event card */}
      <div
        className={cn(
          'rounded-lg border border-slate-700/50 overflow-hidden',
          'bg-gradient-to-br from-slate-900/90 to-slate-800/90',
          'hover:border-slate-600/50 transition-colors cursor-pointer'
        )}
        onClick={onClick}
      >
        <div className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm truncate">{event.title}</span>
                {event.severity && (
                  <Badge
                    variant={event.severity === 'critical' || event.severity === 'high' ? 'destructive' : 'secondary'}
                    className="text-[10px] px-1 py-0"
                  >
                    {event.severity}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{format(event.date, 'MMM d, yyyy')}</span>
                <span className="text-slate-600">|</span>
                <span>{formatDistanceToNow(event.date, { addSuffix: true })}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
            >
              {isExpanded ? (
                <CaretDown className="w-4 h-4" />
              ) : (
                <CaretRight className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-2">
            {event.mileage && (
              <span className="text-xs text-slate-500">
                <Car className="w-3 h-3 inline mr-1" />
                {event.mileage.toLocaleString()} mi
              </span>
            )}
            {event.cost && (
              <span className="text-xs text-slate-500">
                ${event.cost.toLocaleString()}
              </span>
            )}
            {event.status && (
              <Badge
                variant={
                  event.status === 'completed' ? 'default' :
                  event.status === 'pending' ? 'secondary' :
                  event.status === 'in_progress' ? 'outline' : 'destructive'
                }
                className="text-[10px]"
              >
                {event.status.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-slate-700/50 mt-2">
            {event.description && (
              <p className="text-xs text-slate-400 mt-2">{event.description}</p>
            )}
            {event.technician && (
              <p className="text-xs text-slate-500 mt-2">
                Technician: <span className="text-slate-400">{event.technician}</span>
              </p>
            )}
            {event.location && (
              <p className="text-xs text-slate-500">
                Location: <span className="text-slate-400">{event.location}</span>
              </p>
            )}
            {event.photos && event.photos.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Camera className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-500">
                  {event.photos.length} photo{event.photos.length > 1 ? 's' : ''} attached
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Quick Stats Component
function QuickStats({ events }: { events: TimelineEvent[] }) {
  const maintenanceCount = events.filter(e => e.type === 'maintenance').length
  const damageCount = events.filter(e => e.type === 'damage').length
  const inspectionCount = events.filter(e => e.type === 'inspection').length
  const totalCost = events.reduce((sum, e) => sum + (e.cost || 0), 0)

  return (
    <div className="grid grid-cols-4 gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
      <div className="text-center">
        <p className="text-lg font-bold text-blue-400">{maintenanceCount}</p>
        <p className="text-[10px] text-slate-500 uppercase">Service</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-red-400">{damageCount}</p>
        <p className="text-[10px] text-slate-500 uppercase">Damage</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-green-400">{inspectionCount}</p>
        <p className="text-[10px] text-slate-500 uppercase">Inspect</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-amber-400">${(totalCost / 1000).toFixed(1)}k</p>
        <p className="text-[10px] text-slate-500 uppercase">Total</p>
      </div>
    </div>
  )
}

export function TimelineDrawer({
  events,
  isOpen,
  onClose,
  onEventClick,
  className
}: TimelineDrawerProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // Filter events based on active tab
  const filteredEvents = activeTab === 'all'
    ? events
    : events.filter(e => e.type === activeTab)

  // Sort by date (most recent first)
  const sortedEvents = [...filteredEvents].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-80 z-50',
        'bg-gradient-to-b from-slate-950 to-slate-900',
        'border-l border-slate-700/50 shadow-2xl',
        'transform transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Vehicle Timeline</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <QuickStats events={events} />

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
          <TabsList className="grid grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs">Service</TabsTrigger>
            <TabsTrigger value="damage" className="text-xs">Damage</TabsTrigger>
            <TabsTrigger value="inspection" className="text-xs">Inspect</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Timeline */}
      <ScrollArea className="h-[calc(100%-200px)]">
        <div className="p-4">
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick?.(event)}
                isExpanded={expandedEvent === event.id}
                onToggle={() => setExpandedEvent(
                  expandedEvent === event.id ? null : event.id
                )}
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-950">
        <Button variant="outline" size="sm" className="w-full">
          <CaretDoubleRight className="w-4 h-4 mr-2" />
          View Full History
        </Button>
      </div>
    </div>
  )
}

// Demo data generator for testing
export function generateDemoEvents(vehicleId: string): TimelineEvent[] {
  const now = new Date()
  return [
    {
      id: `${vehicleId}-1`,
      type: 'maintenance',
      title: 'Oil Change & Filter',
      description: 'Replaced engine oil with synthetic 5W-30, replaced oil filter',
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      mileage: 45230,
      cost: 89,
      status: 'completed',
      technician: 'Mike Johnson',
      location: 'Fleet Service Center'
    },
    {
      id: `${vehicleId}-2`,
      type: 'inspection',
      title: 'Annual Safety Inspection',
      description: 'Passed all safety requirements, minor recommendations noted',
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      mileage: 44800,
      status: 'completed',
      severity: 'low'
    },
    {
      id: `${vehicleId}-3`,
      type: 'damage',
      title: 'Rear Bumper Impact',
      description: 'Minor collision in parking lot, scratches and small dent on rear bumper',
      date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      mileage: 44200,
      cost: 450,
      status: 'completed',
      severity: 'medium',
      photos: ['damage-1.jpg', 'damage-2.jpg']
    },
    {
      id: `${vehicleId}-4`,
      type: 'service',
      title: 'Brake Pad Replacement',
      description: 'Replaced front and rear brake pads, rotors resurfaced',
      date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      mileage: 43500,
      cost: 380,
      status: 'completed',
      technician: 'Sarah Chen'
    },
    {
      id: `${vehicleId}-5`,
      type: 'milestone',
      title: '40,000 Mile Service',
      description: 'Major service milestone - full system inspection',
      date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      mileage: 40000,
      cost: 650,
      status: 'completed'
    },
    {
      id: `${vehicleId}-6`,
      type: 'recall',
      title: 'Safety Recall: Airbag System',
      description: 'Manufacturer recall - airbag inflator replacement',
      date: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
      mileage: 38000,
      status: 'completed',
      severity: 'critical'
    }
  ]
}

export type { TimelineEvent, EventType }
export default TimelineDrawer
