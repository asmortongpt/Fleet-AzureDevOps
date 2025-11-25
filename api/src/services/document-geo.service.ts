/**
 * Document Geospatial Service
 *
 * Comprehensive geospatial operations for documents:
 * - Location extraction from documents (EXIF, addresses)
 * - Geocoding and reverse geocoding
 * - Spatial queries (proximity, polygon, route)
 * - Geofencing and clustering
 * - Heatmap generation
 *
 * Integrates with multiple geocoding providers:
 * - Google Maps Geocoding API
 * - Mapbox Geocoding API
 * - ArcGIS Geocoding Service
 * - OpenStreetMap Nominatim (free, no API key)
 */

import pool from '../config/database'

// Optional EXIF parser for image metadata extraction
let ExifParser: any = null

// Lazy load optional EXIF parser
async function loadExifParser() {
  if (ExifParser) return

  try {
    const exifModule = await import('exif-parser')
    ExifParser = exifModule.default
  } catch (err) {
    console.warn('exif-parser not available - install exif-parser for image location extraction from EXIF data')
  }
}

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface GeoLocation {
  lat: number
  lng: number
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  accuracy?: string
  source?: 'exif' | 'address' | 'manual' | 'geocoded'
}

export interface GeocodingResult {
  lat: number
  lng: number
  formatted_address: string
  address_components: {
    city?: string
    state?: string
    country?: string
    postal_code?: string
    street?: string
  }
  accuracy: string
  provider: string
}

export interface DocumentGeoData {
  document_id: string
  file_name: string
  location?: GeoLocation
  distance_meters?: number
}

export interface ProximitySearchOptions {
  categoryId?: string
  tags?: string[]
  limit?: number
  minDistance?: number
  maxDistance?: number
}

export interface PolygonSearchOptions {
  categoryId?: string
  tags?: string[]
  limit?: number
}

export interface RouteSearchOptions {
  bufferMeters?: number
  categoryId?: string
  limit?: number
}

export interface ClusterResult {
  cluster_id: number
  center_lat: number
  center_lng: number
  document_count: number
  documents: DocumentGeoData[]
}

export interface HeatmapCell {
  lat: number
  lng: number
  intensity: number
  document_count: number
}

// ============================================================================
// Document Geo Service
// ============================================================================

export class DocumentGeoService {
  private geocodingProvider: 'nominatim' | 'google' | 'mapbox' | 'arcgis'
  private geocodingApiKey?: string
  private geocodeCache: Map<string, GeocodingResult>

  constructor() {
    // Default to free Nominatim provider (no API key required)
    this.geocodingProvider = (process.env.GEOCODING_PROVIDER as any) || 'nominatim'
    this.geocodingApiKey = process.env.GEOCODING_API_KEY
    this.geocodeCache = new Map()
  }

  // ============================================================================
  // Location Extraction
  // ============================================================================

  /**
   * Extract geolocation from document (EXIF data or content)
   */
  async extractLocation(documentId: string, filePath: string, fileType: string): Promise<GeoLocation | null> {
    try {
      // Extract from EXIF for images
      if (this.isImageFile(fileType)) {
        const exifLocation = await this.extractExifLocation(filePath)
        if (exifLocation) {
          await this.updateDocumentLocation(documentId, exifLocation)
          return exifLocation
        }
      }

      // Extract from text content (addresses)
      const textLocation = await this.extractTextLocation(documentId)
      if (textLocation) {
        return textLocation
      }

      return null
    } catch (error) {
      console.error('Error extracting location from document:', error)
      return null
    }
  }

