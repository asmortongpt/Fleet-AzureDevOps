/**
 * RouteDetailPanel - Comprehensive route detail view for Operations Hub
 * Shows complete route with stops, waypoints, driver, vehicle, and timing
 */

import {
  Navigation,
  MapPin,
  User,
  Truck,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Circle,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Route as RouteIcon,
  Flag,
  FlagCheckered
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useDrilldown } from '@/contexts/DrilldownContext'

interface RouteDetailPanelProps {
  routeId: string
}

interface Stop {
  id: string
  sequence: number
  name: string
  address: string
  type: 'pickup' | 'delivery' | 'waypoint'
  status: 'pending' | 'completed' | 'skipped' | 'failed'
  scheduledTime?: string
  actualTime?: string
  estimatedTime?: string
  contactName?: string
  contactPhone?: string
  notes?: string
  packages?: number
}

interface RouteData {
  id: string
  number: string
  name: string
  description?: string
  status: 'active' | 'planned' | 'completed' | 'cancelled'

  // Vehicle and Driver
  vehicleId?: string
  vehicleName?: string
  vehicleNumber?: string
  driverId?: string
  driverName?: string
  driverPhone?: string
  driverEmail?: string

  // Route metrics
  stops: Stop[]
  stopsTotal: number
  stopsCompleted: number
  totalDistance: number
  distanceCovered: number
  estimatedTime: number
  actualTime?: number
  optimized: boolean

  // Timing
  scheduledStart?: string
  scheduledEnd?: string
  actualStart?: string
  actualEnd?: string
  estimatedCompletion?: string

  // Current status
  currentStopIndex?: number
  currentLocation?: string

