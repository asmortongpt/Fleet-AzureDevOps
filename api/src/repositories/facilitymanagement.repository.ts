import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface FacilityManagement {
  id: number;
  tenant_id: number;
  name: string;
  address: string;
  manager_id: number;
  capacity: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class FacilityManagementRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('facility_management', pool);
    this.pool = pool;
  }

  async create(tenantId: number, facilityManagement: Omit<FacilityManagement, 'id' | 'created_at' | 'updated_at'>): Promise<FacilityManagement> {
    const query = `
      INSERT INTO facility_management (tenant_id, name, address, manager_id, capacity, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      facilityManagement.name,
      facilityManagement.address,
      facilityManagement.manager_id,
      facilityManagement.capacity,
      facilityManagement.status
    ];
    const result: QueryResult<FacilityManagement> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number): Promise<FacilityManagement[]> {
    const query = `SELECT id, tenant_id, name, address, manager_id, capacity, status, created_at, updated_at FROM facility_management WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const result: QueryResult<FacilityManagement> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, facilityManagement: Partial<FacilityManagement>): Promise<FacilityManagement | null> {
    const setClause = Object.keys(facilityManagement)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return null;
    }

    const query = `UPDATE facility_management SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(facilityManagement)];
    const result: QueryResult<FacilityManagement> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM facility_management WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}