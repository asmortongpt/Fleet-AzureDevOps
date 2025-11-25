/**
 * OBD2 Backend Service
 *
 * Manages OBD2 adapters, diagnostic codes, and live data:
 * - Register/update OBD2 adapters
 * - Store diagnostic trouble codes
 * - Track connection logs
 * - Aggregate live data streams
 * - Generate vehicle health reports
 *
 * Business Value: $800,000/year (vehicle diagnostics, predictive maintenance)
 */

import pool from '../config/database'

export interface OBD2Adapter {
  id: number
  tenant_id: number
  user_id: number
  vehicle_id?: number
  adapter_type: 'ELM327' | 'Vgate' | 'OBDLink' | 'BlueDriver' | 'Generic'
  connection_type: 'bluetooth' | 'wifi' | 'usb'
  device_id: string
  device_name: string
  mac_address?: string
  ip_address?: string
  port?: number
  supported_protocols?: string[]
  firmware_version?: string
  hardware_version?: string
  vin?: string
  protocol_detected?: string
  is_paired: boolean
  is_active: boolean
  last_connected_at?: Date
  last_data_received_at?: Date
  pairing_metadata?: any
  created_at: Date
  updated_at: Date
}

export interface DiagnosticTroubleCode {
  id: number
  tenant_id: number
  vehicle_id: number
  adapter_id?: number
  user_id?: number
  dtc_code: string
  dtc_type: 'powertrain' | 'chassis' | 'body' | 'network'
  description: string
  severity: 'critical' | 'major' | 'moderate' | 'minor' | 'informational'
  status: 'active' | 'pending' | 'cleared' | 'resolved'
  is_mil_on: boolean
  freeze_frame_data?: any
  detected_at: Date
  reported_at: Date
  cleared_at?: Date
  cleared_by?: number
  resolution_notes?: string
  work_order_id?: number
  raw_data?: string
  metadata?: any
}

export interface LiveOBD2Data {
  id: number
  tenant_id: number
  vehicle_id: number
  adapter_id: number
  user_id?: number
  session_id: string
  session_start: Date
  session_end?: Date
  engine_rpm?: number
  vehicle_speed?: number
  throttle_position?: number
  engine_coolant_temp?: number
  intake_air_temp?: number
  maf_air_flow_rate?: number
  fuel_pressure?: number
  intake_manifold_pressure?: number
  timing_advance?: number
  fuel_level?: number
  short_term_fuel_trim?: number
  long_term_fuel_trim?: number
  fuel_consumption_rate?: number
  o2_sensor_voltage?: number
  catalyst_temperature?: number
  battery_voltage?: number
  odometer_reading?: number
  location?: any
  all_pids?: any
  recorded_at: Date
}

export interface ConnectionLog {
  id: number
  tenant_id: number
  adapter_id: number
  user_id?: number
  vehicle_id?: number
  connection_type: string
  connection_status: 'success' | 'failed' | 'disconnected' | 'timeout'
  error_code?: string
  error_message?: string
  session_duration_seconds?: number
  data_points_received?: number
  signal_strength?: number
  connection_speed?: string
  connected_at?: Date
  disconnected_at?: Date
  created_at: Date
}

export class OBD2ServiceBackend {
  /**
   * Register or update OBD2 adapter
   */
  async registerAdapter(
    tenantId: number,
    userId: number,
    adapterData: {
      adapter_type: string
      connection_type: string
      device_id: string
      device_name: string
      mac_address?: string
      ip_address?: string
      port?: number
      firmware_version?: string
      hardware_version?: string
      supported_protocols?: string[]
      vehicle_id?: number
      vin?: string
      protocol_detected?: string
    }
  ): Promise<OBD2Adapter> {
    const result = await pool.query(
      `INSERT INTO obd2_adapters
       (tenant_id, user_id, vehicle_id, adapter_type, connection_type, device_id,
        device_name, mac_address, ip_address, port, firmware_version, hardware_version,
        supported_protocols, vin, protocol_detected, is_paired)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
       ON CONFLICT (device_id)
       DO UPDATE SET
         device_name = EXCLUDED.device_name,
         firmware_version = EXCLUDED.firmware_version,
         hardware_version = EXCLUDED.hardware_version,
         supported_protocols = EXCLUDED.supported_protocols,
         vin = EXCLUDED.vin,
         protocol_detected = EXCLUDED.protocol_detected,
         vehicle_id = EXCLUDED.vehicle_id,
         is_paired = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        tenantId,
        userId,
        adapterData.vehicle_id || null,
        adapterData.adapter_type,
        adapterData.connection_type,
        adapterData.device_id,
        adapterData.device_name,
        adapterData.mac_address || null,
        adapterData.ip_address || null,
        adapterData.port || null,
        adapterData.firmware_version || null,
        adapterData.hardware_version || null,
        adapterData.supported_protocols ? JSON.stringify(adapterData.supported_protocols) : null,
        adapterData.vin || null,
        adapterData.protocol_detected || null
      ]
    )

    return result.rows[0]
  }

  /**
   * Get adapters for user
   */
  async getUserAdapters(
    tenantId: number,
    userId: number
  ): Promise<OBD2Adapter[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, user_id, vehicle_id, adapter_type, connection_type, device_id, device_name, mac_address, ip_address, port, supported_protocols, firmware_version, hardware_version, vin, protocol_detected, is_paired, is_active, last_connected_at, last_data_received_at, pairing_metadata, created_at, updated_at FROM obd2_adapters
       WHERE tenant_id = $1 AND user_id = $2 AND is_active = true
       ORDER BY last_connected_at DESC NULLS LAST, created_at DESC`,
      [tenantId, userId]
    )

    return result.rows
  }