  // Metadata
  createdAt?: string
  createdBy?: string
  updatedAt?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Demo data for fallback
const demoRouteData: Record<string, RouteData> = {
  'route-001': {
    id: 'route-001',
    number: 'RT-1001',
    name: 'Downtown Morning Circuit',
    description: 'Optimized delivery route covering downtown Tallahassee business district',
    status: 'active',
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    vehicleNumber: 'V-1001',
    driverId: 'drv-001',
    driverName: 'John Smith',
    driverPhone: '(850) 555-0101',
    driverEmail: 'john.smith@fleet.com',
    stopsTotal: 12,
    stopsCompleted: 8,
    totalDistance: 45.5,
    distanceCovered: 28.3,
    estimatedTime: 240,
    actualTime: 165,
    optimized: true,
    scheduledStart: '2026-01-03T08:00:00',
    scheduledEnd: '2026-01-03T12:00:00',
    actualStart: '2026-01-03T08:15:00',
    estimatedCompletion: '2026-01-03T11:45:00',
    currentStopIndex: 8,
    currentLocation: '234 Commerce Blvd, Tallahassee, FL',
    stops: [
      {
        id: 'stop-001',
        sequence: 1,
        name: 'Distribution Center',
        address: '123 Main St, Tallahassee, FL 32301',
        type: 'pickup',
        status: 'completed',
        scheduledTime: '2026-01-03T08:00:00',
        actualTime: '2026-01-03T08:15:00',
        contactName: 'Warehouse Supervisor',
        contactPhone: '(850) 555-0300',
        notes: 'Load verification completed',
        packages: 45
      },
      {
        id: 'stop-002',
        sequence: 2,
        name: 'Acme Corporation',
        address: '456 Oak Ave, Tallahassee, FL 32301',
        type: 'delivery',
        status: 'completed',
        scheduledTime: '2026-01-03T08:30:00',
        actualTime: '2026-01-03T08:35:00',
        contactName: 'Reception Desk',
        contactPhone: '(850) 555-0200',
        packages: 8
      },
      {
        id: 'stop-003',
        sequence: 3,
        name: 'Tech Solutions Inc',
        address: '789 Commerce Blvd, Tallahassee, FL 32301',
        type: 'delivery',
        status: 'completed',
        scheduledTime: '2026-01-03T08:50:00',
        actualTime: '2026-01-03T08:52:00',
        contactName: 'IT Department',
        contactPhone: '(850) 555-0201',
        packages: 5
      },
      {
        id: 'stop-004',
        sequence: 4,
        name: 'Medical Center',
        address: '234 Health Dr, Tallahassee, FL 32301',
        type: 'delivery',
        status: 'completed',
        scheduledTime: '2026-01-03T09:10:00',
        actualTime: '2026-01-03T09:08:00',
        contactName: 'Supply Room',
        contactPhone: '(850) 555-0202',
        notes: 'Delivery to loading dock B',
        packages: 12
      },
      {
        id: 'stop-005',
        sequence: 5,
        name: 'Legal Associates',
        address: '567 Law Plaza, Tallahassee, FL 32301',
        type: 'delivery',
        status: 'completed',
        scheduledTime: '2026-01-03T09:30:00',
        actualTime: '2026-01-03T09:32:00',
        contactName: 'Office Manager',
        contactPhone: '(850) 555-0203',
        packages: 3
      },
      {
        id: 'stop-006',
        sequence: 6,
        name: 'State Building',
        address: '890 Capitol Cir, Tallahassee, FL 32301',
        type: 'delivery',
        status: 'completed',
        scheduledTime: '2026-01-03T09:50:00',
        actualTime: '2026-01-03T09:55:00',
        contactName: 'Security Desk',
        contactPhone: '(850) 555-0204',
        notes: 'Requires ID for entry',
        packages: 6
      },
      {
        id: 'stop-007',
        sequence: 7,
        name: 'University Admin',
        address: '321 College Ave, Tallahassee, FL 32306',
        type: 'delivery',
        status: 'completed',
        scheduledTime: '2026-01-03T10:15:00',
        actualTime: '2026-01-03T10:12:00',
        contactName: 'Mail Room',
        contactPhone: '(850) 555-0205',
        packages: 7
      },
      {
        id: 'stop-008',
        sequence: 8,
        name: 'Research Park',
        address: '654 Innovation Way, Tallahassee, FL 32310',
        type: 'delivery',
        status: 'completed',
        scheduledTime: '2026-01-03T10:40:00',
        actualTime: '2026-01-03T10:38:00',
        contactName: 'Lab Coordinator',
        contactPhone: '(850) 555-0206',
        packages: 4
      },
      {
        id: 'stop-009',
        sequence: 9,
        name: 'Retail Plaza',
        address: '987 Shopping Dr, Tallahassee, FL 32308',
        type: 'delivery',
        status: 'pending',
        scheduledTime: '2026-01-03T11:00:00',
        estimatedTime: '2026-01-03T11:05:00',
        contactName: 'Store Manager',
        contactPhone: '(850) 555-0207',
        packages: 10
      },
      {
        id: 'stop-010',
        sequence: 10,
        name: 'Industrial Park',
        address: '147 Factory Rd, Tallahassee, FL 32304',
        type: 'delivery',
        status: 'pending',
        scheduledTime: '2026-01-03T11:20:00',
        estimatedTime: '2026-01-03T11:25:00',
        contactName: 'Shipping Dept',
        contactPhone: '(850) 555-0208',
        packages: 15
      },
      {
        id: 'stop-011',
        sequence: 11,
        name: 'Office Complex',
        address: '258 Business Pkwy, Tallahassee, FL 32301',
        type: 'delivery',
        status: 'pending',
        scheduledTime: '2026-01-03T11:40:00',
        estimatedTime: '2026-01-03T11:48:00',
        contactName: 'Reception',
        contactPhone: '(850) 555-0209',
        packages: 9
      },
      {
        id: 'stop-012',
        sequence: 12,
        name: 'Distribution Center',
        address: '123 Main St, Tallahassee, FL 32301',
        type: 'waypoint',
        status: 'pending',
        scheduledTime: '2026-01-03T12:00:00',
        estimatedTime: '2026-01-03T11:55:00',
        contactName: 'Warehouse Supervisor',
        contactPhone: '(850) 555-0300',
        notes: 'End of route - return empty vehicle'
      }
    ],
    createdAt: '2026-01-02T18:00:00',
    createdBy: 'Route Optimizer',
    updatedAt: '2026-01-03T08:15:00'
  }
}

export function RouteDetailPanel({ routeId }: RouteDetailPanelProps) {
  const { push } = useDrilldown()

  const { data: route, error, isLoading, mutate } = useSWR<RouteData>(
    `/api/routes/${routeId}`,
    fetcher,
    {
      fallbackData: demoRouteData[routeId],
      shouldRetryOnError: false
    }
  )

  const handleViewDriver = () => {
    if (route?.driverId) {
      push({
        id: `driver-${route.driverId}`,
        type: 'driver',
        label: route.driverName || `Driver ${route.driverId}`,
        data: { driverId: route.driverId }
      })
    }
  }

  const handleViewVehicle = () => {
    if (route?.vehicleId) {
      push({
        id: `vehicle-${route.vehicleId}`,
        type: 'vehicle',
        label: route.vehicleName || `Vehicle ${route.vehicleId}`,
        data: { vehicleId: route.vehicleId }
      })
    }
  }

  const handleCallDriver = () => {
    if (route?.driverPhone) {
      window.location.href = `tel:${route.driverPhone}`
    }
  }

  const handleEmailDriver = () => {
    if (route?.driverEmail) {
      window.location.href = `mailto:${route.driverEmail}`
    }
  }

  const handleCallContact = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const getStopIcon = (type: string, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    switch (type) {
      case 'pickup':
        return <Flag className="h-5 w-5 text-blue-500" />
      case 'delivery':
        return <MapPin className="h-5 w-5 text-amber-500" />
      case 'waypoint':
        return <FlagCheckered className="h-5 w-5 text-purple-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStopStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      case 'skipped':
        return <Badge variant="destructive">Skipped</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return null
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const completionPercent = route ? Math.round((route.stopsCompleted / route.stopsTotal) * 100) : 0

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {route && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Navigation className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="text-2xl font-bold">{route.name}</h3>
                  <p className="text-sm text-muted-foreground">Route #{route.number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={route.status === 'active' ? 'default' : 'outline'}>
                  {route.status}
                </Badge>
                {route.optimized && (
                  <Badge variant="secondary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Optimized
                  </Badge>
                )}
              </div>
            </div>
            {route.status === 'active' && (
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{completionPercent}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            )}
          </div>

          {route.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{route.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Route Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Stops</p>
                  <p className="text-xl font-bold">{route.stopsCompleted} / {route.stopsTotal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-xl font-bold">{route.distanceCovered.toFixed(1)} / {route.totalDistance} mi</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="text-xl font-bold">{route.actualTime || 0} / {route.estimatedTime} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className="text-sm font-medium">{route.currentLocation || 'Unknown'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver & Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Driver
                </CardTitle>
              </CardHeader>
              <CardContent>
                {route.driverId ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{route.driverName}</p>
                        <p className="text-xs text-muted-foreground">ID: {route.driverId}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleViewDriver}>
                        View
                      </Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${route.driverPhone}`}
                          className="text-sm text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.preventDefault()
                            handleCallDriver()
                          }}
                        >
                          {route.driverPhone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${route.driverEmail}`}
                          className="text-sm text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.preventDefault()
                            handleEmailDriver()
                          }}
                        >
                          {route.driverEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No driver assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Vehicle */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                {route.vehicleId ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{route.vehicleName}</p>
                      <p className="text-xs text-muted-foreground">#{route.vehicleNumber}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleViewVehicle}>
                      View
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No vehicle assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Start</p>
                  <p className="font-medium">{formatDateTime(route.scheduledStart)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled End</p>
                  <p className="font-medium">{formatDateTime(route.scheduledEnd)}</p>
                </div>
                {route.actualStart && (
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Start</p>
                    <p className="font-medium">{formatDateTime(route.actualStart)}</p>
                  </div>
                )}
                {route.estimatedCompletion && route.status === 'active' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Completion</p>
                    <p className="font-medium">{formatDateTime(route.estimatedCompletion)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stops & Waypoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RouteIcon className="h-5 w-5" />
                Stops & Waypoints ({route.stops.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {route.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className={`p-4 rounded-lg border ${
                      stop.status === 'completed'
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                        : index === route.currentStopIndex
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                        : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-0.5">
                        {getStopIcon(stop.type, stop.status)}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">#{stop.sequence}</span>
                              <span className="font-medium">{stop.name}</span>
                              {index === route.currentStopIndex && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{stop.address}</p>
                          </div>
                          {getStopStatusBadge(stop.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <p className="font-medium capitalize">{stop.type}</p>
                          </div>
                          {stop.packages && (
                            <div>
                              <p className="text-xs text-muted-foreground">Packages</p>
                              <p className="font-medium">{stop.packages}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">Scheduled</p>
                            <p className="font-medium">{formatTime(stop.scheduledTime)}</p>
                          </div>
                          {stop.actualTime && (
                            <div>
                              <p className="text-xs text-muted-foreground">Actual</p>
                              <p className="font-medium">{formatTime(stop.actualTime)}</p>
                            </div>
                          )}
                          {!stop.actualTime && stop.estimatedTime && (
                            <div>
                              <p className="text-xs text-muted-foreground">Estimated</p>
                              <p className="font-medium">{formatTime(stop.estimatedTime)}</p>
                            </div>
                          )}
                        </div>

                        {stop.contactName && (
                          <Separator />
                        )}

                        {stop.contactName && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Contact</p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{stop.contactName}</p>
                              {stop.contactPhone && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCallContact(stop.contactPhone!)}
                                  className="text-blue-600"
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  {stop.contactPhone}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {stop.notes && (
                          <div className="bg-background/50 p-2 rounded text-xs">
                            <p className="text-muted-foreground">Note: {stop.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                {route.createdAt && (
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{formatDateTime(route.createdAt)}</p>
                    {route.createdBy && <p className="text-muted-foreground">by {route.createdBy}</p>}
                  </div>
                )}
                {route.updatedAt && (
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{formatDateTime(route.updatedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DrilldownContent>
  )
}
