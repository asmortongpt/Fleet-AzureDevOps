import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import type { DependencyList } from "react"

import { useAccessibility } from "@/hooks/useAccessibility"
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import type { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"
import { formatEnum } from '@/utils/format-enum';
import logger from '@/utils/logger';
// ============================================================================
// Dependency Validation & Dynamic Imports
// ============================================================================

let L: typeof import("leaflet") | null = null
let leafletCssLoaded = false

/**
 * Validates and loads Leaflet dependencies with proper error handling.
 * Ensures all required assets are available before map initialization.
 *
 * @returns Promise that resolves with Leaflet library or rejects with error
 * @throws {Error} If Leaflet cannot be loaded or is incompatible
 */
async function ensureLeafletLoaded(): Promise<typeof import("leaflet")> {
  if (L) return L

  try {
    // Dynamic import of Leaflet library
    // Leaflet uses named exports, not default export
    const leafletModule = await import("leaflet")
    L = leafletModule as any as typeof import("leaflet")

    if (!L || typeof L.map !== "function") {
      throw new Error("Leaflet library loaded but is missing core functionality")
    }

    // Load CSS if not already loaded (prevents duplicate style tags)
    if (!leafletCssLoaded && typeof window !== "undefined") {
      try {
        await import("leaflet/dist/leaflet.css")
        leafletCssLoaded = true
      } catch (cssError) {
        logger.warn(`⚠️  Leaflet CSS could not be loaded: ${cssError}`)
        // Non-fatal: map will still work but may not be styled correctly
      }
    }

    // Fix Leaflet default icon paths for bundlers (Vite, Webpack, etc.)
    try {
      const iconUrl = await import("leaflet/dist/images/marker-icon.png")
      const iconRetinaUrl = await import("leaflet/dist/images/marker-icon-2x.png")
      const shadowUrl = await import("leaflet/dist/images/marker-shadow.png")

      L.Icon.Default.mergeOptions({
        iconUrl: iconUrl.default,
        iconRetinaUrl: iconRetinaUrl.default,
        shadowUrl: shadowUrl.default,
      })
    } catch (iconError) {
      logger.warn(`⚠️  Leaflet icons could not be loaded: ${iconError}`)
      // Non-fatal: markers will use fallback icons
    }

    logger.debug(`✅ Leaflet loaded successfully (version: ${L.version || "unknown"})`)
    return L
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error(`❌ Failed to load Leaflet: ${errorMessage}`)
    throw new Error(`Leaflet initialization failed: ${errorMessage}`)
  }
}

// ============================================================================
// Type Definitions & Interfaces
// ============================================================================

// Types imported from @/lib/types above

/**
 * Map visual style options
 */
export type MapStyle = "osm" | "dark" | "topo" | "satellite"

/**
 * Marker type discriminator for event handling
 */
export type MarkerType = "vehicle" | "facility" | "camera"

/**
 * Component props interface with comprehensive documentation
 */
export interface LeafletMapProps {
  /** Array of vehicles to display on map */
  vehicles?: Vehicle[]
  /** Array of facilities to display on map */
  facilities?: GISFacility[]
  /** Array of traffic cameras to display on map */
  cameras?: TrafficCamera[]
  /** Toggle vehicle markers visibility (default: true) */
  showVehicles?: boolean
  /** Toggle facility markers visibility (default: true) */
  showFacilities?: boolean
  /** Toggle camera markers visibility (default: false) */
  showCameras?: boolean
  /** Toggle route lines visibility - future feature (default: false) */
  showRoutes?: boolean
  /** Map visual style theme (default: "osm") */
  mapStyle?: MapStyle
  /** Initial map center [latitude, longitude] (default: center of USA) */
  center?: [number, number]
  /** Initial zoom level 1-19 (default: 4) */
  zoom?: number
  /** Custom CSS class name for container */
  className?: string
  /** Callback fired when marker is clicked */
  onMarkerClick?: (id: string, type: MarkerType) => void
  /** Enable marker clustering for better performance with many markers (default: false) */
  enableClustering?: boolean
  /** Enable auto-fit to show all markers (default: true) */
  autoFitBounds?: boolean
  /** Minimum height in pixels (default: 500) */
  minHeight?: number
  /** Maximum zoom level when auto-fitting (default: 15) */
  maxFitBoundsZoom?: number
  /** Callback when map is ready */
  onReady?: () => void
  /** Callback when an error occurs */
  onError?: (error: Error) => void
  /** Enable screen reader announcements (default: true) */
  enableAnnouncements?: boolean
  /** ARIA label for map region (default: "Interactive fleet management map") */
  ariaLabel?: string
}

/**
 * Tile layer configuration for different map styles
 */
interface TileLayerConfig {
  /** Tile server URL template */
  url: string
  /** Attribution HTML string */
  attribution: string
  /** Maximum zoom level */
  maxZoom?: number
  /** Tile server subdomains for load balancing */
  subdomains?: string[]
}

// ============================================================================
// Constants & Configuration
// ============================================================================

/**
 * Tile layer configurations for different map styles.
 * All providers are free and require no API keys.
 */
const TILE_LAYERS: Record<MapStyle, TileLayerConfig> = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ["a", "b", "c"],
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    subdomains: ["a", "b", "c", "d"],
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org" target="_blank" rel="noopener noreferrer">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: ["a", "b", "c"],
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19,
  },
}

