import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface DriverQualification {
  id: number;
  tenant_id: number;
  driver_id: number;
  qualification_type: string;
  issuing_authority: string;
  issue_date: Date;
  expiration_date: Date;
  created_at: Date;
  updated_at: Date;
}

export class DriverQualificationRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('driver_qualifications', pool);
    this.pool = pool;
  }

  async create(tenantId: number, qualification: Omit<DriverQualification, 'id' | 'created_at' | 'updated_at'>): Promise<DriverQualification> {
    const query = `
      INSERT INTO driver_qualifications (tenant_id, driver_id, qualification_type, issuing_authority, issue_date, expiration_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      qualification.driver_id,
      qualification.qualification_type,
      qualification.issuing_authority,
      qualification.issue_date,
      qualification.expiration_date
    ];
    const result: QueryResult<DriverQualification> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async readById(tenantId: number, id: number): Promise<DriverQualification | null> {
    const query = `SELECT id, tenant_id, driver_id, qualification_type, issuing_authority, issue_date, expiration_date, created_at, updated_at FROM driver_qualifications WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<DriverQualification> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async readAll(tenantId: number): Promise<DriverQualification[]> {
    const query = `SELECT id, tenant_id, driver_id, qualification_type, issuing_authority, issue_date, expiration_date, created_at, updated_at FROM driver_qualifications WHERE tenant_id = $1 ORDER BY issue_date DESC`;
    const result: QueryResult<DriverQualification> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, qualification: Partial<DriverQualification>): Promise<DriverQualification | null> {
    const setClause = Object.keys(qualification)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.readById(tenantId, id);
    }

    const query = `UPDATE driver_qualifications SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(qualification)];
    const result: QueryResult<DriverQualification> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM driver_qualifications WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}