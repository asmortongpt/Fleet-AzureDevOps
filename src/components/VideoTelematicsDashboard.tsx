/**
 * Video Telematics Dashboard
 * Real-time video event monitoring, AI analysis, and driver safety management
 */

import { AlertCircle, Video, Eye, AlertTriangle, CheckCircle, XCircle, Play, Shield, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

interface VideoEvent {
  id: number;
  vehicle_name: string;
  vin: string;
  driver_name: string;
  event_type: string;
  severity: string;
  event_timestamp: string;
  latitude: number;
  longitude: number;
  address: string;
  speed_mph: number;
  g_force: number;
  video_url: string;
  video_thumbnail_url: string;
  confidence_score: number;
  ai_detected_behaviors: any[];
  reviewed: boolean;
  coaching_required: boolean;
  marked_as_evidence: boolean;
  camera_type: string;
}

interface CameraHealth {
  id: number;
  vehicle_name: string;
  vin: string;
  camera_type: string;
  status: string;
  health_status: string;
  last_ping_at: string;
  hours_since_ping: number;
  firmware_version: string;
}

const severityColors = {
  minor: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  severe: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const eventTypeLabels: Record<string, string> = {
  harsh_braking: 'Harsh Braking',
  harsh_acceleration: 'Harsh Acceleration',
  harsh_turning: 'Harsh Turning',
  speeding: 'Speeding',
  distracted_driving: 'Distracted Driving',
  drowsiness: 'Drowsiness',
  phone_use: 'Phone Use',
  smoking: 'Smoking',
  no_seatbelt: 'No Seatbelt',
  following_too_close: 'Following Too Close',
  lane_departure: 'Lane Departure',
  collision: 'Collision'
};

export default function VideoTelematicsDashboard() {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<VideoEvent[]>([]);
  const [cameras, setCameras] = useState<CameraHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [_selectedEvent, _setSelectedEvent] = useState<VideoEvent | null>(null);
  const [filters, setFilters] = useState({
    severity: 'all',
    eventType: 'all',
    reviewed: 'all',
    dateRange: '7'
  });

  useEffect(() => {
    loadVideoEvents();
    loadCameraHealth();
  }, [filters]);

  const loadVideoEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters.eventType !== 'all') params.append('eventType', filters.eventType);
      if (filters.dateRange !== 'all') {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(filters.dateRange));
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/video/events?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      logger.error('Failed to load video events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCameraHealth = async () => {
    try {
      const response = await fetch('/api/video/health/cameras', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCameras(data.cameras || []);
      }
    } catch (error) {
      logger.error('Failed to load camera health:', error);
    }
  };

  const handleReviewEvent = async (eventId: number, reviewed: boolean, falsePositive: boolean = false) => {
    try {
      const response = await fetch(`/api/video/events/${eventId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewed,
          falsePositive,
          reviewNotes: falsePositive ? 'Marked as false positive' : 'Event reviewed'
        })
      });

      if (response.ok) {
        loadVideoEvents();
      }
    } catch (error) {
      logger.error('Failed to review event:', error);
    }
  };

  const handleMarkForCoaching = async (eventId: number) => {
    try {
      const response = await fetch(`/api/video/events/${eventId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coachingRequired: true
        })
      });

      if (response.ok) {
        loadVideoEvents();
      }
    } catch (error) {
      logger.error('Failed to mark for coaching:', error);
    }
  };

  const getVideoPlaybackUrl = async (eventId: number) => {
    try {
      const response = await fetch(`/api/video/events/${eventId}/clip`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (error) {
      logger.error('Failed to get video URL:', error);
    }
    return null;
  };

  const handlePlayVideo = async (event: VideoEvent) => {
    const url = await getVideoPlaybackUrl(event.id);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const stats = {
    total: (events || []).length,
    critical: (events || []).filter(e => e.severity === 'critical').length,
    needsReview: (events || []).filter(e => !e.reviewed).length,
    needsCoaching: (events || []).filter(e => e.coaching_required && !e.reviewed).length,
    camerasOnline: (cameras || []).filter(c => c.health_status === 'online').length,
    camerasOffline: (cameras || []).filter(c => c.health_status === 'offline').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Video Telematics</h1>
        <p className="text-muted-foreground">Real-time driver safety monitoring and AI-powered event analysis</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Review</p>
                <p className="text-2xl font-bold">{stats.needsReview}</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Coaching</p>
                <p className="text-2xl font-bold">{stats.needsCoaching}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cameras Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.camerasOnline}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cameras Offline</p>
                <p className="text-2xl font-bold text-red-600">{stats.camerasOffline}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="events">Safety Events</TabsTrigger>
          <TabsTrigger value="cameras">Camera Health</TabsTrigger>
          <TabsTrigger value="coaching">Coaching Queue</TabsTrigger>
        </TabsList>

        {/* Safety Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Severity</label>
                  <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Event Type</label>
                  <Select value={filters.eventType} onValueChange={(value) => setFilters({ ...filters, eventType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(eventTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last 24 hours</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={loadVideoEvents} className="w-full">Apply Filters</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <div className="space-y-3">
            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">Loading events...</p>
                </CardContent>
              </Card>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No video events found</p>
                </CardContent>
              </Card>
            ) : (
              (events || []).map((event) => (
                <Card key={event.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {event.video_thumbnail_url ? (
                          <img
                            src={event.video_thumbnail_url}
                            alt="Event thumbnail"
                            className="w-32 h-20 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-32 h-20 bg-gray-200 rounded border flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{eventTypeLabels[event.event_type] || event.event_type}</h3>
                            <p className="text-sm text-muted-foreground">
                              {event.vehicle_name} {event.driver_name && `• ${event.driver_name}`}
                            </p>
                          </div>
                          <Badge className={cn('ml-2', severityColors[event.severity as keyof typeof severityColors])}>
                            {event.severity}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Time:</span> {event.event_timestamp}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span> {event.address}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Speed:</span> {event.speed_mph} mph
                          </div>
                          <div>
                            <span className="text-muted-foreground">G-Force:</span> {event.g_force}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handlePlayVideo(event)}>
                            <Play className="h-4 w-4 mr-2" /> Play Video
                          </Button>
                          {!event.reviewed && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleReviewEvent(event.id, true)}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Mark Reviewed
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleReviewEvent(event.id, true, true)}>
                                <XCircle className="h-4 w-4 mr-2" /> False Positive
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleMarkForCoaching(event.id)}>
                                <Users className="h-4 w-4 mr-2" /> Needs Coaching
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Camera Health Tab */}
        <TabsContent value="cameras" className="space-y-4">
          <div className="space-y-3">
            {cameras.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No camera health data available</p>
                </CardContent>
              </Card>
            ) : (
              cameras.map((camera) => (
                <Card key={camera.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{camera.vehicle_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          VIN: {camera.vin} • {camera.camera_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last Ping: {camera.last_ping_at} ({camera.hours_since_ping} hours ago)
                        </p>
                        <p className="text-sm text-muted-foreground">Firmware: {camera.firmware_version}</p>
                      </div>
                      <Badge
                        className={cn(
                          camera.health_status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        )}
                      >
                        {camera.health_status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Coaching Queue Tab */}
        <TabsContent value="coaching" className="space-y-4">
          <div className="space-y-3">
            {events.filter(e => e.coaching_required && !e.reviewed).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No events in coaching queue</p>
                </CardContent>
              </Card>
            ) : (
              events
                .filter(e => e.coaching_required && !e.reviewed)
                .map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {event.video_thumbnail_url ? (
                            <img
                              src={event.video_thumbnail_url}
                              alt="Event thumbnail"
                              className="w-32 h-20 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-32 h-20 bg-gray-200 rounded border flex items-center justify-center">
                              <Video className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{eventTypeLabels[event.event_type] || event.event_type}</h3>
                              <p className="text-sm text-muted-foreground">
                                {event.vehicle_name} {event.driver_name && `• ${event.driver_name}`}
                              </p>
                            </div>
                            <Badge className={cn('ml-2', severityColors[event.severity as keyof typeof severityColors])}>
                              {event.severity}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Time:</span> {event.event_timestamp}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Location:</span> {event.address}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePlayVideo(event)}>
                              <Play className="h-4 w-4 mr-2" /> Play Video
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleReviewEvent(event.id, true)}>
                              <CheckCircle className="h-4 w-4 mr-2" /> Complete Coaching
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}