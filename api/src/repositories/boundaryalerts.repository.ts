import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface BoundaryAlert {
  id: number;
  tenant_id: string;
  name: string;
  description: string;
  boundary_type: string;
  coordinates: any;
  created_at: Date;
  updated_at: Date;
}

export class BoundaryAlertsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('boundary_alerts', pool);
    this.pool = pool;
  }

  async create(tenantId: string, boundaryAlert: Omit<BoundaryAlert, 'id' | 'created_at' | 'updated_at'>): Promise<BoundaryAlert> {
    const query = `
      INSERT INTO boundary_alerts (tenant_id, name, description, boundary_type, coordinates, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      boundaryAlert.name,
      boundaryAlert.description,
      boundaryAlert.boundary_type,
      boundaryAlert.coordinates
    ];
    const result: QueryResult<BoundaryAlert> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getById(tenantId: string, id: number): Promise<BoundaryAlert | null> {
    const query = `
      SELECT id, tenant_id, name, description, boundary_type, coordinates, created_at, updated_at
      FROM boundary_alerts
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<BoundaryAlert> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async getAll(tenantId: string): Promise<BoundaryAlert[]> {
    const query = `
      SELECT id, tenant_id, name, description, boundary_type, coordinates, created_at, updated_at
      FROM boundary_alerts
      WHERE tenant_id = $1
    `;
    const result: QueryResult<BoundaryAlert> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: string, id: number, boundaryAlert: Partial<BoundaryAlert>): Promise<BoundaryAlert | null> {
    const setClause = Object.keys(boundaryAlert)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getById(tenantId, id);
    }

    const query = `UPDATE boundary_alerts SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(boundaryAlert)];
    const result: QueryResult<BoundaryAlert> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM boundary_alerts
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}