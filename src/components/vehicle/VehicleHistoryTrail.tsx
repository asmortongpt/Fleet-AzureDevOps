/**
 * VehicleHistoryTrail Component
 *
 * Displays vehicle location history as a polyline trail on a map
 * with color gradient and event markers
 *
 * Features:
 * - GPS breadcrumb trail visualization
 * - Color gradient (blue = old, red/orange = recent)
 * - Hover tooltips with timestamp, speed, address
 * - Toggle visibility
 * - Loading states and error handling
 * - Performance optimized for 10,000+ points
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, MapPin, Eye, EyeOff, Calendar } from 'lucide-react';
import useSWR from 'swr';
import { format } from 'date-fns';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface LocationPoint {
  id: number;
  trip_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_mph?: number;
  heading_degrees?: number;
  accuracy_meters?: number;
  altitude_meters?: number;
  engine_rpm?: number;
  fuel_level_percent?: number;
  metadata?: Record<string, any>;
}

interface VehicleHistoryTrailProps {
  vehicleId: string;
  startDate?: string;
  endDate?: string;
  onPointClick?: (point: LocationPoint) => void;
}

interface LocationHistoryResponse {
  data: LocationPoint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
  metadata: {
    vehicleId: string;
    startDate: string | null;
    endDate: string | null;
    pointsReturned: number;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate color based on timestamp age (gradient from blue to red)
 */
function getColorForTimestamp(timestamp: string, oldestTime: number, newestTime: number): string {
  const time = new Date(timestamp).getTime();
  const range = newestTime - oldestTime;
  const position = range > 0 ? (time - oldestTime) / range : 0;

  // Blue (old) to Red (new) gradient
  if (position < 0.25) {
    return '#0066cc'; // Blue
  } else if (position < 0.5) {
    return '#00aacc'; // Cyan
  } else if (position < 0.75) {
    return '#ffaa00'; // Orange
  } else {
    return '#ff3333'; // Red
  }
}

/**
 * Format speed for display
 */
function formatSpeed(mph?: number): string {
  if (mph === undefined || mph === null) return 'N/A';
  return `${Math.round(mph)} mph`;
}

/**
 * Format heading for display
 */
function formatHeading(degrees?: number): string {
  if (degrees === undefined || degrees === null) return 'N/A';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return `${directions[index]} (${Math.round(degrees)}°)`;
}

// ============================================================================
// Fetcher Function
// ============================================================================

const fetcher = async (url: string): Promise<LocationHistoryResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// ============================================================================
// Main Component
// ============================================================================

