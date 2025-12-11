import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';

export interface IVehicleGroup {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class VehicleGroupsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Fetch all vehicle groups
   * @param tenantId 
   * @param filters 
   * @returns 
   */
  async findAll(tenantId: number, filters?: any): Promise<IVehicleGroup[]> {
    try {
      const query = `
        SELECT id, created_at, updated_at FROM vehicle_groups
        WHERE tenant_id = $1
        AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('Failed to fetch records');
    }
  }

  /**
   * Fetch a vehicle group by id
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async findById(id: number, tenantId: number): Promise<IVehicleGroup | null> {
    const query = `
      SELECT id, created_at, updated_at FROM vehicle_groups
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a vehicle group
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async create(data: Partial<IVehicleGroup>, tenantId: number): Promise<IVehicleGroup> {
    const query = `
      INSERT INTO vehicle_groups (tenant_id, name, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.pool.query(query, [tenantId, data.name]);
    return result.rows[0];
  }

  /**
   * Update a vehicle group
   * @param id 
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async update(id: number, data: Partial<IVehicleGroup>, tenantId: number): Promise<IVehicleGroup> {
    const query = `
      UPDATE vehicle_groups
      SET name = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [data.name, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Soft delete a vehicle group
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      UPDATE vehicle_groups
      SET deleted_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}
