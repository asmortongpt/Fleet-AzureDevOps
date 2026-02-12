import { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

/**
 * Default map center from environment (format: "lat,lng")
 */
function parseDefaultCenter(): [number, number] | null {
  const raw = (import.meta as any).env?.VITE_DEFAULT_MAP_CENTER as string | undefined
  if (!raw) return null
  const parts = raw.split(',').map(p => Number(p.trim()))
  if (parts.length !== 2 || parts.some(n => !Number.isFinite(n))) return null
  return [parts[0], parts[1]]
}

export const DEFAULT_CENTER: [number, number] = parseDefaultCenter() ?? [0, 0]

/**
 * Default zoom level from environment
 */
export const DEFAULT_ZOOM = Number((import.meta as any).env?.VITE_DEFAULT_MAP_ZOOM ?? 4)

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
    const latRaw =
      (v as any).location?.lat ??
      (v as any).location?.latitude ??
      (v as any).latitude ??
      (v as any).gps_latitude ??
      (v as any).lat
    const lngRaw =
      (v as any).location?.lng ??
      (v as any).location?.longitude ??
      (v as any).longitude ??
      (v as any).gps_longitude ??
      (v as any).lng

    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (Number.isFinite(lat) && Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180) {
      validCoords.push([lat, lng])
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