  /**
   * Extract GPS coordinates from EXIF data
   */
  private async extractExifLocation(filePath: string): Promise<GeoLocation | null> {
    try {
      // Load EXIF parser if not already loaded
      await loadExifParser()

      if (!ExifParser) {
        console.warn('EXIF parser not available - cannot extract location from image')
        return null
      }

      const fs = await import('fs/promises')
      const buffer = await fs.readFile(filePath)

      const parser = ExifParser.create(buffer)
      const result = parser.parse()

      if (result.tags?.GPSLatitude && result.tags?.GPSLongitude) {
        const lat = result.tags.GPSLatitude
        const lng = result.tags.GPSLongitude

        // Reverse geocode to get address
        const address = await this.reverseGeocode(lat, lng)

        return {
          lat,
          lng,
          address: address?.formatted_address,
          city: address?.address_components.city,
          state: address?.address_components.state,
          country: address?.address_components.country,
          postal_code: address?.address_components.postal_code,
          accuracy: 'high',
          source: 'exif'
        }
      }

      return null
    } catch (error) {
      console.error('Error extracting EXIF location:', error)
      return null
    }
  }

  /**
   * Extract addresses from document text using pattern matching
   */
  private async extractTextLocation(documentId: string): Promise<GeoLocation | null> {
    try {
      const result = await pool.query(
        `SELECT extracted_text FROM documents WHERE id = $1',
        [documentId]
      )

      if (!result.rows[0]?.extracted_text) {
        return null
      }

      const text = result.rows[0].extracted_text
      const addresses = this.findAddressesInText(text)

      if (addresses.length > 0) {
        // Geocode the first address found
        const geocoded = await this.geocode(addresses[0])
        if (geocoded) {
          const location: GeoLocation = {
            lat: geocoded.lat,
            lng: geocoded.lng,
            address: geocoded.formatted_address,
            city: geocoded.address_components.city,
            state: geocoded.address_components.state,
            country: geocoded.address_components.country,
            postal_code: geocoded.address_components.postal_code,
            accuracy: geocoded.accuracy,
            source: 'address'
          }

          await this.updateDocumentLocation(documentId, location)
          return location
        }
      }

      return null
    } catch (error) {
      console.error('Error extracting text location:', error)
      return null
    }
  }

  /**
   * Find addresses in text using regex patterns
   */
  private findAddressesInText(text: string): string[] {
    const addresses: string[] = []

    // US address pattern: street number, street name, city, state zip
    const usAddressPattern = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Plaza|Pkwy|Parkway)[,\s]+[\w\s]+,\s*[A-Z]{2}\s+\d{5}/gi
    const usMatches = text.match(usAddressPattern)
    if (usMatches) {
      addresses.push(...usMatches)
    }

    // Coordinate pattern: lat, lng
    const coordPattern = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/g
    const coordMatches = text.matchAll(coordPattern)
    for (const match of coordMatches) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        addresses.push(`${lat}, ${lng}`)
      }
    }

    return addresses
  }

  // ============================================================================
  // Geocoding Services
  // ============================================================================

  /**
   * Geocode an address to coordinates
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    // Check cache first
    const cacheKey = `geocode:${address}`
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!
    }

    try {
      let result: GeocodingResult | null = null

      switch (this.geocodingProvider) {
        case 'nominatim':
          result = await this.geocodeNominatim(address)
          break
        case 'google':
          result = await this.geocodeGoogle(address)
          break
        case 'mapbox':
          result = await this.geocodeMapbox(address)
          break
        case 'arcgis':
          result = await this.geocodeArcGIS(address)
          break
      }

      if (result) {
        this.geocodeCache.set(cacheKey, result)
      }

      return result
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    const cacheKey = `reverse:${lat},${lng}`
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!
    }

    try {
      let result: GeocodingResult | null = null

      switch (this.geocodingProvider) {
        case 'nominatim':
          result = await this.reverseGeocodeNominatim(lat, lng)
          break
        case 'google':
          result = await this.reverseGeocodeGoogle(lat, lng)
          break
        case 'mapbox':
          result = await this.reverseGeocodeMapbox(lat, lng)
          break
        case 'arcgis':
          result = await this.reverseGeocodeArcGIS(lat, lng)
          break
      }

      if (result) {
        this.geocodeCache.set(cacheKey, result)
      }

      return result
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  /**
   * Geocode using OpenStreetMap Nominatim (free, no API key)
   */
  private async geocodeNominatim(address: string): Promise<GeocodingResult | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Fleet-Management-System/1.0'
      }
    })

    const data = await response.json()

    if (!data || data.length === 0) {
      return null
    }

    const result = data[0]

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name,
      address_components: this.parseNominatimAddress(result.address),
      accuracy: result.importance > 0.5 ? 'high' : 'medium',
      provider: 'nominatim'
    }
  }

  /**
   * Reverse geocode using Nominatim
   */
  private async reverseGeocodeNominatim(lat: number, lng: number): Promise<GeocodingResult | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Fleet-Management-System/1.0'
      }
    })

    const result = await response.json()

    if (!result) {
      return null
    }

    return {
      lat,
      lng,
      formatted_address: result.display_name,
      address_components: this.parseNominatimAddress(result.address),
      accuracy: 'high',
      provider: 'nominatim'
    }
  }

  /**
   * Parse Nominatim address components
   */
  private parseNominatimAddress(address: any): GeocodingResult['address_components'] {
    return {
      city: address.city || address.town || address.village,
      state: address.state,
      country: address.country,
      postal_code: address.postcode,
      street: address.road
    }
  }

  /**
   * Geocode using Google Maps (requires API key)
   */
  private async geocodeGoogle(address: string): Promise<GeocodingResult | null> {
    if (!this.geocodingApiKey) {
      throw new Error('Google Maps API key not configured')
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.geocodingApiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null
    }

    const result = data.results[0]
    const location = result.geometry.location

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      address_components: this.parseGoogleAddressComponents(result.address_components),
      accuracy: result.geometry.location_type === 'ROOFTOP' ? 'high' : 'medium',
      provider: 'google'
    }
  }

  /**
   * Reverse geocode using Google Maps
   */
  private async reverseGeocodeGoogle(lat: number, lng: number): Promise<GeocodingResult | null> {
    if (!this.geocodingApiKey) {
      throw new Error('Google Maps API key not configured')
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.geocodingApiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null
    }

    const result = data.results[0]

    return {
      lat,
      lng,
      formatted_address: result.formatted_address,
      address_components: this.parseGoogleAddressComponents(result.address_components),
      accuracy: 'high',
      provider: 'google'
    }
  }

  /**
   * Parse Google address components
   */
  private parseGoogleAddressComponents(components: any[]): GeocodingResult['address_components'] {
    const result: any = {}

    for (const comp of components) {
      if (comp.types.includes('locality')) {
        result.city = comp.long_name
      } else if (comp.types.includes('administrative_area_level_1')) {
        result.state = comp.short_name
      } else if (comp.types.includes('country')) {
        result.country = comp.long_name
      } else if (comp.types.includes('postal_code')) {
        result.postal_code = comp.long_name
      } else if (comp.types.includes('route')) {
        result.street = comp.long_name
      }
    }

    return result
  }

  /**
   * Geocode using Mapbox (requires API key)
   */
  private async geocodeMapbox(address: string): Promise<GeocodingResult | null> {
    if (!this.geocodingApiKey) {
      throw new Error('Mapbox API key not configured')
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.geocodingApiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return null
    }

    const result = data.features[0]
    const [lng, lat] = result.center

    return {
      lat,
      lng,
      formatted_address: result.place_name,
      address_components: this.parseMapboxContext(result.context),
      accuracy: result.relevance > 0.9 ? 'high' : 'medium',
      provider: 'mapbox'
    }
  }

  /**
   * Reverse geocode using Mapbox
   */
  private async reverseGeocodeMapbox(lat: number, lng: number): Promise<GeocodingResult | null> {
    if (!this.geocodingApiKey) {
      throw new Error('Mapbox API key not configured')
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.geocodingApiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return null
    }

    const result = data.features[0]

    return {
      lat,
      lng,
      formatted_address: result.place_name,
      address_components: this.parseMapboxContext(result.context),
      accuracy: 'high',
      provider: 'mapbox'
    }
  }

  /**
   * Parse Mapbox context
   */
  private parseMapboxContext(context: any[]): GeocodingResult['address_components'] {
    const result: any = {}

    if (!context) return result

    for (const ctx of context) {
      if (ctx.id.startsWith('place')) {
        result.city = ctx.text
      } else if (ctx.id.startsWith('region')) {
        result.state = ctx.short_code?.split('-')[1]
      } else if (ctx.id.startsWith('country')) {
        result.country = ctx.text
      } else if (ctx.id.startsWith('postcode')) {
        result.postal_code = ctx.text
      }
    }

    return result
  }

  /**
   * Geocode using ArcGIS (requires API key)
   */
  private async geocodeArcGIS(address: string): Promise<GeocodingResult | null> {
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(address)}&f=json`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      return null
    }

    const result = data.candidates[0]

    return {
      lat: result.location.y,
      lng: result.location.x,
      formatted_address: result.address,
      address_components: {
        city: result.attributes.City,
        state: result.attributes.Region,
        country: result.attributes.Country,
        postal_code: result.attributes.Postal
      },
      accuracy: result.score > 90 ? 'high' : 'medium',
      provider: 'arcgis'
    }
  }

  /**
   * Reverse geocode using ArcGIS
   */
  private async reverseGeocodeArcGIS(lat: number, lng: number): Promise<GeocodingResult | null> {
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lng},${lat}&f=json`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.address) {
      return null
    }

    return {
      lat,
      lng,
      formatted_address: data.address.Match_addr,
      address_components: {
        city: data.address.City,
        state: data.address.Region,
        country: data.address.CountryCode,
        postal_code: data.address.Postal
      },
      accuracy: 'high',
      provider: 'arcgis'
    }
  }

  // ============================================================================
  // Spatial Queries
  // ============================================================================

  /**
   * Find documents within radius of a point
   */
  async findDocumentsNearby(
    tenantId: string,
    lat: number,
    lng: number,
    radiusMeters: number,
    options?: ProximitySearchOptions
  ): Promise<DocumentGeoData[]> {
    let query = `
      SELECT
        d.id as document_id,
        d.file_name,
        d.location_coordinates_lat as lat,
        d.location_coordinates_lng as lng,
        d.location_address as address,
        d.location_city as city,
        d.location_state as state,
        ST_Distance(
          d.location::geography,
          ST_MakePoint($2, $1)::geography
        ) as distance_meters
      FROM documents d
      WHERE d.tenant_id = $3
      AND d.location IS NOT NULL
      AND d.status = 'active'
      AND ST_DWithin(
        d.location::geography,
        ST_MakePoint($2, $1)::geography,
        $4
      )
    `

    const params: any[] = [lat, lng, tenantId, radiusMeters]
    let paramCount = 4

    if (options?.categoryId) {
      paramCount++
      query += ` AND d.category_id = $${paramCount}`
      params.push(options.categoryId)
    }

    if (options?.tags && options.tags.length > 0) {
      paramCount++
      query += ` AND d.tags && $${paramCount}`
      params.push(options.tags)
    }

    if (options?.minDistance) {
      paramCount++
      query += ` AND ST_Distance(d.location::geography, ST_MakePoint($2, $1)::geography) >= $${paramCount}`
      params.push(options.minDistance)
    }

    query += ` ORDER BY distance_meters ASC`

    if (options?.limit) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(options.limit)
    }

    const result = await pool.query(query, params)

    return result.rows.map(row => ({
      document_id: row.document_id,
      file_name: row.file_name,
      location: {
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        address: row.address,
        city: row.city,
        state: row.state
      },
      distance_meters: parseFloat(row.distance_meters)
    }))
  }

  /**
   * Find documents within a polygon
   */
  async findDocumentsInPolygon(
    tenantId: string,
    polygon: any, // GeoJSON polygon
    options?: PolygonSearchOptions
  ): Promise<DocumentGeoData[]> {
    let query = `
      SELECT
        d.id as document_id,
        d.file_name,
        d.location_coordinates_lat as lat,
        d.location_coordinates_lng as lng,
        d.location_address as address
      FROM documents d
      WHERE d.tenant_id = $1
      AND d.location IS NOT NULL
      AND d.status = 'active'
      AND ST_Within(
        d.location::geometry,
        ST_GeomFromGeoJSON($2)
      )
    `

    const params: any[] = [tenantId, JSON.stringify(polygon)]
    let paramCount = 2

    if (options?.categoryId) {
      paramCount++
      query += ` AND d.category_id = $${paramCount}`
      params.push(options.categoryId)
    }

    if (options?.tags && options.tags.length > 0) {
      paramCount++
      query += ` AND d.tags && $${paramCount}`
      params.push(options.tags)
    }

    query += ` ORDER BY d.created_at DESC`

    if (options?.limit) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(options.limit)
    }

    const result = await pool.query(query, params)

    return result.rows.map(row => ({
      document_id: row.document_id,
      file_name: row.file_name,
      location: {
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        address: row.address
      }
    }))
  }

  /**
   * Find documents along a route
   */
  async findDocumentsAlongRoute(
    tenantId: string,
    waypoints: Array<{ lat: number; lng: number }>,
    options?: RouteSearchOptions
  ): Promise<DocumentGeoData[]> {
    const bufferMeters = options?.bufferMeters || 1000

    // Create LineString from waypoints
    const coordinates = waypoints.map(wp => `${wp.lng} ${wp.lat}`).join(', ')
    const linestring = `LINESTRING(${coordinates})`

    let query = `
      SELECT
        d.id as document_id,
        d.file_name,
        d.location_coordinates_lat as lat,
        d.location_coordinates_lng as lng,
        d.location_address as address,
        ST_Distance(
          d.location::geography,
          ST_GeomFromText($2, 4326)::geography
        ) as distance_meters
      FROM documents d
      WHERE d.tenant_id = $1
      AND d.location IS NOT NULL
      AND d.status = 'active'
      AND ST_DWithin(
        d.location::geography,
        ST_GeomFromText($2, 4326)::geography,
        $3
      )
    `

    const params: any[] = [tenantId, linestring, bufferMeters]
    let paramCount = 3

    if (options?.categoryId) {
      paramCount++
      query += ` AND d.category_id = $${paramCount}`
      params.push(options.categoryId)
    }

    query += ` ORDER BY distance_meters ASC`

    if (options?.limit) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(options.limit)
    }

    const result = await pool.query(query, params)

    return result.rows.map(row => ({
      document_id: row.document_id,
      file_name: row.file_name,
      location: {
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        address: row.address
      },
      distance_meters: parseFloat(row.distance_meters)
    }))
  }

  /**
   * Get document density heatmap
   */
  async getDocumentHeatmap(
    tenantId: string,
    gridSizeMeters: number = 1000
  ): Promise<HeatmapCell[]> {
    const query = `
      WITH gridded_docs AS (
        SELECT
          ST_SnapToGrid(location::geometry, $2) as grid,
          id
        FROM documents
        WHERE tenant_id = $1
        AND location IS NOT NULL
        AND status = 'active'
      )
      SELECT
        ST_Y(ST_Centroid(grid))::DECIMAL as lat,
        ST_X(ST_Centroid(grid))::DECIMAL as lng,
        COUNT(*)::INTEGER as document_count
      FROM gridded_docs
      GROUP BY grid
      HAVING COUNT(*) > 0
      ORDER BY document_count DESC
    `

    const result = await pool.query(query, [tenantId, gridSizeMeters])

    const maxCount = result.rows.length > 0 ? Math.max(...result.rows.map(r => r.document_count)) : 1

    return result.rows.map(row => ({
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      intensity: row.document_count / maxCount,
      document_count: row.document_count
    }))
  }

  /**
   * Cluster documents by geographic proximity
   */
  async clusterDocuments(
    tenantId: string,
    clusterDistance: number = 5000 // meters
  ): Promise<ClusterResult[]> {
    const query = `
      WITH clustered AS (
        SELECT
          id,
          file_name,
          location_coordinates_lat as lat,
          location_coordinates_lng as lng,
          location_address,
          ST_ClusterDBSCAN(location::geometry, eps := $2, minpoints := 1) OVER () as cluster_id
        FROM documents
        WHERE tenant_id = $1
        AND location IS NOT NULL
        AND status = 'active'
      )
      SELECT
        cluster_id,
        AVG(lat)::DECIMAL as center_lat,
        AVG(lng)::DECIMAL as center_lng,
        COUNT(*)::INTEGER as document_count,
        json_agg(
          json_build_object(
            'document_id', id,
            'file_name', file_name,
            'location', json_build_object(
              'lat', lat,
              'lng', lng,
              'address', location_address
            )
          )
        ) as documents
      FROM clustered
      WHERE cluster_id IS NOT NULL
      GROUP BY cluster_id
      ORDER BY document_count DESC
    `

    const result = await pool.query(query, [tenantId, clusterDistance / 111320]) // Convert meters to degrees (approximate)

    return result.rows.map(row => ({
      cluster_id: row.cluster_id,
      center_lat: parseFloat(row.center_lat),
      center_lng: parseFloat(row.center_lng),
      document_count: row.document_count,
      documents: row.documents
    }))
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Update document location in database
   */
  private async updateDocumentLocation(documentId: string, location: GeoLocation): Promise<void> {
    await pool.query(
      `UPDATE documents
       SET
         location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
         location_coordinates_lat = $3,
         location_coordinates_lng = $2,
         location_address = $4,
         location_city = $5,
         location_state = $6,
         location_country = $7,
         location_postal_code = $8,
         geo_accuracy = $9,
         geo_source = $10,
         geo_extracted_at = NOW()
       WHERE id = $1',
      [
        documentId,
        location.lng,
        location.lat,
        location.address,
        location.city,
        location.state,
        location.country,
        location.postal_code,
        location.accuracy,
        location.source
      ]
    )
  }

  /**
   * Check if file is an image
   */
  private isImageFile(fileType: string): boolean {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'].includes(fileType.toLowerCase())
  }

  /**
   * Manually set document location
   */
  async setDocumentLocation(documentId: string, lat: number, lng: number): Promise<void> {
    const address = await this.reverseGeocode(lat, lng)

    const location: GeoLocation = {
      lat,
      lng,
      address: address?.formatted_address,
      city: address?.address_components.city,
      state: address?.address_components.state,
      country: address?.address_components.country,
      postal_code: address?.address_components.postal_code,
      accuracy: 'high',
      source: 'manual'
    }

    await this.updateDocumentLocation(documentId, location)
  }

  /**
   * Get all geolocated documents for a tenant
   */
  async getGeolocatedDocuments(tenantId: string): Promise<DocumentGeoData[]> {
    const query = `
      SELECT
        id as document_id,
        file_name,
        location_coordinates_lat as lat,
        location_coordinates_lng as lng,
        location_address as address,
        location_city as city,
        location_state as state
      FROM documents
      WHERE tenant_id = $1
      AND location IS NOT NULL
      AND status = 'active'
      ORDER BY created_at DESC
    `

    const result = await pool.query(query, [tenantId])

    return result.rows.map(row => ({
      document_id: row.document_id,
      file_name: row.file_name,
      location: {
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        address: row.address,
        city: row.city,
        state: row.state
      }
    }))
  }
}

export default new DocumentGeoService()
