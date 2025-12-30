/**
 * ArcGIS Layer Utilities
 * @module ArcGIS/utils/layerUtils
 */

import type { LayerWithStatus, LayerExportData } from "../types"

import type { ArcGISLayerConfig } from "@/lib/arcgis/types"

/**
 * Export layers to JSON file
 */
export function exportLayersToFile(layers: LayerWithStatus[]): void {
  const exportData: LayerExportData = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    layers: layers.map(({ health, lastChecked, ...layer }) => layer),
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `arcgis-layers-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Swap two items in an array by index
 */
export function swapArrayItems<T>(array: T[], index1: number, index2: number): T[] {
  if (index1 < 0 || index1 >= array.length || index2 < 0 || index2 >= array.length) {
    return array
  }
  const newArray = [...array]
  const temp = newArray[index1]
  newArray[index1] = newArray[index2]
  newArray[index2] = temp
  return newArray
}

/**
 * Update a layer's opacity
 */
export function updateLayerOpacity(layer: LayerWithStatus, opacity: number): LayerWithStatus {
  return {
    ...layer,
    opacity,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Toggle a layer's enabled state
 */
export function toggleLayerEnabled(layer: LayerWithStatus): LayerWithStatus {
  return {
    ...layer,
    enabled: !layer.enabled,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Create a duplicate of a layer with a new ID
 */
export function duplicateLayer(layer: ArcGISLayerConfig): ArcGISLayerConfig {
  return {
    ...layer,
    id: `arcgis-${Date.now()}`,
    name: `${layer.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}