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

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"

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
    (vehicle.location ? `${vehicle.location.lat.toFixed(4)}, ${vehicle.location.lng.toFixed(4)}` : "Unknown")

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
                 vehicle.type === "van" ? "🚐" : "🚙"
    el.innerHTML = icon

    el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)" })
    el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)" })

    return el
  }, [])

  /**
   * Creates a styled marker element for a facility
   */
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
    el.innerHTML = icon

    el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)" })
    el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)" })

    return el
  }, [])

  /**
   * Creates a styled marker element for a traffic camera
   */
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
    el.innerHTML = "📹"

    el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)" })
    el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)" })

    return el
  }, [])

  /**
   * Removes all markers from the map and clears the marker map
   */
  const clearMarkers = useCallback((markerMap: Map<string, mapboxgl.Marker>) => {
    markerMap.forEach(marker => {
      try {
        marker.remove()
      } catch (error) {
        console.error("Error removing marker:", error)
      }
    })
    markerMap.clear()
  }, [])

  /**
   * Initialize the map with dynamic loading
   */
  useEffect(() => {
    // Prevent re-initialization
    if (!mapContainerRef.current || mapRef.current) return

    // Get and validate Mapbox access token
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

    if (!validateMapboxToken(accessToken)) {
      const errorMessage = "Mapbox access token not configured. Set VITE_MAPBOX_ACCESS_TOKEN in .env file."
      setMapError(errorMessage)
      setIsLoading(false)
      console.error("VITE_MAPBOX_ACCESS_TOKEN is not set or invalid. Get your free token at https://www.mapbox.com/")

      if (onError) {
        onError(new Error(errorMessage))
      }
      return
    }

    // Async initialization function
    async function initializeMap() {
      if (!mapContainerRef.current || mapRef.current || isCleaningUpRef.current) return

      try {
        // Load Mapbox GL library dynamically
        const mapbox = await loadMapboxGL()
        if (!mapbox) {
          throw new Error("Failed to load Mapbox GL library")
        }

        // Store reference for marker creation
        mapboxRef.current = mapbox

        // Check if component was unmounted during async load
        if (!mapContainerRef.current || isCleaningUpRef.current) {
          console.log("Component unmounted during Mapbox GL load, aborting initialization")
          return
        }

        // Set the access token
        mapbox.accessToken = accessToken

        // Initialize map instance
        const map = new mapbox.Map({
          container: mapContainerRef.current,
          style: MAPBOX_STYLE_URLS[mapStyle],
          center: center,
          zoom: zoom,
          attributionControl: true,
          preserveDrawingBuffer: true, // Better for screenshots
          antialias: true // Better rendering quality
        })

        // Add navigation controls (zoom, rotation)
        const navControl = new mapbox.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        })
        map.addControl(navControl, "top-right")

        // Add scale control
        const scaleControl = new mapbox.ScaleControl({
          maxWidth: 100,
          unit: 'imperial'
        })
        map.addControl(scaleControl, "bottom-left")

        // Add fullscreen control
        const fullscreenControl = new mapbox.FullscreenControl()
        map.addControl(fullscreenControl, "top-right")

        // Handle map load event
        map.on("load", () => {
          if (isCleaningUpRef.current) return

          mapRef.current = map
          setMapReady(true)
          setIsLoading(false)
          console.log("Mapbox loaded successfully")

          if (onMapReady) {
            onMapReady(map)
          }
        })

        // Handle map errors
        map.on("error", (e: any) => {
          if (isCleaningUpRef.current) return

          console.error("Mapbox error:", e)
          const errorMessage = `Failed to load map: ${e.error?.message || "Unknown error"}`
          setMapError(errorMessage)
          setIsLoading(false)

          if (onError && e.error) {
            onError(e.error)
          }
        })
      } catch (error) {
        const errorMessage = `Failed to initialize map: ${(error as Error).message}`
        console.error("Error initializing Mapbox:", error)
        setMapError(errorMessage)
        setIsLoading(false)

        if (onError) {
          onError(error as Error)
        }
      }
    }

    // Start initialization
    initializeMap()

    // Cleanup function
    return () => {
      isCleaningUpRef.current = true

      try {
        // Clear all markers
        clearMarkers(vehicleMarkersRef.current)
        clearMarkers(facilityMarkersRef.current)
        clearMarkers(cameraMarkersRef.current)

        // Remove map instance
        if (mapRef.current) {
          mapRef.current.remove()
        }

        mapRef.current = null
        setMapReady(false)
      } catch (error) {
        console.error("Error during map cleanup:", error)
      } finally {
        isCleaningUpRef.current = false
      }
    }
  }, []) // Only run once on mount

  /**
   * Update map style when changed
   */
  useEffect(() => {
    if (!mapRef.current || !mapReady || isCleaningUpRef.current) return

    try {
      mapRef.current.setStyle(MAPBOX_STYLE_URLS[mapStyle])
    } catch (error) {
      console.error("Error changing map style:", error)
    }
  }, [mapStyle, mapReady])

  /**
   * Update vehicle markers when vehicles or visibility changes
   */
  useEffect(() => {
    if (!mapRef.current || !mapReady || isCleaningUpRef.current || !mapboxRef.current) return

    // Clear existing markers
    clearMarkers(vehicleMarkersRef.current)

    // Don't add markers if not visible
    if (!showVehicles || !vehicles || vehicles.length === 0) return

    try {
      const mapbox = mapboxRef.current

      // Add new markers
      vehicles.forEach(vehicle => {
        if (!vehicle.location || !vehicle.id) return

        const el = createVehicleMarkerElement(vehicle)
        const marker = new mapbox.Marker({ element: el })
          .setLngLat([vehicle.location.lng, vehicle.location.lat])
          .setPopup(
            new mapbox.Popup({
              offset: 25,
              closeButton: true,
              closeOnClick: false,
              maxWidth: "300px"
            }).setHTML(createVehiclePopupHTML(vehicle))
          )

        if (mapRef.current) {
          marker.addTo(mapRef.current)
          vehicleMarkersRef.current.set(vehicle.id, marker)
        }
      })
    } catch (error) {
      console.error("Error updating vehicle markers:", error)
    }
  }, [vehicles, showVehicles, mapReady, createVehicleMarkerElement, clearMarkers])

  /**
   * Update facility markers when facilities or visibility changes
   */
  useEffect(() => {
    if (!mapRef.current || !mapReady || isCleaningUpRef.current || !mapboxRef.current) return

    // Clear existing markers
    clearMarkers(facilityMarkersRef.current)

    // Don't add markers if not visible
    if (!showFacilities || !facilities || facilities.length === 0) return

    try {
      const mapbox = mapboxRef.current

      // Add new markers
      facilities.forEach(facility => {
        if (!facility.location || !facility.id) return

        const el = createFacilityMarkerElement(facility)
        const marker = new mapbox.Marker({ element: el })
          .setLngLat([facility.location.lng, facility.location.lat])
          .setPopup(
            new mapbox.Popup({
              offset: 25,
              closeButton: true,
              closeOnClick: false,
              maxWidth: "300px"
            }).setHTML(createFacilityPopupHTML(facility))
          )

        if (mapRef.current) {
          marker.addTo(mapRef.current)
          facilityMarkersRef.current.set(facility.id, marker)
        }
      })
    } catch (error) {
      console.error("Error updating facility markers:", error)
    }
  }, [facilities, showFacilities, mapReady, createFacilityMarkerElement, clearMarkers])

  /**
   * Update camera markers when cameras or visibility changes
   */
  useEffect(() => {
    if (!mapRef.current || !mapReady || isCleaningUpRef.current || !mapboxRef.current) return

    // Clear existing markers
    clearMarkers(cameraMarkersRef.current)

    // Don't add markers if not visible
    if (!showCameras || !cameras || cameras.length === 0) return

    try {
      const mapbox = mapboxRef.current

      // Add new markers
      cameras.forEach(camera => {
        if (!camera.latitude || !camera.longitude || !camera.id) return

        const el = createCameraMarkerElement(camera)
        const marker = new mapbox.Marker({ element: el })
          .setLngLat([camera.longitude, camera.latitude])
          .setPopup(
            new mapbox.Popup({
              offset: 25,
              closeButton: true,
              closeOnClick: false,
              maxWidth: "350px"
            }).setHTML(createCameraPopupHTML(camera))
          )

        if (mapRef.current) {
          marker.addTo(mapRef.current)
          cameraMarkersRef.current.set(camera.id, marker)
        }
      })
    } catch (error) {
      console.error("Error updating camera markers:", error)
    }
  }, [cameras, showCameras, mapReady, createCameraMarkerElement, clearMarkers])

  /**
   * Fit map bounds to show all visible markers
   */
  useEffect(() => {
    if (!mapRef.current || !mapReady || isCleaningUpRef.current || !mapboxRef.current) return

    const coordinates: [number, number][] = []

    // Collect coordinates from visible markers
    if (showVehicles && vehicles) {
      vehicles.forEach(v => {
        if (v.location) {
          coordinates.push([v.location.lng, v.location.lat])
        }
      })
    }

    if (showFacilities && facilities) {
      facilities.forEach(f => {
        if (f.location) {
          coordinates.push([f.location.lng, f.location.lat])
        }
      })
    }

    if (showCameras && cameras) {
      cameras.forEach(c => {
        if (c.latitude && c.longitude) {
          coordinates.push([c.longitude, c.latitude])
        }
      })
    }

    // Fit bounds if we have coordinates
    if (coordinates.length > 0) {
      try {
        const mapbox = mapboxRef.current
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord)
        }, new mapbox.LngLatBounds(coordinates[0], coordinates[0]))

        mapRef.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
          duration: 1000 // Smooth animation
        })
      } catch (error) {
        console.error("Error fitting bounds:", error)
      }
    }
  }, [vehicles, facilities, cameras, showVehicles, showFacilities, showCameras, mapReady])

  /**
   * Render error state
   */
  if (mapError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-muted/30 ${className}`}
        style={{ minHeight: '500px' }}
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center p-6 max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-destructive font-semibold mb-2">Map Error</p>
          <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
          <div className="text-xs text-muted-foreground bg-muted p-4 rounded-lg text-left">
            <p className="font-semibold mb-2">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>
                Sign up for free at{" "}
                <a
                  href="https://www.mapbox.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  mapbox.com
                </a>
              </li>
              <li>Get your access token from your account</li>
              <li>
                Add to <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">.env</code> file:
                <br />
                <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono mt-1 inline-block">
                  VITE_MAPBOX_ACCESS_TOKEN=your_token_here
                </code>
              </li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-muted/20 ${className}`}
        style={{ minHeight: '500px' }}
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-sm text-muted-foreground">Loading Mapbox...</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Initializing map engine</p>
        </div>
      </div>
    )
  }

  /**
   * Render map
   */
  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '500px' }}
      role="region"
      aria-label="Interactive map"
    />
  )
}

/**
 * Export default for convenience
 */
export default MapboxMap
