/**
 * Layer Actions Hook - CRUD operations for layers
 * @module ArcGIS/hooks/useLayerActions
 */

import { useCallback } from "react"

import type { LayerWithStatus } from "../types"
import { toggleLayerEnabled, updateLayerOpacity, duplicateLayer, swapArrayItems } from "../utils/layerUtils"

import { apiClient } from "@/lib/api-client"

interface UseLayerActionsProps {
  layers: LayerWithStatus[]
  setLayers: React.Dispatch<React.SetStateAction<LayerWithStatus[]>>
  updateLayerOperation: (layerId: string, state: { loading: boolean; error: string | null }) => void
}

interface UseLayerActionsReturn {
  handleToggleLayer: (layerId: string) => Promise<void>
  handleOpacityChange: (layerId: string, opacity: number) => void
  handleDeleteLayer: (layerId: string) => Promise<void>
  handleDuplicateLayer: (layerId: string) => Promise<void>
  handleMoveLayerUp: (layerId: string) => void
  handleMoveLayerDown: (layerId: string) => void
}

/**
 * Hook for layer CRUD actions
 */
export function useLayerActions({
  layers,
  setLayers,
  updateLayerOperation,
}: UseLayerActionsProps): UseLayerActionsReturn {
  const handleToggleLayer = useCallback(
    async (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      const updatedLayer = toggleLayerEnabled(layer)
      setLayers((prev) => prev.map((l) => (l.id === layerId ? updatedLayer : l)))

      updateLayerOperation(layerId, { loading: true, error: null })

      try {
        await apiClient.arcgisLayers.update(layer.id, { enabled: !layer.enabled })
        updateLayerOperation(layerId, { loading: false, error: null })
      } catch (error) {
        setLayers((prev) => prev.map((l) => (l.id === layerId ? layer : l)))
        updateLayerOperation(layerId, {
          loading: false,
          error: error instanceof Error ? error.message : "Failed to update layer",
        })
      }
    },
    [layers, setLayers, updateLayerOperation]
  )

  const handleOpacityChange = useCallback(
    (layerId: string, opacity: number) => {
      setLayers((prev) => prev.map((l) => (l.id === layerId ? updateLayerOpacity(l, opacity) : l)))
    },
    [setLayers]
  )

  const handleDeleteLayer = useCallback(
    async (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      if (!confirm(`Are you sure you want to remove "${layer.name}"?`)) return

      const originalLayers = [...layers]
      setLayers((prev) => prev.filter((l) => l.id !== layerId))

      try {
        await apiClient.arcgisLayers.delete(layerId)
      } catch (error) {
        setLayers(originalLayers)
        updateLayerOperation(layerId, {
          loading: false,
          error: error instanceof Error ? error.message : "Failed to delete layer",
        })
      }
    },
    [layers, setLayers, updateLayerOperation]
  )

  const handleDuplicateLayer = useCallback(
    async (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      const duplicatedLayer = duplicateLayer(layer)

      try {
        setLayers((prev) => [...prev, { ...duplicatedLayer, health: "unknown" }])
        await apiClient.arcgisLayers.create(duplicatedLayer)
      } catch (error) {
        setLayers((prev) => prev.filter((l) => l.id !== duplicatedLayer.id))
      }
    },
    [layers, setLayers]
  )

  const handleMoveLayerUp = useCallback(
    (layerId: string) => {
      setLayers((prev) => {
        const index = prev.findIndex((l) => l.id === layerId)
        if (index <= 0) return prev
        return swapArrayItems(prev, index, index - 1)
      })
    },
    [setLayers]
  )

  const handleMoveLayerDown = useCallback(
    (layerId: string) => {
      setLayers((prev) => {
        const index = prev.findIndex((l) => l.id === layerId)
        if (index < 0 || index >= prev.length - 1) return prev
        return swapArrayItems(prev, index, index + 1)
      })
    },
    [setLayers]
  )

  return {
    handleToggleLayer,
    handleOpacityChange,
    handleDeleteLayer,
    handleDuplicateLayer,
    handleMoveLayerUp,
    handleMoveLayerDown,
  }
}
