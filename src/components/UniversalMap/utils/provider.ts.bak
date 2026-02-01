import { MapProvider } from "../types"

import { safeGetLocalStorage } from "./storage"
import { hasGoogleMapsApiKey, isValidProvider } from "./validation"

/**
 * LocalStorage key for map provider preference
 */
export const STORAGE_KEY = "fleet_map_provider"

/**
 * Get the current map provider from localStorage or default
 * @param forceProvider - Optional forced provider
 * @returns Active map provider
 */
export function getActiveProvider(forceProvider?: MapProvider): MapProvider {
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
