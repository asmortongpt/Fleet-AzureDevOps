import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface EquipmentTracking {
  id: number;
  tenant_id: number;
  equipment_id: number;
  location: string;
  status: string;
  last_updated: Date;
  created_at: Date;
  updated_at: Date;
}

export class EquipmentTrackingRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('equipment_tracking', pool);
    this.pool = pool;
  }

  async create(tenantId: number, equipmentTracking: Omit<EquipmentTracking, 'id' | 'created_at' | 'updated_at' | 'last_updated'>): Promise<EquipmentTracking> {
    const query = `
      INSERT INTO equipment_tracking (tenant_id, equipment_id, location, status, last_updated, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      equipmentTracking.equipment_id,
      equipmentTracking.location,
      equipmentTracking.status
    ];
    const result: QueryResult<EquipmentTracking> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, equipmentId?: number): Promise<EquipmentTracking[]> {
    let query = `SELECT id, tenant_id, equipment_id, location, status, last_updated, created_at, updated_at FROM equipment_tracking WHERE tenant_id = $1`;
    const values = [tenantId];

    if (equipmentId) {
      query += ` AND equipment_id = $2`;
      values.push(equipmentId);
    }

    query += ` ORDER BY last_updated DESC`;

    const result: QueryResult<EquipmentTracking> = await this.pool.query(query, values);
    return result.rows;
  }

  async update(tenantId: number, id: number, equipmentTracking: Partial<EquipmentTracking>): Promise<EquipmentTracking | null> {
    const setClause = Object.keys(equipmentTracking)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return null;
    }

    const query = `UPDATE equipment_tracking SET ${setClause}, last_updated = NOW(), updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(equipmentTracking)];
    const result: QueryResult<EquipmentTracking> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM equipment_tracking WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}