/**
 * Enhanced Telemetry Repository
 *
 * Replaces direct pool.query() calls in routes/telemetry.ts
 * Handles vehicle telemetry data (GPS, diagnostics, sensor readings).
 *
 * Epic #1, Issue #1.2: Fleet Domain Repositories
 */

import { Pool, PoolClient } from 'pg'
import { GenericRepository } from '../base'
import { DatabaseError } from "../../errors/AppError"

export interface TelemetryData {
  id?: string | number
  tenant_id?: string
  vehicle_id: string | number
  timestamp: Date
  latitude?: number
  longitude?: number
  speed?: number
  heading?: number
  altitude?: number
  odometer?: number
  fuel_level?: number
  battery_voltage?: number
  engine_rpm?: number
  engine_temp?: number
  coolant_temp?: number
  oil_pressure?: number
  tire_pressure_fl?: number
  tire_pressure_fr?: number
  tire_pressure_rl?: number
  tire_pressure_rr?: number
  accelerometer_x?: number
  accelerometer_y?: number
  accelerometer_z?: number
  harsh_braking?: boolean
  harsh_acceleration?: boolean
  harsh_cornering?: boolean
  idling?: boolean
  engine_fault_codes?: string[]
  dtc_codes?: string[]
  vin?: string
  driver_id?: string | number
  trip_id?: string | number
  raw_data?: any
  created_at?: Date
  updated_at?: Date
}

export interface TelemetryFilters {
  vehicle_id?: string | number
  driver_id?: string | number
  trip_id?: string | number
  start_date?: Date
  end_date?: Date
  min_speed?: number
  max_speed?: number
  has_fault_codes?: boolean
  harsh_events?: boolean
}

export interface TelemetryStats {
  total_records: number
  avg_speed: number
  max_speed: number
  total_distance: number
  harsh_braking_count: number
  harsh_acceleration_count: number
  harsh_cornering_count: number
  idling_time_minutes: number
  unique_vehicles: number
}

/**
 * Telemetry Repository
 *
 * Handles all vehicle telemetry data operations.
 * Optimized for time-series data with high volume inserts.
 */
export class TelemetryRepository extends GenericRepository<TelemetryData> {
  protected tableName = 'telemetry_data'
  protected idColumn = 'id'

  constructor(pool: Pool) {
    super(pool)
  }

  /**
   * Find telemetry data for a specific vehicle
   */
  async findByVehicle(
    vehicleId: string | number,
    tenantId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<TelemetryData[]> {
    const { limit = 100, offset = 0 } = options

    return this.executeQuery<TelemetryData>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE vehicle_id = $1 AND tenant_id = $2
       ORDER BY timestamp DESC
       LIMIT $3 OFFSET $4`,
      [vehicleId, tenantId, limit, offset]
    )
  }

  /**
   * Find latest telemetry for a vehicle
   */
  async findLatestByVehicle(
    vehicleId: string | number,
    tenantId: string
  ): Promise<TelemetryData | null> {
    const results = await this.executeQuery<TelemetryData>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE vehicle_id = $1 AND tenant_id = $2
       ORDER BY timestamp DESC
       LIMIT 1`,
      [vehicleId, tenantId]
    )
    return results[0] || null
  }

