/**
 * ArcGIS Integration Types
 * Defines types for plug-and-play ArcGIS layer integration
 */

export interface ArcGISLayerConfig {
  id: string
  name: string
  description?: string
  serviceUrl: string
  layerType: 'feature' | 'tile' | 'image' | 'dynamic' | 'wms'
  enabled: boolean
  opacity: number // 0-1
  minZoom?: number
  maxZoom?: number
  refreshInterval?: number // in seconds
  authentication?: ArcGISAuth
  styling?: ArcGISLayerStyle
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ArcGISAuth {
  type: 'token' | 'oauth' | 'none'
  token?: string
  clientId?: string
  clientSecret?: string
}

export interface ArcGISLayerStyle {
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  iconUrl?: string
  iconSize?: number
  labelField?: string
  labelSize?: number
  labelColor?: string
}

export interface ArcGISServiceCapabilities {
  serviceUrl: string
  name: string
  description: string
  layerType: string
  spatialReference: {
    wkid: number
    latestWkid?: number
  }
  extent: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
  }
  layers?: ArcGISLayerInfo[]
  fields?: ArcGISFieldInfo[]
  supportedOperations: string[]
}

export interface ArcGISLayerInfo {
  id: number
  name: string
  type: string
  geometryType?: string
  minScale: number
  maxScale: number
}

export interface ArcGISFieldInfo {
  name: string
  type: string
  alias: string
  length?: number
}

export interface ArcGISLayerGroup {
  id: string
  name: string
  description?: string
  layers: string[] // Layer IDs
  enabled: boolean
  order: number
}
