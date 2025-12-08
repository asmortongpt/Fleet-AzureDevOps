/**
 * Layer Operations State Management Hook
 * @module ArcGIS/hooks/useLayerOperations
 */

import { useState, useCallback } from "react"

import type { LayerOperationState } from "../types"

interface UseLayerOperationsReturn {
  layerOperations: Map<string, LayerOperationState>
  updateLayerOperation: (layerId: string, state: Partial<LayerOperationState>) => void
  getLayerOperation: (layerId: string) => LayerOperationState | undefined
}

/**
 * Hook for managing layer operation states (loading, errors)
 */
export function useLayerOperations(): UseLayerOperationsReturn {
  const [layerOperations, setLayerOperations] = useState<Map<string, LayerOperationState>>(new Map())

  const updateLayerOperation = useCallback((layerId: string, state: Partial<LayerOperationState>) => {
    setLayerOperations((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(layerId) || { loading: false, error: null }
      newMap.set(layerId, { ...current, ...state })
      return newMap
    })
  }, [])

  const getLayerOperation = useCallback(
    (layerId: string) => {
      return layerOperations.get(layerId)
    },
    [layerOperations]
  )

  return {
    layerOperations,
    updateLayerOperation,
    getLayerOperation,
  }
}
