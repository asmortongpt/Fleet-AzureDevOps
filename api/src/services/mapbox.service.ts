/**
 * Mapbox Integration Service
 * Provides routing, directions, traffic, and geocoding via Mapbox API
 *
 * Security: Uses SSRF-protected HTTP client to prevent server-side request forgery
 */

import { safeGet, SSRFError, createSafeAxiosInstance } from '../utils/ssrf-protection'
import { logger } from '../config/logger'

const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY || ''
const MAPBOX_BASE_URL = 'https://api.mapbox.com'

// Allowed domains for Mapbox requests
const MAPBOX_ALLOWED_DOMAINS = [
  'api.mapbox.com',
  'events.mapbox.com',
]

export interface Coordinate {
  latitude: number
  longitude: number
}

export interface RouteOptions {
  profile?: 'driving-traffic' | 'driving' | 'walking' | 'cycling'
  alternatives?: boolean
  steps?: boolean
  overview?: 'full' | 'simplified' | 'false'
  geometries?: 'geojson' | 'polyline' | 'polyline6'
  annotations?: string[]
}

export interface RouteWaypoint {
  location: number[]
  name: string
  distance?: number
  duration?: number
}

export interface RouteResponse {
  distance: number // meters
  duration: number // seconds
  geometry: any // GeoJSON or encoded polyline
  waypoints: RouteWaypoint[]
  legs: RouteLeg[]
  weight?: number
  weight_name?: string
}

export interface RouteLeg {
  distance: number
  duration: number
  steps?: RouteStep[]
  annotation?: {
    distance?: number[]
    duration?: number[]
    speed?: number[]
    congestion?: string[]
  }
}

export interface RouteStep {
  distance: number
  duration: number
  geometry: any
  name: string
  instruction: string
  maneuver: {
    type: string
    location: number[]
    bearing_before: number
    bearing_after: number
    instruction: string
  }
}

export interface TrafficData {
  congestion_level: 'low' | 'moderate' | 'heavy' | 'severe'
  speed_factor: number // 1.0 = normal, <1.0 = slower
  delay_minutes: number
}

export interface MatrixResponse {
  durations: number[][] // seconds
  distances: number[][] // meters
  sources: RouteWaypoint[]
  destinations: RouteWaypoint[]
}

/**
 * Get directions between multiple points
 */
