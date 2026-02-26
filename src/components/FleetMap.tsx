import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup as LeafletPopup } from 'react-leaflet';
import L from 'leaflet';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/utils/logger';


const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const USE_LEAFLET_FALLBACK =
  !GOOGLE_MAPS_API_KEY ||
  GOOGLE_MAPS_API_KEY.toLowerCase().includes('placeholder') ||
  GOOGLE_MAPS_API_KEY.toLowerCase().startsWith('dev-');

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
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const leafletIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    []
  );

  // Ensure Leaflet CSS is present when using fallback
  useEffect(() => {
    if (!USE_LEAFLET_FALLBACK) return;
    const existing = document.querySelector('link[data-leaflet]');
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.setAttribute('data-leaflet', 'true');
    document.head.appendChild(link);
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (USE_LEAFLET_FALLBACK) {
      setLoading(false);
      return;
    }

    setOptions({
      key: GOOGLE_MAPS_API_KEY,
      v: 'weekly',
      libraries: ['places', 'geometry'],
    });

    const initMap = async () => {
      try {
        await importLibrary('maps');
        await importLibrary('marker'); // Advanced markers

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
    markers.forEach((marker) => { marker.map = null; });

    // Create new markers
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    const bounds = new google.maps.LatLngBounds();
    let hasValidCoordinates = false;

    vehicles.forEach((vehicle) => {
      const lat = vehicle.latitude ?? 0;
      const lng = vehicle.longitude ?? 0;

      // Skip invalid coordinates (0, 0)
      if (lat === 0 && lng === 0) return;

      hasValidCoordinates = true;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map,
        title: vehicle.name || vehicle.vehicleNumber || 'Unknown Vehicle',
        content: createMarkerContent(getMarkerIcon(vehicle.status)),
      });

      // Info window for each marker
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${vehicle.name || vehicle.vehicleNumber}</h3>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>Status:</strong> ${vehicle.status || '—'}
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
      bounds.extend(marker.position as google.maps.LatLng);
    });

    // Fit map to show all markers
    if (hasValidCoordinates && newMarkers.length > 0) {
      if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].position as google.maps.LatLng);
        map.setZoom(14);
      } else {
        map.fitBounds(bounds);
      }
    }

    setMarkers(newMarkers);
  }, [map, vehicles]);

  // Get marker icon based on vehicle status
  const getMarkerIcon = (status?: string): string => {
    const baseUrl = 'https://maps.gstatic.com/mapfiles/ms2/micons/';
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return `${baseUrl}green.png`;
      case 'in_use':
      case 'in use':
        return `${baseUrl}blue.png`;
      case 'maintenance':
      case 'repair':
        return `${baseUrl}yellow.png`;
      case 'out_of_service':
      case 'inactive':
        return `${baseUrl}red.png`;
      default:
        return `${baseUrl}purple.png`;
    }
  };

  const createMarkerContent = (iconUrl: string) => {
    const img = document.createElement('img');
    img.src = iconUrl;
    img.style.width = '32px';
    img.style.height = '32px';
    img.style.objectFit = 'contain';
    return img;
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
              <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-emerald-600 mx-auto mb-2"></div>
              <p className="text-sm text-white/70">Loading Google Maps...</p>
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

        {USE_LEAFLET_FALLBACK ? (
          <div style={{ height }}>
            <MapContainer
              center={[30.4383, -84.2807]}
              zoom={12}
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {vehiclesWithCoords.map((v) => (
                <LeafletMarker
                  key={v.id}
                  position={[v.latitude!, v.longitude!]}
                  icon={leafletIcon}
                >
                  <LeafletPopup>
                    <div className="space-y-1">
                      <div className="font-semibold">{v.name || v.vehicleNumber}</div>
                      <div className="text-sm text-muted-foreground">Status: {v.status || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.latitude?.toFixed(5)}, {v.longitude?.toFixed(5)}
                      </div>
                    </div>
                  </LeafletPopup>
                </LeafletMarker>
              ))}
            </MapContainer>
          </div>
        ) : (
          <div ref={mapRef} style={{ width: '100%', height, borderRadius: '8px' }} />
        )}

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
                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
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