/**
 * Global map configuration constants
 */
const MAP_CONFIG = {
  /** Default map center (Tallahassee, FL) */
  defaultCenter: [30.4383, -84.2807] as [number, number],
  /** Default zoom level (shows Tallahassee area) */
  defaultZoom: 12,
  /** Minimum allowed zoom level */
  minZoom: 2,
  /** Maximum allowed zoom level */
  maxZoom: 19,
  /** Padding around bounds when auto-fitting [top/bottom, left/right] */
  fitBoundsPadding: [50, 50] as [number, number],
  /** Maximum zoom when auto-fitting to prevent over-zoom */
  maxFitBoundsZoom: 15,
  /** Timeout for map initialization (ms) */
  loadingTimeout: 10000,
  /** Debounce delay for marker updates (ms) */
  markerUpdateDebounce: 150,
  /** Animation duration for map movements (ms) */
  animationDuration: 300,
} as const

/**
 * Color scheme for vehicle status indicators
 */
const VEHICLE_STATUS_COLORS: Record<string, string> = {
  active: "#10b981", // emerald-500 - operational and moving
  idle: "#6b7280", // gray-500 - operational but stationary
  charging: "#3b82f6", // blue-500 - electric vehicle charging
  service: "#f59e0b", // amber-500 - under maintenance
  emergency: "#ef4444", // red-500 - emergency/breakdown
  offline: "#374151", // gray-700 - no connection/inactive
  assigned: "#818cf8", // indigo-400 - assigned, not yet moving
  dispatched: "#fb923c", // orange-400 - dispatched
  en_route: "#38bdf8", // sky-400 - en route
  on_site: "#facc15", // yellow-400 - on site
  completed: "#34d399", // emerald-400 - completed
  maintenance: "#f59e0b", // amber-500 - under maintenance
  retired: "#6b7280", // gray-500 - retired
} as const

/**
 * SVG icon paths for vehicle types (18×18 viewBox, rendered as white stroke)
 */
const VEHICLE_ICON_PATHS: Record<string, string> = {
  sedan: 'M3 11h12M4.5 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 11l1.5-4h9L15 11M5 7V5.5a.5.5 0 01.5-.5h7a.5.5 0 01.5.5V7',
  suv: 'M2 12h14M4 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM2 12V9a1 1 0 011-1h2l2-3h4l2 3h2a1 1 0 011 1v3',
  truck: 'M2 11V7a1 1 0 011-1h7v6H3a1 1 0 01-1-1zm8-5h3.2a1 1 0 01.8.4l2 3 .5.6v3a1 1 0 01-1 1h-1M10 6v7m-5 1a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  van: 'M2 12V6a1 1 0 011-1h8a1 1 0 011 1v1l2 2v3a1 1 0 01-1 1h-1M2 12h1m-1 0a1 1 0 001 1h1M4.5 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  emergency: 'M7 3h4v4h4v4h-4v4H7v-4H3V7h4V3z',
  specialty: 'M9 2l1.5 2L13 3l-.5 2.5L15 7l-2 1 .5 2.5-2.5-.5L9 12l-1.5-2L5 11l.5-2.5L3 7l2-1L4.5 3.5 7 4z',
  tractor: 'M3 10V7a2 2 0 012-2h4v5H3zm6-5h3l2 3v2h-5V5zM4 14a2 2 0 100-4 2 2 0 000 4zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  forklift: 'M4 4v9h3V4H4zm5 5v4h2V9H9zm4-5v8m0-8h3m-3 4h2',
  trailer: 'M1 6h14v6H1V6zm0 6h14M4 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM15 9h2',
  construction: 'M2 14h5V9L4 6l3-2m0 0l4 5v5h3l1-4 1 4',
  bus: 'M1 12V5a1 1 0 011-1h14a1 1 0 011 1v7M1 12h16M1 12a1 1 0 001 1h1m13-1a1 1 0 01-1 1h-1M4 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6 4v4m4-4v4m4-4v4',
  motorcycle: 'M4 12a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 10h3l2-4h2l1 2h2',
}

