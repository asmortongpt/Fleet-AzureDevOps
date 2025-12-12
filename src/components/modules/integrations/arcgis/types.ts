/**
 * ArcGIS Integration Types
 * @module ArcGIS/types
 */

import type { ArcGISLayerConfig } from "@/lib/arcgis/types"

/**
 * Layer health status indicator
 */
export type LayerHealth = "healthy" | "warning" | "error" | "unknown"

/**
 * Extended layer configuration with status information
 */
export interface LayerWithStatus extends ArcGISLayerConfig {
  health?: LayerHealth
  lastChecked?: Date
}

/**
 * State of layer operations (loading, errors)
 */
export interface LayerOperationState {
  loading: boolean
  error: string | null
}

/**
 * Export data structure for layer configurations
 */
export interface LayerExportData {
  version: string
  exportedAt: string
  layers: ArcGISLayerConfig[]
}
