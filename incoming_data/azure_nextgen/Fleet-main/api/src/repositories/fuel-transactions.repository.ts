import { Pool } from 'pg';

import { BaseRepository } from './base/BaseRepository';

/**
 * Fuel Transactions Repository
 * Extends BaseRepository for consistent pattern compliance
 */
export class FuelTransactionsRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'fuel_transactions');
  }

  /**
   * N+1 PREVENTION: Fetch fuel transaction with vehicle and driver
   */
  async findWithVehicleAndDriver(id: string, tenantId: string) {
    const query = `
      SELECT
        ft.id, ft.date, ft.gallons, ft.cost, ft.odometer, ft.location, ft.tenant_id,
        v.id as vehicle_id, v.make as vehicle_make, v.model as vehicle_model, v.vin as vehicle_vin,
        d.id as driver_id, d.name as driver_name
      FROM fuel_transactions ft
      LEFT JOIN vehicles v ON ft.vehicle_id = v.id
      LEFT JOIN drivers d ON ft.driver_id = d.id
      WHERE ft.id = $1 AND ft.tenant_id = $2 AND ft.deleted_at IS NULL
    `;
    const result = await this.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Get all fuel transactions with related data
   */
  async findAllWithVehicleAndDriver(tenantId: string) {
    const query = `
      SELECT
        ft.*,
        v.make as vehicle_make, v.model as vehicle_model,
        d.name as driver_name
      FROM fuel_transactions ft
      LEFT JOIN vehicles v ON ft.vehicle_id = v.id
      LEFT JOIN drivers d ON ft.driver_id = d.id
      WHERE ft.tenant_id = $1 AND ft.deleted_at IS NULL
      ORDER BY ft.date DESC
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }
}

// Also export from fuel.repository for backward compatibility
export * from './fuel.repository';
