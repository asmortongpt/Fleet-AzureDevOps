import { useEffect, useRef, useState, useCallback } from "react"


import { Vehicle, GISFacility, TrafficCamera, Geofence } from "@/lib/types"
import logger from '@/utils/logger';
/**
 * Props for the GoogleMap component
 */
export interface GoogleMapProps {
  /** Array of vehicles to display on the map */
  vehicles?: Vehicle[]
  /** Array of facilities to display on the map */
  facilities?: GISFacility[]
  /** Array of traffic cameras to display on the map */
  cameras?: TrafficCamera[]
  /** Array of geofences to display on the map */
  geofences?: Geofence[]
  /** Whether to show vehicle markers */
  showVehicles?: boolean
  /** Whether to show facility markers */
  showFacilities?: boolean
  /** Whether to show camera markers */
  showCameras?: boolean
  /** Whether to show geofences */
  showGeofences?: boolean
  /** Whether to show routes between markers */
  showRoutes?: boolean
  /** Map display style */
  mapStyle?: "roadmap" | "satellite" | "hybrid" | "terrain"
  /** Center coordinates [longitude, latitude] */
  center?: [number, number]
  /** Initial zoom level (0-20) */
  zoom?: number
  /** Additional CSS classes */
  className?: string
  /** Callback when map is ready */
  onReady?: () => void
  /** Callback when an error occurs */
  onError?: (error: Error) => void
  /** Callback when a vehicle action is triggered from the popup */
  onVehicleAction?: (action: string, vehicleId: string) => void
  /** Callback when a vehicle marker is selected */
  onVehicleSelect?: (vehicleId: string) => void
  /** Callback when a geofence is selected */
  onGeofenceSelect?: (geofence: Geofence) => void
}

/**
 * Marker with associated InfoWindow for cleanup tracking
 */
interface MarkerWithInfo {
  marker: google.maps.Marker
  infoWindow?: google.maps.InfoWindow
}