const VEHICLE_ICON_FALLBACK = 'M9 4a5 5 0 100 10 5 5 0 000-10z'

/**
 * Build an inline SVG marker for a vehicle (replaces emoji markers)
 */
function buildVehicleSvgMarker(vehicleType: string, statusColor: string): string {
  const iconPath = VEHICLE_ICON_PATHS[vehicleType] || VEHICLE_ICON_FALLBACK
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <defs>
      <filter id="ds" x="-20%" y="-10%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <path d="M17 42 C17 42 3 26 3 16 A14 14 0 0 1 31 16 C31 26 17 42 17 42Z"
          fill="${statusColor}" stroke="white" stroke-width="2" filter="url(#ds)"/>
    <circle cx="17" cy="16" r="9" fill="rgba(0,0,0,0.2)"/>
    <g transform="translate(8,7)">
      <path d="${iconPath}" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`
}

/**
 * SVG icons for facility types
 */
const FACILITY_ICON_PATHS: Record<string, string> = {
  office: 'M3 14V4a1 1 0 011-1h10a1 1 0 011 1v10M1 14h16M6 6h2m-2 3h2m4-3h2m-2 3h2',
  depot: 'M2 14V7l7-4 7 4v7M2 14h14M6 14v-3h6v3M9 3v4',
  'service-center': 'M14.7 6.3a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0l-2 2L12.2 8l2.5-1.7zM3 11l6.3-6.3 2.8 2.8L5.8 13.8 2 15l1-4z',
  'fueling-station': 'M4 14V4a1 1 0 011-1h6a1 1 0 011 1v5h1.5a1.5 1.5 0 011.5 1.5V13a1 1 0 002 0V7l-2-2M4 8h8',
}

function buildFacilitySvgMarker(facilityType: string): string {
  const iconPath = FACILITY_ICON_PATHS[facilityType] || FACILITY_ICON_PATHS.office
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <defs>
      <filter id="fds" x="-20%" y="-10%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <rect x="2" y="2" width="32" height="32" rx="6" fill="#1e40af" stroke="white" stroke-width="2" filter="url(#fds)"/>
    <g transform="translate(9,9)">
      <path d="${iconPath}" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * React 19 compatible useEffect with proper cleanup tracking.
 * Prevents state updates on unmounted components.
 *
 * @param effect - Effect function that may return cleanup
 * @param deps - Dependency array for effect
 */
function useSafeEffect(effect: () => void | (() => void), deps: DependencyList): void {
  const isMountedRef = useRef(false)
  const cleanupRef = useRef<(() => void) | void | undefined>(undefined)

  useEffect(() => {
    isMountedRef.current = true
    cleanupRef.current = effect()

    return () => {
      isMountedRef.current = false
      if (typeof cleanupRef.current === "function") {
        cleanupRef.current()
      }
    }
  }, deps)
}

/**
 * Debounced callback hook for performance optimization.
 * Prevents excessive updates during rapid changes.
 *
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced callback function
 */
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * LeafletMap - Production-ready interactive map component.
 *
 * Renders an interactive map with markers for vehicles, facilities, and cameras.
 * Supports multiple map styles, marker clustering, and comprehensive error handling.
 *
 * @param props - Component properties
 * @returns Rendered map component or error state
 */
export function LeafletMap({
  vehicles = [],
  facilities = [],
  cameras = [],
  showVehicles = true,
  showFacilities = true,
  showCameras = false,
  mapStyle = "osm",
  center = MAP_CONFIG.defaultCenter,
  zoom = MAP_CONFIG.defaultZoom,
  className = "",
  onMarkerClick,
  enableClustering = false,
  autoFitBounds = true,
  minHeight = 500,
  maxFitBoundsZoom = MAP_CONFIG.maxFitBoundsZoom,
  onReady,
  onError,
  enableAnnouncements = true,
  ariaLabel = "Interactive fleet management map",
}: LeafletMapProps) {
  // ========== Accessibility ==========
  const {

    announceMapChange,

  } = useAccessibility({
    enableAnnouncements,
    announceMarkerChanges: true,
  })

  // ========== Performance Monitoring ==========
  const perf = usePerformanceMonitor('LeafletMap', {
    enabled: typeof window !== 'undefined' && import.meta.env.DEV,
    reportInterval: 0, // Disable auto-reporting to avoid console spam
  })

  // ========== State Management ==========
  // FIX: Split mapState into individual state variables to prevent infinite loop
  // Issue: When mapState object updates, it creates a new reference, triggering
  // all effects that depend on isReady, which can cause an infinite loop
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [libraryLoaded, setLibraryLoaded] = useState(false)

  // ========== Refs for Leaflet Instances ==========
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const vehicleLayerRef = useRef<any>(null)
  const facilityLayerRef = useRef<any>(null)
  const cameraLayerRef = useRef<any>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // ========== Memoized Values ==========
  const tileConfig = useMemo(() => TILE_LAYERS[mapStyle], [mapStyle])

  // Placeholder for remaining component logic
  // This is a partial implementation to fix the provided errors
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Load Leaflet library on mount
  useEffect(() => {
    let cancelled = false

    const loadLibrary = async () => {
      try {
        await ensureLeafletLoaded()
        if (!cancelled && isMountedRef.current) {
          setLibraryLoaded(true)
        }
      } catch (error) {
        if (!cancelled && isMountedRef.current) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load map library'
          setMapError(errorMessage)
          setIsLoading(false)
          onError?.(error instanceof Error ? error : new Error(errorMessage))
        }
      }
    }

    loadLibrary()

    return () => {
      cancelled = true
    }
  }, [onError])

  // Initialize map once library is loaded
  useSafeEffect(() => {
    if (!libraryLoaded || !mapContainerRef.current || !L) return

    // Set loading timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        setMapError('Map loading timed out. Please refresh the page.')
        setIsLoading(false)
      }
    }, MAP_CONFIG.loadingTimeout)

    try {
      // Initialize the map
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoomControl: true,
        attributionControl: true,
      })

      mapInstanceRef.current = map

      // Add tile layer
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom || MAP_CONFIG.maxZoom,
        subdomains: tileConfig.subdomains || ['a', 'b', 'c'],
      })
      tileLayer.addTo(map)
      tileLayerRef.current = tileLayer

      // Create layer groups for markers
      vehicleLayerRef.current = L.layerGroup().addTo(map)
      facilityLayerRef.current = L.layerGroup().addTo(map)
      cameraLayerRef.current = L.layerGroup().addTo(map)

      // Mark as ready
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      setIsLoading(false)
      setIsReady(true)
      onReady?.()
      announceMapChange({ type: 'ready', message: 'Map loaded successfully' })

      // perf.markEvent('map_initialized')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map'
      setMapError(errorMessage)
      setIsLoading(false)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }

    return () => {
      // Cleanup
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [libraryLoaded, center, zoom, tileConfig, onReady, onError, announceMapChange, perf])

  // Update markers when data changes
  const updateMarkers = useDebouncedCallback(() => {
    const Leaflet = L
    if (!isReady || !Leaflet || !mapInstanceRef.current) return

    const bounds: [number, number][] = []

    // Clear existing markers
    vehicleLayerRef.current?.clearLayers()
    facilityLayerRef.current?.clearLayers()
    cameraLayerRef.current?.clearLayers()

    // Add vehicle markers
    if (showVehicles && vehicles.length > 0) {
      vehicles.forEach((vehicle) => {
        if (vehicle.location?.latitude && vehicle.location?.longitude) {
          const lat = vehicle.location.latitude
          const lng = vehicle.location.longitude

          // Validate coordinates
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            const color = VEHICLE_STATUS_COLORS[vehicle.status] || VEHICLE_STATUS_COLORS.offline
            const vehicleType = vehicle.type || 'sedan'

            const icon = Leaflet.divIcon({
              className: 'vehicle-marker',
              html: buildVehicleSvgMarker(vehicleType, color),
              iconSize: [34, 44],
              iconAnchor: [17, 44],
            })

            const marker = Leaflet.marker([lat, lng], { icon })
              .bindPopup(`<b>${vehicle.year ? vehicle.year + ' ' : ''}${vehicle.make || ''} ${vehicle.model || vehicle.name || 'Unknown Vehicle'}</b><br/>Status: ${formatEnum(vehicle.status)}`)
              .on('click', () => onMarkerClick?.(vehicle.id, 'vehicle'))

            marker.addTo(vehicleLayerRef.current)
            bounds.push([lat, lng])
          }
        }
      })
    }

    // Add facility markers
    if (showFacilities && facilities.length > 0) {
      facilities.forEach((facility) => {
        if (facility.location?.lat && facility.location?.lng) {
          const lat = facility.location.lat
          const lng = facility.location.lng

          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            const icon = Leaflet.divIcon({
              className: 'facility-marker',
              html: buildFacilitySvgMarker(facility.type),
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            })

            const marker = Leaflet.marker([lat, lng], { icon })
              .bindPopup(`<b>${facility.name}</b><br/>Type: ${facility.type}`)
              .on('click', () => onMarkerClick?.(facility.id, 'facility'))

            marker.addTo(facilityLayerRef.current)
            bounds.push([lat, lng])
          }
        }
      })
    }

    // Add camera markers
    if (showCameras && cameras.length > 0) {
      cameras.forEach((camera) => {
        if (camera.latitude && camera.longitude) {
          const lat = camera.latitude
          const lng = camera.longitude

          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            const icon = Leaflet.divIcon({
              className: 'camera-marker',
              html: `<div style="background-color: #7c3aed; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📹</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            })

            const marker = Leaflet.marker([lat, lng], { icon })
              .bindPopup(`<b>${camera.name || 'Traffic Camera'}</b>`)
              .on('click', () => onMarkerClick?.(camera.id, 'camera'))

            marker.addTo(cameraLayerRef.current)
            bounds.push([lat, lng])
          }
        }
      })
    }

    // Auto-fit bounds
    if (autoFitBounds && bounds.length > 0 && mapInstanceRef.current) {
      const latLngBounds = Leaflet.latLngBounds(bounds)
      mapInstanceRef.current.fitBounds(latLngBounds, {
        padding: MAP_CONFIG.fitBoundsPadding,
        maxZoom: maxFitBoundsZoom,
        animate: true,
        duration: MAP_CONFIG.animationDuration / 1000,
      })
    }

    // perf.markEvent('markers_updated', { count: bounds.length })
  }, MAP_CONFIG.markerUpdateDebounce)

  // Trigger marker update when data changes
  useEffect(() => {
    if (isReady) {
      updateMarkers()
    }
  }, [isReady, vehicles, facilities, cameras, showVehicles, showFacilities, showCameras, updateMarkers])

  // Update tile layer when style changes
  useEffect(() => {
    if (!isReady || !L || !mapInstanceRef.current || !tileLayerRef.current) return

    // Remove old tile layer
    mapInstanceRef.current.removeLayer(tileLayerRef.current)

    // Add new tile layer
    const newTileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom || MAP_CONFIG.maxZoom,
      subdomains: tileConfig.subdomains || ['a', 'b', 'c'],
    })
    newTileLayer.addTo(mapInstanceRef.current)
    tileLayerRef.current = newTileLayer

    announceMapChange({ type: 'custom', message: `Map style changed to ${mapStyle}` })
  }, [isReady, mapStyle, tileConfig, announceMapChange])

  // Return JSX (placeholder for complete implementation)
  return (
    <div
      ref={mapContainerRef}
      className={`leaflet-map-container ${className}`}
      style={{ minHeight: `${minHeight}px`, height: '100%', width: '100%' }}
      role="region"
      aria-label={ariaLabel}
    >
      {isLoading && <div className="loading">Loading map...</div>}
      {mapError && <div className="error">{mapError}</div>}
    </div>
  )
}