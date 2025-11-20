import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Component,
  ErrorInfo,
  ReactNode,
} from "react"
import { LeafletMap } from "./LeafletMap"
import { GoogleMap } from "./GoogleMap"
import { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import { PerformanceMonitor } from "./PerformanceMonitor"
import { getMarkerOptimizationSuggestions } from "@/utils/performance"

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Supported map providers
 * - leaflet: OpenStreetMap with Leaflet (free, no API key required)
 * - google: Google Maps Platform (requires API key, $200/month free credit)
 */
export type MapProvider = "leaflet" | "google"

/**
 * Map loading state
 */
export type MapLoadingState = "idle" | "loading" | "ready" | "error"

/**
 * Props for UniversalMap component
 */
export interface UniversalMapProps {
  /** Array of vehicles to display on the map */
  vehicles?: Vehicle[]

  /** Array of GIS facilities to display on the map */
  facilities?: GISFacility[]

  /** Array of traffic cameras to display on the map */
  cameras?: TrafficCamera[]

  /** Whether to show vehicle markers (default: true) */
  showVehicles?: boolean

  /** Whether to show facility markers (default: true) */
  showFacilities?: boolean

  /** Whether to show camera markers (default: true) */
  showCameras?: boolean

  /** Whether to show routes between points (default: false) */
  showRoutes?: boolean

  /** Center coordinates [latitude, longitude] (default: [30.4383, -84.2807] - Tallahassee, FL) */
  center?: [number, number]

  /** Initial zoom level (default: 13) */
  zoom?: number

  /** Additional CSS class names */
  className?: string

  /** Callback when map is ready */
  onMapReady?: (provider: MapProvider) => void

  /** Callback when map encounters an error */
  onMapError?: (error: Error, provider: MapProvider) => void

  /** Force a specific map provider (overrides localStorage) */
  forceProvider?: MapProvider

  /** Enable clustering for markers (default: true for performance) */
  enableClustering?: boolean

  /** Maximum number of markers before forcing clustering (default: 100) */
  clusterThreshold?: number

  /** Enable performance monitoring (default: true in dev mode) */
  enablePerformanceMonitoring?: boolean

  /** Show performance monitor dashboard (default: true in dev mode) */
  showPerformanceMonitor?: boolean
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default map center (Tallahassee, FL)
 */
const DEFAULT_CENTER: [number, number] = [30.4383, -84.2807]

/**
 * Default zoom level
 */
const DEFAULT_ZOOM = 13

/**
 * LocalStorage key for map provider preference
 */
const STORAGE_KEY = "fleet_map_provider"

/**
 * Maximum number of markers before clustering is recommended
 */
const DEFAULT_CLUSTER_THRESHOLD = 100

/**
 * Debounce delay for storage events (ms)
 */
const STORAGE_EVENT_DEBOUNCE = 100

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * Error boundary for map component failures
 * Catches errors in map rendering and provides fallback UI
 */
class MapErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Map Error Boundary caught an error:", error, errorInfo)
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-md text-center">
            <div className="mb-4 text-red-500">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Map Failed to Load
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || "An unexpected error occurred while loading the map."}
            </p>
            <button
              onClick={() => window.location?.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely access localStorage with fallback
 * @param key - Storage key
 * @param defaultValue - Default value if access fails
 * @returns Stored value or default
 */
function safeGetLocalStorage(key: string, defaultValue: string | null = null): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return defaultValue
    }
    return localStorage.getItem(key) ?? defaultValue
  } catch (error) {
    console.warn("Failed to access localStorage:", error)
    return defaultValue
  }
}

/**
 * Safely set localStorage with error handling
 * @param key - Storage key
 * @param value - Value to store
 * @returns Success status
 */
function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false
    }
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn("Failed to set localStorage:", error)
    return false
  }
}

/**
 * Check if Google Maps API key is available
 * @returns True if key exists and is non-empty
 */
function hasGoogleMapsApiKey(): boolean {
  try {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    return typeof key === "string" && key.length > 0
  } catch (error) {
    console.warn("Failed to check Google Maps API key:", error)
    return false
  }
}

/**
 * Validate map provider
 * @param provider - Provider to validate
 * @returns True if provider is valid
 */
function isValidProvider(provider: unknown): provider is MapProvider {
  return provider === "leaflet" || provider === "google"
}

/**
 * Validate coordinates
 * @param coords - Coordinates to validate
 * @returns True if coordinates are valid
 */
function isValidCoordinates(coords: unknown): coords is [number, number] {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return false
  }
  const [lat, lng] = coords
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Get the current map provider from localStorage or default
 * @param forceProvider - Optional forced provider
 * @returns Active map provider
 */
