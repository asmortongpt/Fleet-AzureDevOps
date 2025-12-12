import { BaseRepository } from './BaseRepository';

/**
 * Fuel Transactions Repository - Alias
 * This is an alias to fuel.repository.ts for naming consistency
 */
export * from './fuel.repository'

/**
 * N+1 PREVENTION: Fetch fuel transaction with vehicle and driver
 */
async findWithVehicleAndDriver(id: string, tenantId: string) {
  const query = `
    SELECT
      ft.id, ft.date, ft.gallons, ft.cost, ft.odometer, ft.location,
      v.id as vehicle_id, v.make as vehicle_make, v.model as vehicle_model, v.vin as vehicle_vin,
      d.id as driver_id, d.name as driver_name
    FROM fuel_transactions ft
    LEFT JOIN vehicles v ON ft.vehicle_id = v.id
    LEFT JOIN drivers d ON ft.driver_id = d.id
    WHERE ft.id = $1 AND ft.tenant_id = $2 AND ft.deleted_at IS NULL
  `;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}