  /**
   * Find telemetry data within time range
   */
  async findByTimeRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    options: { vehicleId?: string | number; limit?: number; offset?: number } = {}
  ): Promise<TelemetryData[]> {
    const { vehicleId, limit = 1000, offset = 0 } = options

    const conditions = ['tenant_id = $1', 'timestamp BETWEEN $2 AND $3']
    const values: any[] = [tenantId, startDate, endDate]
    let paramIndex = 4

    if (vehicleId) {
      conditions.push(`vehicle_id = $${paramIndex++}`)
      values.push(vehicleId)
    }

    const whereClause = conditions.join(' AND ')

    return this.executeQuery<TelemetryData>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )
  }

  /**
   * Find telemetry with harsh events (braking, acceleration, cornering)
   */
  async findHarshEvents(
    tenantId: string,
    options: {
      vehicleId?: string | number
      driverId?: string | number
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {}
  ): Promise<TelemetryData[]> {
    const { vehicleId, driverId, startDate, endDate, limit = 100 } = options

    const conditions = [
      'tenant_id = $1',
      '(harsh_braking = true OR harsh_acceleration = true OR harsh_cornering = true)'
    ]
    const values: any[] = [tenantId]
    let paramIndex = 2

    if (vehicleId) {
      conditions.push(`vehicle_id = $${paramIndex++}`)
      values.push(vehicleId)
    }
    if (driverId) {
      conditions.push(`driver_id = $${paramIndex++}`)
      values.push(driverId)
    }
    if (startDate && endDate) {
      conditions.push(`timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
      values.push(startDate, endDate)
      paramIndex += 2
    }

    const whereClause = conditions.join(' AND ')

    return this.executeQuery<TelemetryData>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex}`,
      [...values, limit]
    )
  }

  /**
   * Find telemetry with fault codes
   */
  async findWithFaultCodes(
    tenantId: string,
    options: {
      vehicleId?: string | number
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {}
  ): Promise<TelemetryData[]> {
    const { vehicleId, startDate, endDate, limit = 100 } = options

    const conditions = [
      'tenant_id = $1',
      '(engine_fault_codes IS NOT NULL OR dtc_codes IS NOT NULL)'
    ]
    const values: any[] = [tenantId]
    let paramIndex = 2

    if (vehicleId) {
      conditions.push(`vehicle_id = $${paramIndex++}`)
      values.push(vehicleId)
    }
    if (startDate && endDate) {
      conditions.push(`timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
      values.push(startDate, endDate)
      paramIndex += 2
    }

    const whereClause = conditions.join(' AND ')

    return this.executeQuery<TelemetryData>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex}`,
      [...values, limit]
    )
  }

  /**
   * Get telemetry statistics for a vehicle
   */
  async getVehicleStats(
    vehicleId: string | number,
    tenantId: string,
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<TelemetryStats> {
    const { startDate, endDate } = options

    const conditions = ['vehicle_id = $1', 'tenant_id = $2']
    const values: any[] = [vehicleId, tenantId]
    let paramIndex = 3

    if (startDate && endDate) {
      conditions.push(`timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
      values.push(startDate, endDate)
      paramIndex += 2
    }

    const whereClause = conditions.join(' AND ')

    const query = `
      SELECT
        COUNT(*) as total_records,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MAX(odometer) - MIN(odometer) as total_distance,
        SUM(CASE WHEN harsh_braking = true THEN 1 ELSE 0 END) as harsh_braking_count,
        SUM(CASE WHEN harsh_acceleration = true THEN 1 ELSE 0 END) as harsh_acceleration_count,
        SUM(CASE WHEN harsh_cornering = true THEN 1 ELSE 0 END) as harsh_cornering_count,
        SUM(CASE WHEN idling = true THEN 1 ELSE 0 END) * 5 as idling_time_minutes,
        COUNT(DISTINCT vehicle_id) as unique_vehicles
      FROM ${this.tableName}
      WHERE ${whereClause}
    `

    interface StatsRow {
      total_records: string
      avg_speed: string
      max_speed: string
      total_distance: string
      harsh_braking_count: string
      harsh_acceleration_count: string
      harsh_cornering_count: string
      idling_time_minutes: string
      unique_vehicles: string
    }

    const result = await this.executeQuery<StatsRow>(query, values)
    const row = result[0]

    return {
      total_records: parseInt(row?.total_records || '0', 10),
      avg_speed: parseFloat(row?.avg_speed || '0'),
      max_speed: parseFloat(row?.max_speed || '0'),
      total_distance: parseFloat(row?.total_distance || '0'),
      harsh_braking_count: parseInt(row?.harsh_braking_count || '0', 10),
      harsh_acceleration_count: parseInt(row?.harsh_acceleration_count || '0', 10),
      harsh_cornering_count: parseInt(row?.harsh_cornering_count || '0', 10),
      idling_time_minutes: parseInt(row?.idling_time_minutes || '0', 10),
      unique_vehicles: parseInt(row?.unique_vehicles || '0', 10)
    }
  }

  /**
   * Bulk insert telemetry data (optimized for IoT/GPS devices)
   */
  async bulkInsert(
    records: Partial<TelemetryData>[],
    tenantId: string,
    client?: PoolClient
  ): Promise<number> {
    if (records.length === 0) return 0

    const pool = this.getPool(client)

    // Build bulk insert query
    const columns = [
      'tenant_id',
      'vehicle_id',
      'timestamp',
      'latitude',
      'longitude',
      'speed',
      'heading',
      'odometer',
      'fuel_level',
      'battery_voltage',
      'raw_data'
    ]

    const placeholders = records
      .map((_, rowIndex) => {
        const rowPlaceholders = columns
          .map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`)
          .join(', ')
        return `(${rowPlaceholders})`
      })
      .join(', ')

    const values: any[] = []
    for (const record of records) {
      values.push(
        tenantId,
        record.vehicle_id,
        record.timestamp || new Date(),
        record.latitude,
        record.longitude,
        record.speed,
        record.heading,
        record.odometer,
        record.fuel_level,
        record.battery_voltage,
        record.raw_data
      )
    }

    const result = await pool.query(
      `INSERT INTO ${this.tableName} (${columns.join(', ')})
       VALUES ${placeholders}
       ON CONFLICT DO NOTHING`,
      values
    )

    return result.rowCount || 0
  }

  /**
   * Delete old telemetry data (data retention policy)
   */
  async deleteOlderThan(
    daysOld: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<number> {
    const pool = this.getPool(client)

    const result = await pool.query(
      `DELETE FROM ${this.tableName}
       WHERE tenant_id = $1
         AND timestamp < NOW() - INTERVAL '$2 days'`,
      [tenantId, daysOld]
    )

    return result.rowCount || 0
  }

  /**
   * Get telemetry summary by vehicle (last 24 hours)
   */
  async getRecentSummary(tenantId: string): Promise<any[]> {
    const query = `
      SELECT
        vehicle_id,
        COUNT(*) as data_points,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MAX(timestamp) as last_update,
        MAX(latitude) as last_latitude,
        MAX(longitude) as last_longitude,
        SUM(CASE WHEN harsh_braking = true THEN 1 ELSE 0 END) as harsh_events
      FROM ${this.tableName}
      WHERE tenant_id = $1
        AND timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY vehicle_id
      ORDER BY last_update DESC
    `

    return this.executeQuery(query, [tenantId])
  }
}
