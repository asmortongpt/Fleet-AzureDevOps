import { pool } from '../config/database'
import { logger } from '../config/logger'
import axios from 'axios'

interface CameraDataSource {
  id: string
  name: string
  source_type: string
  service_url: string
  field_mapping: Record<string, string>
  authentication?: {
    type: string
    token?: string
  }
}

interface ExternalCamera {
  attributes: Record<string, any>
  geometry?: {
    x: number
    y: number
  }
}

export class CameraSyncService {
  /**
   * Sync all enabled camera data sources
   */
  async syncAll(): Promise<void> {
    logger.info('Starting camera sync for all enabled sources')

    try {
      // Get all enabled data sources
      const result = await pool.query(
        `SELECT id, name, source_type, service_url, field_mapping, authentication
         FROM camera_data_sources
         WHERE enabled = true
         ORDER BY name`
      )

      const sources: CameraDataSource[] = result.rows

      logger.info(`Found ${sources.length} enabled camera data sources`)

      for (const source of sources) {
        try {
          await this.syncSource(source)
        } catch (error: any) {
          logger.error(`Failed to sync source ${source.name}`, {
            sourceId: source.id,
            error: error.message
          })

          // Update sync status to failed
          await pool.query(
            `UPDATE camera_data_sources
             SET last_sync_at = NOW(),
                 last_sync_status = 'failed',
                 last_sync_error = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [error.message, source.id]
          )
        }
      }

      logger.info('Camera sync completed for all sources')
    } catch (error: any) {
      logger.error('Fatal error in camera sync', { error: error.message })
      throw error
    }
  }

  /**
   * Sync a single data source
   */
  async syncSource(source: CameraDataSource): Promise<void> {
    logger.info(`Syncing camera source: ${source.name}`, { sourceId: source.id })

    let cameras: ExternalCamera[] = []

    // Fetch cameras based on source type
    if (source.source_type === 'arcgis') {
      cameras = await this.fetchArcGISCameras(source)
    } else {
      throw new Error(`Unsupported source type: ${source.source_type}`)
    }

    logger.info(`Fetched ${cameras.length} cameras from ${source.name}`)

    // Transform and upsert cameras
    let successCount = 0
    for (const camera of cameras) {
      try {
        await this.upsertCamera(source, camera)
        successCount++
      } catch (error: any) {
        logger.error(`Failed to upsert camera`, {
          sourceId: source.id,
          camera: camera.attributes,
          error: error.message
        })
      }
    }

    // Update sync status
    await pool.query(
      `UPDATE camera_data_sources
       SET last_sync_at = NOW(),
           last_sync_status = 'success',
           last_sync_error = NULL,
           total_cameras_synced = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [successCount, source.id]
    )

    logger.info(`Successfully synced ${successCount}/${cameras.length} cameras from ${source.name}`)
  }

  /**
   * Fetch cameras from ArcGIS Feature Service
   */
  private async fetchArcGISCameras(source: CameraDataSource): Promise<ExternalCamera[]> {
    const url = `${source.service_url}/query`
    const params: Record<string, any> = {
      where: '1=1',
      outFields: '*',
      f: 'json',
      returnGeometry: true,
      outSR: 4326 // WGS84
    }

    // Add authentication if configured
    if (source.authentication?.type === 'token' && source.authentication.token) {
      params.token = source.authentication.token
    }

    const response = await axios.get(url, { params, timeout: 30000 })

    if (!response.data || !response.data.features) {
      throw new Error('Invalid ArcGIS response: missing features array')
    }

    return response.data.features
  }

  /**
   * Transform and upsert a single camera
   */
  private async upsertCamera(source: CameraDataSource, camera: ExternalCamera): Promise<void> {
    const mapping = source.field_mapping
    const attrs = camera.attributes

    // Map external fields to our schema
    const cameraData: Record<string, any> = {}

    for (const [externalField, internalField] of Object.entries(mapping)) {
      if (attrs[externalField] !== null && attrs[externalField] !== undefined) {
        cameraData[internalField] = attrs[externalField]
      }
    }

    // Extract coordinates from geometry if available
    if (camera.geometry) {
      cameraData.longitude = camera.geometry.x
      cameraData.latitude = camera.geometry.y
    }

    // Ensure we have required fields
    if (!cameraData.external_id) {
      throw new Error('Camera missing external_id')
    }
    if (!cameraData.name) {
      throw new Error('Camera missing name')
    }

    // Upsert camera
    await pool.query(
      `INSERT INTO traffic_cameras (
        source_id,
        external_id,
        name,
        address,
        cross_street1,
        cross_street2,
        cross_streets,
        camera_url,
        stream_url,
        image_url,
        latitude,
        longitude,
        enabled,
        operational,
        metadata,
        synced_at,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW(), NOW()
      )
      ON CONFLICT (source_id, external_id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        cross_street1 = EXCLUDED.cross_street1,
        cross_street2 = EXCLUDED.cross_street2,
        cross_streets = EXCLUDED.cross_streets,
        camera_url = EXCLUDED.camera_url,
        stream_url = EXCLUDED.stream_url,
        image_url = EXCLUDED.image_url,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        synced_at = NOW(),
        updated_at = NOW()`,
      [
        source.id,
        cameraData.external_id,
        cameraData.name,
        cameraData.address || null,
        cameraData.cross_street1 || null,
        cameraData.cross_street2 || null,
        cameraData.cross_streets || null,
        cameraData.camera_url || null,
        cameraData.stream_url || null,
        cameraData.image_url || null,
        cameraData.latitude || null,
        cameraData.longitude || null,
        true, // enabled
        true, // operational
        JSON.stringify(cameraData.metadata || {})
      ]
    )
  }

  /**
   * Get sync status for all sources
   */
  async getSyncStatus(): Promise<any[]> {
    const result = await pool.query(
      `SELECT
        id,
        name,
        source_type,
        enabled,
        sync_interval_minutes,
        last_sync_at,
        last_sync_status,
        last_sync_error,
        total_cameras_synced
       FROM camera_data_sources
       ORDER BY name`
    )

    return result.rows
  }
}

export const cameraSyncService = new CameraSyncService()
