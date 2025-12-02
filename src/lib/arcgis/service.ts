/**
 * ArcGIS Integration Service
 * Handles ArcGIS REST API interactions and layer management
 */

import { ArcGISServiceCapabilities } from './types'
import logger from '@/utils/logger'

// GeoJSON type definitions
declare namespace GeoJSON {
  interface Feature {
    type: 'Feature'
    geometry: Geometry
    properties: Record<string, any>
  }

  type Geometry = Point | LineString | MultiLineString | Polygon | MultiPolygon

  interface Point {
    type: 'Point'
    coordinates: [number, number]
  }

  interface LineString {
    type: 'LineString'
    coordinates: [number, number][]
  }

  interface MultiLineString {
    type: 'MultiLineString'
    coordinates: [number, number][][]
  }

  interface Polygon {
    type: 'Polygon'
    coordinates: [number, number][][]
  }

  interface MultiPolygon {
    type: 'MultiPolygon'
    coordinates: [number, number][][][]
  }
}

export class ArcGISService {
  /**
   * Fetch service capabilities from ArcGIS REST endpoint
   */
  async fetchServiceCapabilities(serviceUrl: string, token?: string): Promise<ArcGISServiceCapabilities> {
    try {
      const url = new URL(serviceUrl)
      url.searchParams.set('f', 'json')
      if (token) {
        url.searchParams.set('token', token)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Failed to fetch service capabilities: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`ArcGIS Error: ${data.error.message || 'Unknown error'}`)
      }

      return {
        serviceUrl: serviceUrl,
        name: data.name || data.mapName || 'Unnamed Service',
        description: data.description || data.serviceDescription || '',
        layerType: this.detectLayerType(serviceUrl, data),
        spatialReference: data.spatialReference || { wkid: 4326 },
        extent: data.fullExtent || data.extent || {
          xmin: -180,
          ymin: -90,
          xmax: 180,
          ymax: 90
        },
        layers: data.layers || [],
        fields: data.fields || [],
        supportedOperations: this.detectSupportedOperations(data)
      }
    } catch (error) {
      logger.error('Error fetching ArcGIS service capabilities:', { error })
      throw error
    }
  }

  /**
   * Detect the layer type from service URL and metadata
   */
  private detectLayerType(serviceUrl: string, data: any): string {
    const url = serviceUrl.toLowerCase()

    if (url.includes('/featureserver/')) return 'feature'
    if (url.includes('/mapserver/') && url.includes('/tile')) return 'tile'
    if (url.includes('/mapserver/') && !data.tileInfo) return 'dynamic'
    if (url.includes('/imageserver/')) return 'image'
    if (url.includes('wms')) return 'wms'
    if (data.tileInfo) return 'tile'
    if (data.type === 'Feature Layer') return 'feature'

    return 'dynamic'
  }

  /**
   * Detect supported operations
   */
  private detectSupportedOperations(data: any): string[] {
    const operations: string[] = []

    if (data.capabilities) {
      const caps = data.capabilities.toLowerCase()
      if (caps.includes('query')) operations.push('query')
      if (caps.includes('create')) operations.push('create')
      if (caps.includes('update')) operations.push('update')
      if (caps.includes('delete')) operations.push('delete')
      if (caps.includes('editing')) operations.push('editing')
    }

    if (data.supportedQueryFormats) operations.push('query')
    if (data.hasAttachments) operations.push('attachments')

    return operations
  }

  /**
   * Test if a service URL is accessible
   */
  async testServiceConnection(serviceUrl: string, token?: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.fetchServiceCapabilities(serviceUrl, token)
      return {
        success: true,
        message: 'Successfully connected to ArcGIS service'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to service'
      }
    }
  }

  /**
   * Build ArcGIS REST API query URL
   */
  buildQueryUrl(serviceUrl: string, params: Record<string, any> = {}): string {
    const url = new URL(serviceUrl.replace(/\/$/, '') + '/query')

    // Default parameters
    const defaultParams = {
      f: 'json',
      where: '1=1',
      outFields: '*',
      returnGeometry: true,
      spatialRel: 'esriSpatialRelIntersects'
    }

    // Merge parameters
    const allParams = { ...defaultParams, ...params }

    Object.entries(allParams).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })

    return url.toString()
  }

  /**
   * Query features from ArcGIS Feature Layer
   */
  async queryFeatures(serviceUrl: string, options: {
    where?: string
    geometry?: any
    spatialRel?: string
    outFields?: string[]
    returnGeometry?: boolean
    token?: string
  } = {}): Promise<any> {
    try {
      const params: Record<string, any> = {
        where: options.where || '1=1',
        outFields: options.outFields?.join(',') || '*',
        returnGeometry: options.returnGeometry !== false,
        spatialRel: options.spatialRel || 'esriSpatialRelIntersects',
        f: 'json'
      }

      if (options.geometry) {
        params.geometry = JSON.stringify(options.geometry)
        params.geometryType = 'esriGeometryEnvelope'
      }

      if (options.token) {
        params.token = options.token
      }

      const queryUrl = this.buildQueryUrl(serviceUrl, params)
      const response = await fetch(queryUrl)

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`ArcGIS Query Error: ${data.error.message}`)
      }

      return data
    } catch (error) {
      logger.error('Error querying ArcGIS features:', { error })
      throw error
    }
  }

  /**
   * Get tile URL for ArcGIS tile layers
   */
  getTileUrl(serviceUrl: string, level: number, row: number, col: number, token?: string): string {
    const baseUrl = serviceUrl.replace(/\/$/, '')
    let url = `${baseUrl}/tile/${level}/${row}/${col}`

    if (token) {
      url += `?token=${token}`
    }

    return url
  }

  /**
   * Get export image URL for ArcGIS dynamic map services
   */
  getExportImageUrl(serviceUrl: string, bbox: number[], width: number, height: number, options: {
    layers?: string
    layerDefs?: string
    transparent?: boolean
    format?: string
    token?: string
  } = {}): string {
    const url = new URL(serviceUrl.replace(/\/$/, '') + '/export')

    url.searchParams.set('bbox', bbox.join(','))
    url.searchParams.set('size', `${width},${height}`)
    url.searchParams.set('format', options.format || 'png32')
    url.searchParams.set('transparent', String(options.transparent !== false))
    url.searchParams.set('f', 'image')
    url.searchParams.set('bboxSR', '4326')
    url.searchParams.set('imageSR', '3857')

    if (options.layers) {
      url.searchParams.set('layers', options.layers)
    }

    if (options.layerDefs) {
      url.searchParams.set('layerDefs', options.layerDefs)
    }

    if (options.token) {
      url.searchParams.set('token', options.token)
    }

    return url.toString()
  }

  /**
   * Convert ArcGIS extent to Azure Maps bounding box
   */
  convertExtentToBBox(extent: { xmin: number; ymin: number; xmax: number; ymax: number }): [number, number, number, number] {
    return [extent.xmin, extent.ymin, extent.xmax, extent.ymax]
  }

  /**
   * Parse ArcGIS feature to GeoJSON
   */
  featureToGeoJSON(feature: any): GeoJSON.Feature {
    return {
      type: 'Feature',
      geometry: this.geometryToGeoJSON(feature.geometry),
      properties: feature.attributes || {}
    }
  }

  /**
   * Convert ArcGIS geometry to GeoJSON geometry
   */
  private geometryToGeoJSON(geometry: any): GeoJSON.Geometry {
    if (!geometry) {
      return { type: 'Point', coordinates: [0, 0] }
    }

    if (geometry.x !== undefined && geometry.y !== undefined) {
      return {
        type: 'Point',
        coordinates: [geometry.x, geometry.y]
      }
    }

    if (geometry.paths) {
      return {
        type: geometry.paths.length === 1 ? 'LineString' : 'MultiLineString',
        coordinates: geometry.paths.length === 1 ? geometry.paths[0] : geometry.paths
      }
    }

    if (geometry.rings) {
      return {
        type: geometry.rings.length === 1 ? 'Polygon' : 'MultiPolygon',
        coordinates: geometry.rings.length === 1 ? [geometry.rings[0]] : [geometry.rings]
      }
    }

    return { type: 'Point', coordinates: [0, 0] }
  }
}

export const arcgisService = new ArcGISService()
