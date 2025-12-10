/**
 * MapboxMap Component
 *
 * A production-ready, robust React component for rendering interactive Mapbox maps
 * with support for vehicles, facilities, and traffic cameras.
 *
 * Features:
 * - Multiple map styles (streets, satellite, outdoors, dark, light)
 * - Interactive markers with popups
 * - Automatic bounds fitting
 * - Comprehensive error handling
 * - Graceful degradation without API token
 * - Proper resource cleanup
 * - React 19 compatible
 * - TypeScript strict mode compatible
 *
 * @example
 * ```tsx
 * <MapboxMap
 *   vehicles={vehicleData}
 *   facilities={facilityData}
 *   showVehicles={true}
 *   mapStyle="streets"
 *   zoom={12}
 * />
 * ```
 */

import { useEffect, useRef, useState, useCallback } from "react"

import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

// ============================================================================
// Dynamic Import for Mapbox GL
// Reduces initial bundle size by ~500kb - loads on demand
// ============================================================================

let mapboxgl: typeof import("mapbox-gl") | null = null
let mapboxCssLoaded = false

/**
 * Dynamically loads Mapbox GL library and CSS
 * Ensures library is only loaded when map component is rendered
 *
 * @returns Promise resolving to mapbox-gl module
 * @throws Error if Mapbox GL fails to load
 */
async function loadMapboxGL(): Promise<typeof import("mapbox-gl")> {
  if (mapboxgl) return mapboxgl

  try {
    // Dynamic import of Mapbox GL library
    const module = await import("mapbox-gl")
    mapboxgl = module.default || module

    // Load CSS if not already loaded
    if (!mapboxCssLoaded && typeof window !== "undefined") {
      try {
        await import("mapbox-gl/dist/mapbox-gl.css")
        mapboxCssLoaded = true
        console.log("✅ Mapbox GL CSS loaded")
      } catch (cssError) {
        console.warn("⚠️  Mapbox GL CSS could not be loaded:", cssError)
        // Non-fatal: map will work but may not be styled correctly
      }
    }

    console.log("✅ Mapbox GL loaded successfully")
    return mapboxgl
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("❌ Failed to load Mapbox GL:", errorMessage)
    throw new Error(`Mapbox GL initialization failed: ${errorMessage}`)
  }
}

/**
 * Supported Mapbox map styles
 */
export type MapStyle = "streets" | "satellite" | "outdoors" | "dark" | "light"

/**
 * Props for the MapboxMap component
 */
export interface MapboxMapProps {
  /** Array of vehicles to display on the map */
  vehicles?: Vehicle[]
  /** Array of facilities to display on the map */
  facilities?: GISFacility[]
  /** Array of traffic cameras to display on the map */
  cameras?: TrafficCamera[]
  /** Whether to show vehicle markers */
  showVehicles?: boolean
  /** Whether to show facility markers */
  showFacilities?: boolean
  /** Whether to show camera markers */
  showCameras?: boolean
  /** Whether to show routes (future enhancement) */
  showRoutes?: boolean
  /** Map style to use */
  mapStyle?: MapStyle
  /** Initial center coordinates [longitude, latitude] */
  center?: [number, number]
  /** Initial zoom level (0-22) */
  zoom?: number
  /** Additional CSS classes */
  className?: string
  /** Callback when map is ready */
  onMapReady?: (map: mapboxgl.Map) => void
  onReady?: () => void
  /** Callback when an error occurs */
  onError?: (error: Error) => void
}

/**
 * Map of style names to Mapbox style URLs
 */
const MAPBOX_STYLE_URLS: Record<MapStyle, string> = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/light-v11"
} as const

/**
 * Default center of USA
 */
const DEFAULT_CENTER: [number, number] = [-98.5795, 39.8283]

/**
 * Default zoom level
 */
const DEFAULT_ZOOM = 4

/**
 * Minimum required length for a valid Mapbox token
 */
const MIN_TOKEN_LENGTH = 50

/**
 * Validates a Mapbox access token
 *
 * @param token - The token to validate
 * @returns True if the token appears valid, false otherwise
 */
function validateMapboxToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  // Check if it's not a placeholder
  if (token.includes('demo') || token.includes('YOUR_') || token.includes('xxx')) {
    return false
  }

  // Check minimum length (Mapbox tokens are typically 100+ characters)
  if (token.length < MIN_TOKEN_LENGTH) {
    return false
  }

  // Check if it starts with 'pk.' (public token) or 'sk.' (secret token)
  if (!token.startsWith('pk.') && !token.startsWith('sk.')) {
    return false
  }

  return true
}

/**
 * Gets the color for a vehicle based on its status
 *
 * @param status - The vehicle status
 * @returns Hex color code
 */
function getVehicleColor(status: Vehicle["status"]): string {
  const colors: Record<Vehicle["status"], string> = {
    active: "#10b981",      // green
    idle: "#6b7280",        // gray
    charging: "#3b82f6",    // blue
    service: "#f59e0b",     // amber
    emergency: "#ef4444",   // red
    offline: "#374151"      // dark gray
  }
  return colors[status] || "#6b7280"
}

/**
 * Creates HTML content for a vehicle popup
 *
 * @param vehicle - The vehicle data
 * @returns HTML string for the popup
 */
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

/**
 * Creates HTML content for a facility popup
 *
 * @param facility - The facility data
 * @returns HTML string for the popup
 */
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

/**
 * Creates HTML content for a camera popup
 *
 * @param camera - The camera data
 * @returns HTML string for the popup
 */
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

/**
 * Escapes HTML special characters to prevent XSS
 *
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Sanitizes a URL to prevent XSS via javascript: or data: URI schemes
 * Only allows http:// and https:// URLs
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
function sanitizeUrl(url: string): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url)
    // Only allow http and https protocols
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return escapeHtml(url)
    }
  } catch {
    // Invalid URL
  }

  return ''
}

/**
 * MapboxMap Component
 *
 * Renders an interactive map with vehicles, facilities, and cameras.
 * Handles all map lifecycle, markers, and error states.
 */
export function MapboxMap({
  vehicles = [],
  facilities = [],
  cameras = [],
  showVehicles = true,
  showFacilities = true,
  showCameras = false,
  showRoutes = true,
  mapStyle = "streets",
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "",
  onMapReady,
  onReady,
  onError
}: MapboxMapProps) {
  // Performance monitoring
  const perf = usePerformanceMonitor("MapboxMap", {
    enabled: import.meta.env.DEV,
    reportInterval: 10000, // Report every 10 seconds
    slowRenderThreshold: 50,
    highMemoryThreshold: 150,
  })

  // Refs for DOM and Mapbox instances
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const vehicleMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const facilityMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const cameraMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const isCleaningUpRef = useRef(false)

  // State
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Store mapbox reference for marker creation
  const mapboxRef = useRef<typeof import("mapbox-gl") | null>(null)

  /**
   * Creates a styled marker element for a vehicle
   */
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

    const icon = vehicle.type === "car" ? "🚗" :
                 vehicle.type === "truck" ? "🚚" :
