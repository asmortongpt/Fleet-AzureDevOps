import { Pool } from 'pg';

/**
 * MaintenanceRepository handles database operations related to maintenance schedules.
 */
export class MaintenanceRepository {
  private pool: Pool;

  /**
   * @param {Pool} pool - The PostgreSQL connection pool.
   */
  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Retrieves maintenance schedules with the latest telemetry data.
   * @param {Date} nextDueDate - The date to filter maintenance schedules.
   * @returns {Promise<any[]>} - A promise that resolves to an array of maintenance schedules with telemetry.
   */
  async getMaintenanceSchedulesWithTelemetry(nextDueDate: Date): Promise<any[]> {
    try {
      const query = `
        SELECT ms.*, vt.*
        FROM maintenance_schedules ms
        CROSS JOIN LATERAL (
          SELECT id, vehicle_id, provider_id, timestamp, latitude, longitude, heading, speed_mph, altitude_ft, address, odometer_miles, fuel_percent, fuel_gallons, battery_percent, battery_voltage_12v, engine_rpm, engine_state, engine_hours, temperature_f, temperature_probe_1, temperature_probe_2, temperature_probe_3, tire_pressure_fl, tire_pressure_fr, tire_pressure_rl, tire_pressure_rr, oil_life_percent, coolant_temp_f, is_charging, charge_rate_kw, estimated_range_miles, raw_data, created_at FROM vehicle_telemetry
          WHERE vehicle_id = ms.vehicle_id
          ORDER BY timestamp DESC
          LIMIT 1
        ) vt
        WHERE ms.next_due < $1
      `;
      const result = await this.pool.query(query, [nextDueDate]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching maintenance schedules with telemetry:', error);
      throw new Error('Database query failed');
    }
  }
}