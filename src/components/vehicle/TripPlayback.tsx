/**
 * TripPlayback Component
 *
 * Animated vehicle marker moving along breadcrumb trail with playback controls
 *
 * Features:
 * - Smooth animation using requestAnimationFrame
 * - Play/pause/stop controls
 * - Speed selector (0.5x, 1x, 2x, 4x, 8x)
 * - Time scrubber slider to jump to any point
 * - Current timestamp display (live updating)
 * - Distance/duration stats
 * - Responsive design
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, Play, Pause, StopCircle, FastForward, Rewind, MapPin } from 'lucide-react';
import useSWR from 'swr';
import { format } from 'date-fns';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Breadcrumb {
  id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_mph?: number;
  heading_degrees?: number;
  accuracy_meters?: number;
  altitude_meters?: number;
  engine_rpm?: number;
  fuel_level_percent?: number;
  coolant_temp_f?: number;
  throttle_position_percent?: number;
  metadata?: Record<string, any>;
}

interface TripData {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  start_time: string;
  end_time: string;
  distance_miles: number;
  duration_seconds: number;
  avg_speed_mph: number;
  max_speed_mph: number;
  usage_type?: string;
  classification_status?: string;
  unit_number?: string;
  make?: string;
  model?: string;
  year?: number;
  first_name?: string;
  last_name?: string;
  employee_id?: string;
}

interface TripBreadcrumbsResponse {
  trip: TripData;
  breadcrumbs: Breadcrumb[];
  metadata: {
    totalPoints: number;
    startTime: string;
    endTime: string;
    duration: number;
    distance: number;
  };
}

interface TripPlaybackProps {
  tripId: string;
  autoPlay?: boolean;
}

type PlaybackSpeed = 0.5 | 1 | 2 | 4 | 8;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Interpolate between two points for smooth animation
 */
function interpolatePosition(
  point1: Breadcrumb,
  point2: Breadcrumb,
  progress: number
): [number, number] {
  const lat = point1.latitude + (point2.latitude - point1.latitude) * progress;
  const lng = point1.longitude + (point2.longitude - point1.longitude) * progress;
  return [lat, lng];
}

// ============================================================================
// Fetcher Function
// ============================================================================

const fetcher = async (url: string): Promise<TripBreadcrumbsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// ============================================================================
// Main Component
// ============================================================================