export async function getDirections(
  coordinates: Coordinate[],
  options: RouteOptions = {}
): Promise<RouteResponse> {
  try {
    if (!MAPBOX_API_KEY) {
      throw new Error('MAPBOX_API_KEY not configured')
    }

    const profile = options.profile || 'driving-traffic'
    const coordsString = coordinates
      .map((c) => `${c.longitude},${c.latitude}`)
      .join(';')

    const params = new URLSearchParams({
      access_token: MAPBOX_API_KEY,
      alternatives: String(options.alternatives ?? true),
      steps: String(options.steps ?? true),
      overview: options.overview || 'full',
      geometries: options.geometries || 'geojson',
      annotations: (options.annotations || ['duration', 'distance', 'speed', 'congestion']).join(',')
    })

    const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/${profile}/${coordsString}?${params}`

    const response = await safeGet(url, {
      timeout: 30000,
      allowedDomains: MAPBOX_ALLOWED_DOMAINS,
    })

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error('No routes found')
    }

    const route = response.data.routes[0]

    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      waypoints: response.data.waypoints,
      legs: route.legs,
      weight: route.weight,
      weight_name: route.weight_name
    }
  } catch (error: any) {
    logger.error('Mapbox directions error:', error.message)
    throw new Error(`Failed to get directions: ${error.message}`)
  }
}

/**
 * Get distance and duration matrix between all points
 * Useful for optimization algorithms
 */
export async function getDistanceMatrix(
  coordinates: Coordinate[],
  profile: string = 'driving-traffic'
): Promise<MatrixResponse> {
  try {
    if (!MAPBOX_API_KEY) {
      throw new Error('MAPBOX_API_KEY not configured')
    }

    const coordsString = coordinates
      .map((c) => `${c.longitude},${c.latitude}`)
      .join(';')

    const params = new URLSearchParams({
      access_token: MAPBOX_API_KEY,
      annotations: 'duration,distance'
    })

    const url = `${MAPBOX_BASE_URL}/directions-matrix/v1/mapbox/${profile}/${coordsString}?${params}`

    const response = await safeGet(url, {
      timeout: 60000,
      allowedDomains: MAPBOX_ALLOWED_DOMAINS,
    })

    return {
      durations: response.data.durations,
      distances: response.data.distances,
      sources: response.data.sources || [],
      destinations: response.data.destinations || []
    }
  } catch (error: any) {
    logger.error('Mapbox matrix error:', error.message)
    throw new Error(`Failed to get distance matrix: ${error.message}`)
  }
}

/**
 * Get optimized route with traffic considerations
 */
export async function getOptimizedRoute(
  coordinates: Coordinate[],
  vehicleType: 'car' | 'truck' = 'car'
): Promise<RouteResponse> {
  const profile = vehicleType === 'truck' ? 'driving' : 'driving-traffic'

  return getDirections(coordinates, {
    profile,
    alternatives: true,
    steps: true,
    annotations: ['duration', 'distance', 'speed', 'congestion']
  })
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(address: string): Promise<Coordinate | null> {
  try {
    if (!MAPBOX_API_KEY) {
      throw new Error('MAPBOX_API_KEY not configured')
    }

    const encodedAddress = encodeURIComponent(address)
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_API_KEY}&limit=1`

    const response = await safeGet(url, {
      allowedDomains: MAPBOX_ALLOWED_DOMAINS,
    })

    if (!response.data.features || response.data.features.length === 0) {
      return null
    }

    const [longitude, latitude] = response.data.features[0].center

    return { latitude, longitude }
  } catch (error: any) {
    logger.error('Geocoding error:', error.message)
    return null
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    if (!MAPBOX_API_KEY) {
      throw new Error('MAPBOX_API_KEY not configured')
    }

    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}`

    const response = await safeGet(url, {
      allowedDomains: MAPBOX_ALLOWED_DOMAINS,
    })

    if (!response.data.features || response.data.features.length === 0) {
      return null
    }

    return response.data.features[0].place_name
  } catch (error: any) {
    logger.error('Reverse geocoding error:', error.message)
    return null
  }
}

/**
 * Analyze traffic congestion on a route
 */
export function analyzeTrafficCongestion(route: RouteResponse): TrafficData {
  const annotations = route.legs[0]?.annotation

  if (!annotations || !annotations.congestion) {
    return {
      congestion_level: 'low',
      speed_factor: 1.0,
      delay_minutes: 0
    }
  }

  const congestionCounts = {
    low: 0,
    moderate: 0,
    heavy: 0,
    severe: 0
  }

  annotations.congestion.forEach((level) => {
    if (level in congestionCounts) {
      congestionCounts[level as keyof typeof congestionCounts]++
    }
  })

  const total = annotations.congestion.length
  const heavyPercent = ((congestionCounts.heavy + congestionCounts.severe) / total) * 100

  let congestion_level: 'low' | 'moderate' | 'heavy' | 'severe' = 'low'
  let speed_factor = 1.0

  if (heavyPercent > 50) {
    congestion_level = 'severe'
    speed_factor = 0.5
  } else if (heavyPercent > 25) {
    congestion_level = 'heavy'
    speed_factor = 0.7
  } else if (heavyPercent > 10) {
    congestion_level = 'moderate'
    speed_factor = 0.85
  }

  const normalDuration = route.duration / speed_factor
  const delay_minutes = (route.duration - normalDuration) / 60

  return {
    congestion_level,
    speed_factor,
    delay_minutes
  }
}

/**
 * Get isochrone (time-based reachability area)
 */
export async function getIsochrone(
  coordinate: Coordinate,
  minutes: number,
  profile: string = 'driving'
): Promise<any> {
  try {
    if (!MAPBOX_API_KEY) {
      throw new Error('MAPBOX_API_KEY not configured')
    }

    const url = `${MAPBOX_BASE_URL}/isochrone/v1/mapbox/${profile}/${coordinate.longitude},${coordinate.latitude}?contours_minutes=${minutes}&polygons=true&access_token=${MAPBOX_API_KEY}`

    const response = await safeGet(url, {
      allowedDomains: MAPBOX_ALLOWED_DOMAINS,
    })
    return response.data
  } catch (error: any) {
    logger.error('Isochrone error:', error.message)
    throw new Error(`Failed to get isochrone: ${error.message}`)
  }
}

/**
 * Calculate route efficiency score
 */
export function calculateRouteEfficiency(
  route: RouteResponse,
  directDistance: number
): number {
  const routeDistance = route.distance
  const circuityRatio = routeDistance / directDistance

  // Lower circuity is better (1.0 = straight line)
  // Typical good routes are 1.1-1.3
  const circuityScore = Math.max(0, 100 - (circuityRatio - 1.0) * 100)

  return Math.min(100, Math.max(0, circuityScore))
}

/**
 * Estimate fuel consumption based on route
 */
export function estimateFuelConsumption(
  route: RouteResponse,
  vehicleMPG: number,
  fuelCostPerGallon: number = 3.5
): {
  gallons: number
  cost: number
} {
  const miles = route.distance * 0.000621371 // meters to miles
  const gallons = miles / vehicleMPG
  const cost = gallons * fuelCostPerGallon

  return {
    gallons: Math.round(gallons * 100) / 100,
    cost: Math.round(cost * 100) / 100
  }
}

export default {
  getDirections,
  getDistanceMatrix,
  getOptimizedRoute,
  geocodeAddress,
  reverseGeocode,
  analyzeTrafficCongestion,
  getIsochrone,
  calculateRouteEfficiency,
  estimateFuelConsumption
}
