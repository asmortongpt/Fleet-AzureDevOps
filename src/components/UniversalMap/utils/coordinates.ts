import { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

/**
 * Default map center (Tallahassee, FL)
 */
export const DEFAULT_CENTER: [number, number] = [30.4383, -84.2807]

/**
 * Default zoom level
 */
export const DEFAULT_ZOOM = 13

/**
 * Calculate center coordinates from markers data
 * Returns the geographic center of all valid markers
 * Falls back to DEFAULT_CENTER if no valid markers exist
 * @param vehicles - Array of vehicles
 * @param facilities - Array of facilities
 * @param cameras - Array of cameras
 * @returns Calculated center coordinates [lat, lng]
 */
export function calculateDynamicCenter(
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