export function TripPlayback({ tripId, autoPlay = false }: TripPlaybackProps) {
  // State
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [progress, setProgress] = useState(0); // 0-1 interpolation progress between points

  // Refs
  const mapRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const animationFrameRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);

  // Fetch trip breadcrumbs data
  const { data, error, isLoading } = useSWR<TripBreadcrumbsResponse>(
    tripId ? `/api/v1/vehicles/trips/${tripId}/breadcrumbs` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  // Initialize Leaflet map
  useEffect(() => {
    let L: any = null;
    let map: any = null;

    const initMap = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Dynamic import of Leaflet
        const leaflet = await import('leaflet');
        L = leaflet.default || leaflet;

        // Load CSS
        await import('leaflet/dist/leaflet.css');

        // Fix default icon paths
        const iconUrl = await import('leaflet/dist/images/marker-icon.png');
        const iconRetinaUrl = await import('leaflet/dist/images/marker-icon-2x.png');
        const shadowUrl = await import('leaflet/dist/images/marker-shadow.png');

        L.Icon.Default.mergeOptions({
          iconUrl: iconUrl.default,
          iconRetinaUrl: iconRetinaUrl.default,
          shadowUrl: shadowUrl.default,
        });

        // Initialize map
        if (!mapRef.current && document.getElementById('trip-playback-map')) {
          map = L.map('trip-playback-map').setView([39.8283, -98.5795], 4);
          mapRef.current = map;

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
        }
      } catch (err) {
        console.error('Failed to initialize map:', err);
      }
    };

    initMap();

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (polylineRef.current && mapRef.current) {
        mapRef.current.removeLayer(polylineRef.current);
      }
      if (vehicleMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(vehicleMarkerRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Render trail when data loads
  useEffect(() => {
    if (!data || !data.breadcrumbs.length || !mapRef.current) return;

    const renderTrail = async () => {
      try {
        const L = await import('leaflet');
        const leaflet = L.default || L;

        const breadcrumbs = data.breadcrumbs;

        // Create polyline trail
        const coordinates = breadcrumbs.map(b => [b.latitude, b.longitude] as [number, number]);
        const polyline = leaflet.polyline(coordinates, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.7
        });

        polyline.addTo(mapRef.current);
        polylineRef.current = polyline;

        // Create custom vehicle marker icon
        const vehicleIcon = leaflet.divIcon({
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: #22c55e;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 0;
                height: 0;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-bottom: 8px solid white;
                transform: rotate(0deg);
              "></div>
            </div>
          `,
          className: 'vehicle-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        // Create vehicle marker at start position
        const vehicleMarker = leaflet.marker(
          [breadcrumbs[0].latitude, breadcrumbs[0].longitude],
          { icon: vehicleIcon }
        );

        vehicleMarker.bindPopup(`
          <div class="p-2">
            <p class="font-bold">Vehicle Position</p>
            <p class="text-sm">Click play to start</p>
          </div>
        `);

        vehicleMarker.addTo(mapRef.current);
        vehicleMarkerRef.current = vehicleMarker;

        // Add start/end markers
        const startMarker = leaflet.marker([breadcrumbs[0].latitude, breadcrumbs[0].longitude], {
          icon: leaflet.divIcon({
            html: '<div style="background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">START</div>',
            className: 'start-marker',
            iconAnchor: [20, 30]
          })
        });
        startMarker.addTo(mapRef.current);

        const lastPoint = breadcrumbs[breadcrumbs.length - 1];
        const endMarker = leaflet.marker([lastPoint.latitude, lastPoint.longitude], {
          icon: leaflet.divIcon({
            html: '<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">END</div>',
            className: 'end-marker',
            iconAnchor: [20, 30]
          })
        });
        endMarker.addTo(mapRef.current);

        // Fit map to show entire route
        mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      } catch (err) {
        console.error('Failed to render trail:', err);
      }
    };

    renderTrail();
  }, [data]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !data || !data.breadcrumbs.length || !vehicleMarkerRef.current) return;

    const animate = (timestamp: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = timestamp;

      // Calculate progress increment based on playback speed
      // Assume 30ms per point at 1x speed
      const baseProgressPerMs = 1 / 30;
      const progressIncrement = baseProgressPerMs * deltaTime * playbackSpeed;

      setProgress(prev => {
        const newProgress = prev + progressIncrement;

        if (newProgress >= 1) {
          // Move to next point
          setCurrentIndex(idx => {
            const nextIndex = idx + 1;
            if (nextIndex >= data.breadcrumbs.length - 1) {
              // Reached end
              setIsPlaying(false);
              return idx;
            }
            return nextIndex;
          });
          return 0;
        }

        return newProgress;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastUpdateTimeRef.current = 0;
    };
  }, [isPlaying, playbackSpeed, data, currentIndex]);

  // Update vehicle marker position
  useEffect(() => {
    if (!data || !vehicleMarkerRef.current || !data.breadcrumbs.length) return;

    const currentPoint = data.breadcrumbs[currentIndex];
    const nextPoint = data.breadcrumbs[Math.min(currentIndex + 1, data.breadcrumbs.length - 1)];

    const [lat, lng] = interpolatePosition(currentPoint, nextPoint, progress);
    vehicleMarkerRef.current.setLatLng([lat, lng]);

    // Update popup with current data
    const popup = `
      <div class="p-2 min-w-[200px]">
        <p class="font-bold">${format(new Date(currentPoint.timestamp), 'h:mm:ss a')}</p>
        <p class="text-sm">Speed: ${currentPoint.speed_mph?.toFixed(1) || 'N/A'} mph</p>
        ${currentPoint.engine_rpm ? `<p class="text-sm">RPM: ${currentPoint.engine_rpm}</p>` : ''}
        ${currentPoint.fuel_level_percent ? `<p class="text-sm">Fuel: ${currentPoint.fuel_level_percent}%</p>` : ''}
      </div>
    `;
    vehicleMarkerRef.current.setPopupContent(popup);
  }, [currentIndex, progress, data]);

  // Control handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      lastUpdateTimeRef.current = 0;
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setProgress(0);
    lastUpdateTimeRef.current = 0;
  };

  const handleSpeedChange = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
  };

  const handleSliderChange = (value: number[]) => {
    if (!data) return;
    const newIndex = Math.floor((value[0] / 100) * (data.breadcrumbs.length - 1));
    setCurrentIndex(newIndex);
    setProgress(0);
    setIsPlaying(false);
  };

  const currentPercentage = data
    ? ((currentIndex + progress) / (data.breadcrumbs.length - 1)) * 100
    : 0;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Trip Playback
          </CardTitle>
          {data && (
            <Badge variant="secondary">
              {data.metadata.totalPoints} points
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-4 border border-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Failed to load trip data</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && data && (
          <>
            {/* Map Container */}
            <div
              id="trip-playback-map"
              className="w-full h-[400px] rounded-md border mb-4"
            />

            {/* Playback Controls */}
            <div className="space-y-4">
              {/* Time Scrubber */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {data.breadcrumbs[currentIndex] &&
                      format(new Date(data.breadcrumbs[currentIndex].timestamp), 'h:mm:ss a')}
                  </span>
                  <span className="font-semibold">
                    {Math.round(currentPercentage)}%
                  </span>
                  <span className="text-muted-foreground">
                    {data.breadcrumbs[data.breadcrumbs.length - 1] &&
                      format(
                        new Date(data.breadcrumbs[data.breadcrumbs.length - 1].timestamp),
                        'h:mm:ss a'
                      )}
                  </span>
                </div>
                <Slider
                  value={[currentPercentage]}
                  onValueChange={handleSliderChange}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isPlaying ? 'default' : 'outline'}
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleStop}>
                    <StopCircle className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                </div>

                {/* Speed Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Speed:</span>
                  {([0.5, 1, 2, 4, 8] as PlaybackSpeed[]).map(speed => (
                    <Button
                      key={speed}
                      size="sm"
                      variant={playbackSpeed === speed ? 'default' : 'outline'}
                      onClick={() => handleSpeedChange(speed)}
                      className="w-12"
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>

              {/* Trip Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-semibold">{data.trip.distance_miles.toFixed(1)} mi</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{formatDuration(data.trip.duration_seconds)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Speed</p>
                  <p className="font-semibold">{data.trip.avg_speed_mph.toFixed(1)} mph</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Speed</p>
                  <p className="font-semibold">{data.trip.max_speed_mph.toFixed(1)} mph</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
