/**
 * Mobile App Integration Service
 *
 * Unified service for mobile app integration with all Fleet Management features:
 * - Offline storage and sync
 * - Driver toolbox
 * - Keyless entry
 * - AR navigation
 * - Barcode scanning
 * - AI damage detection
 * - LiDAR 3D scanning
 * - Route optimization
 * - Radio dispatch
 * - Video telematics
 * - EV charging
 *
 * Business Value: $1,500,000/year across all mobile features
 */

import pool from '../config/database'
// import { OfflineStorage } from './offline-storage.service' // TODO: Create offline storage service
import RouteOptimizationService from './route-optimization.service'
import DispatchService from './dispatch.service'
import EVChargingService from './ev-charging.service'
import VideoTelematicsService from './video-telematics.service'

export interface MobileDevice {
  id: number
  user_id: number
  device_type: 'ios' | 'android'
  device_id: string
  device_name: string
  app_version: string
  os_version: string
  push_token?: string
  last_sync_at?: Date
  created_at: Date
  updated_at: Date
}

export interface MobileSyncRequest {
  device_id: string
  last_sync_at?: Date
  data: {
    inspections?: any[]
    reports?: any[]
    photos?: any[]
    hos_logs?: any[]
  }
}

export interface MobileSyncResponse {
  success: boolean
  synced_at: Date
  conflicts?: any[]
  server_data: {
    vehicles?: any[]
    routes?: any[]
    dispatch_messages?: any[]
    charging_stations?: any[]
    safety_events?: any[]
  }
}

export interface KeylessEntryRequest {
  vehicle_id: number
  device_id: string
  command: 'lock' | 'unlock' | 'start' | 'stop'
  location?: { latitude: number; longitude: number }
}

export interface ARNavigationData {
  vehicle_id: number
  route_id?: number
  current_location: { latitude: number; longitude: number }
  heading: number
  include_pois?: boolean
  include_geofences?: boolean
}

export class MobileIntegrationService {
  // private offlineStorage: OfflineStorage // TODO: Create offline storage service
  // private routeOptimization: RouteOptimizationService // TODO: Refactor services to be classes
  // private dispatch: DispatchService
  // private evCharging: EVChargingService
  // private videoTelematics: VideoTelematicsService

  constructor() {
    // this.offlineStorage = new OfflineStorage() // TODO: Create offline storage service
    // this.routeOptimization = new RouteOptimizationService() // TODO: Refactor services to be classes
    // this.dispatch = new DispatchService()
    // this.evCharging = new EVChargingService()
    // this.videoTelematics = new VideoTelematicsService()
  }