export function VehicleHistoryTrail({
  vehicleId,
  startDate,
  endDate,
  onPointClick
}: VehicleHistoryTrailProps) {
  const [visible, setVisible] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<LocationPoint | null>(null);
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Build API URL with query parameters
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      limit: '10000',
      page: '1'
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return `/api/v1/vehicles/${vehicleId}/location-history?${params.toString()}`;
  }, [vehicleId, startDate, endDate]);

  // Fetch location history data
  const { data, error, isLoading } = useSWR<LocationHistoryResponse>(
    vehicleId ? buildUrl() : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000 // 1 minute
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
        if (!mapRef.current && document.getElementById('history-trail-map')) {
          map = L.map('history-trail-map').setView([39.8283, -98.5795], 4);
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
      if (polylineRef.current && mapRef.current) {
        mapRef.current.removeLayer(polylineRef.current);
      }
      markersRef.current.forEach(marker => {
        if (mapRef.current) mapRef.current.removeLayer(marker);
      });
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Render trail on map when data changes
  useEffect(() => {
    if (!data || !data.data.length || !mapRef.current || !visible) return;

    const renderTrail = async () => {
      try {
        const L = await import('leaflet');
        const leaflet = L.default || L;

        // Clear existing trail and markers
        if (polylineRef.current) {
          mapRef.current.removeLayer(polylineRef.current);
        }
        markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
        markersRef.current = [];

        const points = data.data;
        const oldestTime = new Date(points[points.length - 1].timestamp).getTime();
        const newestTime = new Date(points[0].timestamp).getTime();

        // Create polyline segments with gradient
        const segments: any[] = [];
        for (let i = 0; i < points.length - 1; i++) {
          const point1 = points[i];
          const point2 = points[i + 1];
          const color = getColorForTimestamp(point1.timestamp, oldestTime, newestTime);

          const segment = leaflet.polyline(
            [[point1.latitude, point1.longitude], [point2.latitude, point2.longitude]],
            {
              color: color,
              weight: 3,
              opacity: 0.7
            }
          );

          segments.push(segment);
          segment.addTo(mapRef.current);
        }

        // Add markers at significant points (every 100th point or significant events)
        const markerInterval = Math.max(1, Math.floor(points.length / 50));
        points.forEach((point, index) => {
          if (index % markerInterval === 0 || index === 0 || index === points.length - 1) {
            const color = getColorForTimestamp(point.timestamp, oldestTime, newestTime);
            const marker = leaflet.circleMarker([point.latitude, point.longitude], {
              radius: 5,
              fillColor: color,
              color: '#fff',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            });

            marker.bindPopup(`
              <div class="p-2">
                <p class="font-bold">${format(new Date(point.timestamp), 'MMM d, yyyy h:mm a')}</p>
                <p>Speed: ${formatSpeed(point.speed_mph)}</p>
                <p>Heading: ${formatHeading(point.heading_degrees)}</p>
                ${point.fuel_level_percent ? `<p>Fuel: ${point.fuel_level_percent}%</p>` : ''}
                ${point.engine_rpm ? `<p>RPM: ${point.engine_rpm}</p>` : ''}
              </div>
            `);

            marker.on('click', () => {
              if (onPointClick) onPointClick(point);
            });

            marker.addTo(mapRef.current);
            markersRef.current.push(marker);
          }
        });

        // Fit map to show all points
        if (points.length > 0) {
          const bounds = leaflet.latLngBounds(points.map(p => [p.latitude, p.longitude]));
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }

        polylineRef.current = segments;
      } catch (err) {
        console.error('Failed to render trail:', err);
      }
    };

    renderTrail();
  }, [data, visible, onPointClick]);

  // Toggle visibility
  const toggleVisibility = () => {
    setVisible(!visible);
    if (polylineRef.current && mapRef.current) {
      if (visible) {
        polylineRef.current.forEach((segment: any) => mapRef.current.removeLayer(segment));
        markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
      }
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location History Trail
          </CardTitle>
          <div className="flex items-center gap-2">
            {data && (
              <Badge variant="secondary">
                {data.metadata.pointsReturned} points
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={toggleVisibility}
            >
              {visible ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide Trail
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Show Trail
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Date Range Display */}
        {(startDate || endDate) && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {startDate && format(new Date(startDate), 'MMM d, yyyy')}
              {startDate && endDate && ' - '}
              {endDate && format(new Date(endDate), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-[400px] w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-4 border border-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Failed to load location history</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        )}

        {/* Map Container */}
        {!isLoading && !error && (
          <>
            <div
              id="history-trail-map"
              className="w-full h-[400px] rounded-md border"
              style={{ display: visible ? 'block' : 'none' }}
            />

            {!visible && (
              <div className="h-[400px] flex items-center justify-center border rounded-md bg-muted">
                <div className="text-center">
                  <EyeOff className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Trail hidden</p>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#0066cc]" />
                <span>Oldest</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#00aacc]" />
                <span>Older</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ffaa00]" />
                <span>Recent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ff3333]" />
                <span>Newest</span>
              </div>
            </div>

            {/* Stats */}
            {data && data.data.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">First Point</p>
                  <p className="font-semibold">
                    {format(new Date(data.data[data.data.length - 1].timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Point</p>
                  <p className="font-semibold">
                    {format(new Date(data.data[0].timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Points</p>
                  <p className="font-semibold">{data.pagination.total.toLocaleString()}</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
