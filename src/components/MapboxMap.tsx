import { useEffect, useRef, useState, useCallback } from "react"

import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"
import logger from '@/utils/logger';

let mapboxgl: typeof import("mapbox-gl") | null = null
let mapboxCssLoaded = false

async function loadMapboxGL(): Promise<typeof import("mapbox-gl")> {
  if (mapboxgl) return mapboxgl

  try {
    const module = await import("mapbox-gl")
    mapboxgl = module.default || module

    if (!mapboxCssLoaded && typeof window !== "undefined") {
      try {
        await import("mapbox-gl/dist/mapbox-gl.css")
        mapboxCssLoaded = true
        logger.debug("✅ Mapbox GL CSS loaded")
      } catch (cssError) {
        logger.warn("⚠️  Mapbox GL CSS could not be loaded:", cssError)
      }
    }

    logger.debug("✅ Mapbox GL loaded successfully")
    return mapboxgl
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error("❌ Failed to load Mapbox GL:", errorMessage)
    throw new Error(`Mapbox GL initialization failed: ${errorMessage}`)
  }
}

export type MapStyle = "streets" | "satellite" | "outdoors" | "dark" | "light"

export interface MapboxMapProps {
  vehicles?: Vehicle[]
  facilities?: GISFacility[]
  cameras?: TrafficCamera[]
  showVehicles?: boolean
  showFacilities?: boolean
  showCameras?: boolean
  showRoutes?: boolean
  mapStyle?: MapStyle
  center?: [number, number]
  zoom?: number
  className?: string
  onMapReady?: (map: mapboxgl.Map) => void
  onReady?: () => void
  onError?: (error: Error) => void
}

const MAPBOX_STYLE_URLS: Record<MapStyle, string> = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/light-v11"
} as const

const DEFAULT_CENTER: [number, number] = [-98.5795, 39.8283]
const DEFAULT_ZOOM = 4
const MIN_TOKEN_LENGTH = 50

function validateMapboxToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  if (token.includes('demo') || token.includes('YOUR_') || token.includes('xxx')) {
    return false
  }

  if (token.length < MIN_TOKEN_LENGTH) {
    return false
  }

  if (!token.startsWith('pk.') && !token.startsWith('sk.')) {
    return false
  }

  return true
}

function getVehicleColor(status: Vehicle["status"]): string {
  const colors: Record<Vehicle["status"], string> = {
    active: "#10b981",
    idle: "#6b7280",
    charging: "#3b82f6",
    service: "#f59e0b",
    emergency: "#ef4444",
    offline: "#374151"
  }
  return colors[status] || "#6b7280"
}

function createVehiclePopupHTML(vehicle: Vehicle): string {
  const locationText = vehicle.location?.address ||
    (vehicle.location ? `${vehicle.location?.lat.toFixed(4)}, ${vehicle.location?.lng.toFixed(4)}` : "Unknown")

  return `
    <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${escapeHtml(vehicle.name)}</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        <strong>Type:</strong> ${escapeHtml(vehicle.type)}
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        <strong>Status:</strong> <span style="color: ${getVehicleColor(vehicle.status)}">${escapeHtml(vehicle.status)}</span>
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        <strong>Driver:</strong> ${escapeHtml(vehicle.driver || "Unassigned")}
      </div>
      <div style="font-size: 12px; color: #666;">
        <strong>Location:</strong> ${escapeHtml(locationText)}
      </div>
    </div>
  `
}

function createFacilityPopupHTML(facility: GISFacility): string {
  return `
    <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${escapeHtml(facility.name)}</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        <strong>Type:</strong> ${escapeHtml(facility.type.replace("-", " "))}
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        <strong>Status:</strong> <span style="color: ${facility.status === "operational" ? "#10b981" : "#f59e0b"}">${escapeHtml(facility.status)}</span>
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        <strong>Capacity:</strong> ${facility.capacity} vehicles
      </div>
      <div style="font-size: 12px; color: #666;">
        <strong>Address:</strong> ${escapeHtml(facility.address)}
      </div>
    </div>
  `
}