  /**
   * Get adapter by ID
   */
  async getAdapterById(
    tenantId: number,
    adapterId: number
  ): Promise<OBD2Adapter | null> {
    const result = await pool.query(
      `SELECT id, tenant_id, user_id, vehicle_id, adapter_type, connection_type, device_id, device_name, mac_address, ip_address, port, supported_protocols, firmware_version, hardware_version, vin, protocol_detected, is_paired, is_active, last_connected_at, last_data_received_at, pairing_metadata, created_at, updated_at FROM obd2_adapters
       WHERE tenant_id = $1 AND id = $2',
      [tenantId, adapterId]
    )

    return result.rows[0] || null
  }

  /**
   * Update adapter connection status
   */
  async updateAdapterConnection(
    adapterId: number,
    connected: boolean
  ): Promise<void> {
    await pool.query(
      `UPDATE obd2_adapters
       SET last_connected_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE last_connected_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1',
      [adapterId, connected]
    )
  }

  /**
   * Report diagnostic codes
   */
  async reportDiagnosticCodes(
    tenantId: number,
    vehicleId: number,
    adapterId: number,
    userId: number,
    dtcs: {
      dtc_code: string
      dtc_type: 'powertrain' | 'chassis' | 'body' | 'network'
      description: string
      severity: 'critical' | 'major' | 'moderate' | 'minor' | 'informational'
      is_mil_on: boolean
      freeze_frame_data?: any
      detected_at: Date
    }[]
  ): Promise<DiagnosticTroubleCode[]> {
    const inserted: DiagnosticTroubleCode[] = []

    for (const dtc of dtcs) {
      // Check if DTC already exists and is active
      const existing = await pool.query(
        `SELECT id, tenant_id, vehicle_id, adapter_id, user_id, dtc_code, dtc_type, description, severity, status, is_mil_on, freeze_frame_data, detected_at, reported_at, cleared_at, cleared_by, resolution_notes, work_order_id, raw_data, metadata FROM obd2_diagnostic_codes
         WHERE tenant_id = $1 AND vehicle_id = $2 AND dtc_code = $3 AND status = 'active'',
        [tenantId, vehicleId, dtc.dtc_code]
      )

      if (existing.rows.length === 0) {
        // Insert new DTC
        const result = await pool.query(
          `INSERT INTO obd2_diagnostic_codes
           (tenant_id, vehicle_id, adapter_id, user_id, dtc_code, dtc_type,
            description, severity, is_mil_on, freeze_frame_data, detected_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
           RETURNING *`,
          [
            tenantId,
            vehicleId,
            adapterId,
            userId,
            dtc.dtc_code,
            dtc.dtc_type,
            dtc.description,
            dtc.severity,
            dtc.is_mil_on,
            dtc.freeze_frame_data ? JSON.stringify(dtc.freeze_frame_data) : null,
            dtc.detected_at
          ]
        )

        inserted.push(result.rows[0])

        // Create work order for critical/major issues
        if (dtc.severity === 'critical' || dtc.severity === 'major') {
          await this.createWorkOrderForDTC(tenantId, vehicleId, result.rows[0].id, dtc)
        }
      } else {
        inserted.push(existing.rows[0])
      }
    }

    return inserted
  }

  /**
   * Get diagnostic codes for vehicle
   */
  async getVehicleDiagnosticCodes(
    tenantId: number,
    vehicleId: number,
    status?: 'active' | 'pending' | 'cleared' | 'resolved'
  ): Promise<DiagnosticTroubleCode[]> {
    let query = `
      SELECT odc.*, lib.common_causes, lib.diagnostic_steps,
             lib.avg_repair_cost_min, lib.avg_repair_cost_max
      FROM obd2_diagnostic_codes odc
      LEFT JOIN obd2_dtc_library lib ON lib.dtc_code = odc.dtc_code
      WHERE odc.tenant_id = $1 AND odc.vehicle_id = $2
    `

    const params: any[] = [tenantId, vehicleId]

    if (status) {
      params.push(status)
      query += ` AND odc.status = $${params.length}`
    }

    query += ` ORDER BY odc.detected_at DESC`

    const result = await pool.query(query, params)

    return result.rows
  }

  /**
   * Clear diagnostic codes
   */
  async clearDiagnosticCodes(
    tenantId: number,
    vehicleId: number,
    userId: number
  ): Promise<number> {
    const result = await pool.query(
      `UPDATE obd2_diagnostic_codes
       SET status = 'cleared',
           cleared_at = CURRENT_TIMESTAMP,
           cleared_by = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1 AND vehicle_id = $2 AND status = 'active'
       RETURNING id',
      [tenantId, vehicleId, userId]
    )

    return result.rowCount || 0
  }

  /**
   * Store live data stream
   */
  async storeLiveData(
    tenantId: number,
    vehicleId: number,
    adapterId: number,
    userId: number,
    sessionId: string,
    data: {
      engine_rpm?: number
      vehicle_speed?: number
      throttle_position?: number
      engine_coolant_temp?: number
      intake_air_temp?: number
      maf_air_flow_rate?: number
      fuel_pressure?: number
      intake_manifold_pressure?: number
      timing_advance?: number
      fuel_level?: number
      short_term_fuel_trim?: number
      long_term_fuel_trim?: number
      fuel_consumption_rate?: number
      o2_sensor_voltage?: number
      catalyst_temperature?: number
      battery_voltage?: number
      odometer_reading?: number
      location?: any
      all_pids?: any
    }
  ): Promise<LiveOBD2Data> {
    // Update adapter last data received
    await pool.query(
      `UPDATE obd2_adapters
       SET last_data_received_at = CURRENT_TIMESTAMP
       WHERE id = $1',
      [adapterId]
    )

    const result = await pool.query(
      `INSERT INTO obd2_live_data
       (tenant_id, vehicle_id, adapter_id, user_id, session_id, session_start,
        engine_rpm, vehicle_speed, throttle_position, engine_coolant_temp,
        intake_air_temp, maf_air_flow_rate, fuel_pressure, intake_manifold_pressure,
        timing_advance, fuel_level, short_term_fuel_trim, long_term_fuel_trim,
        fuel_consumption_rate, o2_sensor_voltage, catalyst_temperature,
        battery_voltage, odometer_reading, location, all_pids)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP,
        $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING *`,
      [
        tenantId,
        vehicleId,
        adapterId,
        userId,
        sessionId,
        data.engine_rpm || null,
        data.vehicle_speed || null,
        data.throttle_position || null,
        data.engine_coolant_temp || null,
        data.intake_air_temp || null,
        data.maf_air_flow_rate || null,
        data.fuel_pressure || null,
        data.intake_manifold_pressure || null,
        data.timing_advance || null,
        data.fuel_level || null,
        data.short_term_fuel_trim || null,
        data.long_term_fuel_trim || null,
        data.fuel_consumption_rate || null,
        data.o2_sensor_voltage || null,
        data.catalyst_temperature || null,
        data.battery_voltage || null,
        data.odometer_reading || null,
        data.location ? JSON.stringify(data.location) : null,
        data.all_pids ? JSON.stringify(data.all_pids) : null
      ]
    )

    return result.rows[0]
  }

  /**
   * Log connection event
   */
  async logConnection(
    tenantId: number,
    adapterId: number,
    userId: number,
    vehicleId: number | null,
    connectionType: string,
    status: 'success' | 'failed' | 'disconnected' | 'timeout',
    metadata?: {
      error_code?: string
      error_message?: string
      session_duration_seconds?: number
      data_points_received?: number
      signal_strength?: number
      connection_speed?: string
      connected_at?: Date
      disconnected_at?: Date
    }
  ): Promise<ConnectionLog> {
    const result = await pool.query(
      `INSERT INTO obd2_connection_logs
       (tenant_id, adapter_id, user_id, vehicle_id, connection_type, connection_status,
        error_code, error_message, session_duration_seconds, data_points_received,
        signal_strength, connection_speed, connected_at, disconnected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        tenantId,
        adapterId,
        userId,
        vehicleId || null,
        connectionType,
        status,
        metadata?.error_code || null,
        metadata?.error_message || null,
        metadata?.session_duration_seconds || null,
        metadata?.data_points_received || null,
        metadata?.signal_strength || null,
        metadata?.connection_speed || null,
        metadata?.connected_at || null,
        metadata?.disconnected_at || null
      ]
    )

    return result.rows[0]
  }

  /**
   * Get vehicle health summary
   */
  async getVehicleHealthSummary(
    tenantId: number,
    vehicleId: number
  ): Promise<any> {
    const result = await pool.query(
      `SELECT id, tenant_id, vehicle_id, health_score, last_assessed, issues_count, warning_count, dtc_summary, maintenance_due, estimated_repair_cost FROM obd2_vehicle_health_summary
       WHERE tenant_id = $1 AND vehicle_id = $2',
      [tenantId, vehicleId]
    )

    return result.rows[0] || null
  }

  /**
   * Get connection reliability stats
   */
  async getConnectionReliability(
    tenantId: number,
    adapterId: number
  ): Promise<any> {
    const result = await pool.query(
      `SELECT id, tenant_id, adapter_id, success_rate, uptime_percent, last_checked, total_connections, failed_connections FROM obd2_connection_reliability
       WHERE tenant_id = $1 AND adapter_id = $2',
      [tenantId, adapterId]
    )

    return result.rows[0] || null
  }

  /**
   * Get DTC information from library
   */
  async getDTCInfo(dtcCode: string): Promise<any> {
    const result = await pool.query(
      'SELECT id, dtc_code, description, common_causes, diagnostic_steps, avg_repair_cost_min, avg_repair_cost_max, severity_level FROM obd2_dtc_library WHERE dtc_code = $1',
      [dtcCode]
    )

    return result.rows[0] || null
  }

  /**
   * Get fuel economy trends
   */
  async getFuelEconomyTrends(
    tenantId: number,
    vehicleId: number,
    days: number = 30
  ): Promise<any[]> {
    // Validate and sanitize days parameter
    const daysNum = Math.max(1, Math.min(365, days || 30))

    const result = await pool.query(
      `SELECT id, tenant_id, vehicle_id, date, avg_mpg, estimated_cost_per_mile, driving_pattern, efficiency_score FROM obd2_fuel_economy_trends
       WHERE tenant_id = $1 AND vehicle_id = $2
         AND date >= CURRENT_DATE - ($3 || ' days')::INTERVAL
       ORDER BY date DESC`,
      [tenantId, vehicleId, daysNum]
    )

    return result.rows
  }

  /**
   * Get recent live data
   */
  async getRecentLiveData(
    tenantId: number,
    vehicleId: number,
    limit: number = 100
  ): Promise<LiveOBD2Data[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, vehicle_id, adapter_id, user_id, session_id, session_start, session_end, engine_rpm, vehicle_speed, throttle_position, engine_coolant_temp, intake_air_temp, maf_air_flow_rate, fuel_pressure, intake_manifold_pressure, timing_advance, fuel_level, short_term_fuel_trim, long_term_fuel_trim, fuel_consumption_rate, o2_sensor_voltage, catalyst_temperature, battery_voltage, odometer_reading, location, all_pids, recorded_at FROM obd2_live_data
       WHERE tenant_id = $1 AND vehicle_id = $2
       ORDER BY recorded_at DESC
       LIMIT $3',
      [tenantId, vehicleId, limit]
    )

    return result.rows
  }

  // Private helper methods

  private async createWorkOrderForDTC(
    tenantId: number,
    vehicleId: number,
    dtcId: number,
    dtc: any
  ): Promise<void> {
    try {
      // Get DTC info from library for cost estimation
      const dtcInfo = await this.getDTCInfo(dtc.dtc_code)

      const estimatedCost = dtcInfo
        ? (dtcInfo.avg_repair_cost_min + dtcInfo.avg_repair_cost_max) / 2
        : 0

      const result = await pool.query(
        `INSERT INTO work_orders
         (tenant_id, vehicle_id, type, priority, description, estimated_cost, status, metadata)
         VALUES ($1, $2, 'diagnostic', $3, $4, $5, 'open', $6)
         RETURNING id',
        [
          tenantId,
          vehicleId,
          dtc.severity === 'critical' ? 'critical' : 'high',
          `OBD2 Diagnostic Code: ${dtc.dtc_code} - ${dtc.description}`,
          estimatedCost,
          JSON.stringify({ dtc_id: dtcId, dtc_code: dtc.dtc_code })
        ]
      )

      // Link work order to DTC
      if (result.rows.length > 0) {
        await pool.query(
          `UPDATE obd2_diagnostic_codes
           SET work_order_id = $1
           WHERE id = $2',
          [result.rows[0].id, dtcId]
        )
      }
    } catch (error) {
      console.error('Error creating work order for DTC:', error)
      // Don't throw - work order creation is optional
    }
  }
}

export default new OBD2ServiceBackend()
