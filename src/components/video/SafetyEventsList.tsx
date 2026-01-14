/**
 * Safety Events List Component
 * Displays video safety events with filtering, sorting, and bulk actions
 */

import { AlertCircle, Play, Eye, CheckCircle, XCircle, Users, Download, Lock } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { cn } from '@/lib/utils';

interface SafetyEvent {
  id: number;
  vehicle_name: string;
  vin: string;
  driver_name: string | null;
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
  false_positive: boolean;
  camera_type: string;
}

interface SafetyEventsListProps {
  events: SafetyEvent[];
  loading?: boolean;
  onEventClick?: (event: SafetyEvent) => void;
  onPlayVideo?: (event: SafetyEvent) => void;
  onReview?: (eventId: number, reviewed: boolean, falsePositive?: boolean) => void;
  onMarkForCoaching?: (eventId: number) => void;
  onAddToEvidence?: (eventId: number) => void;
  onBulkAction?: (action: string, eventIds: number[]) => void;
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
  collision: 'Collision',
  eyes_closed: 'Eyes Closed',
  yawning: 'Yawning',
  looking_away: 'Looking Away',
  eating_drinking: 'Eating/Drinking'
};

export default function SafetyEventsList({
  events,
  loading = false,
  onEventClick,
  onPlayVideo,
  onReview,
  onMarkForCoaching,
  onAddToEvidence,
  onBulkAction
}: SafetyEventsListProps) {
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'vehicle'>('date');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const toggleEventSelection = (eventId: number) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map(e => e.id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedEvents.length === 0) return;
    onBulkAction?.(action, selectedEvents);
    setSelectedEvents([]);
  };

  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          event.vehicle_name.toLowerCase().includes(query) ||
          event.driver_name?.toLowerCase().includes(query) ||
          event.event_type.toLowerCase().includes(query) ||
          event.address.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter(event => {
      // Severity filter
      if (filterSeverity !== 'all') {
        return event.severity === filterSeverity;
      }
      return true;
    })
    .sort((a, b) => {
      // Sorting
      if (sortBy === 'date') {
        return new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime();
      } else if (sortBy === 'severity') {
        const severityOrder = { critical: 4, severe: 3, moderate: 2, minor: 1 };
        return (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
               (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      } else if (sortBy === 'vehicle') {
        return a.vehicle_name.localeCompare(b.vehicle_name);
      }
      return 0;
    });

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-3 text-center">
          <p className="text-muted-foreground">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-3">
          <div className="flex flex-col md:flex-row gap-2">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by vehicle, driver, event type, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="severity">Severity</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by Severity */}
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
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

          {/* Bulk Actions */}
          {selectedEvents.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedEvents.length} selected
              </span>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('review')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Reviewed
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('coaching')}>
                <Users className="h-4 w-4 mr-2" />
                Assign Coaching
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('evidence')}>
                <Lock className="h-4 w-4 mr-2" />
                Add to Evidence
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredEvents.length} of {events.length} events
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-3 text-center">
            <p className="text-muted-foreground">No events found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className={cn(event.reviewed && 'opacity-60')}>
              <CardContent className="pt-3">
                <div className="flex items-start gap-2">
                  {/* Selection Checkbox */}
                  <Checkbox
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => toggleEventSelection(event.id)}
                  />

                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {event.video_thumbnail_url ? (
                      <img
                        src={event.video_thumbnail_url}
                        alt="Event thumbnail"
                        className="w-40 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => onPlayVideo?.(event)}
                      />
                    ) : (
                      <div className="w-40 h-24 bg-gray-200 rounded border flex items-center justify-center">
                        <Play className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {eventTypeLabels[event.event_type] || event.event_type}
                          </h3>
                          <Badge className={cn(severityColors[event.severity as keyof typeof severityColors])}>
                            {event.severity}
                          </Badge>
                          {event.marked_as_evidence && (
                            <Badge variant="outline">
                              <Lock className="h-3 w-3 mr-1" />
                              Evidence
                            </Badge>
                          )}
                          {event.coaching_required && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              Coaching
                            </Badge>
                          )}
                          {event.false_positive && (
                            <Badge variant="secondary">False Positive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.vehicle_name} ({event.vin})
                          {event.driver_name && ` • ${event.driver_name}`}
                          {` • ${event.camera_type}`}
                        </p>
                      </div>
                    </div>

                    {/* Event Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Time:</span>{' '}
                        {new Date(event.event_timestamp).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span> {event.address}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Speed:</span> {event.speed_mph} mph
                      </div>
                      <div>
                        <span className="text-muted-foreground">G-Force:</span> {event.g_force?.toFixed(2) || 'N/A'}
                      </div>
                    </div>

                    {/* AI Detections */}
                    {event.ai_detected_behaviors && event.ai_detected_behaviors.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-medium">AI Detected: </span>
                        <span className="text-sm text-muted-foreground">
                          {event.ai_detected_behaviors.map((b: any) => b.behavior).join(', ')}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          (Confidence: {(event.confidence_score * 100).toFixed(0)}%)
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onPlayVideo?.(event)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play Video
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEventClick?.(event)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>

                      {!event.reviewed && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReview?.(event.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Reviewed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReview?.(event.id, true, true)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            False Positive
                          </Button>
                        </>
                      )}

                      {!event.marked_as_evidence && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddToEvidence?.(event.id)}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Add to Evidence
                        </Button>
                      )}

                      {!event.coaching_required && !event.reviewed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMarkForCoaching?.(event.id)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Coaching
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Select All Toggle */}
      {filteredEvents.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
            {selectedEvents.length === filteredEvents.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      )}
    </div>
  );
}
