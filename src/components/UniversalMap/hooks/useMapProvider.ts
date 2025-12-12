import { useState, useEffect, useCallback, useRef } from "react"

import { MapProvider } from "../types"
import { getActiveProvider } from "../utils/provider"

const STORAGE_EVENT_DEBOUNCE = 100

export function useMapProvider(forceProvider?: MapProvider) {
  const [provider, setProvider] = useState<MapProvider>(() => getActiveProvider(forceProvider))
  const [fallbackAttempted, setFallbackAttempted] = useState(false)
  const providerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const storageListenerRef = useRef<(() => void) | null>(null)

  const handleStorageChange = useCallback(() => {
    // Debounce storage events
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current)
    }

    providerChangeTimeoutRef.current = setTimeout(() => {
      const newProvider = getActiveProvider(forceProvider)
      if (newProvider !== provider) {
        console.log(`Provider changed to: ${newProvider}`)
        setProvider(newProvider)
        setFallbackAttempted(false)
      }
    }, STORAGE_EVENT_DEBOUNCE)
  }, [provider, forceProvider])

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

  useEffect(() => {
    return () => {
      if (providerChangeTimeoutRef.current) {
        clearTimeout(providerChangeTimeoutRef.current)
      }
      if (storageListenerRef.current) {
        storageListenerRef.current()
      }
    }
  }, [])

  return { provider, setProvider, fallbackAttempted, setFallbackAttempted }
}