function getActiveProvider(forceProvider?: MapProvider): MapProvider {
  // If forced, use that provider
  if (forceProvider && isValidProvider(forceProvider)) {
    return forceProvider
  }

  // Check if Google Maps API key is available
  const hasGoogleKey = hasGoogleMapsApiKey()

  // Get saved preference from localStorage
  const saved = safeGetLocalStorage(STORAGE_KEY)

  // If user prefers Google and key is available, use Google
  if (saved === "google" && hasGoogleKey) {
    return "google"
  }

  // Default to Leaflet (always works, no API key needed)
  return "leaflet"
}

// ============================================================================
// Main Component
// ============================================================================

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
 *
 * Providers:
 * - Leaflet (default): OpenStreetMap with Leaflet - 100% free, no API key required
 * - Google Maps: Google Maps Platform - requires API key, $200/month free credit
 *
 * Usage:
 * ```tsx
 * <UniversalMap
 *   vehicles={vehicles}
 *   facilities={facilities}
 *   cameras={cameras}
 *   showVehicles={true}
 *   showFacilities={true}
 *   center={[30.4383, -84.2807]}
 *   zoom={13}
 *   onMapReady={(provider) => console.log(`Map ready: ${provider}`)}
 * />
 * ```
 *
 * Provider Management:
 * ```tsx
 * // Get current provider
 * const provider = getMapProvider()
 *
 * // Set provider preference
 * setMapProvider("google")
 * ```
 */
export function UniversalMap(props: UniversalMapProps) {
  // --------------------------------------------------------------------------
  // Props Destructuring with Defaults
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------

  const [provider, setProvider] = useState<MapProvider>(() => getActiveProvider(forceProvider))
  const [loadingState, setLoadingState] = useState<MapLoadingState>("idle")
  const [fallbackAttempted, setFallbackAttempted] = useState(false)

  // --------------------------------------------------------------------------
  // Performance Monitoring
  // --------------------------------------------------------------------------

  const perf = usePerformanceMonitor("UniversalMap", {
    enabled: enablePerformanceMonitoring,
    reportInterval: 10000, // Report every 10 seconds
    slowRenderThreshold: 50,
    highMemoryThreshold: 150,
  })

  // --------------------------------------------------------------------------
  // Refs
  // --------------------------------------------------------------------------

  const mountedRef = useRef(true)
  const storageListenerRef = useRef<(() => void) | null>(null)
  const providerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // --------------------------------------------------------------------------
  // Memoized Values
  // --------------------------------------------------------------------------

  /**
   * Validated center coordinates with fallback
   */
  const validatedCenter = useMemo(() => {
    if (isValidCoordinates(center)) {
      return center
    }
    console.warn("Invalid center coordinates provided, using default:", DEFAULT_CENTER)
    return DEFAULT_CENTER
  }, [center])

  /**
   * Validated zoom level with bounds
   */
  const validatedZoom = useMemo(() => {
    const zoomValue = typeof zoom === "number" && !isNaN(zoom) ? zoom : DEFAULT_ZOOM
    // Clamp zoom between 1 and 20
    return Math.max(1, Math.min(20, zoomValue))
  }, [zoom])

  /**
   * Total marker count for clustering decision
   */
  const totalMarkerCount = useMemo(() => {
    let count = 0
    if (showVehicles) count += vehicles.length
    if (showFacilities) count += facilities.length
    if (showCameras) count += cameras.length
    return count
  }, [vehicles.length, facilities.length, cameras.length, showVehicles, showFacilities, showCameras])

  /**
   * Whether clustering should be enabled based on marker count
   */
  const shouldCluster = useMemo(() => {
    return enableClustering && totalMarkerCount > clusterThreshold
  }, [enableClustering, totalMarkerCount, clusterThreshold])

  // --------------------------------------------------------------------------
  // Callbacks
  // --------------------------------------------------------------------------

  /**
   * Handle map provider errors with fallback to Leaflet
   */
  const handleMapError = useCallback(
    (error: Error) => {
      console.error(`Map provider "${provider}" encountered error:`, error)

      if (!mountedRef.current) return

      setLoadingState("error")
      onMapError?.(error, provider)

      // If Google Maps fails and we haven't tried fallback, switch to Leaflet
      if (provider === "google" && !fallbackAttempted) {
        console.warn("Google Maps failed, falling back to Leaflet...")
        setFallbackAttempted(true)
        setProvider("leaflet")
        setLoadingState("loading")
      }
    },
    [provider, fallbackAttempted, onMapError]
  )

  /**
   * Handle successful map initialization
   */
  const handleMapReady = useCallback(() => {
    if (!mountedRef.current) return

    // Track time to interactive
    const initTime = performance.now()
    perf.recordMetric("timeToInteractive", initTime, {
      provider,
      markerCount: totalMarkerCount,
      clustering: shouldCluster,
    })

    setLoadingState("ready")
    onMapReady?.(provider)

    // Log optimization suggestions in dev mode
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

  /**
   * Handle storage events (provider changes from other tabs)
   */
  const handleStorageChange = useCallback(() => {
    if (!mountedRef.current) return

    // Debounce storage events
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current)
    }

    providerChangeTimeoutRef.current = setTimeout(() => {
      const newProvider = getActiveProvider(forceProvider)
      if (newProvider !== provider) {
        console.log(`Provider changed to: ${newProvider}`)
        setProvider(newProvider)
        setLoadingState("loading")
        setFallbackAttempted(false)
      }
    }, STORAGE_EVENT_DEBOUNCE)
  }, [provider, forceProvider])

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  /**
   * Component mount/unmount lifecycle
   */
  useEffect(() => {
    mountedRef.current = true

    // Track map initialization
    const initStart = perf.startMetric("mapInit")
    setLoadingState("loading")

    return () => {
      mountedRef.current = false

      // Cleanup timeout
      if (providerChangeTimeoutRef.current) {
        clearTimeout(providerChangeTimeoutRef.current)
      }

      // Cleanup storage listener
      if (storageListenerRef.current) {
        storageListenerRef.current()
      }

      // Track component unmount
      perf.recordMetric("componentLifetime", Date.now() - initStart)
    }
  }, [])

  /**
   * Listen for storage changes (cross-tab provider switching)
   */
  useEffect(() => {
    // Don't listen if provider is forced
    if (forceProvider) return

    const cleanup = () => {
      window.removeEventListener("storage", handleStorageChange)
    }

    window.addEventListener("storage", handleStorageChange)
    storageListenerRef.current = cleanup

    return cleanup
  }, [handleStorageChange, forceProvider])

  /**
   * Update loading state when provider changes
   */
  useEffect(() => {
    setLoadingState("loading")
  }, [provider])

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  /**
   * Common props passed to both map implementations
   */
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
        {/* Loading Overlay */}
        {loadingState === "loading" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading {provider === "google" ? "Google Maps" : "OpenStreetMap"}...
              </p>
            </div>
          </div>
        )}

        {/* Map Provider Components */}
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

        {/* Clustering Info Badge */}
        {shouldCluster && (
          <div className="absolute bottom-4 left-4 z-40 bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-md shadow-md text-xs text-gray-600 dark:text-gray-300">
            Clustering {totalMarkerCount} markers
          </div>
        )}

        {/* Provider Badge (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute top-4 right-4 z-40 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
            {provider === "google" ? "Google Maps" : "Leaflet/OSM"}
          </div>
        )}

        {/* Performance Monitor Dashboard */}
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

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Get the current active map provider
 * @returns Current map provider
 */
