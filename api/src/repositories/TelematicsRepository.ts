/**
 * TelematicsRepository - Repository for Telematics Integration
 *
 * Provides tenant-safe access to:
 * - telematics_providers
 * - vehicle_telematics_connections
 * - vehicle_telemetry
 * - driver_safety_events
 *
 * All queries enforce tenant_id isolation with parameterized queries
 */

import { injectable } from 'inversify'
import { Pool } from 'pg'

// ============================================================================
// Interfaces
// ============================================================================

export interface TelematicsProvider {
  id: number
  name: string
  display_name: string
  api_endpoint?: string
  supports_webhooks: boolean
  supports_video: boolean
  supports_temperature: boolean
  supports_hos: boolean
  created_at: Date
}

export interface VehicleTelematicsConnection {
  id: number
  vehicle_id: number
  provider_id: number
  external_vehicle_id: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: Date
  last_sync_at?: Date
  sync_status: 'active' | 'disconnected' | 'error' | 'paused'
  sync_error?: string
  metadata?: any
  tenant_id: number
  created_at: Date
  updated_at: Date
}

export interface VehicleTelemetry {
  id: number
  vehicle_id: number
  provider_id?: number
  timestamp: Date
  latitude?: number
  longitude?: number
  heading?: number
  speed_mph?: number
  altitude_ft?: number
  address?: string
  odometer_miles?: number
  fuel_percent?: number
  fuel_gallons?: number
  battery_percent?: number
  battery_voltage_12v?: number
  engine_rpm?: number
  engine_state?: 'on' | 'off' | 'idle'
  engine_hours?: number
  temperature_f?: number
  oil_life_percent?: number
  coolant_temp_f?: number
  is_charging?: boolean
  charge_rate_kw?: number
  estimated_range_miles?: number
  tenant_id: number
  created_at: Date
}

export interface DriverSafetyEvent {
  id: number
  external_event_id?: string
  vehicle_id: number
  driver_id?: number
  provider_id?: number
  event_type: string
  severity?: 'minor' | 'moderate' | 'severe' | 'critical'
  latitude?: number
  longitude?: number
  address?: string
  speed_mph?: number
  g_force?: number
  duration_seconds?: number
  video_request_id?: string
  video_url?: string
  video_thumbnail_url?: string
  video_expires_at?: Date
  timestamp: Date
  tenant_id: number
  created_at: Date
}

export interface TelematicsWebhookEvent {
  id: number
  provider_id: number
  event_type: string
  external_id?: string
  payload: any
  processed: boolean
  processed_at?: Date
  error?: string
  created_at: Date
}

export interface ConnectionWithDetails extends VehicleTelematicsConnection {
  provider_name: string
  provider_display_name: string
  vehicle_name: string
  vin: string
}

export interface LocationData {
  latitude: number
  longitude: number
  heading?: number
  speed_mph?: number
  address?: string
  timestamp: Date
  engine_state?: string
  provider: string
}

export interface StatsData {
  odometer_miles?: number
  fuel_percent?: number
  fuel_gallons?: number
  battery_percent?: number
  battery_voltage_12v?: number
  engine_rpm?: number
  engine_state?: string
  engine_hours?: number
  temperature_f?: number
  oil_life_percent?: number
  coolant_temp_f?: number
  is_charging?: boolean
  charge_rate_kw?: number
  estimated_range_miles?: number
  timestamp: Date
  provider: string
}

export interface DashboardVehicle {
  id: number
  name: string
  vin: string
  make: string
  model: string
  latitude?: number
  longitude?: number
  heading?: number
  speed_mph?: number
  address?: string
  engine_state?: string
  timestamp?: Date
}

export interface SafetyEventSummary {
  count: number
  event_type: string
  severity: string
}

export interface DiagnosticSummary {
  count: number
  severity: string
}

// ============================================================================
// TelematicsRepository
// ============================================================================

@injectable()
export class TelematicsRepository {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // Providers
  // ==========================================================================

  /**
   * Get all telematics providers (system table, no tenant filter)
   */
  async getAllProviders(): Promise<TelematicsProvider[]> {
    const result = await this.pool.query<TelematicsProvider>(
      `SELECT id, name, display_name, supports_webhooks, supports_video,
              supports_temperature, supports_hos, created_at
       FROM telematics_providers
       ORDER BY display_name`
    )
    return result.rows
  }

