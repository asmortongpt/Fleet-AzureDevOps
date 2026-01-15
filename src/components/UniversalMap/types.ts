import { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

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

  /** Map style variant (default, satellite, terrain, etc.) */
  mapStyle?: string

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

  /** Callback when camera marker is clicked */
  onCameraClick?: (camera: TrafficCamera) => void

  /** Currently selected camera */
  selectedCamera?: TrafficCamera | null
}
