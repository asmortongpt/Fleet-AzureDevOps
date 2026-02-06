import {
  MapPin, Play, Pause, SkipBack, SkipForward, Navigation,
  Clock, Fuel, Gauge, AlertTriangle, CheckCircle,
  Flag, XCircle
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';

interface Route {
  id: string;
  name?: string;
  vehicleId?: string;
  driverId?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  distance?: number;
  [key: string]: any;
}

interface RouteDetailViewProps {
  route: Route;
  onClose?: () => void;
}

export function RouteDetailView({ route, onClose }: RouteDetailViewProps) {
  const { push: _push } = useDrilldown();
  const [activeTab, setActiveTab] = useState('playback');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState([0]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const stops = useMemo(() => {
    if (Array.isArray((route as any).stops)) return (route as any).stops
    if (Array.isArray((route as any).waypoints)) return (route as any).waypoints
    return []
  }, [route])

  const events = useMemo(() => {
    const routeEvents = (route as any).events || (route as any).metadata?.events
    return Array.isArray(routeEvents) ? routeEvents : []
  }, [route])

  const normalizedStops = useMemo(() => {
    return stops.map((stop: any, index: number) => ({
      id: stop.id || `stop-${index}`,
      name: stop.name || stop.address || `Stop ${index + 1}`,
      address: stop.address || stop.location || '',
      arrivalTime: stop.arrivalTime || stop.estimatedArrival || stop.estimated_arrival,
      departureTime: stop.departureTime || stop.departedAt || stop.departure_time,
      duration: stop.duration,
      type: stop.type || stop.status || 'stop'
    }))
  }, [stops])

  const normalizedEvents = useMemo(() => {
    return events.map((event: any, index: number) => ({
      id: event.id || `event-${index}`,
      time: event.time || event.timestamp || event.created_at,
      type: event.type || event.event_type || 'event',
      severity: event.severity || 'info',
      description: event.description || event.details || '',
      location: event.location || event.address || ''
    }))
  }, [events])

  const geofences = useMemo(() => {
    const routeGeofences = (route as any).geofences || (route as any).metadata?.geofences
    return Array.isArray(routeGeofences) ? routeGeofences : []
  }, [route])

  const formatDuration = (minutes?: number) => {
    if (!minutes || Number.isNaN(minutes)) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const routeOverview = useMemo(() => {
    const distance = Number(route.distance ?? route.total_distance ?? route.actual_distance ?? route.estimated_distance ?? 0)
    const durationMinutes = Number(route.actualDuration ?? route.actual_duration ?? route.estimatedDuration ?? route.estimated_duration ?? 0)
    const avgSpeed = durationMinutes > 0 ? Number((distance / (durationMinutes / 60)).toFixed(1)) : 0
    const fuelUsed = Number((route as any).fuelUsed ?? (route as any).fuel_used ?? 0)
    const fuelEfficiency = fuelUsed > 0 ? Number((distance / fuelUsed).toFixed(1)) : 0

    return {
      totalDistance: distance,
      totalDuration: formatDuration(durationMinutes),
      avgSpeed,
      maxSpeed: Number((route as any).maxSpeed ?? (route as any).max_speed ?? 0),
      stops: stops.length,
      idleTime: (route as any).idleTime || (route as any).idle_time || 'N/A',
      fuelUsed,
      fuelEfficiency
    }
  }, [route, stops])

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Flag className="w-4 h-4 text-green-600" />;
      case 'end':
        return <Flag className="w-4 h-4 text-red-600" />;
      case 'delivery':
        return <MapPin className="w-4 h-4 text-blue-800" />;
      case 'fuel':
        return <Fuel className="w-4 h-4 text-orange-600" />;
      case 'service':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getEventBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In production, this would control actual map animation
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Navigation className="w-4 h-4" />
              <div>
                <h1 className="text-sm font-bold">{route.name || 'Route Details'}</h1>
                <p className="text-cyan-100">Route ID: {route.id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div>
                <p className="text-xs text-cyan-200">Distance</p>
                <p className="text-sm font-semibold">{routeOverview.totalDistance} mi</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Duration</p>
                <p className="text-sm font-semibold">{routeOverview.totalDuration}</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Avg Speed</p>
                <p className="text-sm font-semibold">{routeOverview.avgSpeed} mph</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Stops</p>
                <p className="text-sm font-semibold">{routeOverview.stops}</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Fuel Efficiency</p>
                <p className="text-sm font-semibold">{routeOverview.fuelEfficiency} MPG</p>
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
            {/* Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Route Visualization</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{route.vehicleId || 'V-001'}</Badge>
                    <Badge variant="outline">{route.driverId || 'Driver'}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                  <div className="text-center">
                    <MapPin className="w-12 h-9 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">Interactive map would display here</p>
                    <p className="text-xs text-gray-700 mt-1">
                      Route from {normalizedStops[0]?.name ?? 'Start'} to {normalizedStops[normalizedStops.length - 1]?.name ?? 'End'}
                    </p>
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
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[0.5, 1, 2, 4].map(speed => (
                        <Button
                          key={speed}
                          size="sm"
                          variant={playbackSpeed === speed ? 'default' : 'outline'}
                          onClick={() => setPlaybackSpeed(speed)}
                        >
                          {speed}x
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{route.startTime || '08:00'}</span>
                    <span>Position: {playbackPosition[0]}%</span>
                    <span>{route.endTime || '13:00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card>
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-muted-foreground">Total Time</p>
                  </div>
                  <p className="text-sm font-bold">{routeOverview.totalDuration}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-muted-foreground">Max Speed</p>
                  </div>
                  <p className="text-sm font-bold">{routeOverview.maxSpeed} mph</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-muted-foreground">Fuel Used</p>
                  </div>
                  <p className="text-sm font-bold">{routeOverview.fuelUsed} gal</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-muted-foreground">Idle Time</p>
                  </div>
                  <p className="text-sm font-bold">{routeOverview.idleTime}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stops Tab */}
          <TabsContent value="stops">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  Route Stops
                </CardTitle>
                <CardDescription>{normalizedStops.length} stops along this route</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-3">
                  {normalizedStops.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No stops available for this route.</p>
                  ) : (
                    normalizedStops.map((stop, index) => (
                      <div key={stop.id} className="flex gap-2">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                            {getStopIcon(stop.type)}
                          </div>
                          {index < normalizedStops.length - 1 && (
                            <div className="w-px h-full bg-cyan-200 dark:bg-cyan-800 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-semibold">{stop.name}</p>
                              <p className="text-sm text-muted-foreground">{stop.address || 'N/A'}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs capitalize">{stop.type}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Arrival:</span>
                              <p className="font-medium">{stop.arrivalTime || 'N/A'}</p>
                            </div>
                            {stop.departureTime && (
                              <>
                                <div>
                                  <span className="text-muted-foreground">Departure:</span>
                                  <p className="font-medium">{stop.departureTime}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Duration:</span>
                                  <p className="font-medium">{stop.duration ?? 'N/A'}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Route Events
                </CardTitle>
                <CardDescription>{normalizedEvents.length} events recorded during this route</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {normalizedEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No events recorded for this route.</p>
                  ) : (
                    normalizedEvents.map((event) => (
                      <div key={event.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="font-semibold capitalize">{event.type.replace('-', ' ')}</p>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          </div>
                          {getEventBadge(event.severity)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{event.time || 'N/A'}</span>
                          <span>{event.location || 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-3 h-3" />
                  Performance Analytics
                </CardTitle>
                <CardDescription>Route performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                      <p className="text-sm font-medium mb-1">Fuel Efficiency</p>
                      <p className="text-sm font-bold">{routeOverview.fuelEfficiency || 0} MPG</p>
                      <p className="text-xs text-muted-foreground mt-1">Benchmark data not available</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                      <p className="text-sm font-medium mb-1">Idle Time Ratio</p>
                      <p className="text-sm font-bold">{routeOverview.idleTime || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Target thresholds configurable</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                      <p className="text-sm font-medium mb-1">Speed Compliance</p>
                      <p className="text-sm font-bold">
                        {normalizedEvents.length > 0
                          ? Math.max(0, Math.round((1 - normalizedEvents.filter(e => e.type === 'speed').length / normalizedEvents.length) * 100))
                          : 100}%\n                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {normalizedEvents.filter(e => e.type === 'speed').length} speed events recorded
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center p-2">
                    <div className="text-center">
                      <Gauge className="w-12 h-9 text-gray-700 mx-auto mb-2" />
                      <p className="text-sm text-gray-700">Analytics charts unavailable</p>
                      <p className="text-xs text-gray-700 mt-1">Enable telemetry history to view charts</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geofences Tab */}
          <TabsContent value="geofences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-3 h-3" />
                  Geofence Interactions
                </CardTitle>
                <CardDescription>Route interactions with defined geofences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geofences.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No geofence interactions recorded.</p>
                  ) : (
                    geofences.map((geofence: any) => {
                      const interactions = Number(geofence.interactions ?? geofence.entry_count ?? 0)
                      const type = geofence.type || geofence.zone_type || 'allowed'
                      return (
                        <div key={geofence.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-semibold">{geofence.name || 'Geofence'}</p>
                              <p className="text-sm text-muted-foreground capitalize">{type} zone</p>
                            </div>
                            <Badge variant={type === 'restricted' ? 'destructive' : 'secondary'}>
                              {interactions} {interactions === 1 ? 'entry' : 'entries'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
