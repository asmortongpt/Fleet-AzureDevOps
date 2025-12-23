import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

// Define the VehicleHistory interface
interface VehicleHistory {
  id: number;
  vehicle_id: number;
  event_date: Date;
  event_type: string;
  description: string;
  tenant_id: number;
}

// VehicleHistoryRepository class
export class VehicleHistoryRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('vehicle_history', pool);
    this.pool = pool;
  }

  // Create a new vehicle history entry
  async create(vehicleHistory: Omit<VehicleHistory, 'id'>, tenantId: number): Promise<VehicleHistory> {
    const query = `
      INSERT INTO vehicle_history (vehicle_id, event_date, event_type, description, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      vehicleHistory.vehicle_id,
      vehicleHistory.event_date,
      vehicleHistory.event_type,
      vehicleHistory.description,
      tenantId
    ];

    const result: QueryResult<VehicleHistory> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a vehicle history entry by id
  async read(id: number, tenantId: number): Promise<VehicleHistory | null> {
    const query = `
      SELECT id, created_at, updated_at FROM vehicle_history
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];

    const result: QueryResult<VehicleHistory> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a vehicle history entry
  async update(id: number, vehicleHistory: Partial<VehicleHistory>, tenantId: number): Promise<VehicleHistory | null> {
    const setClause = Object.keys(vehicleHistory)
      .filter(key => key !== 'id' && key !== 'tenant_id')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE vehicle_history
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(vehicleHistory).length + 2}
      RETURNING *
    `;
    const values = [
      id,
      ...Object.values(vehicleHistory).filter(key => key !== 'id' && key !== 'tenant_id'),
      tenantId
    ];

    const result: QueryResult<VehicleHistory> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a vehicle history entry
  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      DELETE FROM vehicle_history
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenantId];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // List all vehicle history entries for a tenant
  async list(tenantId: number): Promise<VehicleHistory[]> {
    const query = `
      SELECT id, created_at, updated_at FROM vehicle_history
      WHERE tenant_id = $1
      ORDER BY event_date DESC
    `;
    const values = [tenantId];

    const result: QueryResult<VehicleHistory> = await this.pool.query(query, values);
    return result.rows;
  }
}