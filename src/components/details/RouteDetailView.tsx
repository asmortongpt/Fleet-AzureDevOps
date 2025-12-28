import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  MapPin, Play, Pause, SkipBack, SkipForward, Navigation,
  Clock, TrendingUp, Fuel, Gauge, AlertTriangle, CheckCircle,
  Flag, XCircle, Calendar, User, Car
} from 'lucide-react';
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
  const { push } = useDrilldown();
  const [activeTab, setActiveTab] = useState('playback');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState([0]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Mock comprehensive route data
  const routeOverview = {
    totalDistance: 145.8,
    totalDuration: '4h 23m',
    avgSpeed: 33.2,
    maxSpeed: 65,
    stops: 12,
    idleTime: '32m',
    fuelUsed: 8.5,
    fuelEfficiency: 17.2
  };

  const stops = [
    { id: '1', name: 'Depot - Start', address: '123 Main St', arrivalTime: '08:00', departureTime: '08:15', duration: '15m', type: 'start', lat: 30.2672, lng: -97.7431 },
    { id: '2', name: 'Customer Site A', address: '456 Oak Ave', arrivalTime: '08:45', departureTime: '09:20', duration: '35m', type: 'delivery', lat: 30.2850, lng: -97.7350 },
    { id: '3', name: 'Customer Site B', address: '789 Elm St', arrivalTime: '09:55', departureTime: '10:15', duration: '20m', type: 'delivery', lat: 30.2950, lng: -97.7250 },
    { id: '4', name: 'Fuel Station', address: '321 Gas Rd', arrivalTime: '11:00', departureTime: '11:12', duration: '12m', type: 'fuel', lat: 30.3050, lng: -97.7150 },
    { id: '5', name: 'Customer Site C', address: '654 Pine Ln', arrivalTime: '11:45', departureTime: '12:30', duration: '45m', type: 'service', lat: 30.3150, lng: -97.7050 },
    { id: '6', name: 'Depot - End', address: '123 Main St', arrivalTime: '13:00', departureTime: null, duration: null, type: 'end', lat: 30.2672, lng: -97.7431 }
  ];

  const events = [
    { time: '08:32', type: 'speed', severity: 'low', description: 'Speed exceeded 5 mph over limit', location: 'Highway 183' },
    { time: '09:15', type: 'idle', severity: 'info', description: 'Extended idle time (8 minutes)', location: 'Customer Site A' },
    { time: '10:45', type: 'harsh-brake', severity: 'medium', description: 'Harsh braking detected', location: 'Intersection of Oak & Elm' },
    { time: '12:15', type: 'geofence', severity: 'info', description: 'Entered restricted zone', location: 'Downtown Construction Area' }
  ];

  const telemetryData = [
    { time: '08:00', speed: 0, fuel: 95, rpm: 0 },
    { time: '08:15', speed: 35, fuel: 94, rpm: 1800 },
    { time: '08:30', speed: 55, fuel: 92, rpm: 2200 },
    { time: '08:45', speed: 30, fuel: 90, rpm: 1500 },
    { time: '09:00', speed: 0, fuel: 90, rpm: 800 },
    { time: '09:20', speed: 40, fuel: 88, rpm: 1900 },
    { time: '09:55', speed: 35, fuel: 85, rpm: 1700 },
    { time: '10:15', speed: 45, fuel: 83, rpm: 2000 },
    { time: '11:00', speed: 50, fuel: 80, rpm: 2100 },
    { time: '11:45', speed: 35, fuel: 78, rpm: 1600 },
    { time: '12:30', speed: 40, fuel: 75, rpm: 1800 },
    { time: '13:00', speed: 0, fuel: 73, rpm: 0 }
  ];

  const geofences = [
    { id: '1', name: 'Service Area North', type: 'allowed', interactions: 5 },
    { id: '2', name: 'Downtown Core', type: 'restricted', interactions: 1 },
    { id: '3', name: 'Highway Corridor', type: 'preferred', interactions: 8 }
  ];

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Flag className="w-4 h-4 text-green-600" />;
      case 'end':
        return <Flag className="w-4 h-4 text-red-600" />;
      case 'delivery':
        return <MapPin className="w-4 h-4 text-blue-600" />;
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
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Navigation className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">{route.name || 'Route Details'}</h1>
                <p className="text-cyan-100">Route ID: {route.id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <div>
                <p className="text-xs text-cyan-200">Distance</p>
                <p className="text-lg font-semibold">{routeOverview.totalDistance} mi</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Duration</p>
                <p className="text-lg font-semibold">{routeOverview.totalDuration}</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Avg Speed</p>
                <p className="text-lg font-semibold">{routeOverview.avgSpeed} mph</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Stops</p>
                <p className="text-lg font-semibold">{routeOverview.stops}</p>
              </div>
              <div>
                <p className="text-xs text-cyan-200">Fuel Efficiency</p>
                <p className="text-lg font-semibold">{routeOverview.fuelEfficiency} MPG</p>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-cyan-700">
              <XCircle className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger value="stops">Stops</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="geofences">Geofences</TabsTrigger>
          </TabsList>

          {/* Playback Tab */}
          <TabsContent value="playback" className="space-y-4">
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
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Interactive map would display here</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Route from {stops[0].name} to {stops[stops.length - 1].name}
                    </p>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-muted-foreground">Total Time</p>
                  </div>
                  <p className="text-2xl font-bold">{routeOverview.totalDuration}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-muted-foreground">Max Speed</p>
                  </div>
                  <p className="text-2xl font-bold">{routeOverview.maxSpeed} mph</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-muted-foreground">Fuel Used</p>
                  </div>
                  <p className="text-2xl font-bold">{routeOverview.fuelUsed} gal</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-muted-foreground">Idle Time</p>
                  </div>
                  <p className="text-2xl font-bold">{routeOverview.idleTime}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stops Tab */}
          <TabsContent value="stops">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Route Stops
                </CardTitle>
                <CardDescription>{stops.length} stops along this route</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-3">
                  {stops.map((stop, index) => (
                    <div key={stop.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                          {getStopIcon(stop.type)}
                        </div>
                        {index < stops.length - 1 && (
                          <div className="w-px h-full bg-cyan-200 dark:bg-cyan-800 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="font-semibold">{stop.name}</p>
                            <p className="text-sm text-muted-foreground">{stop.address}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs capitalize">{stop.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Arrival:</span>
                            <p className="font-medium">{stop.arrivalTime}</p>
                          </div>
                          {stop.departureTime && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Departure:</span>
                                <p className="font-medium">{stop.departureTime}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duration:</span>
                                <p className="font-medium">{stop.duration}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Route Events
                </CardTitle>
                <CardDescription>{events.length} events logged during this route</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm capitalize">{event.type.replace('-', ' ')}</p>
                            {getEventBadge(event.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Speed Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Speed:</span>
                      <span className="font-medium">{routeOverview.avgSpeed} mph</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Speed:</span>
                      <span className="font-medium">{routeOverview.maxSpeed} mph</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Speed Violations:</span>
                      <span className="font-medium text-yellow-600">1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Fuel Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Used:</span>
                      <span className="font-medium">{routeOverview.fuelUsed} gal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MPG:</span>
                      <span className="font-medium">{routeOverview.fuelEfficiency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">vs Fleet Avg:</span>
                      <span className="font-medium text-green-600">+2.3 MPG</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Telemetry Graph Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Telemetry Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Speed/Fuel/RPM graph would display here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geofences Tab */}
          <TabsContent value="geofences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Geofence Interactions
                </CardTitle>
                <CardDescription>{geofences.length} geofences interacted with</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geofences.map((geofence) => (
                    <div key={geofence.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{geofence.name}</p>
                            <Badge
                              variant={geofence.type === 'restricted' ? 'destructive' : 'secondary'}
                              className="text-xs capitalize"
                            >
                              {geofence.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {geofence.interactions} interaction{geofence.interactions !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
