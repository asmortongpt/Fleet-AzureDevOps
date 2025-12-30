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

import { GoogleMap } from "./GoogleMap"
import { LeafletMap } from "./LeafletMap"
import { PerformanceMonitor } from "./PerformanceMonitor"

import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"
import logger from '@/utils/logger';
import { getMarkerOptimizationSuggestions, PerformanceSuggestion } from "@/utils/performance"

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
    logger.error("Map Error Boundary caught an error:", error, errorInfo)
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
              onClick={() => window.location.reload()}
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
    logger.warn("Failed to access localStorage:", error)
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
    logger.warn("Failed to set localStorage:", error)
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
    logger.warn("Failed to check Google Maps API key:", error)
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
 * Calculate center coordinates from markers data
 * Returns the geographic center of all valid markers
 * Falls back to DEFAULT_CENTER if no valid markers exist
 * @param vehicles - Array of vehicles
 * @param facilities - Array of facilities
 * @param cameras - Array of cameras
 * @returns Calculated center coordinates [lat, lng]
 */
function calculateDynamicCenter(
  vehicles: Vehicle[] = [],
  facilities: GISFacility[] = [],
  cameras: TrafficCamera[] = []
): [number, number] {
  const validCoords: [number, number][] = []

  // Collect vehicle coordinates
  vehicles.forEach(v => {
    if (v.location?.lat && v.location?.lng &&
        v.location.lat >= -90 && v.location.lat <= 90 &&
        v.location.lng >= -180 && v.location.lng <= 180) {
      validCoords.push([v.location.lat, v.location.lng])
    }
  })

  // Collect facility coordinates
  facilities.forEach(f => {
    if (f.location?.lat && f.location?.lng &&
        f.location.lat >= -90 && f.location.lat <= 90 &&
        f.location.lng >= -180 && f.location.lng <= 180) {
      validCoords.push([f.location.lat, f.location.lng])
    }
  })

  // Collect camera coordinates
  cameras.forEach(c => {
    if (c.latitude && c.longitude &&
        c.latitude >= -90 && c.latitude <= 90 &&
        c.longitude >= -180 && c.longitude <= 180) {
      validCoords.push([c.latitude, c.longitude])
    }
  })

  // If no valid coordinates, return default
  if (validCoords.length === 0) {
    return DEFAULT_CENTER
  }

  // Calculate average (centroid)
  const sumLat = validCoords.reduce((sum, [lat]) => sum + lat, 0)
  const sumLng = validCoords.reduce((sum, [, lng]) => sum + lng, 0)

  return [
    sumLat / validCoords.length,
    sumLng / validCoords.length
  ]
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

  // Check environment variable for default provider
  const envProvider = import.meta.env.VITE_MAP_PROVIDER || import.meta.env.VITE_DEFAULT_MAP_PROVIDER

  // Get saved preference from localStorage
  const saved = safeGetLocalStorage(STORAGE_KEY)

  // Priority: 1) localStorage preference, 2) env var, 3) default to Google if key available
  if (saved && isValidProvider(saved) && (saved !== "google" || hasGoogleKey)) {
    return saved
  }

  // If environment specifies Google and key is available, use Google
  if (envProvider === "google" && hasGoogleKey) {
    return "google"
  }

  // If Google key is available and no other preference, default to Google
  if (hasGoogleKey) {
    return "google"
  }

  // Final fallback to Leaflet (always works, no API key needed)
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
 *