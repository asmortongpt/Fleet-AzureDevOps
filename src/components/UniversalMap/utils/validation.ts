import { MapProvider } from "../types"

/**
 * Check if Google Maps API key is available
 * @returns True if key exists and is non-empty
 */
export function hasGoogleMapsApiKey(): boolean {
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
export function isValidProvider(provider: unknown): provider is MapProvider {
  return provider === "leaflet" || provider === "google"
}

/**
 * Validate coordinates
 * @param coords - Coordinates to validate
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(coords: unknown): coords is [number, number] {
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
