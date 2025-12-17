import { Pool } from 'pg';

import logger from '@/utils/logger';
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
          SELECT * FROM vehicle_telemetry
          WHERE vehicle_id = ms.vehicle_id
          ORDER BY timestamp DESC
          LIMIT 1
        ) vt
        WHERE ms.next_due < $1
      `;
      const result = await this.pool.query(query, [nextDueDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching maintenance schedules with telemetry:', error);
      throw new Error('Database query failed');
    }
  }
}