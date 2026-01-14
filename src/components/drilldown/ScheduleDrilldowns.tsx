/**
 * ScheduleDrilldowns - Schedule and calendar drilldown components
 * Covers Calendar/Schedule items from OperationsHub
 */

import {
  Calendar,
  Clock,
  MapPin,
  User,
  Truck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { swrFetcher } from '@/lib/fetcher'

const fetcher = swrFetcher

// ============================================
// Scheduled Item Detail Panel
// ============================================
interface ScheduledItemDetailPanelProps {
  itemId: string
}

export function ScheduledItemDetailPanel({ itemId }: ScheduledItemDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: item, error, isLoading, mutate } = useSWR(
    `/api/schedule/${itemId}`,
    fetcher
  )

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'shift':
        return 'default'
      case 'maintenance':
        return 'secondary'
      case 'delivery':
        return 'outline'
      case 'pickup':
        return 'outline'
      case 'inspection':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary'
      case 'in-progress':
        return 'default'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {item && (
        <div className="space-y-2">
          {/* Item Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.type} • {item.item_number}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                <Badge variant={getTypeVariant(item.type)}>{item.type}</Badge>
              </div>
            </div>
            <Calendar className="h-9 w-12 text-muted-foreground" />
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">
                  {item.start_time
                    ? new Date(item.start_time).toLocaleString()
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">
                  {item.end_time
                    ? new Date(item.end_time).toLocaleString()
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{item.description || 'No description provided'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{item.duration_hours || 0} hours</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Priority</p>
                      <p className="font-medium capitalize">{item.priority || 'Normal'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-medium">{item.created_by || 'System'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created Date</p>
                      <p className="font-medium">
                        {item.created_date
                          ? new Date(item.created_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.assigned_driver && (
                    <div className="p-3 rounded bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Driver</p>
                      </div>
                      <p className="text-sm">{item.assigned_driver}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() =>
                          push({
                            id: `driver-${item.driver_id}`,
                            type: 'driver-detail',
                            label: item.assigned_driver,
                            data: { driverId: item.driver_id },
                          })
                        }
                      >
                        View Driver
                      </Button>
                    </div>
                  )}

                  {item.assigned_vehicle && (
                    <div className="p-3 rounded bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Vehicle</p>
                      </div>
                      <p className="text-sm">{item.assigned_vehicle}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() =>
                          push({
                            id: `vehicle-${item.vehicle_id}`,
                            type: 'vehicle-detail',
                            label: item.assigned_vehicle,
                            data: { vehicleId: item.vehicle_id },
                          })
                        }
                      >
                        View Vehicle
                      </Button>
                    </div>
                  )}

                  {!item.assigned_driver && !item.assigned_vehicle && (
                    <p className="text-sm text-muted-foreground">No resources assigned</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Location Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.start_location && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Start Location</p>
                      </div>
                      <p className="text-sm">{item.start_location}</p>
                    </div>
                  )}

                  {item.end_location && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">End Location</p>
                      </div>
                      <p className="text-sm">{item.end_location}</p>
                    </div>
                  )}

                  {item.distance && (
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Distance</p>
                      <p className="font-medium">{item.distance} miles</p>
                    </div>
                  )}

                  {!item.start_location && !item.end_location && (
                    <p className="text-sm text-muted-foreground">No location information</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Notes & Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes available</p>
                  )}
                </CardContent>
              </Card>

              {item.special_instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Special Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{item.special_instructions}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          {item.status === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
              <Button variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {item.status === 'in-progress' && (
            <Button className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// Calendar List View
// ============================================
interface CalendarListViewProps {
  timeframe?: 'today' | 'week' | 'month'
  type?: 'shifts' | 'maintenance' | 'deliveries' | 'all'
}

export function CalendarListView({ timeframe, type = 'all' }: CalendarListViewProps) {
  const { push } = useDrilldown()

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (timeframe) params.append('timeframe', timeframe)
    if (type && type !== 'all') params.append('type', type)
    return `/api/schedule?${params.toString()}`
  }

  const { data: items, error, isLoading } = useSWR(buildUrl(), fetcher)

  const timeframeLabels = {
    today: "Today's Schedule",
    week: "This Week's Schedule",
    month: "This Month's Schedule",
  }

  const typeLabels = {
    shifts: 'Driver Shifts',
    maintenance: 'Maintenance Schedule',
    deliveries: 'Deliveries & Pickups',
    all: 'All Scheduled Items',
  }

  const getTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'shift':
        return <User className="h-4 w-4" />
      case 'maintenance':
        return <AlertCircle className="h-4 w-4" />
      case 'delivery':
      case 'pickup':
        return <Truck className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary'
      case 'in-progress':
        return 'default'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">
            {timeframe ? timeframeLabels[timeframe] : typeLabels[type]}
          </h3>
          <Badge>{items?.length || 0} items</Badge>
        </div>

        {/* Group by date */}
        <div className="space-y-2">
          {items &&
            Object.entries(
              items.reduce((groups: any, item: any) => {
                const date = new Date(item.start_time).toLocaleDateString()
                if (!groups[date]) groups[date] = []
                groups[date].push(item)
                return groups
              }, {})
            ).map(([date, dateItems]: [string, any]) => (
              <div key={date}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {date}
                </h4>
                <div className="space-y-2">
                  {dateItems.map((item: any) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() =>
                        push({
                          id: `schedule-${item.id}`,
                          type: 'scheduled-item',
                          label: item.title,
                          data: { itemId: item.id },
                        })
                      }
                    >
                      <CardContent className="p-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              <p className="font-semibold">{item.title}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.start_time).toLocaleTimeString()} -{' '}
                              {new Date(item.end_time).toLocaleTimeString()}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.assigned_driver && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {item.assigned_driver}
                                </span>
                              )}
                              {item.assigned_vehicle && (
                                <span className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  {item.assigned_vehicle}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge variant={getStatusVariant(item.status)}>
                              {item.status}
                            </Badge>
                            {item.priority && item.priority !== 'normal' && (
                              <p className="text-xs text-destructive font-semibold">
                                {item.priority} priority
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

          {(!items || items.length === 0) && (
            <Card>
              <CardContent className="p-3 text-center">
                <Calendar className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No scheduled items found for this period
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DrilldownContent>
  )
}
