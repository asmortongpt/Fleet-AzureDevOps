// ============================================================================
// Vehicle Idling Detection and Tracking Service
// ============================================================================
// Purpose: Detect and track vehicle idling to reduce fuel costs and emissions
// ============================================================================

import { Pool } from 'pg';
import { EventEmitter } from 'events';

interface IdlingEvent {
  id?: number;
  vehicle_id: number;
  driver_id?: number;
  start_time: Date;
  end_time?: Date;
  duration_seconds?: number;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  geofence_id?: number;
  engine_rpm?: number;
  speed_mph?: number;
  fuel_level_percent?: number;
  engine_temp_celsius?: number;
  battery_voltage?: number;
  idle_type?: 'traffic' | 'loading_unloading' | 'warmup' | 'cooldown' | 'break' | 'unauthorized' | 'unknown';
  is_authorized?: boolean;
  driver_notes?: string;
  data_source?: 'gps_telematics' | 'obd2' | 'samsara' | 'manual';
}

interface IdlingThreshold {
  warning_threshold_seconds: number;
  alert_threshold_seconds: number;
  critical_threshold_seconds: number;
  fuel_consumption_rate_gph: number;
  avg_fuel_price_per_gallon: number;
  co2_kg_per_gallon: number;
  send_driver_alert: boolean;
  send_manager_alert: boolean;
}

interface VehicleState {
  vehicle_id: number;
  driver_id?: number;
  engine_on: boolean;
  speed_mph: number;
  engine_rpm?: number;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
}

export class VehicleIdlingService extends EventEmitter {
  private pool: Pool;
  private activeIdlingEvents: Map<number, number> = new Map(); // vehicle_id -> event_id
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(pool: Pool) {
    super();
    this.pool = pool;
  }

  /**
   * Start monitoring for idling events
   * Call this on service initialization
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    console.log('[IdlingService] Starting idling detection monitoring');
    this.monitoringInterval = setInterval(() => {
      this.checkActiveIdlingEvents().catch(err => {
        console.error('[IdlingService] Error checking active idling events:', err);
      });
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[IdlingService] Stopped idling detection monitoring');
    }
  }

  /**
   * Process vehicle state update from GPS/telemetry
   * This is the main entry point for real-time idling detection
   */
  async processVehicleStateUpdate(state: VehicleState): Promise<void> {
    const isIdling = this.detectIdling(state);
    const activeEventId = this.activeIdlingEvents.get(state.vehicle_id);

    if (isIdling && !activeEventId) {
      // Start new idling event
      await this.startIdlingEvent(state);
    } else if (!isIdling && activeEventId) {
      // End existing idling event
      await this.endIdlingEvent(state.vehicle_id, state.timestamp);
    } else if (isIdling && activeEventId) {
      // Update existing idling event
      await this.updateIdlingEvent(activeEventId, state);
    }
  }

  /**
   * Detect if vehicle is idling based on state
   */
  private detectIdling(state: VehicleState): boolean {
    // Idling criteria:
    // 1. Engine is on
    // 2. Speed is 0 or very low (< 3 mph allows for GPS drift)
    // 3. Optionally: RPM is in idle range (600-900 typical)

    if (!state.engine_on) {
      return false;
    }

    if (state.speed_mph > 3) {
      return false;
    }

    // Optional: Check RPM if available
    if (state.engine_rpm !== undefined) {
      // If RPM is 0 or very low, engine might be off despite flag
      if (state.engine_rpm < 500) {
        return false;
      }
      // If RPM is very high, might be in neutral/park revving
      // This is still idle time we want to track
    }

    return true;
  }

  /**
   * Start a new idling event
   */
  private async startIdlingEvent(state: VehicleState): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO vehicle_idling_events (
          vehicle_id, driver_id, start_time,
          latitude, longitude, engine_rpm, speed_mph,
          data_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id',
        [
          state.vehicle_id,
          state.driver_id,
          state.timestamp,
          state.latitude,
          state.longitude,
          state.engine_rpm,
          state.speed_mph,
          'gps_telematics'
        ]
      );

      const eventId = result.rows[0].id;
      this.activeIdlingEvents.set(state.vehicle_id, eventId);

      console.log(`[IdlingService] Started idling event ${eventId} for vehicle ${state.vehicle_id}`);

