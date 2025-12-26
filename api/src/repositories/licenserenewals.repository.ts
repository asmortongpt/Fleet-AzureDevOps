import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface LicenseRenewal {
  id: number;
  tenant_id: number;
  driver_id: number;
  license_number: string;
  expiry_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class LicenseRenewalsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('license_renewals', pool);
    this.pool = pool;
  }

  async createLicenseRenewal(tenantId: number, licenseRenewalData: Omit<LicenseRenewal, 'id' | 'created_at' | 'updated_at'>): Promise<LicenseRenewal> {
    const query = `
      INSERT INTO license_renewals (tenant_id, driver_id, license_number, expiry_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      licenseRenewalData.driver_id,
      licenseRenewalData.license_number,
      licenseRenewalData.expiry_date,
      licenseRenewalData.status
    ];
    const result: QueryResult<LicenseRenewal> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getLicenseRenewals(tenantId: number): Promise<LicenseRenewal[]> {
    const query = `SELECT id, tenant_id, driver_id, license_number, expiry_date, status, created_at, updated_at FROM license_renewals WHERE tenant_id = $1`;
    const result: QueryResult<LicenseRenewal> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getLicenseRenewalById(tenantId: number, id: number): Promise<LicenseRenewal | null> {
    const query = `SELECT id, tenant_id, driver_id, license_number, expiry_date, status, created_at, updated_at FROM license_renewals WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<LicenseRenewal> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async updateLicenseRenewal(tenantId: number, id: number, licenseRenewalData: Partial<LicenseRenewal>): Promise<LicenseRenewal | null> {
    const setClause = Object.keys(licenseRenewalData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getLicenseRenewalById(tenantId, id);
    }

    const query = `
      UPDATE license_renewals
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(licenseRenewalData)];
    const result: QueryResult<LicenseRenewal> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteLicenseRenewal(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM license_renewals WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}