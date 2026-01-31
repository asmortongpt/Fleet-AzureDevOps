import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, AlertCircle } from 'lucide-react';
<<<<<<< HEAD
import logger from '@/utils/logger';
=======
import { useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

>>>>>>> fix/pipeline-eslint-build

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface Vehicle {
  id: string;
  name: string;
  vehicleNumber?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  location?: string;
}

interface FleetMapProps {
  vehicles?: Vehicle[];
  height?: string;
}

export function FleetMap({ vehicles = [], height = '600px' }: FleetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment.');
      setLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    const initMap = async () => {
      try {
        // @ts-expect-error - Google Maps Loader API - importLibrary type signature may vary
        await loader.importLibrary('maps');
        // @ts-expect-error - Google Maps Loader API - importLibrary type signature may vary
        await loader.importLibrary('places');
        // @ts-expect-error - Google Maps Loader API - importLibrary type signature may vary
        await loader.importLibrary('geometry');

        if (mapRef.current) {
          const newMap = new google.maps.Map(mapRef.current, {
            center: { lat: 30.4383, lng: -84.2807 }, // Tallahassee, FL
            zoom: 12,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          });
          setMap(newMap);
          setLoading(false);
        }
      } catch (err: unknown) {
        logger.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps. Please check your API key configuration.');
        setLoading(false);
      }
    };

    initMap();
  }, []);

  // Update markers when vehicles change
  useEffect(() => {
    if (!map || !vehicles.length) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    // Create new markers
    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();
    let hasValidCoordinates = false;

    vehicles.forEach((vehicle) => {
      const lat = vehicle.latitude ?? 0;
      const lng = vehicle.longitude ?? 0;

      // Skip invalid coordinates (0, 0)
      if (lat === 0 && lng === 0) return;

      hasValidCoordinates = true;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: vehicle.name || vehicle.vehicleNumber || 'Unknown Vehicle',
        icon: {
          url: getMarkerIcon(vehicle.status),
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      // Info window for each marker
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${vehicle.name || vehicle.vehicleNumber}</h3>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>Status:</strong> ${vehicle.status || 'Unknown'}
            </p>
            ${vehicle.location ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Location:</strong> ${vehicle.location}</p>` : ''}
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    // Fit map to show all markers
    if (hasValidCoordinates && newMarkers.length > 0) {
      if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition()!);
        map.setZoom(14);
      } else {
        map.fitBounds(bounds);
      }
    }

    setMarkers(newMarkers);
  }, [map, vehicles]);

  // Get marker icon based on vehicle status
  const getMarkerIcon = (status?: string): string => {
    const baseUrl = 'http://maps.google.com/mapfiles/ms/icons/';
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return `${baseUrl}green-dot.png`;
      case 'in_use':
      case 'in use':
        return `${baseUrl}blue-dot.png`;
      case 'maintenance':
      case 'repair':
        return `${baseUrl}yellow-dot.png`;
      case 'out_of_service':
      case 'inactive':
        return `${baseUrl}red-dot.png`;
      default:
        return `${baseUrl}purple-dot.png`;
    }
  };

  const vehiclesWithCoords = vehicles.filter(
    (v) => v.latitude !== undefined && v.longitude !== undefined && v.latitude !== 0 && v.longitude !== 0
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Fleet Vehicle Map
        </CardTitle>
        <CardDescription>
          Real-time vehicle locations powered by Google Maps
          {vehicles.length > 0 && (
            <span className="ml-2">
              ({vehiclesWithCoords.length} of {vehicles.length} vehicles have coordinates)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-slate-700">Loading Google Maps...</p>
            </div>
          </div>
        )}

        {!loading && vehiclesWithCoords.length === 0 && !error && (
          <Alert className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No vehicles with valid GPS coordinates found. Vehicles will appear on the map once location data is
              available.
            </AlertDescription>
          </Alert>
        )}

        <div ref={mapRef} style={{ width: '100%', height, borderRadius: '8px' }} />

        {/* Legend */}
        {vehiclesWithCoords.length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Status Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>In Use</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Out of Service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Unknown</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