  /**
   * Get provider by name (system table, no tenant filter)
   */
  async getProviderByName(name: string): Promise<TelematicsProvider | null> {
    const result = await this.pool.query<TelematicsProvider>(
      `SELECT id FROM telematics_providers WHERE name = $1`,
      [name]
    )
    return result.rows[0] || null
  }

  // ==========================================================================
  // Connections
  // ==========================================================================

  /**
   * Verify vehicle belongs to tenant
   */
  async verifyVehicleOwnership(vehicleId: number, tenantId: number): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2`,
      [vehicleId, tenantId]
    )
    return result.rows.length > 0
  }

  /**
   * Create or update vehicle telematics connection
   */
  async upsertConnection(
    vehicleId: number,
    providerId: number,
    externalVehicleId: string,
    accessToken: string | undefined,
    metadata: any,
    tenantId: number
  ): Promise<VehicleTelematicsConnection> {
    const result = await this.pool.query<VehicleTelematicsConnection>(
      `INSERT INTO vehicle_telematics_connections
       (vehicle_id, provider_id, external_vehicle_id, access_token, metadata, last_sync_at, sync_status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'active', $6)
       ON CONFLICT (vehicle_id, provider_id)
       DO UPDATE SET
         external_vehicle_id = EXCLUDED.external_vehicle_id,
         access_token = EXCLUDED.access_token,
         metadata = EXCLUDED.metadata,
         sync_status = 'active',
         updated_at = NOW()
       WHERE vehicle_telematics_connections.tenant_id = $6
       RETURNING *`,
      [vehicleId, providerId, externalVehicleId, accessToken, JSON.stringify(metadata || {}), tenantId]
    )
    return result.rows[0]
  }

  /**
   * Get all connections for tenant
   */
  async getAllConnections(tenantId: number): Promise<ConnectionWithDetails[]> {
    const result = await this.pool.query<ConnectionWithDetails>(
      `SELECT
         vtc.id, vtc.vehicle_id, vtc.external_vehicle_id,
         vtc.last_sync_at, vtc.sync_status, vtc.sync_error, vtc.metadata,
         tp.name as provider_name, tp.display_name as provider_display_name,
         v.name as vehicle_name, v.vin
       FROM vehicle_telematics_connections vtc
       JOIN telematics_providers tp ON vtc.provider_id = tp.id
       JOIN vehicles v ON vtc.vehicle_id = v.id
       WHERE v.tenant_id = $1 AND vtc.tenant_id = $1
       ORDER BY v.name, tp.display_name`,
      [tenantId]
    )
    return result.rows
  }

  /**
   * Get connection for vehicle and provider
   */
  async getConnection(
    vehicleId: number,
    providerName: string,
    tenantId: number
  ): Promise<VehicleTelematicsConnection | null> {
    const result = await this.pool.query<VehicleTelematicsConnection>(
      `SELECT vtc.external_vehicle_id
       FROM vehicle_telematics_connections vtc
       JOIN vehicles v ON vtc.vehicle_id = v.id
       WHERE vtc.vehicle_id = $1
       AND v.tenant_id = $2
       AND vtc.tenant_id = $2
       AND vtc.provider_id = (SELECT id FROM telematics_providers WHERE name = $3)`,
      [vehicleId, tenantId, providerName]
    )
    return result.rows[0] || null
  }

  // ==========================================================================
  // Telemetry
  // ==========================================================================

  /**
   * Get latest location for a vehicle
   */
  async getLatestLocation(vehicleId: number, tenantId: number): Promise<LocationData | null> {
    const result = await this.pool.query<LocationData>(
      `SELECT
         vt.latitude, vt.longitude, vt.heading, vt.speed_mph, vt.address,
         vt.timestamp, vt.engine_state,
         tp.display_name as provider
       FROM vehicle_telemetry vt
       JOIN telematics_providers tp ON vt.provider_id = tp.id
       JOIN vehicles v ON vt.vehicle_id = v.id
       WHERE vt.vehicle_id = $1 AND v.tenant_id = $2 AND vt.tenant_id = $2
       ORDER BY vt.timestamp DESC
       LIMIT 1`,
      [vehicleId, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Get latest stats for a vehicle
   */
  async getLatestStats(vehicleId: number, tenantId: number): Promise<StatsData | null> {
    const result = await this.pool.query<StatsData>(
      `SELECT
         vt.odometer_miles, vt.fuel_percent, vt.fuel_gallons,
         vt.battery_percent, vt.battery_voltage_12v,
         vt.engine_rpm, vt.engine_state, vt.engine_hours,
         vt.temperature_f, vt.oil_life_percent, vt.coolant_temp_f,
         vt.is_charging, vt.charge_rate_kw, vt.estimated_range_miles,
         vt.timestamp,
         tp.display_name as provider
       FROM vehicle_telemetry vt
       JOIN telematics_providers tp ON vt.provider_id = tp.id
       JOIN vehicles v ON vt.vehicle_id = v.id
       WHERE vt.vehicle_id = $1 AND v.tenant_id = $2 AND vt.tenant_id = $2
       ORDER BY vt.timestamp DESC
       LIMIT 1`,
      [vehicleId, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Get historical telemetry for a vehicle
   */
  async getHistoricalTelemetry(
    vehicleId: number,
    tenantId: number,
    startTime?: string,
    endTime?: string,
    limit: number = 1000
  ): Promise<any[]> {
    let query = `
      SELECT
        vt.latitude, vt.longitude, vt.heading, vt.speed_mph,
        vt.odometer_miles, vt.timestamp, vt.address
      FROM vehicle_telemetry vt
      JOIN vehicles v ON vt.vehicle_id = v.id
      WHERE vt.vehicle_id = $1 AND v.tenant_id = $2 AND vt.tenant_id = $2
    `
    const params: any[] = [vehicleId, tenantId]

    if (startTime) {
      params.push(startTime)
      query += ` AND vt.timestamp >= $${params.length}`
    }

    if (endTime) {
      params.push(endTime)
      query += ` AND vt.timestamp <= $${params.length}`
    }

    query += ` ORDER BY vt.timestamp DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await this.pool.query(query, params)
    return result.rows
  }

  // ==========================================================================
  // Safety Events
  // ==========================================================================

  /**
   * Get safety events with pagination and filters
   */
  async getSafetyEvents(
    tenantId: number,
    filters: {
      vehicleId?: number
      driverId?: number
      eventType?: string
      severity?: string
      startDate?: string
      endDate?: string
    },
    pagination: { limit: number; offset: number }
  ): Promise<any[]> {
    let query =
      'SELECT ' +
      '  dse.id, dse.event_type, dse.severity, dse.latitude, dse.longitude, ' +
      '  dse.address, dse.speed_mph, dse.g_force, dse.timestamp, ' +
      '  dse.video_url, dse.video_thumbnail_url, ' +
      '  v.name as vehicle_name, v.vin, ' +
      '  d.first_name || \' \' || d.last_name as driver_name, ' +
      '  tp.display_name as provider ' +
      'FROM driver_safety_events dse ' +
      'JOIN vehicles v ON dse.vehicle_id = v.id ' +
      'LEFT JOIN drivers d ON dse.driver_id = d.id ' +
      'LEFT JOIN telematics_providers tp ON dse.provider_id = tp.id ' +
      'WHERE v.tenant_id = $1 AND dse.tenant_id = $1'
    const params: any[] = [tenantId]

    if (filters.vehicleId) {
      params.push(filters.vehicleId)
      query += ` AND dse.vehicle_id = $${params.length}`
    }

    if (filters.driverId) {
      params.push(filters.driverId)
      query += ` AND dse.driver_id = $${params.length}`
    }

    if (filters.eventType) {
      params.push(filters.eventType)
      query += ` AND dse.event_type = $${params.length}`
    }

    if (filters.severity) {
      params.push(filters.severity)
      query += ` AND dse.severity = $${params.length}`
    }

    if (filters.startDate) {
      params.push(filters.startDate)
      query += ` AND dse.timestamp >= $${params.length}`
    }

    if (filters.endDate) {
      params.push(filters.endDate)
      query += ` AND dse.timestamp <= $${params.length}`
    }

    query += ` ORDER BY dse.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pagination.limit, pagination.offset)

    const result = await this.pool.query(query, params)
    return result.rows
  }

  /**
   * Count safety events with filters
   */
  async countSafetyEvents(
    tenantId: number,
    filters: {
      vehicleId?: number
      driverId?: number
      eventType?: string
      severity?: string
      startDate?: string
      endDate?: string
    }
  ): Promise<number> {
    let query =
      'SELECT COUNT(*) as count ' +
      'FROM driver_safety_events dse ' +
      'JOIN vehicles v ON dse.vehicle_id = v.id ' +
      'WHERE v.tenant_id = $1 AND dse.tenant_id = $1'
    const params: any[] = [tenantId]

    if (filters.vehicleId) {
      params.push(filters.vehicleId)
      query += ` AND dse.vehicle_id = $${params.length}`
    }

    if (filters.driverId) {
      params.push(filters.driverId)
      query += ` AND dse.driver_id = $${params.length}`
    }

    if (filters.eventType) {
      params.push(filters.eventType)
      query += ` AND dse.event_type = $${params.length}`
    }

    if (filters.severity) {
      params.push(filters.severity)
      query += ` AND dse.severity = $${params.length}`
    }

    if (filters.startDate) {
      params.push(filters.startDate)
      query += ` AND dse.timestamp >= $${params.length}`
    }

    if (filters.endDate) {
      params.push(filters.endDate)
      query += ` AND dse.timestamp <= $${params.length}`
    }

    const result = await this.pool.query(query, params)
    return parseInt(result.rows[0].count, 10)
  }

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  /**
   * Get latest locations for all active vehicles
   */
  async getDashboardVehicles(tenantId: number): Promise<DashboardVehicle[]> {
    const result = await this.pool.query<DashboardVehicle>(
      `SELECT DISTINCT ON (v.id)
         v.id, v.name, v.vin, v.make, v.model,
         lvt.latitude, lvt.longitude, lvt.heading, lvt.speed_mph,
         lvt.address, lvt.engine_state, lvt.timestamp
       FROM vehicles v
       LEFT JOIN latest_vehicle_telemetry lvt ON v.id = lvt.vehicle_id
       WHERE v.tenant_id = $1 AND v.status = 'active'
       ORDER BY v.id, lvt.timestamp DESC`,
      [tenantId]
    )
    return result.rows
  }

  /**
   * Get recent safety events summary (last 24 hours)
   */
  async getDashboardSafetyEvents(tenantId: number): Promise<SafetyEventSummary[]> {
    const result = await this.pool.query<SafetyEventSummary>(
      `SELECT COUNT(*) as count, event_type, severity
       FROM driver_safety_events dse
       JOIN vehicles v ON dse.vehicle_id = v.id
       WHERE v.tenant_id = $1 AND dse.tenant_id = $1 AND dse.timestamp >= NOW() - INTERVAL '24 hours'
       GROUP BY event_type, severity
       ORDER BY count DESC`,
      [tenantId]
    )
    return result.rows
  }

  /**
   * Get active diagnostics summary
   */
  async getDashboardDiagnostics(tenantId: number): Promise<DiagnosticSummary[]> {
    const result = await this.pool.query<DiagnosticSummary>(
      `SELECT COUNT(*) as count, severity
       FROM vehicle_diagnostic_codes vdc
       JOIN vehicles v ON vdc.vehicle_id = v.id
       WHERE v.tenant_id = $1 AND vdc.tenant_id = $1 AND vdc.cleared_at IS NULL
       GROUP BY severity`,
      [tenantId]
    )
    return result.rows
  }

  // ==========================================================================
  // Webhooks
  // ==========================================================================

  /**
   * Log webhook event
   */
  async logWebhookEvent(
    providerId: number,
    eventType: string,
    externalId: string | undefined,
    payload: any
  ): Promise<TelematicsWebhookEvent> {
    const result = await this.pool.query<TelematicsWebhookEvent>(
      `INSERT INTO telematics_webhook_events
       (provider_id, event_type, external_id, payload, processed)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [providerId, eventType, externalId, JSON.stringify(payload)]
    )
    return result.rows[0]
  }
}