export function getMapProvider(): MapProvider {
  return getActiveProvider()
}

/**
 * Set the map provider preference
 * @param provider - Provider to use ("leaflet" or "google")
 * @param reloadPage - Whether to reload the page (default: true)
 * @returns Success status
 */
export function setMapProvider(provider: MapProvider, reloadPage = true): boolean {
  if (!isValidProvider(provider)) {
    console.error(`Invalid map provider: ${provider}`)
    return false
  }

  // Validate Google Maps availability
  if (provider === "google" && !hasGoogleMapsApiKey()) {
    console.error("Cannot set Google Maps provider: API key not available")
    return false
  }

  const success = safeSetLocalStorage(STORAGE_KEY, provider)

  if (success && reloadPage && typeof window !== "undefined") {
    window.location?.reload()
  }

  return success
}

/**
 * Check if a map provider is available
 * @param provider - Provider to check
 * @returns True if provider is available
 */
export function isMapProviderAvailable(provider: MapProvider): boolean {
  if (!isValidProvider(provider)) {
    return false
  }

  if (provider === "google") {
    return hasGoogleMapsApiKey()
  }

  // Leaflet is always available
  return true
}

/**
 * Get list of available map providers
 * @returns Array of available providers
 */
export function getAvailableProviders(): MapProvider[] {
  const providers: MapProvider[] = ["leaflet"]

  if (hasGoogleMapsApiKey()) {
    providers.push("google")
  }

  return providers
}

/**
 * Reset map provider to default (Leaflet)
 * @param reloadPage - Whether to reload the page (default: true)
 */
export function resetMapProvider(reloadPage = true): void {
  setMapProvider("leaflet", reloadPage)
}
