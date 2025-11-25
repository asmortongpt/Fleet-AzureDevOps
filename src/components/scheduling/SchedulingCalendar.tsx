/**
 * Interactive Calendar Component for Fleet Scheduling
 * Displays vehicle reservations and maintenance appointments
 */

import { useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ChevronLeftIcon from 'lucide-react/dist/esm/icons/chevron-left'
import ChevronRightIcon from 'lucide-react/dist/esm/icons/chevron-right'
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar'
import AlertCircleIcon from 'lucide-react/dist/esm/icons/alert-circle'
import TruckIcon from 'lucide-react/dist/esm/icons/truck'
import WrenchIcon from 'lucide-react/dist/esm/icons/wrench'
import { cn } from '@/lib/utils'
import { VehicleReservation, MaintenanceAppointment } from '@/types/scheduling'

export type CalendarView = 'day' | 'week' | 'month'

interface ScheduleEvent {
  id: string
  type: 'reservation' | 'maintenance'
  title: string
  start: Date
  end: Date
  vehicleId: string
  vehicleNumber?: string
  status: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  color: string
  data: VehicleReservation | MaintenanceAppointment
}

interface SchedulingCalendarProps {
  reservations?: VehicleReservation[]
  appointments?: MaintenanceAppointment[]
  isLoading?: boolean
  error?: Error | null
  onEventClick?: (event: ScheduleEvent) => void
  onTimeSlotClick?: (date: Date) => void
  onCreateReservation?: (date: Date) => void
  onCreateMaintenance?: (date: Date) => void
  defaultView?: CalendarView
  className?: string
}

const EVENT_COLORS = {
  reservation: {
    pending: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    confirmed: 'bg-blue-100 border-blue-300 text-blue-900',
    active: 'bg-green-100 border-green-300 text-green-900',
    completed: 'bg-gray-100 border-gray-300 text-gray-600',
    cancelled: 'bg-red-100 border-red-300 text-red-900',
  },
  maintenance: {
    scheduled: 'bg-purple-100 border-purple-300 text-purple-900',
    in_progress: 'bg-orange-100 border-orange-300 text-orange-900',
    completed: 'bg-gray-100 border-gray-300 text-gray-600',
    cancelled: 'bg-red-100 border-red-300 text-red-900',
  },
}

const PRIORITY_COLORS = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

export function SchedulingCalendar({
  reservations = [],
  appointments = [],
  isLoading = false,
  error = null,
  onEventClick,
  onTimeSlotClick,
  onCreateReservation,
  onCreateMaintenance,
  defaultView = 'month',
  className,
}: SchedulingCalendarProps) {
  const [view, setView] = useState<CalendarView>(defaultView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>()

  // Transform data into schedule events
  const events = useMemo<ScheduleEvent[]>(() => {
    const reservationEvents: ScheduleEvent[] = reservations.map((res) => ({
      id: res.id,
      type: 'reservation' as const,
      title: `${res.make || ''} ${res.model || ''} ${res.license_plate || ''}`.trim() || 'Vehicle Reservation',
      start: typeof res.start_time === 'string' ? parseISO(res.start_time) : res.start_time,
      end: typeof res.end_time === 'string' ? parseISO(res.end_time) : res.end_time,
      vehicleId: res.vehicle_id,
      vehicleNumber: res.license_plate,
      status: res.status,
      color: EVENT_COLORS.reservation[res.status as keyof typeof EVENT_COLORS.reservation] || EVENT_COLORS.reservation.pending,
      data: res,
    }))

    const appointmentEvents: ScheduleEvent[] = appointments.map((appt) => ({
      id: appt.id,
      type: 'maintenance' as const,
      title: `${appt.appointment_type || 'Maintenance'} - ${appt.make || ''} ${appt.model || ''}`.trim(),
      start: typeof appt.scheduled_start === 'string' ? parseISO(appt.scheduled_start) : appt.scheduled_start,
      end: typeof appt.scheduled_end === 'string' ? parseISO(appt.scheduled_end) : appt.scheduled_end,
      vehicleId: appt.vehicle_id || '',
      vehicleNumber: appt.license_plate,
      status: appt.status,
      priority: appt.priority,
      color: EVENT_COLORS.maintenance[appt.status as keyof typeof EVENT_COLORS.maintenance] || EVENT_COLORS.maintenance.scheduled,
      data: appt,
    }))

    return [...reservationEvents, ...appointmentEvents].sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [reservations, appointments])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    return events.filter((event) => {
      const eventStart = startOfDay(event.start)
      const eventEnd = endOfDay(event.end)
      return eventStart <= dayEnd && eventEnd >= dayStart
    })
  }

  // Navigation handlers
  const navigatePrevious = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const navigateNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  // Get date range for current view
  const getDateRange = () => {
    if (view === 'month') {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
        title: format(currentDate, 'MMMM yyyy'),
      }
    } else if (view === 'week') {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return {
        start,
        end,
        title: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
      }
    } else {
      return {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate),
        title: format(currentDate, 'EEEE, MMMM d, yyyy'),
      }
    }
  }

  const dateRange = getDateRange()

  // Get days to display
  const getDaysToDisplay = () => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      return eachDayOfInterval({ start, end })
    } else if (view === 'week') {
      return eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
    } else {
      return [currentDate]
    }
  }

  const days = getDaysToDisplay()

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setCurrentDate(date)
      if (view === 'month') {
        setView('day')
      }
      onTimeSlotClick?.(date)
    }
  }

  const handleEventClick = (event: ScheduleEvent) => {
    onEventClick?.(event)
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load calendar events: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Fleet Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
          </div>
          <h3 className="text-lg font-semibold">{dateRange.title}</h3>
          <div className="flex items-center gap-4">
            {onCreateReservation && (
              <Button variant="outline" size="sm" onClick={() => onCreateReservation(selectedDate || currentDate)}>
                <TruckIcon className="h-4 w-4 mr-1" />
                New Reservation
              </Button>
            )}
            {onCreateMaintenance && (
              <Button variant="outline" size="sm" onClick={() => onCreateMaintenance(selectedDate || currentDate)}>
                <WrenchIcon className="h-4 w-4 mr-1" />
                New Maintenance
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {view === 'month' && (
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold p-2 bg-muted">
                    {day}
                  </div>
                ))}
                {days.map((day) => {
                  const dayEvents = getEventsForDate(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())
                  const isSelected = selectedDate && isSameDay(day, selectedDate)

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        'min-h-24 p-1 border rounded-md text-left hover:bg-accent transition-colors',
                        !isCurrentMonth && 'opacity-40',
                        isToday && 'ring-2 ring-primary',
                        isSelected && 'bg-accent'
                      )}
                    >
                      <div className={cn('text-sm font-semibold mb-1', isToday && 'text-primary')}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                            className={cn(
                              'text-xs px-1 py-0.5 rounded border cursor-pointer truncate',
                              event.color
                            )}
                            title={event.title}
                          >
                            {event.type === 'reservation' ? '🚗' : '🔧'} {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {view === 'week' && (
              <div className="grid grid-cols-8 gap-2">
                <div className="col-span-1 text-sm font-semibold sticky left-0 bg-background">
                  Time
                </div>
                {days.map((day) => (
                  <div key={day.toISOString()} className="text-center">
                    <div className="text-sm font-semibold">{format(day, 'EEE')}</div>
                    <div className={cn('text-lg', isSameDay(day, new Date()) && 'text-primary font-bold')}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
                <ScrollArea className="col-span-8 h-[600px]">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div key={hour} className="grid grid-cols-8 border-t">
                      <div className="col-span-1 text-xs text-muted-foreground p-2">
                        {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                      </div>
                      {days.map((day) => {
                        const hourStart = new Date(day).setHours(hour, 0, 0, 0)
                        const hourEnd = new Date(day).setHours(hour, 59, 59, 999)
                        const hourEvents = events.filter((event) => {
                          return event.start.getTime() <= hourEnd && event.end.getTime() >= hourStart
                        })

                        return (
                          <button
                            key={`${day.toISOString()}-${hour}`}
                            onClick={() => handleDateSelect(new Date(day.setHours(hour)))}
                            className="min-h-12 p-1 border-r hover:bg-accent transition-colors relative"
                          >
                            {hourEvents.map((event) => (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEventClick(event)
                                }}
                                className={cn(
                                  'text-xs px-1 py-0.5 rounded border cursor-pointer mb-0.5 truncate',
                                  event.color
                                )}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            {view === 'day' && (
              <div className="space-y-2">
                <ScrollArea className="h-[600px] pr-4">
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const hourStart = new Date(currentDate).setHours(hour, 0, 0, 0)
                    const hourEnd = new Date(currentDate).setHours(hour, 59, 59, 999)
                    const hourEvents = events.filter((event) => {
                      return event.start.getTime() <= hourEnd && event.end.getTime() >= hourStart
                    })

                    return (
                      <div key={hour} className="flex border-t">
                        <div className="w-24 text-sm text-muted-foreground p-2 flex-shrink-0">
                          {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                        </div>
                        <button
                          onClick={() => handleDateSelect(new Date(currentDate.setHours(hour)))}
                          className="flex-1 min-h-20 p-2 hover:bg-accent transition-colors"
                        >
                          <div className="space-y-1">
                            {hourEvents.map((event) => (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEventClick(event)
                                }}
                                className={cn(
                                  'p-2 rounded border cursor-pointer',
                                  event.color
                                )}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    {event.type === 'reservation' ? (
                                      <TruckIcon className="h-4 w-4" />
                                    ) : (
                                      <WrenchIcon className="h-4 w-4" />
                                    )}
                                    <span className="font-semibold">{event.title}</span>
                                  </div>
                                  {event.priority && (
                                    <Badge variant="outline" className={cn('text-white', PRIORITY_COLORS[event.priority])}>
                                      {event.priority}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs">
                                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                                </div>
                                {event.vehicleNumber && (
                                  <div className="text-xs mt-1">Vehicle: {event.vehicleNumber}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </ScrollArea>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Reservation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Completed</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