function getVehicleLatLng(vehicle: any): { lat: number; lng: number } | null {
  const latRaw =
    vehicle?.location?.lat ??
    vehicle?.location?.latitude ??
    vehicle?.latitude ??
    vehicle?.coordinates?.lat ??
    vehicle?.coordinates?.latitude
  const lngRaw =
    vehicle?.location?.lng ??
    vehicle?.location?.longitude ??
    vehicle?.longitude ??
    vehicle?.coordinates?.lng ??
    vehicle?.coordinates?.longitude

  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function getFacilityLatLng(facility: any): { lat: number; lng: number } | null {
  const latRaw =
    facility?.location?.lat ??
    facility?.location?.latitude ??
    facility?.lat ??
    facility?.latitude ??
    facility?.gps_latitude ??
    facility?.gps_lat ??
    facility?.gpsLat ??
    facility?.center_lat ??
    facility?.centerLat
  const lngRaw =
    facility?.location?.lng ??
    facility?.location?.longitude ??
    facility?.lng ??
    facility?.longitude ??
    facility?.gps_longitude ??
    facility?.gps_lng ??
    facility?.gpsLng ??
    facility?.center_lng ??
    facility?.centerLng

  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function getGeofenceCenter(geofence: any): google.maps.LatLngLiteral | null {
  const center =
    geofence?.center ||
    (geofence?.center_lat != null && geofence?.center_lng != null
      ? { lat: geofence.center_lat, lng: geofence.center_lng }
      : null) ||
    (geofence?.center_latitude != null && geofence?.center_longitude != null
      ? { lat: geofence.center_latitude, lng: geofence.center_longitude }
      : null)

  const latRaw = center?.lat ?? center?.latitude ?? geofence?.latitude
  const lngRaw = center?.lng ?? center?.longitude ?? geofence?.longitude

  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function normalizeGeofencePath(coordinates: any): google.maps.LatLngLiteral[] | null {
  if (!coordinates) return null
  if (!Array.isArray(coordinates)) return null

  // GeoJSON-style: [{ lat, lng }] or [[lng, lat]]
  const path: google.maps.LatLngLiteral[] = []
  for (const point of coordinates) {
    if (!point) continue
    if (Array.isArray(point) && point.length >= 2) {
      const [lng, lat] = point
      const latNum = Number(lat)
      const lngNum = Number(lng)
      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        path.push({ lat: latNum, lng: lngNum })
      }
      continue
    }
    if (typeof point === 'object') {
      const latNum = Number(point.lat ?? point.latitude)
      const lngNum = Number(point.lng ?? point.longitude)
      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        path.push({ lat: latNum, lng: lngNum })
      }
    }
  }

  return path.length >= 3 ? path : null
}

/**
 * Google Maps API loading state
 */
type LoadingState = "idle" | "loading" | "loaded" | "error"

/**
 * Global tracking for Google Maps API script loading
 * Prevents duplicate script injection
 */
let googleMapsLoadingPromise: Promise<void> | null = null
let googleMapsLoadingState: LoadingState = "idle"

/**
 * Production-ready Google Maps component for React 19
 *
 * Features:
 * - Robust error handling and recovery
 * - Proper TypeScript typing with @types/google.maps
 * - Loading states and error boundaries
 * - React 19 compatibility
 * - Complete cleanup of map instances and markers
 * - Efficient marker management with batching
 * - Support for all Google Maps types
 * - API key validation and graceful degradation
 * - Memory leak prevention
 * - Retry logic for failed API loads
 *
 * @example
 * ```tsx
 * <GoogleMap
 *   vehicles={vehicles}
 *   facilities={facilities}
 *   showVehicles={true}
 *   mapStyle="roadmap"
 *   center={[39.8283, -98.5795]}
 *   zoom={4}
 * />
 * ```
 */
export function GoogleMap({
  vehicles = [],
  facilities = [],
  cameras = [],
  geofences = [],
  showVehicles = true,
  showFacilities = true,
  showCameras = false,
  showGeofences = false,
  showRoutes: _showRoutes = false,
  mapStyle = "roadmap",
  center = [30.4383, -84.2807], // Tallahassee, FL [lat, lng]
  zoom = 12, // Focused on Tallahassee area
  className = "",
  onReady,
  onError,
  onVehicleAction,
  onVehicleSelect,
  onGeofenceSelect,
}: GoogleMapProps) {
  // Refs for DOM and map instances
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<MarkerWithInfo[]>([])
  const geofenceOverlaysRef = useRef<Array<google.maps.Circle | google.maps.Polygon>>([])
  const boundsListenerRef = useRef<google.maps.MapsEventListener | null>(null)

  // Component state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Get and validate Google Maps API key
  // Try runtime config first (window._env_), then fall back to build-time env
  const apiKey = ((window as any)._env_?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY)?.trim() || ""
  const hasValidApiKey = apiKey.length > 0

  // Handle global auth failure (Google Maps specific)
  useEffect(() => {
    // Define global callback if not exists
    if (!(window as any).gm_authFailure) {
      (window as any).gm_authFailure = () => {
        logger.error("Google Maps Authentication Failure detected")
        setError("Google Maps authentication failed")
        setIsLoading(false)
      }
    }

    return () => {
      // Clean up potentially? usually global handler stays
    }
  }, [])

  // Handle custom events from InfoWindows
  useEffect(() => {
    const handleVehicleAction = (e: Event) => {
      if (onVehicleAction) {
        const customEvent = e as CustomEvent
        onVehicleAction(customEvent.detail.action, customEvent.detail.vehicleId)
      }
    }

    window.addEventListener('vehicle-action', handleVehicleAction)

    return () => {
      window.removeEventListener('vehicle-action', handleVehicleAction)
    }
  }, [onVehicleAction])

  /**
   * Load Google Maps JavaScript API
   * Uses global promise to prevent duplicate script injections
   */
  const loadGoogleMapsAPI = useCallback((): Promise<void> => {
    // Return existing promise if already loading
    if (googleMapsLoadingPromise) {
      return googleMapsLoadingPromise
    }

    // Return resolved promise if already loaded
    if (window.google?.maps && googleMapsLoadingState === "loaded") {
      return Promise.resolve()
    }

    // Create new loading promise
    googleMapsLoadingState = "loading"
    googleMapsLoadingPromise = new Promise((resolve, reject) => {
      // Double-check if loaded while promise was being created
      if (window.google?.maps) {
        googleMapsLoadingState = "loaded"
        googleMapsLoadingPromise = null
        resolve()
        return
      }

      // Check if script already exists (from previous failed load)
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      )

      if (existingScript) {
        existingScript.remove()
      }

      // Create and configure script element
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,drawing`
      script.async = true
      script.defer = true

      // Success handler
      script.onload = () => {
        if (window.google?.maps) {
          googleMapsLoadingState = "loaded"
          googleMapsLoadingPromise = null
          resolve()
        } else {
          googleMapsLoadingState = "error"
          googleMapsLoadingPromise = null
          reject(new Error("Google Maps API loaded but not available"))
        }
      }

      // Error handler
      script.onerror = () => {
        googleMapsLoadingState = "error"
        googleMapsLoadingPromise = null
        script.remove()
        reject(new Error("Failed to load Google Maps API script"))
      }

      // Inject script
      document.head.appendChild(script)

      // Timeout fallback (30 seconds)
      setTimeout(() => {
        if (googleMapsLoadingState === "loading") {
          googleMapsLoadingState = "error"
          googleMapsLoadingPromise = null
          script.remove()
          reject(new Error("Google Maps API loading timeout"))
        }
      }, 30000)
    })

    return googleMapsLoadingPromise
  }, [apiKey])

  /**
   * Retry loading the Google Maps API
   */
  const retryLoad = useCallback(() => {
    setError(null)
    setIsLoading(true)
    setRetryCount(prev => prev + 1)
    googleMapsLoadingPromise = null
    googleMapsLoadingState = "idle"
  }, [])

  /**
   * Load Google Maps API on mount
   */
  useEffect(() => {
    if (!hasValidApiKey) {
      setIsLoading(false)
      return
    }

    let mounted = true

    loadGoogleMapsAPI()
      .then(() => {
        if (mounted) {
          setIsLoading(false)
          setError(null)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Failed to load Google Maps")
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [hasValidApiKey, loadGoogleMapsAPI, retryCount])

  /**
   * Initialize or update map instance
   */
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps || isLoading || error) {
      return
    }

    // Initialize map if not already created
    if (!mapInstanceRef.current) {
      try {


        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom: zoom,
          mapTypeId: mapStyle as google.maps.MapTypeId,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          },
          streetViewControl: true,
          streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: [
              google.maps.MapTypeId.ROADMAP,
              google.maps.MapTypeId.SATELLITE,
              google.maps.MapTypeId.HYBRID,
              google.maps.MapTypeId.TERRAIN
            ]
          },
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
          },
          scaleControl: true,
          rotateControl: true,
          gestureHandling: "auto",
          backgroundColor: "#e5e7eb",
          clickableIcons: true,
          disableDoubleClickZoom: false,
          keyboardShortcuts: true,
        })

        // Track map initialization complete



        // Add test IDs to map controls after a short delay to ensure they're rendered
        setTimeout(() => {
          try {
            const mapDiv = mapRef.current
            if (mapDiv) {
              // Find and add test IDs to zoom controls
              const zoomInButton = mapDiv.querySelector('button[title="Zoom in"]')
              if (zoomInButton) zoomInButton.setAttribute('data-testid', 'map-zoom-in')

              const zoomOutButton = mapDiv.querySelector('button[title="Zoom out"]')
              if (zoomOutButton) zoomOutButton.setAttribute('data-testid', 'map-zoom-out')

              // Find and add test ID to fullscreen control
              const fullscreenButton = mapDiv.querySelector('button[title="Toggle fullscreen view"]')
              if (fullscreenButton) fullscreenButton.setAttribute('data-testid', 'map-fullscreen')
            }
          } catch (err) {
            logger.debug(`[GoogleMap] Could not add test IDs to controls: ${err}`)
          }
        }, 1000)

        // Notify parent component
        if (onReady) {
          onReady()
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Unknown error")
        setError(`Failed to initialize map: ${errorObj.message}`)
        if (onError) {
          onError(errorObj)
        }
        return
      }
    } else {
      // Update existing map settings
      mapInstanceRef.current.setCenter({ lat: center[0], lng: center[1] })
      mapInstanceRef.current.setZoom(zoom)
      mapInstanceRef.current.setMapTypeId(mapStyle as google.maps.MapTypeId)
    }
  }, [isLoading, error, center, zoom, mapStyle])

  /**
   * Clear all markers and info windows
   */
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(({ marker, infoWindow }) => {
      // Close and cleanup info window
      if (infoWindow) {
        infoWindow.close()
      }
      // Remove marker from map
      marker.setMap(null)
    })
    markersRef.current = []
  }, [])

  const clearGeofences = useCallback(() => {
    geofenceOverlaysRef.current.forEach((overlay) => {
      overlay.setMap(null)
    })
    geofenceOverlaysRef.current = []
  }, [])

  /**
   * Update markers when data changes
   */
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps || isLoading || error) {
      return
    }



    // Clear existing markers
    clearMarkers()

    const newMarkers: MarkerWithInfo[] = []
    const bounds = new google.maps.LatLngBounds()
    let hasMarkers = false

    try {
      // Add vehicle markers
      if (showVehicles && vehicles.length > 0) {
        vehicles.forEach(vehicle => {
          const coords = getVehicleLatLng(vehicle)
          if (!coords) return

          const marker = new google.maps.Marker({
            position: coords,
            map: mapInstanceRef.current,
            title: vehicle.name,
            optimized: false,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getVehicleColor(vehicle.status),
              fillOpacity: 0.95,
              strokeColor: "#0f172a",
              strokeWeight: 2,
              scale: 10,
            },
            zIndex: 1000,
          })

          // Add data-testid to marker element when DOM is ready
          google.maps.event.addListenerOnce(marker, 'visible', () => {
            const markerDiv = (marker as any).getDiv?.()
            if (markerDiv) {
              markerDiv.setAttribute('data-testid', 'vehicle-marker')
              markerDiv.setAttribute('data-vehicle-id', vehicle.id)
            }
          })

          const infoWindow = new google.maps.InfoWindow({
            content: createVehicleInfoHTML(vehicle),
          })

          marker.addListener("click", () => {
            // Close all other info windows
            markersRef.current.forEach(({ infoWindow: iw }) => iw?.close())
            infoWindow.open(mapInstanceRef.current, marker)
            onVehicleSelect?.(String(vehicle.id))
          })

          newMarkers.push({ marker, infoWindow })
          bounds.extend(coords)
          hasMarkers = true
        })
      }

      // Add facility markers
      if (showFacilities && facilities.length > 0) {
        facilities.forEach(facility => {
          const coords = getFacilityLatLng(facility)
          if (!coords) return

          const marker = new google.maps.Marker({
            position: coords,
            map: mapInstanceRef.current,
            title: facility.name,
            optimized: false,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor: facility.status === "operational" ? "#10b981" : "#f59e0b",
              fillOpacity: 0.95,
              strokeColor: "#0f172a",
              strokeWeight: 2,
              scale: 7,
              rotation: 0,
            },
            zIndex: 900,
          })

          const infoWindow = new google.maps.InfoWindow({
            content: createFacilityInfoHTML(facility),
          })

          marker.addListener("click", () => {
            markersRef.current.forEach(({ infoWindow: iw }) => iw?.close())
            infoWindow.open(mapInstanceRef.current, marker)
          })

          newMarkers.push({ marker, infoWindow })
          bounds.extend(coords)
          hasMarkers = true
        })
      }

      // Add camera markers
      if (showCameras && cameras.length > 0) {
        cameras.forEach(camera => {
          if (!camera.latitude || !camera.longitude) return

          const marker = new google.maps.Marker({
            position: { lat: camera.latitude, lng: camera.longitude },
            map: mapInstanceRef.current,
            title: camera.name,
            optimized: false,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: camera.operational ? "#3b82f6" : "#6b7280",
              fillOpacity: 0.95,
              strokeColor: "#0f172a",
              strokeWeight: 2,
              scale: 8,
            },
            zIndex: 800,
          })

          const infoWindow = new google.maps.InfoWindow({
            content: createCameraInfoHTML(camera),
          })

          marker.addListener("click", () => {
            markersRef.current.forEach(({ infoWindow: iw }) => iw?.close())
            infoWindow.open(mapInstanceRef.current, marker)
          })

          newMarkers.push({ marker, infoWindow })
          bounds.extend({ lat: camera.latitude, lng: camera.longitude })
          hasMarkers = true
        })
      }

      // Update markers ref
      markersRef.current = newMarkers

      // Track marker creation complete

      // Fit bounds to show all markers
      if (hasMarkers && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds)

        // Cleanup previous listener
        if (boundsListenerRef.current) {
          google.maps.event.removeListener(boundsListenerRef.current)
        }

        // Limit max zoom after bounds fit
        boundsListenerRef.current = google.maps.event.addListenerOnce(
          mapInstanceRef.current,
          "idle",
          () => {
            if (mapInstanceRef.current) {
              const currentZoom = mapInstanceRef.current.getZoom()
              if (currentZoom !== undefined && currentZoom > 15) {
                mapInstanceRef.current.setZoom(15)
              }
            }
            boundsListenerRef.current = null
          }
        )
      }
    } catch (err) {
      logger.error("Error updating markers:", err)
      setError(`Failed to update markers: ${err instanceof Error ? err.message : "Unknown error"}`)
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      // Clear all markers and info windows
      clearMarkers()

      // Cleanup bounds listener set in this effect
      if (boundsListenerRef.current) {
        google.maps.event.removeListener(boundsListenerRef.current)
        boundsListenerRef.current = null
      }
    }
  }, [
    vehicles,
    facilities,
    cameras,
    showVehicles,
    showFacilities,
    showCameras,
    isLoading,
    error,
    clearMarkers,
  ])

  /**
   * Update geofence overlays when data changes
   */
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps || isLoading || error) {
      return
    }

    clearGeofences()

    if (!showGeofences || geofences.length === 0) {
      return
    }

    const overlays: Array<google.maps.Circle | google.maps.Polygon> = []

    geofences.forEach((geofence) => {
      const color = geofence.color || "#3b82f6"

      if (geofence.type === "circle") {
        const center = getGeofenceCenter(geofence)
        if (!center) return
        const radius = Number(geofence.radius ?? geofence.radius_meters ?? 0)
        if (!Number.isFinite(radius) || radius <= 0) return

        const circle = new google.maps.Circle({
          map: mapInstanceRef.current || undefined,
          center,
          radius,
          fillColor: color,
          fillOpacity: 0.2,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: true,
        })

        circle.addListener("click", () => onGeofenceSelect?.(geofence))
        overlays.push(circle)
        return
      }

      const path = normalizeGeofencePath(
        geofence.coordinates ?? geofence.polygon ?? geofence.polygon_coordinates
      )
      if (!path) return

      const polygon = new google.maps.Polygon({
        map: mapInstanceRef.current || undefined,
        paths: path,
        fillColor: color,
        fillOpacity: 0.2,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
      })

      polygon.addListener("click", () => onGeofenceSelect?.(geofence))
      overlays.push(polygon)
    })

    geofenceOverlaysRef.current = overlays

    return () => {
      clearGeofences()
    }
  }, [geofences, showGeofences, onGeofenceSelect, isLoading, error, clearGeofences])

  /**
   * Cleanup map instance on unmount
   * Empty dependency array ensures cleanup only runs on unmount
   */
  useEffect(() => {
    return () => {
      // Clear map instance listeners and reference
      if (mapInstanceRef.current) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current)
        mapInstanceRef.current = null
      }

      // Markers and bounds listener cleanup handled by their respective effects
    }
  }, [])

  if (!hasValidApiKey) {
    return (
      <div
        className={`relative w-full h-full min-h-[500px] bg-slate-950 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 text-center max-w-md">
            <div className="text-sm font-semibold text-slate-100">Google Maps API key required</div>
            <div className="text-xs text-slate-400 mt-2">
              Set `VITE_GOOGLE_MAPS_API_KEY` to render the live CTA map.
            </div>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div
        className={`w-full h-full min-h-[500px] flex items-center justify-center bg-destructive/5 ${className}`}
      >
        <div className="text-center p-3 max-w-md">
          <div className="text-sm mb-2">⚠️</div>
          <p className="text-destructive font-semibold mb-2">Map Error</p>
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <button
            onClick={retryLoad}
            className="px-2 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Retry Loading
          </button>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Retry attempts: {retryCount}
            </p>
          )}
        </div>
      </div>
    )
  }

  /**
   * Render map component
   */
  return (
    <div
      className={`relative w-full h-full min-h-[500px] ${className}`}
    >
      <div ref={mapRef} className="absolute inset-0 w-full h-full rounded-lg overflow-hidden" />
      {isLoading && (
        <div data-testid="loading-indicator" className="absolute inset-0 w-full h-full flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-2">
              <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Loading Google Maps...
            </p>
            <p className="text-xs text-muted-foreground">
              React 19 Compatible • Production Ready
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Get color for vehicle status indicator
 * @param status - Vehicle status
 * @returns Hex color code
 */
function getVehicleColor(status: Vehicle["status"]): string {
  const colors: Record<Vehicle["status"], string> = {
    active: "#10b981", // Green
    idle: "#6b7280", // Gray
    charging: "#3b82f6", // Blue
    service: "#f59e0b", // Amber
    emergency: "#ef4444", // Red
    offline: "#374151", // Dark gray
  }
  return colors[status] || "#6b7280"
}

/**
 * Create HTML content for vehicle info window
 * @param vehicle - Vehicle data
 * @returns HTML string for info window
 */
function createVehicleInfoHTML(vehicle: Vehicle): string {
  const coords = getVehicleLatLng(vehicle as any)
  const location =
    (vehicle as any)?.location?.address ||
    (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Unknown")

  return `
    <div data-testid="marker-popup" style="padding: 14px; min-width: 220px; max-width: 320px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
      <div data-testid="popup-vehicle-id" style="font-weight: 600; font-size: 15px; margin-bottom: 10px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">
        ${escapeHTML(vehicle.name || "Unknown Vehicle")}
      </div>
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px; display: flex; justify-content: space-between;">
        <strong style="color: #6b7280;">Type:</strong>
        <span style="text-transform: capitalize;">${escapeHTML(vehicle.type || "Unknown")}</span>
      </div>
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px; display: flex; justify-content: space-between;">
        <strong style="color: #6b7280;">Status:</strong>
        <span data-testid="popup-vehicle-status" style="color: ${getVehicleColor(vehicle.status)}; font-weight: 600; text-transform: uppercase; font-size: 12px;">
          ${escapeHTML(vehicle.status)}
        </span>
      </div>
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px; display: flex; justify-content: space-between;">
        <strong style="color: #6b7280;">Driver:</strong>
        <span>${escapeHTML(vehicle.driver || "Unassigned")}</span>
      </div>
      <div style="font-size: 13px; color: #4b5563; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
        <strong style="color: #6b7280; display: block; margin-bottom: 4px;">Location:</strong>
        <span style="font-size: 12px; color: #6b7280;">${escapeHTML(location)}</span>
      </div>
      
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button 
          onclick="(function(){ window.dispatchEvent(new CustomEvent('vehicle-action', { detail: { action: 'maintenance', vehicleId: '${escapeHTML(vehicle.id)}' } })); })()"
          style="flex: 1; border: 1px solid #e5e7eb; background: #f9fafb; color: #374151; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;"
          onmouseover="this.style.background='#f3f4f6'"
          onmouseout="this.style.background='#f9fafb'"
        >
          Report Issue
        </button>
      </div>
    </div>
  `
}

/**
 * Create HTML content for facility info window
 * @param facility - Facility data
 * @returns HTML string for info window
 */
function createFacilityInfoHTML(facility: GISFacility): string {
  return `
    <div style="padding: 14px; min-width: 220px; max-width: 320px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
      <div style="font-weight: 600; font-size: 15px; margin-bottom: 10px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">
        ${escapeHTML(facility.name)}
      </div>
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px; display: flex; justify-content: space-between;">
        <strong style="color: #6b7280;">Type:</strong>
        <span style="text-transform: capitalize;">${escapeHTML(facility.type.replace(/-/g, " "))}</span>
      </div>
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px; display: flex; justify-content: space-between;">
        <strong style="color: #6b7280;">Status:</strong>
        <span style="color: ${facility.status === "operational" ? "#10b981" : "#f59e0b"}; font-weight: 600; text-transform: uppercase; font-size: 12px;">
          ${escapeHTML(facility.status)}
        </span>
      </div>
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px; display: flex; justify-content: space-between;">
        <strong style="color: #6b7280;">Capacity:</strong>
        <span>${escapeHTML(String(facility.capacity))} vehicles</span>
      </div>
      <div style="font-size: 13px; color: #4b5563; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
        <strong style="color: #6b7280; display: block; margin-bottom: 4px;">Address:</strong>
        <span style="font-size: 12px; color: #6b7280;">${escapeHTML(facility.address)}</span>
      </div>
    </div>
  `
}

/**
 * Create HTML content for traffic camera info window
 * @param camera - Traffic camera data
 * @returns HTML string for info window
 */
function createCameraInfoHTML(camera: TrafficCamera): string {
  const addressHTML = camera.address
    ? `
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px;">
        <strong style="color: #6b7280;">Address:</strong><br/>
        <span style="font-size: 12px;">${escapeHTML(camera.address)}</span>
      </div>
    `
    : ""

  const crossStreetsHTML = camera.crossStreets
    ? `
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px;">
        <strong style="color: #6b7280;">Cross Streets:</strong><br/>
        <span style="font-size: 12px;">${escapeHTML(camera.crossStreets)}</span>
      </div>
    `
    : ""

  const cameraLinkHTML = camera.cameraUrl
    ? `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <a
          href="${escapeHTML(camera.cameraUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s;
          "
          onmouseover="this.style.backgroundColor='#2563eb'"
          onmouseout="this.style.backgroundColor='#3b82f6'"
        >
          📹 View Live Feed
        </a>
      </div>
    `
    : ""

  return `
    <div style="padding: 14px; min-width: 250px; max-width: 350px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
      <div style="font-weight: 600; font-size: 15px; margin-bottom: 10px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">
        ${escapeHTML(camera.name)}
      </div>
      ${addressHTML}
      ${crossStreetsHTML}
      <div style="font-size: 13px; color: #4b5563; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #6b7280;">Status:</strong>
        <span style="
          color: ${camera.operational ? "#10b981" : "#ef4444"};
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          background-color: ${camera.operational ? "#d1fae5" : "#fee2e2"};
          padding: 3px 8px;
          border-radius: 4px;
        ">
          ${camera.operational ? "● Operational" : "● Offline"}
        </span>
      </div>
      ${cameraLinkHTML}
    </div>
  `
}

/**
 * Escape HTML special characters to prevent XSS
 * @param unsafe - Unsafe string
 * @returns HTML-safe string
 */
function escapeHTML(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
