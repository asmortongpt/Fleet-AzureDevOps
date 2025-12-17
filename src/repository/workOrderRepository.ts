import { Pool } from 'pg';

import logger from '@/utils/logger';
/**
 * WorkOrderRepository handles database operations related to work orders.
 */
export class WorkOrderRepository {
  private pool: Pool;

  /**
   * @param {Pool} pool - The PostgreSQL connection pool.
   */
  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Retrieves work orders with associated vehicles and technicians.
   * @param {string} tenantId - The tenant identifier.
   * @returns {Promise<any[]>} - A promise that resolves to an array of work orders with vehicles and technicians.
   */
  async getWorkOrdersWithDetails(tenantId: string): Promise<any[]> {
    try {
      const query = `
        SELECT
          wo.id, wo.work_order_number, wo.type, wo.priority, wo.status,
          wo.description, wo.scheduled_start, wo.created_at,
          v.id AS vehicle_id, v.make, v.model, v.vin,
          u.id AS technician_id, u.first_name, u.last_name, u.email
        FROM work_orders wo
        LEFT JOIN vehicles v ON wo.vehicle_id = v.id
        LEFT JOIN users u ON wo.assigned_technician_id = u.id
        WHERE wo.tenant_id = $1
        ORDER BY wo.created_at DESC
      `;
      const result = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching work orders with details:', error);
      throw new Error('Database query failed');
    }
  }
}