import { useState, useEffect, useCallback, useMemo, useRef } from "react"

import { GoogleMap } from "./GoogleMap"
import { LeafletMap } from "./LeafletMap"
import { PerformanceMonitor } from "./PerformanceMonitor"
import { ClusteringBadge } from "./UniversalMap/components/ClusteringBadge"
import { MapErrorBoundary } from "./UniversalMap/components/MapErrorBoundary"
import { MapLoadingOverlay } from "./UniversalMap/components/MapLoadingOverlay"
import { ProviderBadge } from "./UniversalMap/components/ProviderBadge"
import { useMapProvider } from "./UniversalMap/hooks/useMapProvider"
import { UniversalMapProps, MapLoadingState } from "./UniversalMap/types"
import { DEFAULT_CENTER, DEFAULT_ZOOM, calculateDynamicCenter } from "./UniversalMap/utils/coordinates"
import { isValidCoordinates } from "./UniversalMap/utils/validation"

import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import { getMarkerOptimizationSuggestions } from "@/utils/performance"

const DEFAULT_CLUSTER_THRESHOLD = 100

/**
 * UniversalMap - Robust dual map provider system with error handling
 *
 * Features:
 * - Automatic provider selection based on API key availability
 * - Fallback from Google Maps to Leaflet if errors occur
 * - Error boundary with user-friendly error messages
 * - Loading states and proper cleanup
 * - React 19 compatible
 * - TypeScript strict mode compatible
 * - Comprehensive prop validation
 * - Performance optimizations with marker clustering
 * - Proper ref management and memory cleanup
 */
export function UniversalMap(props: UniversalMapProps) {
  const {
    vehicles = [],
    facilities = [],
    cameras = [],
    showVehicles = true,
    showFacilities = true,
    showCameras = true,
    showRoutes = false,
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    className = "",
    onMapReady,
    onMapError,
    forceProvider,
    enableClustering = true,
    clusterThreshold = DEFAULT_CLUSTER_THRESHOLD,
    enablePerformanceMonitoring = import.meta.env.DEV,
    showPerformanceMonitor = import.meta.env.DEV,
  } = props

  const [loadingState, setLoadingState] = useState<MapLoadingState>("idle")
  const { provider, setProvider, fallbackAttempted, setFallbackAttempted } = useMapProvider(forceProvider)
  const mountedRef = useRef(true)

  const perf = usePerformanceMonitor("UniversalMap", {
    enabled: enablePerformanceMonitoring,
    reportInterval: 10000,
    slowRenderThreshold: 50,
    highMemoryThreshold: 150,
  })

  const validatedCenter = useMemo(() => {
    if (isValidCoordinates(center)) {
      return center
    }
    const dynamicCenter = calculateDynamicCenter(vehicles, facilities, cameras)
    if (process.env.NODE_ENV === 'development' && (vehicles.length > 0 || facilities.length > 0 || cameras.length > 0)) {
      console.log("Map center calculated from markers:", dynamicCenter)
    }
    return dynamicCenter
  }, [center, vehicles, facilities, cameras])

  const validatedZoom = useMemo(() => {
    const zoomValue = typeof zoom === "number" && !isNaN(zoom) ? zoom : DEFAULT_ZOOM
    return Math.max(1, Math.min(20, zoomValue))
  }, [zoom])

  const totalMarkerCount = useMemo(() => {
    let count = 0
    if (showVehicles) count += vehicles.length
    if (showFacilities) count += facilities.length
    if (showCameras) count += cameras.length
    return count
  }, [vehicles.length, facilities.length, cameras.length, showVehicles, showFacilities, showCameras])

  const shouldCluster = useMemo(() => {
    return enableClustering && totalMarkerCount > clusterThreshold
  }, [enableClustering, totalMarkerCount, clusterThreshold])

  const handleMapError = useCallback(
    (error: Error) => {
      console.error(`Map provider "${provider}" encountered error:`, error)
      if (!mountedRef.current) return

      setLoadingState("error")
      onMapError?.(error, provider)

      if (provider === "google" && !fallbackAttempted) {
        console.warn("Google Maps failed, falling back to Leaflet...")
        setFallbackAttempted(true)
        setProvider("leaflet")
        setLoadingState("loading")
      }
    },
    [provider, fallbackAttempted, onMapError, setProvider, setFallbackAttempted]
  )

  const handleMapReady = useCallback(() => {
    if (!mountedRef.current) return

    const initTime = performance.now()
    perf.recordMetric("timeToInteractive", initTime, {
      provider,
      markerCount: totalMarkerCount,
      clustering: shouldCluster,
    })

    setLoadingState("ready")
    onMapReady?.(provider)

    if (import.meta.env.DEV && totalMarkerCount > 0) {
      const suggestions = getMarkerOptimizationSuggestions(totalMarkerCount)
      if (suggestions.length > 0) {
        console.log("\n🚀 Performance Optimization Suggestions:")
        suggestions.forEach((s) => {
          console.log(`  ${s.priority === "high" ? "🔴" : s.priority === "medium" ? "🟡" : "🟢"} ${s.message}`)
          console.log(`     Impact: ${s.impact} | Effort: ${s.effort}`)
        })
      }
    }
  }, [provider, onMapReady, perf, totalMarkerCount, shouldCluster])

  useEffect(() => {
    mountedRef.current = true
    const initStart = perf.startMetric("mapInit")
    setLoadingState("loading")

    return () => {
      mountedRef.current = false
      perf.recordMetric("componentLifetime", Date.now() - initStart)
    }
  }, [])

  useEffect(() => {
    setLoadingState("loading")
  }, [provider])

  const commonMapProps = {
    vehicles,
    facilities,
    cameras,
    showVehicles,
    showFacilities,
    showCameras,
    showRoutes,
    center: validatedCenter,
    zoom: validatedZoom,
    className,
  }

  return (
    <MapErrorBoundary onError={(error) => handleMapError(error)}>
      <div className="relative w-full h-full">
        {loadingState === "loading" && <MapLoadingOverlay provider={provider} />}

        {provider === "google" ? (
          <GoogleMap
            {...commonMapProps}
            key="google-map"
            onError={handleMapError}
            onReady={handleMapReady}
          />
        ) : (
          <LeafletMap
            {...commonMapProps}
            key="leaflet-map"
            onError={handleMapError}
            onReady={handleMapReady}
          />
        )}

        {shouldCluster && <ClusteringBadge markerCount={totalMarkerCount} />}
        <ProviderBadge provider={provider} />

        {showPerformanceMonitor && (
          <PerformanceMonitor
            componentName={`UniversalMap (${provider})`}
            position="bottom-right"
            defaultExpanded={false}
            metrics={perf.metrics}
            showFPS={true}
            showMemory={true}
            showWebVitals={true}
            detectMemoryLeaks={true}
          />
        )}
      </div>
    </MapErrorBoundary>
  )
}

export { getMapProvider, setMapProvider, isMapProviderAvailable, getAvailableProviders, resetMapProvider } from "./UniversalMap/api"