function createCameraPopupHTML(camera: TrafficCamera): string {
  return `
    <div style="padding: 12px; min-width: 250px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${escapeHtml(camera.name)}</div>
      ${camera.address ? `
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
          <strong>Address:</strong> ${escapeHtml(camera.address)}
        </div>
      ` : ''}
      ${camera.crossStreets ? `
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
          <strong>Cross Streets:</strong> ${escapeHtml(camera.crossStreets)}
        </div>
      ` : ''}
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        <strong>Status:</strong> <span style="color: ${camera.operational ? "#10b981" : "#ef4444"}">${camera.operational ? "Operational" : "Offline"}</span>
      </div>
      ${camera.cameraUrl && sanitizeUrl(camera.cameraUrl) ? `
        <div style="margin-top: 8px;">
          <a href="${sanitizeUrl(camera.cameraUrl)}" target="_blank" rel="noopener noreferrer" style="
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
          ">View Camera Feed</a>
        </div>
      ` : ''}
      ${camera.latitude && camera.longitude ? `
        <div style="font-size: 11px; color: #999; margin-top: 8px;">
          ${camera.latitude.toFixed(5)}, ${camera.longitude.toFixed(5)}
        </div>
      ` : ''}
    </div>
  `
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function sanitizeUrl(url: string | undefined): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url)
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return escapeHtml(url)
    }
  } catch {
    // Invalid URL
  }

  return ''
}

