/**
 * LeafletMap Component - Refactored Production-Ready Implementation
 *
 * Main coordinator component that assembles map functionality from modular sub-components
 * and hooks. Maintains all existing functionality while adhering to SOLID principles.
 *
 * @module LeafletMap
 * @version 2.1.0 (Refactored)
 */

import { useMemo } from "react"

import { LeafletMapError } from "./leaflet/LeafletMapError"
import { LeafletMapLoading } from "./leaflet/LeafletMapLoading"
import { LeafletMarkerCount } from "./leaflet/LeafletMarkerCount"
import { useLeafletInit } from "./leaflet/hooks/useLeafletInit"
import { useMarkerLayers, type MarkerType } from "./leaflet/hooks/useMarkerLayers"

import { useAccessibility } from "@/hooks/useAccessibility"
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import type { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"
import { screenReaderOnly } from "@/utils/accessibility"


/**
 * Map visual style options
 */
export type MapStyle = "osm" | "dark" | "topo" | "satellite"

/**
 * Component props interface
 */
export interface LeafletMapProps {
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
  onMarkerClick?: (id: string, type: MarkerType) => void
  enableClustering?: boolean
  autoFitBounds?: boolean
  minHeight?: number
  maxFitBoundsZoom?: number
  onReady?: () => void
  onError?: (error: Error) => void
  enableAnnouncements?: boolean
  ariaLabel?: string
}

const DEFAULT_CENTER: [number, number] = [30.4383, -84.2807] // Tallahassee, FL
const DEFAULT_ZOOM = 12

/**
 * LeafletMap - Production-ready interactive map component.
 *
 * Refactored to use modular hooks and components for better maintainability.
 */
export function LeafletMap({
  vehicles = [],
  facilities = [],
  cameras = [],
  showVehicles = true,
  showFacilities = true,
  showCameras = false,
  showRoutes = false,
  mapStyle = "osm",
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "",
  onMarkerClick,
  enableClustering = false,
  autoFitBounds = true,
  minHeight = 500,
  maxFitBoundsZoom = 15,
  onReady,
  onError,
  enableAnnouncements = true,
  ariaLabel = "Interactive fleet management map",
}: LeafletMapProps) {
  // Accessibility
  const { announce, announceMapChange, isScreenReaderActive } = useAccessibility({
    enableAnnouncements,
    announceMarkerChanges: true,
  })

  // Performance monitoring (dev only)
  const perf = usePerformanceMonitor("LeafletMap", {
    enabled: typeof window !== "undefined" && import.meta.env.DEV,
    reportInterval: 0,
    trackMemory: false,
  })

  // Initialize map
  const {
    isReady,
    isLoading,
    mapError,
    libraryLoaded,
    mapContainerRef,
    mapInstanceRef,
    vehicleLayerRef,
    facilityLayerRef,
    cameraLayerRef,
    L,
  } = useLeafletInit({
    center,
    zoom,
    mapStyle,
    onReady,
    onError,
  })

  // Manage marker layers
  useMarkerLayers({
    L,
    isReady,
    vehicleLayerRef,
    facilityLayerRef,
    cameraLayerRef,
    vehicles,
    facilities,
    cameras,
    showVehicles,
    showFacilities,
    showCameras,
    onMarkerClick,
  })

  // Calculate visible marker count
  const visibleMarkerCount = useMemo(() => {
    let count = 0
    if (showVehicles) count += vehicles.length
    if (showFacilities) count += facilities.length
    if (showCameras) count += cameras.length
    return count
  }, [vehicles.length, facilities.length, cameras.length, showVehicles, showFacilities, showCameras])

  // Auto-fit bounds when markers change
  useMemo(() => {
    if (!mapInstanceRef.current || !isReady || !autoFitBounds || !L) return

    try {
      const bounds: any[] = []

      if (showVehicles) {
        vehicles.forEach((v) => {
          if (v.location?.lat && v.location?.lng) {
            bounds.push([v.location.lat, v.location.lng])
          }
        })
      }

      if (showFacilities) {
        facilities.forEach((f) => {
          if (f.location?.lat && f.location?.lng) {
            bounds.push([f.location.lat, f.location.lng])
          }
        })
      }

      if (showCameras) {
        cameras.forEach((c) => {
          if (c.latitude && c.longitude) {
            bounds.push([c.latitude, c.longitude])
          }
        })
      }

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: maxFitBoundsZoom,
          animate: true,
        })
      }
    } catch (err) {
      console.error("Error fitting bounds:", err)
    }
  }, [vehicles, facilities, cameras, showVehicles, showFacilities, showCameras, isReady, autoFitBounds])

  // Error state
  if (mapError) {
    return (
      <LeafletMapError
        error={mapError}
        minHeight={minHeight}
        className={className}
        onRetry={() => window.location.reload()}
      />
    )
  }

  // Main map UI
  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{ minHeight: `${minHeight}px` }}
      role="region"
      aria-label={ariaLabel}
      aria-busy={isLoading}
      aria-describedby={visibleMarkerCount > 0 ? "map-marker-count" : undefined}
    >
      {/* Skip Link for keyboard navigation */}
      <a
        href="#after-map"
        style={screenReaderOnly() as React.CSSProperties}
        className="focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[10000] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded"
      >
        Skip map
      </a>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full bg-muted/30 rounded-lg overflow-hidden"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 300ms ease-in-out",
        }}
        aria-hidden={isLoading}
        tabIndex={isLoading ? -1 : 0}
      />

      {/* Loading State */}
      {isLoading && <LeafletMapLoading libraryLoaded={libraryLoaded} />}

      {/* Marker Count Badge */}
      {isReady && !isLoading && visibleMarkerCount > 0 && (
        <LeafletMarkerCount
          vehicles={vehicles}
          facilities={facilities}
          cameras={cameras}
          showVehicles={showVehicles}
          showFacilities={showFacilities}
          showCameras={showCameras}
        />
      )}

      {/* Dev Mode Style Indicator */}
      {isReady && !isLoading && process.env.NODE_ENV === "development" && (
        <div
          className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded text-xs text-muted-foreground z-[1000] font-mono"
          role="status"
        >
          Style: {mapStyle} | Leaflet {L?.version || "?"}
        </div>
      )}

      {/* Skip link target */}
      <div id="after-map" style={screenReaderOnly() as React.CSSProperties} tabIndex={-1} />
    </div>
  )
}

// Re-export types
export type { Vehicle, GISFacility, TrafficCamera, MarkerType }
