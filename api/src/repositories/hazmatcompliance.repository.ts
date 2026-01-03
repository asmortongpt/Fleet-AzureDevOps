import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface HazmatCompliance {
  id: number;
  tenant_id: number;
  driver_id: number;
  vehicle_id: number;
  license_number: string;
  hazmat_type: string;
  expiry_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class HazmatComplianceRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('hazmat_compliance', pool);
    this.pool = pool;
  }

  async createHazmatCompliance(tenantId: number, hazmatComplianceData: Omit<HazmatCompliance, 'id' | 'created_at' | 'updated_at'>): Promise<HazmatCompliance> {
    const query = `
      INSERT INTO hazmat_compliance (tenant_id, driver_id, vehicle_id, license_number, hazmat_type, expiry_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      hazmatComplianceData.driver_id,
      hazmatComplianceData.vehicle_id,
      hazmatComplianceData.license_number,
      hazmatComplianceData.hazmat_type,
      hazmatComplianceData.expiry_date,
      hazmatComplianceData.status
    ];
    const result: QueryResult<HazmatCompliance> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getHazmatCompliances(tenantId: number): Promise<HazmatCompliance[]> {
    const query = `SELECT id, tenant_id, driver_id, vehicle_id, license_number, hazmat_type, expiry_date, status, created_at, updated_at FROM hazmat_compliance WHERE tenant_id = $1`;
    const result: QueryResult<HazmatCompliance> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getHazmatComplianceById(tenantId: number, id: number): Promise<HazmatCompliance | null> {
    const query = `SELECT id, tenant_id, driver_id, vehicle_id, license_number, hazmat_type, expiry_date, status, created_at, updated_at FROM hazmat_compliance WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<HazmatCompliance> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async updateHazmatCompliance(tenantId: number, id: number, hazmatComplianceData: Partial<HazmatCompliance>): Promise<HazmatCompliance | null> {
    const setClause = Object.keys(hazmatComplianceData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getHazmatComplianceById(tenantId, id);
    }

    const query = `
      UPDATE hazmat_compliance
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(hazmatComplianceData)];
    const result: QueryResult<HazmatCompliance> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteHazmatCompliance(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM hazmat_compliance WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}