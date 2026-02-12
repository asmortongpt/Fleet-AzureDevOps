import {
  MapPin,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Navigation,
  Clock,
  Fuel,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Flag,
  XCircle
} from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { swrFetcher } from '@/lib/fetcher'

interface Route {
  id: string
  name?: string
  vehicleId?: string
  driverId?: string
  startTime?: string
  endTime?: string
  status?: string
  distance?: number
  [key: string]: any
}

interface RouteDetailViewProps {
  route: Route
  onClose?: () => void
}

export function RouteDetailView({ route, onClose }: RouteDetailViewProps) {
  const { push: _push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('playback')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState([0])
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const routeId = route.id

  const { data: routeResponse } = useSWR<any>(
    routeId ? `/api/routes/${routeId}` : null,
    swrFetcher
  )
  const routeDetails = (routeResponse?.data || routeResponse || route) as Route

  const vehicleId = routeDetails.vehicleId || routeDetails.vehicle_id
  const { data: gpsResponse } = useSWR<any>(
    vehicleId ? `/api/gps-tracks?vehicleId=${vehicleId}&limit=200` : null,
    swrFetcher
  )
  const { data: incidentResponse } = useSWR<{ data: any[] }>(
    vehicleId ? `/api/safety-incidents?vehicle_id=${vehicleId}&limit=100` : null,
    swrFetcher
  )

  const gpsTracks = Array.isArray(gpsResponse) ? gpsResponse : (gpsResponse as any)?.data || []
  const incidents = incidentResponse?.data || []

  const routeOverview = useMemo(() => {
    const totalDistance = Number(routeDetails.distance ?? routeDetails.total_distance ?? 0)
    const start = routeDetails.startTime || routeDetails.start_time
    const end = routeDetails.endTime || routeDetails.end_time
    let totalDuration = 'N/A'
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      const diff = Math.max(0, endDate.getTime() - startDate.getTime())
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      totalDuration = `${hours}h ${minutes}m`
    }
    const avgSpeed = Number(routeDetails.avg_speed ?? routeDetails.average_speed ?? 0)
    const maxSpeed = Number(routeDetails.max_speed ?? 0)
    const stops = Number(routeDetails.stops ?? routeDetails.stop_count ?? 0)
    const fuelUsed = Number(routeDetails.fuel_used ?? 0)
    const fuelEfficiency = Number(routeDetails.fuel_efficiency ?? 0)
    const idleTime = routeDetails.idle_time || 'N/A'

    return {
      totalDistance,
      totalDuration,
      avgSpeed,
      maxSpeed,
      stops,
      idleTime,
      fuelUsed,
      fuelEfficiency
    }
  }, [routeDetails])

  const stops = useMemo(() => {
    return routeDetails.stops_detail || routeDetails.stops || []
  }, [routeDetails])

  const events = useMemo(() => {
    return incidents.map((incident: any) => ({
      time: incident.occurred_at || incident.date || incident.created_at || 'N/A',
      type: incident.type || incident.category || 'incident',
      severity: incident.severity || incident.priority || 'info',
      description: incident.title || incident.summary || incident.description || 'Incident',
      location: incident.location || incident.address || 'N/A'
    }))
  }, [incidents])

  const geofences = useMemo(() => {
    return routeDetails.geofences || []
  }, [routeDetails])

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Flag className="w-4 h-4 text-green-600" />
      case 'end':
        return <Flag className="w-4 h-4 text-red-600" />
      case 'delivery':
        return <MapPin className="w-4 h-4 text-blue-800" />
      case 'fuel':
        return <Fuel className="w-4 h-4 text-orange-600" />
      case 'service':
        return <CheckCircle className="w-4 h-4 text-purple-600" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const getEventBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />High</Badge>
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      case 'info':
        return <Badge variant="outline">Info</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Navigation className="w-4 h-4" />
              <div>
                <h1 className="text-sm font-bold">{routeDetails.name || 'Route Details'}</h1>
                <p className="text-cyan-100">Route ID: {routeDetails.id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div>
                <p className="text-xs text-cyan-200">Distance</p>
                <p className="text-sm font-semibold">{routeOverview.totalDistance || 0} mi</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Duration</p>
                <p className="text-sm font-semibold">{routeOverview.totalDuration}</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Avg Speed</p>
                <p className="text-sm font-semibold">{routeOverview.avgSpeed || 0} mph</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Stops</p>
                <p className="text-sm font-semibold">{routeOverview.stops || 0}</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Fuel Efficiency</p>
                <p className="text-sm font-semibold">{routeOverview.fuelEfficiency || 0} MPG</p>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-cyan-700">
              <XCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-3">
            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger value="stops">Stops</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="geofences">Geofences</TabsTrigger>
          </TabsList>

          {/* Playback Tab */}
          <TabsContent value="playback" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Route Visualization</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{routeDetails.vehicleId || routeDetails.vehicle_id || 'Vehicle'}</Badge>
                    <Badge variant="outline">{routeDetails.driverId || routeDetails.driver_id || 'Driver'}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                  <div className="text-center">
                    <MapPin className="w-12 h-9 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">Route geometry unavailable.</p>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPlaybackPosition([0])}>
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handlePlayPause}>
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPlaybackPosition([100])}>
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                      <Slider
                        value={playbackPosition}
                        onValueChange={setPlaybackPosition}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Speed</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setPlaybackSpeed(0.5)}>0.5x</Button>
                      <Button size="sm" variant={playbackSpeed === 1 ? "default" : "outline"} onClick={() => setPlaybackSpeed(1)}>1x</Button>
                      <Button size="sm" variant="outline" onClick={() => setPlaybackSpeed(2)}>2x</Button>
                      <Button size="sm" variant="outline" onClick={() => setPlaybackSpeed(4)}>4x</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stops Tab */}
          <TabsContent value="stops" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Route Stops</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stops.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No stop data available.</div>
                ) : (
                  stops.map((stop: any) => (
                    <div key={stop.id || stop.name} className="flex items-start gap-2 p-2 bg-muted rounded-md">
                      {getStopIcon(stop.type || 'stop')}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{stop.name || 'Stop'}</p>
                          <span className="text-xs text-muted-foreground">{stop.arrivalTime || stop.arrival_time || ''}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{stop.address || stop.location || ''}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Route Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {events.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No events available.</div>
                ) : (
                  events.map((event: any, idx: number) => (
                    <div key={`${event.time}-${idx}`} className="flex items-start gap-2 p-2 bg-muted rounded-md">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{event.description}</p>
                          {getEventBadge(event.severity)}
                        </div>
                        <p className="text-xs text-muted-foreground">{event.location}</p>
                        <p className="text-xs text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Route Analytics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-blue-800" />
                    Avg Speed
                  </div>
                  <span>{routeOverview.avgSpeed || 0} mph</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-blue-800" />
                    Max Speed
                  </div>
                  <span>{routeOverview.maxSpeed || 0} mph</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-800" />
                    Idle Time
                  </div>
                  <span>{routeOverview.idleTime}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-blue-800" />
                    Fuel Used
                  </div>
                  <span>{routeOverview.fuelUsed || 0} gal</span>
                </div>
              </CardContent>
            </Card>

            {gpsTracks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Telemetry Samples</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {gpsTracks.slice(0, 10).map((track: any, idx: number) => (
                    <div key={track.id || idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <span>{track.timestamp || track.time || 'Time'}</span>
                      <span>{track.speed || 0} mph</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Geofences Tab */}
          <TabsContent value="geofences" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Geofence Interactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {geofences.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No geofence data available.</div>
                ) : (
                  geofences.map((fence: any) => (
                    <div key={fence.id || fence.name} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div>
                        <p className="font-medium">{fence.name || 'Geofence'}</p>
                        <p className="text-xs text-muted-foreground">{fence.type || 'unknown'}</p>
                      </div>
                      <Badge variant="outline">{fence.interactions || 0}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
