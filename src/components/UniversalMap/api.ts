import { MapProvider } from "./types"
import { getActiveProvider, STORAGE_KEY } from "./utils/provider"
import { safeSetLocalStorage } from "./utils/storage"
import { hasGoogleMapsApiKey, isValidProvider } from "./utils/validation"

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
    window.location.reload()
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
