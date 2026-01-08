/**
 * ArcGIS Layers Management Hook
 * @module ArcGIS/hooks/useArcGISLayers
 */

import { useState, useEffect, useCallback, useRef } from "react"

import type { LayerWithStatus, LayerHealth } from "../types"

import { apiClient } from "@/lib/api-client"
import logger from '@/utils/logger';
interface UseArcGISLayersReturn {
  layers: LayerWithStatus[]
  setLayers: React.Dispatch<React.SetStateAction<LayerWithStatus[]>>
  loading: boolean
  error: string | null
  loadLayers: () => Promise<void>
}

/**
 * Hook for loading and managing ArcGIS layers
 */
export function useArcGISLayers(): UseArcGISLayersReturn {
  const [layers, setLayers] = useState<LayerWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadLayers = useCallback(async (retryCount = 0) => {
    const maxRetries = 3
    try {
      setLoading(true)
      setError(null)
      abortControllerRef.current = new AbortController()

      const layersData = await apiClient.arcgisLayers.list() as LayerWithStatus[]
      setLayers(
        layersData.map((layer: LayerWithStatus) => ({
          ...layer,
          health: "unknown" as LayerHealth,
        }))
      )
    } catch (err) {
      logger.error("Failed to load ArcGIS layers:", err)
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => loadLayers(retryCount + 1), delay)
      } else {
        setError(err instanceof Error ? err.message : "Failed to load ArcGIS layers")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLayers()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadLayers])

  return {
    layers,
    setLayers,
    loading,
    error,
    loadLayers,
  }
}