export function MapboxMap({
  vehicles = [],
  facilities = [],
  cameras = [],
  showVehicles = true,
  showFacilities = true,
  showCameras = false,
  _showRoutes = true,
  mapStyle = "streets",
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "",
  onMapReady,
  
  onError
}: MapboxMapProps) {
  const _perf = usePerformanceMonitor("MapboxMap", {
    enabled: import.meta.env.DEV,
    reportInterval: 10000,
    slowRenderThreshold: 50,
    highMemoryThreshold: 150,
  })

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const vehicleMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const facilityMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const cameraMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const isCleaningUpRef = useRef(false)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const mapboxRef = useRef<typeof import("mapbox-gl") | null>(null)

  const createVehicleMarkerElement = useCallback((vehicle: Vehicle): HTMLElement => {
    const el = document.createElement("div")
    el.className = "vehicle-marker"
    el.setAttribute("data-vehicle-id", vehicle.id)
    el.style.cssText = `
      background-color: ${getVehicleColor(vehicle.status)};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      cursor: pointer;
      transition: transform 0.2s;
    `

    const icon = vehicle.type === "sedan" ? "🚗" :
                 vehicle.type === "truck" ? "🚚" :
                 vehicle.type === "van" ? "🚐" : "🚙"
    el.textContent = icon

    el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)" })
    el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)" })

    return el
  }, [])

  const createFacilityMarkerElement = useCallback((facility: GISFacility): HTMLElement => {
    const icons: Record<GISFacility["type"], string> = {
      office: "🏢",
      depot: "🏭",
      "service-center": "🔧",
      "fueling-station": "⛽"
    }
    const icon = icons[facility.type] || "📍"

    const el = document.createElement("div")
    el.className = "facility-marker"
    el.setAttribute("data-facility-id", facility.id)
    el.style.cssText = `
      background-color: #3b82f6;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.2s;
    `
    el.textContent = icon

    el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)" })
    el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)" })

    return el
  }, [])

  const createCameraMarkerElement = useCallback((camera: TrafficCamera): HTMLElement => {
    const color = camera.operational ? "#3b82f6" : "#6b7280"
    const el = document.createElement("div")
    el.className = "camera-marker"
    el.setAttribute("data-camera-id", camera.id)
    el.style.cssText = `
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.2s;
    `
    el.textContent = "📹"

    el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)" })
    el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)" })

    return el
  }, [])

  const clearMarkers = useCallback((markerMap: Map<string, mapboxgl.Marker>) => {
    markerMap.forEach(marker => {
      marker.remove();
    });
    markerMap.clear();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeMap() {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        const mapbox = await loadMapboxGL();
        mapboxRef.current = mapbox;

        if (!mapContainerRef.current) {
          throw new Error("Map container not found");
        }

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const token = (mapbox as any).accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
        if (!validateMapboxToken(token)) {
          throw new Error("Invalid or missing Mapbox access token");
        }

        (mapbox as any).accessToken = token;

        const map = new mapbox.Map({
          container: mapContainerRef.current,
          style: MAPBOX_STYLE_URLS[mapStyle],
          center: center,
          zoom: zoom,
          attributionControl: false
        });

        mapRef.current = map;

        map.on('load', () => {
          if (!isMounted) return;
          setMapReady(true);
          setIsLoading(false);
          onMapReady?.(map);
        });

        map.on('error', (e) => {
          if (!isMounted) return;
          const error = e.error || new Error('Map error');
          setMapError(error.message);
          onError?.(error);
        });
      } catch (err) {
        if (!isMounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setMapError(error.message);
        setIsLoading(false);
        onError?.(error);
      }
    }

    if (!mapRef.current) {
      initializeMap();
    }

    return () => {
      isMounted = false;
      isCleaningUpRef.current = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      clearMarkers(vehicleMarkersRef.current);
      clearMarkers(facilityMarkersRef.current);
      clearMarkers(cameraMarkersRef.current);
    };
  }, [mapStyle, center, zoom, onMapReady, onError, clearMarkers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) return;

    const mapbox = mapboxRef.current;
    const map = mapRef.current;

    if (showVehicles) {
      vehicles.forEach(vehicle => {
        if (!vehicle.location?.lat || !vehicle.location?.lng) return;

        const existingMarker = vehicleMarkersRef.current.get(vehicle.id);
        if (existingMarker) {
          existingMarker.setLngLat([vehicle.location.lng, vehicle.location.lat]);
          return;
        }

        const el = createVehicleMarkerElement(vehicle);
        const marker = new mapbox.Marker({ element: el })
          .setLngLat([vehicle.location.lng, vehicle.location.lat])
          .setPopup(new mapbox.Popup().setHTML(createVehiclePopupHTML(vehicle)))
          .addTo(map);

        vehicleMarkersRef.current.set(vehicle.id, marker);
      });

      vehicleMarkersRef.current.forEach((marker, id) => {
        if (!vehicles.some(v => v.id === id)) {
          marker.remove();
          vehicleMarkersRef.current.delete(id);
        }
      });
    } else {
      clearMarkers(vehicleMarkersRef.current);
    }
  }, [vehicles, showVehicles, mapReady, clearMarkers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) return;

    const mapbox = mapboxRef.current;
    const map = mapRef.current;

    if (showFacilities) {
      facilities.forEach(facility => {
        if (!facility.lat || !facility.lng) return;

        const existingMarker = facilityMarkersRef.current.get(facility.id);
        if (existingMarker) {
          existingMarker.setLngLat([facility.lng, facility.lat]);
          return;
        }

        const el = createFacilityMarkerElement(facility);
        const marker = new mapbox.Marker({ element: el })
          .setLngLat([facility.lng, facility.lat])
          .setPopup(new mapbox.Popup().setHTML(createFacilityPopupHTML(facility)))
          .addTo(map);

        facilityMarkersRef.current.set(facility.id, marker);
      });

      facilityMarkersRef.current.forEach((marker, id) => {
        if (!facilities.some(f => f.id === id)) {
          marker.remove();
          facilityMarkersRef.current.delete(id);
        }
      });
    } else {
      clearMarkers(facilityMarkersRef.current);
    }
  }, [facilities, showFacilities, mapReady, clearMarkers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) return;

    const mapbox = mapboxRef.current;
    const map = mapRef.current;

    if (showCameras) {
      cameras.forEach(camera => {
        if (!camera.latitude || !camera.longitude) return;

        const existingMarker = cameraMarkersRef.current.get(camera.id);
        if (existingMarker) {
          existingMarker.setLngLat([camera.longitude, camera.latitude]);
          return;
        }

        const el = createCameraMarkerElement(camera);
        const marker = new mapbox.Marker({ element: el })
          .setLngLat([camera.longitude, camera.latitude])
          .setPopup(new mapbox.Popup().setHTML(createCameraPopupHTML(camera)))
          .addTo(map);

        cameraMarkersRef.current.set(camera.id, marker);
      });

      cameraMarkersRef.current.forEach((marker, id) => {
        if (!cameras.some(c => c.id === id)) {
          marker.remove();
          cameraMarkersRef.current.delete(id);
        }
      });
    } else {
      clearMarkers(cameraMarkersRef.current);
    }
  }, [cameras, showCameras, mapReady, clearMarkers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    map.setStyle(MAPBOX_STYLE_URLS[mapStyle]);
  }, [mapStyle, mapReady]);

  return (
    <div
      ref={mapContainerRef}
      className={`map-container ${className}`.trim()}
      style={{ width: '100%', height: '100%' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75 z-50">
          <div className="text-lg font-medium text-gray-700">Loading map...</div>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 bg-opacity-75 z-50 p-4 text-center">
          <div className="text-lg font-medium text-red-800 mb-2">Map Error</div>
          <div className="text-sm text-red-600 max-w-md">{mapError}</div>
        </div>
      )}
    </div>
  );
}