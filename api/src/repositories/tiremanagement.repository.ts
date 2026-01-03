import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

// Define the interface for tire management data
interface TireManagement {
  id: number;
  tire_id: string;
  vehicle_id: string;
  installation_date: Date;
  removal_date: Date | null;
  mileage_at_installation: number;
  mileage_at_removal: number | null;
  condition: string;
  notes: string;
  tenant_id: number;
}

// TireManagementRepository class
export class TireManagementRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('tire_management', pool);
    this.pool = pool;
  }

  // Create a new tire management record
  async create(tireManagement: Omit<TireManagement, 'id'>): Promise<TireManagement> {
    const query = `
      INSERT INTO tire_management (
        tire_id, vehicle_id, installation_date, removal_date, 
        mileage_at_installation, mileage_at_removal, condition, notes, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      tireManagement.tire_id,
      tireManagement.vehicle_id,
      tireManagement.installation_date,
      tireManagement.removal_date,
      tireManagement.mileage_at_installation,
      tireManagement.mileage_at_removal,
      tireManagement.condition,
      tireManagement.notes,
      tireManagement.tenant_id
    ];

    const result: QueryResult<TireManagement> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a tire management record by ID
  async read(id: number, tenant_id: number): Promise<TireManagement | null> {
    const query = `
      SELECT id, created_at, updated_at FROM tire_management
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult<TireManagement> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a tire management record
  async update(id: number, tireManagement: Partial<TireManagement>, tenant_id: number): Promise<TireManagement | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(tireManagement).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'tenant_id') {
        updateFields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    values.push(id);
    values.push(tenant_id);

    const query = `
      UPDATE tire_management
      SET ${updateFields.join(', ')}
      WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
      RETURNING *
    `;

    const result: QueryResult<TireManagement> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a tire management record
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM tire_management
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // List all tire management records for a tenant
  async list(tenant_id: number): Promise<TireManagement[]> {
    const query = `
      SELECT id, created_at, updated_at FROM tire_management
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];

    const result: QueryResult<TireManagement> = await this.pool.query(query, values);
    return result.rows;
  }
}