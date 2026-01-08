import { Pool } from 'pg';

import logger from '@/utils/logger';
/**
 * VehicleRepository handles database operations related to vehicles.
 */
export class VehicleRepository {
  private pool: Pool;

  /**
   * @param {Pool} pool - The PostgreSQL connection pool.
   */
  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Retrieves vehicles with their associated drivers.
   * @param {string} tenantId - The tenant identifier.
   * @returns {Promise<any[]>} - A promise that resolves to an array of vehicles with drivers.
   */
  async getVehiclesWithDrivers(tenantId: string): Promise<any[]> {
    try {
      const query = `
        SELECT vehicles.*, users.id AS driver_id, users.name AS driver_name
        FROM vehicles
        JOIN users ON vehicles.driver_id = users.id
        WHERE vehicles.tenant_id = $1
      `;
      const result = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching vehicles with drivers:', error);
      throw new Error('Database query failed');
    }
  }
}