      // Emit event for real-time updates
      this.emit('idling:started', {
        event_id: eventId,
        vehicle_id: state.vehicle_id,
        driver_id: state.driver_id,
        start_time: state.timestamp
      });

      // Reverse geocode location if coordinates provided
      if (state.latitude && state.longitude) {
        this.reverseGeocodeLocation(eventId, state.latitude, state.longitude).catch(err => {
          console.error('[IdlingService] Error reverse geocoding:', err);
        });
      }

      return eventId;
    } finally {
      client.release();
    }
  }

  /**
   * End an idling event
   */
  private async endIdlingEvent(vehicleId: number, endTime: Date): Promise<void> {
    const eventId = this.activeIdlingEvents.get(vehicleId);
    if (!eventId) {
      return;
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE vehicle_idling_events
         SET end_time = $1,
             duration_seconds = EXTRACT(EPOCH FROM ($1 - start_time))::INTEGER
         WHERE id = $2
         RETURNING duration_seconds, vehicle_id, driver_id, estimated_fuel_cost_usd`,
        [endTime, eventId]
      );

      if (result.rows.length > 0) {
        const event = result.rows[0];
        this.activeIdlingEvents.delete(vehicleId);

        console.log(`[IdlingService] Ended idling event ${eventId} for vehicle ${vehicleId}. Duration: ${event.duration_seconds}s`);

        // Emit event for real-time updates
        this.emit('idling:ended', {
          event_id: eventId,
          vehicle_id: event.vehicle_id,
          driver_id: event.driver_id,
          duration_seconds: event.duration_seconds,
          fuel_cost_usd: event.estimated_fuel_cost_usd
        });

        // Update daily summary
        await this.updateDailySummary(event.vehicle_id, event.driver_id, endTime);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing idling event with new state data
   */
  private async updateIdlingEvent(eventId: number, state: VehicleState): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE vehicle_idling_events
         SET engine_rpm = COALESCE($1, engine_rpm),
             speed_mph = $2,
             latitude = COALESCE($3, latitude),
             longitude = COALESCE($4, longitude)
         WHERE id = $5`,
        [state.engine_rpm, state.speed_mph, state.latitude, state.longitude, eventId]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Check all active idling events and trigger alerts if thresholds exceeded
   */
  private async checkActiveIdlingEvents(): Promise<void> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          e.id,
          e.vehicle_id,
          e.driver_id,
          e.start_time,
          EXTRACT(EPOCH FROM (NOW() - e.start_time))::INTEGER AS current_duration_seconds,
          t.warning_threshold_seconds,
          t.alert_threshold_seconds,
          t.critical_threshold_seconds,
          e.alert_triggered,
          v.name AS vehicle_name,
          u.name AS driver_name,
          u.email AS driver_email
        FROM vehicle_idling_events e
        LEFT JOIN vehicles v ON e.vehicle_id = v.id
        LEFT JOIN users u ON e.driver_id = u.id
        LEFT JOIN vehicle_idling_thresholds t ON (
          e.vehicle_id = t.vehicle_id OR v.type = t.vehicle_type
        )
        WHERE e.end_time IS NULL
      `);

      for (const event of result.rows) {
        const duration = event.current_duration_seconds;
        const { warning_threshold_seconds, alert_threshold_seconds, critical_threshold_seconds } = event;

        // Skip if no thresholds configured
        if (!warning_threshold_seconds) continue;

        // Determine severity level
        let severityLevel: 'warning' | 'alert' | 'critical' | null = null;

        if (duration >= critical_threshold_seconds) {
          severityLevel = 'critical';
        } else if (duration >= alert_threshold_seconds) {
          severityLevel = 'alert';
        } else if (duration >= warning_threshold_seconds) {
          severityLevel = 'warning';
        }

        if (severityLevel) {
          await this.triggerIdlingAlert(event.id, event.vehicle_id, event.driver_id, severityLevel, duration, event);
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Trigger an idling alert
   */
  private async triggerIdlingAlert(
    eventId: number,
    vehicleId: number,
    driverId: number | null,
    severity: 'warning' | 'alert' | 'critical',
    durationSeconds: number,
    eventData: any
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Check if alert already sent for this severity level
      const existing = await client.query(
        `SELECT id FROM vehicle_idling_alerts
         WHERE idling_event_id = $1 AND alert_level = $2',
        [eventId, severity]
      );

      if (existing.rows.length > 0) {
        return; // Already sent
      }

      const durationMinutes = Math.round(durationSeconds / 60);
      const message = '${severity.toUpperCase()}: Vehicle "${eventData.vehicle_name}" has been idling for ${durationMinutes} minutes. Driver: ${eventData.driver_name || 'Unknown'}';

      // Insert alert log
      await client.query(
        `INSERT INTO vehicle_idling_alerts (
          idling_event_id, vehicle_id, driver_id, alert_level, alert_type, message
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [eventId, vehicleId, driverId, severity, 'duration', message]
      );

      // Mark event as alerted
      await client.query(
        `UPDATE vehicle_idling_events
         SET alert_triggered = true, alert_sent_at = NOW()
         WHERE id = $1',
        [eventId]
      );

      console.log(`[IdlingService] ${severity.toUpperCase()} alert triggered for event ${eventId}`);

      // Emit for real-time notifications
      this.emit('idling:alert', {
        event_id: eventId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        severity,
        duration_seconds: durationSeconds,
        message
      });
    } finally {
      client.release();
    }
  }

  /**
   * Update daily summary for a vehicle/driver
   */
  private async updateDailySummary(vehicleId: number, driverId: number | null, date: Date): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO vehicle_idling_daily_summary (
          vehicle_id, driver_id, summary_date,
          total_idle_events, total_idle_seconds,
          total_fuel_wasted_gallons, total_fuel_cost_usd, total_co2_kg
        )
        SELECT
          vehicle_id,
          driver_id,
          DATE($3) AS summary_date,
          COUNT(*) AS total_idle_events,
          SUM(duration_seconds) AS total_idle_seconds,
          SUM(estimated_fuel_wasted_gallons) AS total_fuel_wasted_gallons,
          SUM(estimated_fuel_cost_usd) AS total_fuel_cost_usd,
          SUM(estimated_co2_kg) AS total_co2_kg
        FROM vehicle_idling_events
        WHERE vehicle_id = $1
          AND driver_id = $2
          AND DATE(start_time) = DATE($3)
          AND duration_seconds IS NOT NULL
        GROUP BY vehicle_id, driver_id
        ON CONFLICT (vehicle_id, driver_id, summary_date)
        DO UPDATE SET
          total_idle_events = EXCLUDED.total_idle_events,
          total_idle_seconds = EXCLUDED.total_idle_seconds,
          total_fuel_wasted_gallons = EXCLUDED.total_fuel_wasted_gallons,
          total_fuel_cost_usd = EXCLUDED.total_fuel_cost_usd,
          total_co2_kg = EXCLUDED.total_co2_kg,
          updated_at = CURRENT_TIMESTAMP`,
        [vehicleId, driverId, date]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Reverse geocode location (stub - integrate with Azure Maps or Google Maps)
   */
  private async reverseGeocodeLocation(eventId: number, latitude: number, longitude: number): Promise<void> {
    // TODO: Integrate with Azure Maps API or Google Maps Geocoding API
    // For now, just update with coordinates as string
    const locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE vehicle_idling_events
         SET location_name = $1
         WHERE id = $2',
        [locationName, eventId]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get active idling events
   */
  async getActiveIdlingEvents(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`SELECT * FROM active_idling_events`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get idling history for a vehicle
   */
  async getVehicleIdlingHistory(vehicleId: number, days: number = 30): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM vehicle_idling_events
         WHERE vehicle_id = $1
           AND start_time >= CURRENT_DATE - INTERVAL '${days} days'
         ORDER BY start_time DESC`,
        [vehicleId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get idling statistics for a vehicle
   */
  async getVehicleIdlingStats(vehicleId: number, days: number = 30): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
          COUNT(*) AS total_idle_events,
          SUM(duration_seconds) AS total_idle_seconds,
          ROUND((SUM(duration_seconds) / 3600.0)::NUMERIC, 2) AS total_idle_hours,
          ROUND(AVG(duration_seconds)::NUMERIC, 0) AS avg_idle_duration_seconds,
          MAX(duration_seconds) AS max_idle_duration_seconds,
          ROUND(SUM(estimated_fuel_wasted_gallons)::NUMERIC, 2) AS total_fuel_wasted_gallons,
          ROUND(SUM(estimated_fuel_cost_usd)::NUMERIC, 2) AS total_fuel_cost_usd,
          ROUND(SUM(estimated_co2_kg)::NUMERIC, 2) AS total_co2_kg
        FROM vehicle_idling_events
        WHERE vehicle_id = $1
          AND start_time >= CURRENT_DATE - INTERVAL '${days} days'
          AND duration_seconds IS NOT NULL`,
        [vehicleId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get fleet-wide idling statistics
   */
  async getFleetIdlingStats(days: number = 30): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
          COUNT(*) AS total_idle_events,
          COUNT(DISTINCT vehicle_id) AS vehicles_with_idling,
          COUNT(DISTINCT driver_id) AS drivers_with_idling,
          SUM(duration_seconds) AS total_idle_seconds,
          ROUND((SUM(duration_seconds) / 3600.0)::NUMERIC, 2) AS total_idle_hours,
          ROUND(AVG(duration_seconds)::NUMERIC, 0) AS avg_idle_duration_seconds,
          ROUND(SUM(estimated_fuel_wasted_gallons)::NUMERIC, 2) AS total_fuel_wasted_gallons,
          ROUND(SUM(estimated_fuel_cost_usd)::NUMERIC, 2) AS total_fuel_cost_usd,
          ROUND(SUM(estimated_co2_kg)::NUMERIC, 2) AS total_co2_kg
        FROM vehicle_idling_events
        WHERE start_time >= CURRENT_DATE - INTERVAL '${days} days'
          AND duration_seconds IS NOT NULL`
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get top idling vehicles
   */
  async getTopIdlingVehicles(limit: number = 10, days: number = 30): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM top_idling_vehicles_30d LIMIT $1',
        [limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get driver idling performance
   */
  async getDriverIdlingPerformance(limit: number = 10, days: number = 30): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM driver_idling_performance_30d LIMIT $1',
        [limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Manually report idling event (from driver or supervisor)
   */
  async reportManualIdlingEvent(event: IdlingEvent): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO vehicle_idling_events (
          vehicle_id, driver_id, start_time, end_time, duration_seconds,
          latitude, longitude, location_name, idle_type,
          is_authorized, driver_notes, data_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id',
        [
          event.vehicle_id,
          event.driver_id,
          event.start_time,
          event.end_time,
          event.duration_seconds,
          event.latitude,
          event.longitude,
          event.location_name,
          event.idle_type || 'unknown',
          event.is_authorized || false,
          event.driver_notes,
          'manual'
        ]
      );

      const eventId = result.rows[0].id;
      console.log(`[IdlingService] Manual idling event ${eventId} reported`);

      return eventId;
    } finally {
      client.release();
    }
  }

  /**
   * Get active idling event for specific vehicle
   */
  async getActiveIdlingEvent(vehicleId: number): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM active_idling_events WHERE vehicle_id = $1',
        [vehicleId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get vehicle idling history with pagination
   */
  async getVehicleIdlingHistory(
    vehicleId: number,
    days: number = 30,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM vehicle_idling_events
         WHERE vehicle_id = $1
           AND start_time >= NOW() - INTERVAL '${days} days'
         ORDER BY start_time DESC
         LIMIT $2 OFFSET $3',
        [vehicleId, limit, offset]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get driver idling history with pagination
   */
  async getDriverIdlingHistory(
    driverId: number,
    days: number = 30,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM vehicle_idling_events
         WHERE driver_id = $1
           AND start_time >= NOW() - INTERVAL '${days} days'
         ORDER BY start_time DESC
         LIMIT $2 OFFSET $3',
        [driverId, limit, offset]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Create manual idling event (wrapper for reportManualIdlingEvent)
   */
  async createManualIdlingEvent(eventData: Partial<IdlingEvent>): Promise<number> {
    const event: IdlingEvent = {
      vehicle_id: eventData.vehicleId!,
      driver_id: eventData.driverId,
      start_time: eventData.startTime!,
      end_time: eventData.endTime,
      latitude: eventData.latitude,
      longitude: eventData.longitude,
      idle_type: eventData.idleType,
      driver_notes: eventData.driverNotes
    };

    return this.reportManualIdlingEvent(event);
  }

  /**
   * Get vehicle thresholds
   */
  async getVehicleThresholds(vehicleId: number): Promise<IdlingThreshold> {
    const client = await this.pool.connect();
    try {
      // Try to get vehicle-specific thresholds first
      let result = await client.query(
        'SELECT * FROM vehicle_idling_thresholds WHERE vehicle_id = $1',
        [vehicleId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Fall back to vehicle type thresholds
      result = await client.query(
        `SELECT t.* FROM vehicle_idling_thresholds t
         INNER JOIN vehicles v ON t.vehicle_type = v.type
         WHERE v.id = $1
         LIMIT 1`,
        [vehicleId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Return default thresholds
      return {
        warning_threshold_seconds: 300,
        alert_threshold_seconds: 600,
        critical_threshold_seconds: 1800,
        fuel_consumption_rate_gph: 0.25,
        avg_fuel_price_per_gallon: 3.50,
        co2_kg_per_gallon: 8.89,
        send_driver_alert: true,
        send_manager_alert: true
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update vehicle thresholds
   */
  async updateVehicleThresholds(vehicleId: number, updates: Partial<IdlingThreshold>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (updates.warning_threshold_seconds !== undefined) {
        fields.push(`warning_threshold_seconds = $${paramIndex++}`);
        values.push(updates.warning_threshold_seconds);
      }
      if (updates.alert_threshold_seconds !== undefined) {
        fields.push(`alert_threshold_seconds = $${paramIndex++}`);
        values.push(updates.alert_threshold_seconds);
      }
      if (updates.critical_threshold_seconds !== undefined) {
        fields.push(`critical_threshold_seconds = $${paramIndex++}`);
        values.push(updates.critical_threshold_seconds);
      }
      if (updates.fuel_consumption_rate_gph !== undefined) {
        fields.push(`fuel_consumption_rate_gph = $${paramIndex++}`);
        values.push(updates.fuel_consumption_rate_gph);
      }
      if (updates.avg_fuel_price_per_gallon !== undefined) {
        fields.push(`avg_fuel_price_per_gallon = $${paramIndex++}`);
        values.push(updates.avg_fuel_price_per_gallon);
      }
      if (updates.send_driver_alert !== undefined) {
        fields.push(`send_driver_alert = $${paramIndex++}`);
        values.push(updates.send_driver_alert);
      }
      if (updates.send_manager_alert !== undefined) {
        fields.push(`send_manager_alert = $${paramIndex++}`);
        values.push(updates.send_manager_alert);
      }

      if (fields.length === 0) {
        return; // Nothing to update
      }

      values.push(vehicleId);

      await client.query(
        'INSERT INTO vehicle_idling_thresholds (vehicle_id, ${fields.join(', ').replace(/\s*=\s*\$\d+/g, '')})
         VALUES ($${paramIndex}, ${values.slice(0, -1).map((_, i) => '$${i + 1}').join(', ')})
         ON CONFLICT (vehicle_id) DO UPDATE SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP',
        values
      );

      console.log(`[IdlingService] Updated thresholds for vehicle ${vehicleId}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get recent idling alerts
   */
  async getRecentAlerts(limit: number = 50, unacknowledgedOnly: boolean = false): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      let query = `SELECT * FROM vehicle_idling_alerts`;
      if (unacknowledgedOnly) {
        query += ` WHERE acknowledged = false`;
      }
      query += ` ORDER BY created_at DESC LIMIT $1`;

      const result = await client.query(query, [limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Acknowledge an idling alert
   */
  async acknowledgeAlert(alertId: number, userId?: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE vehicle_idling_alerts
         SET acknowledged = true,
             acknowledged_by = $1,
             acknowledged_at = CURRENT_TIMESTAMP
         WHERE id = $2',
        [userId, alertId]
      );

      console.log(`[IdlingService] Alert ${alertId} acknowledged by user ${userId}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get monthly idling report
   */
  async getMonthlyIdlingReport(months: number = 12): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM fleet_idling_costs_monthly
         WHERE month >= DATE_TRUNC('month', NOW() - INTERVAL '${months} months')
         ORDER BY month DESC`
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
}

export default VehicleIdlingService;