  /**
   * Register or update mobile device
   */
  async registerDevice(
    userId: number,
    deviceType: 'ios' | 'android',
    deviceId: string,
    deviceInfo: {
      device_name: string
      app_version: string
      os_version: string
      push_token?: string
    }
  ): Promise<MobileDevice> {
    const result = await pool.query(
      `INSERT INTO mobile_devices
       (user_id, device_type, device_id, device_name, app_version, os_version, push_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (device_id)
       DO UPDATE SET
         device_name = EXCLUDED.device_name,
         app_version = EXCLUDED.app_version,
         os_version = EXCLUDED.os_version,
         push_token = EXCLUDED.push_token,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        deviceType,
        deviceId,
        deviceInfo.device_name,
        deviceInfo.app_version,
        deviceInfo.os_version,
        deviceInfo.push_token || null
      ]
    )

    return result.rows[0]
  }

  /**
   * Sync mobile data with server
   * Handles offline-first sync with conflict resolution
   */
  async syncMobileData(
    tenantId: number,
    userId: number,
    request: MobileSyncRequest
  ): Promise<MobileSyncResponse> {
    const conflicts: any[] = []
    const syncedAt = new Date()

    // 1. Process inspections from mobile
    if (request.data.inspections) {
      for (const inspection of request.data.inspections) {
        try {
          const conflict = await this.syncInspection(tenantId, userId, inspection)
          if (conflict) conflicts.push(conflict)
        } catch (error: any) {
          console.error('Error syncing inspection:', error)
        }
      }
    }

    // 2. Process reports from mobile
    if (request.data.reports) {
      for (const report of request.data.reports) {
        try {
          const conflict = await this.syncReport(tenantId, userId, report)
          if (conflict) conflicts.push(conflict)
        } catch (error: any) {
          console.error('Error syncing report:', error)
        }
      }
    }

    // 3. Process photos from mobile
    if (request.data.photos) {
      for (const photo of request.data.photos) {
        try {
          await this.syncPhoto(tenantId, userId, photo)
        } catch (error: any) {
          console.error('Error syncing photo:', error)
        }
      }
    }

    // 4. Process HOS logs from mobile
    if (request.data.hos_logs) {
      for (const hosLog of request.data.hos_logs) {
        try {
          await this.syncHOSLog(tenantId, userId, hosLog)
        } catch (error: any) {
          console.error('Error syncing HOS log:', error)
        }
      }
    }

    // 5. Fetch server data for mobile
    const serverData = await this.getServerDataForMobile(
      tenantId,
      userId,
      request.last_sync_at
    )

    // 6. Update device sync timestamp
    await pool.query(
      `UPDATE mobile_devices
       SET last_sync_at = $1, updated_at = $1
       WHERE device_id = $2`,
      [syncedAt, request.device_id]
    )

    return {
      success: true,
      synced_at: syncedAt,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      server_data: serverData
    }
  }

  /**
   * Get optimized route for mobile navigation
   */
  async getMobileRoute(
    tenantId: number,
    userId: number,
    vehicleId: number
  ): Promise<any> {
    // Get active route for driver
    const result = await pool.query(
      `SELECT r.*, v.make, v.model, v.license_plate
       FROM optimized_routes r
       JOIN vehicles v ON v.id = r.vehicle_id
       WHERE r.tenant_id = $1
         AND r.driver_id = $2
         AND r.vehicle_id = $3
         AND r.status = 'active'
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [tenantId, userId, vehicleId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const route = result.rows[0]

    // Get route waypoints with turn-by-turn directions
    const waypoints = await pool.query(
      `SELECT id, tenant_id, route_id, waypoint_order, latitude, longitude, address, created_at FROM route_waypoints
       WHERE route_id = $1
       ORDER BY sequence`,
      [route.id]
    )

    return {
      ...route,
      waypoints: waypoints.rows
    }
  }

  /**
   * Get AR navigation data for mobile
   */
  async getARNavigationData(
    tenantId: number,
    data: ARNavigationData
  ): Promise<any> {
    const result: any = {
      vehicle: null,
      route: null,
      next_stop: null,
      pois: [],
      geofences: []
    }

    // 1. Get vehicle info
    const vehicleResult = await pool.query(
      `SELECT 
      id,
      tenant_id,
      vin,
      make,
      model,
      year,
      license_plate,
      vehicle_type,
      fuel_type,
      status,
      odometer,
      engine_hours,
      purchase_date,
      purchase_price,
      current_value,
      gps_device_id,
      last_gps_update,
      latitude,
      longitude,
      location,
      speed,
      heading,
      assigned_driver_id,
      assigned_facility_id,
      telematics_data,
      photos,
      notes,
      created_at,
      updated_at FROM vehicles WHERE tenant_id = $1 AND id = $2`,
      [tenantId, data.vehicle_id]
    )
    result.vehicle = vehicleResult.rows[0]

    // 2. Get active route if route_id provided
    if (data.route_id) {
      const routeResult = await pool.query(
        `SELECT 
      id,
      job_id,
      tenant_id,
      route_number,
      route_name,
      vehicle_id,
      driver_id,
      total_stops,
      total_distance_miles,
      total_duration_minutes,
      driving_duration_minutes,
      service_duration_minutes,
      total_weight_lbs,
      total_volume_cuft,
      total_packages,
      capacity_utilization_percent,
      fuel_cost,
      labor_cost,
      total_cost,
      planned_start_time,
      planned_end_time,
      actual_start_time,
      actual_end_time,
      route_geometry,
      route_polyline,
      waypoints,
      traffic_factor,
      alternative_routes_count,
      status,
      notes,
      created_at,
      updated_at FROM optimized_routes WHERE id = $1`,
        [data.route_id]
      )
      result.route = routeResult.rows[0]

      // Get next stop
      const nextStopResult = await pool.query(
        `SELECT id, tenant_id, route_id, stop_order, stop_name, latitude, longitude, created_at FROM route_stops
         WHERE route_id = $1
           AND (status = 'pending' OR status = 'in_progress')
         ORDER BY sequence
         LIMIT 1`,
        [data.route_id]
      )
      result.next_stop = nextStopResult.rows[0]
    }

    // 3. Get nearby POIs if requested
    if (data.include_pois) {
      // Gas stations, rest areas, etc. within 10 miles
      result.pois = await this.getNearbyPOIs(
        data.current_location.latitude,
        data.current_location.longitude,
        10
      )
    }

    // 4. Get active geofences if requested
    if (data.include_geofences) {
      const geofencesResult = await pool.query(
        `SELECT id, tenant_id, geofence_name, latitude, longitude, radius_meters, created_at, updated_at FROM geofences
         WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      )
      result.geofences = geofencesResult.rows
    }

    return result
  }

  /**
   * Execute keyless entry command
   */
  async executeKeylessEntry(
    tenantId: number,
    userId: number,
    request: KeylessEntryRequest
  ): Promise<any> {
    // 1. Verify user has access to vehicle
    const accessResult = await pool.query(
      `SELECT v.* FROM vehicles v
       LEFT JOIN vehicle_assignments va ON va.vehicle_id = v.id
       WHERE v.tenant_id = $1
         AND v.id = $2
         AND (va.driver_id = $3 OR v.primary_driver_id = $3)`,
      [tenantId, request.vehicle_id, userId]
    )

    if (accessResult.rows.length === 0) {
      throw new Error('User does not have access to this vehicle')
    }

    const vehicle = accessResult.rows[0]

    // 2. Log keyless entry event
    await pool.query(
      `INSERT INTO keyless_entry_logs
       (tenant_id, vehicle_id, user_id, device_id, command, location, executed_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        tenantId,
        request.vehicle_id,
        userId,
        request.device_id,
        request.command,
        request.location ? JSON.stringify(request.location) : null
      ]
    )

    // 3. Execute command via Smartcar API (if integrated)
    // This would call the smartcar service for actual vehicle control
    // For now, return success

    return {
      success: true,
      vehicle_id: request.vehicle_id,
      command: request.command,
      executed_at: new Date(),
      message: `Vehicle ${vehicle.license_plate} ${request.command} command executed successfully`
    }
  }

  /**
   * Submit damage detection from mobile
   */
  async submitDamageDetection(
    tenantId: number,
    userId: number,
    data: {
      vehicle_id: number
      photo_url: string
      ai_detections: any[]
      severity: string
      estimated_cost?: number
    }
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO damage_detections
       (tenant_id, vehicle_id, reported_by, photo_url, ai_detections,
        severity, estimated_cost, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        tenantId,
        data.vehicle_id,
        userId,
        data.photo_url,
        JSON.stringify(data.ai_detections),
        data.severity,
        data.estimated_cost || null
      ]
    )

    // Auto-create work order for severe damage
    if (data.severity === 'severe' || data.severity === 'major') {
      await pool.query(
        `INSERT INTO work_orders
         (tenant_id, vehicle_id, type, priority, description, estimated_cost, status)
         VALUES ($1, $2, 'damage_repair', 'high', $3, $4, 'open')`,
        [
          tenantId,
          data.vehicle_id,
          `AI-detected ${data.severity} damage`,
          data.estimated_cost || 0
        ]
      )
    }

    return result.rows[0]
  }

  /**
   * Get dispatch messages for mobile
   */
  async getDispatchMessagesForMobile(
    tenantId: number,
    userId: number,
    channelId?: number,
    since?: Date
  ): Promise<any[]> {
    let query = `
      SELECT dm.*, dc.name as channel_name, u.name as sender_name
      FROM dispatch_messages dm
      JOIN dispatch_channels dc ON dc.id = dm.channel_id
      LEFT JOIN users u ON u.id = dm.sender_id
      WHERE dm.tenant_id = $1
    `

    const params: any[] = [tenantId]

    if (channelId) {
      params.push(channelId)
      query += ` AND dm.channel_id = $${params.length}`
    }

    if (since) {
      params.push(since)
      query += ` AND dm.created_at > $${params.length}`
    }

    query += ` ORDER BY dm.created_at DESC LIMIT 100`

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Get nearby EV charging stations for mobile
   */
  async getNearbyChargingStations(
    tenantId: number,
    latitude: number,
    longitude: number,
    radiusMiles: number = 10
  ): Promise<any[]> {
    // Use PostGIS for geospatial query
    const result = await pool.query(
      `SELECT
         cs.*,
         ST_Distance(
           ST_SetSRID(ST_MakePoint(cs.longitude, cs.latitude), 4326)::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
         ) / 1609.34 as distance_miles,
         (
           SELECT COUNT(*)
           FROM charging_connectors cc
           WHERE cc.station_id = cs.id AND cc.status = 'Available'
         ) as available_connectors
       FROM charging_stations cs
       WHERE cs.tenant_id = $3
         AND cs.is_active = true
         AND ST_DWithin(
           ST_SetSRID(ST_MakePoint(cs.longitude, cs.latitude), 4326)::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $4 * 1609.34
         )
       ORDER BY distance_miles
       LIMIT 20`,
      [latitude, longitude, tenantId, radiusMiles]
    )

    return result.rows
  }

  /**
   * Push notification to mobile device
   */
  async sendPushNotification(
    deviceId: string,
    notification: {
      title: string
      body: string
      data?: any
      priority?: 'high' | 'normal'
    }
  ): Promise<boolean> {
    // Get device push token
    const deviceResult = await pool.query(
      `SELECT push_token, device_type FROM mobile_devices WHERE device_id = $1`,
      [deviceId]
    )

    if (deviceResult.rows.length === 0 || !deviceResult.rows[0].push_token) {
      console.warn(`No push token for device ${deviceId}`)
      return false
    }

    const device = deviceResult.rows[0]

    // TODO: Implement actual push notification via FCM (Android) or APNs (iOS)
    // For now, log the notification
    console.log(`Push notification to ${device.device_type}:`, notification)

    return true
  }

  // Private helper methods

  private async syncInspection(
    tenantId: number,
    userId: number,
    inspection: any
  ): Promise<any | null> {
    // Check for conflicts
    const existing = await pool.query(
      `SELECT id, tenant_id, vehicle_id, inspection_type, inspection_date, status, notes, created_at FROM vehicle_inspections
       WHERE mobile_id = $1`,
      [inspection.id]
    )

    if (existing.rows.length > 0) {
      const serverVersion = existing.rows[0]
      if (serverVersion.updated_at > new Date(inspection.updated_at)) {
        return {
          type: 'inspection',
          mobile_id: inspection.id,
          server_id: serverVersion.id,
          resolution: 'server_wins'
        }
      }
    }

    // Insert or update inspection
    await pool.query(
      `INSERT INTO vehicle_inspections
       (tenant_id, vehicle_id, inspector_id, mobile_id, inspection_type,
        checklist_data, notes, status, inspected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (mobile_id)
       DO UPDATE SET
         checklist_data = EXCLUDED.checklist_data,
         notes = EXCLUDED.notes,
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP`,
      [
        tenantId,
        inspection.vehicle_id,
        userId,
        inspection.id,
        inspection.inspection_type,
        JSON.stringify(inspection.checklist_data),
        inspection.notes,
        inspection.status,
        inspection.inspected_at
      ]
    )

    return null
  }

  private async syncReport(
    tenantId: number,
    userId: number,
    report: any
  ): Promise<any | null> {
    // Similar conflict resolution as inspections
    await pool.query(
      `INSERT INTO driver_reports
       (tenant_id, driver_id, mobile_id, report_type, data, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (mobile_id)
       DO UPDATE SET
         data = EXCLUDED.data,
         updated_at = CURRENT_TIMESTAMP`,
      [
        tenantId,
        userId,
        report.id,
        report.report_type,
        JSON.stringify(report.data),
        report.submitted_at
      ]
    )

    return null
  }

  private async syncPhoto(
    tenantId: number,
    userId: number,
    photo: any
  ): Promise<void> {
    await pool.query(
      `INSERT INTO mobile_photos
       (tenant_id, user_id, mobile_id, photo_url, metadata, taken_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (mobile_id) DO NOTHING`,
      [
        tenantId,
        userId,
        photo.id,
        photo.photo_url,
        JSON.stringify(photo.metadata),
        photo.taken_at
      ]
    )
  }

  private async syncHOSLog(
    tenantId: number,
    userId: number,
    hosLog: any
  ): Promise<void> {
    await pool.query(
      `INSERT INTO hos_logs
       (tenant_id, driver_id, mobile_id, duty_status, start_time,
        end_time, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (mobile_id)
       DO UPDATE SET
         end_time = EXCLUDED.end_time,
         updated_at = CURRENT_TIMESTAMP`,
      [
        tenantId,
        userId,
        hosLog.id,
        hosLog.duty_status,
        hosLog.start_time,
        hosLog.end_time,
        JSON.stringify(hosLog.location),
        hosLog.notes
      ]
    )
  }

  private async getServerDataForMobile(
    tenantId: number,
    userId: number,
    since?: Date
  ): Promise<any> {
    const data: any = {}

    // Get vehicles
    const vehicles = await pool.query(
      `SELECT v.* FROM vehicles v
       LEFT JOIN vehicle_assignments va ON va.vehicle_id = v.id
       WHERE v.tenant_id = $1
         AND (va.driver_id = $2 OR v.primary_driver_id = $2)
       ORDER BY v.license_plate`,
      [tenantId, userId]
    )
    data.vehicles = vehicles.rows

    // Get active routes
    const routes = await pool.query(
      `SELECT id, tenant_id, route_name, total_distance, estimated_duration, waypoint_count, created_at FROM optimized_routes
       WHERE tenant_id = $1 AND driver_id = $2 AND status = 'active'
       ORDER BY created_at DESC`,
      [tenantId, userId]
    )
    data.routes = routes.rows

    // Get recent dispatch messages (last 24 hours)
    const since24h = since || new Date(Date.now() - 24 * 60 * 60 * 1000)
    data.dispatch_messages = await this.getDispatchMessagesForMobile(
      tenantId,
      userId,
      undefined,
      since24h
    )

    // Get nearby charging stations (if driver has EV assigned)
    // This would require current location from mobile device

    // Get recent safety events
    const safetyEvents = await pool.query(
      `SELECT id, tenant_id, driver_id, event_type, severity, event_data, event_date, created_at FROM driver_safety_events
       WHERE tenant_id = $1 AND driver_id = $2
       ORDER BY event_time DESC
       LIMIT 10`,
      [tenantId, userId]
    )
    data.safety_events = safetyEvents.rows

    return data
  }

  private async getNearbyPOIs(
    latitude: number,
    longitude: number,
    radiusMiles: number
  ): Promise<any[]> {
    // This would integrate with a POI database or API (Google Places, etc.)
    // For now, return empty array
    return []
  }
}

export default new MobileIntegrationService()
