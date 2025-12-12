import { BaseRepository } from './BaseRepository';

import { Pool } from 'pg';

class EnvironmentalComplianceRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createEnvironmentalCompliance(data: {
    tenant_id: string;
    facility_id: string;
    compliance_status: string;
    compliance_date: Date;
    notes: string;
  }): Promise<number> {
    const query = `
      INSERT INTO environmental_compliance (tenant_id, facility_id, compliance_status, compliance_date, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const values = [
      data.tenant_id,
      data.facility_id,
      data.compliance_status,
      data.compliance_date,
      data.notes,
    ];
    const result = await this.query(query, values);
    return result.rows[0].id;
  }

  async getEnvironmentalComplianceById(id: number, tenant_id: string): Promise<any> {
    const query = `
      SELECT id, created_at, updated_at FROM environmental_compliance
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getAllEnvironmentalCompliances(tenant_id: string): Promise<any[]> {
    const query = `
      SELECT id, created_at, updated_at FROM environmental_compliance
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];
    const result = await this.query(query, values);
    return result.rows;
  }

  async updateEnvironmentalCompliance(id: number, data: {
    tenant_id: string;
    facility_id: string;
    compliance_status: string;
    compliance_date: Date;
    notes: string;
  }): Promise<void> {
    const query = `
      UPDATE environmental_compliance
      SET facility_id = $2, compliance_status = $3, compliance_date = $4, notes = $5
      WHERE id = $1 AND tenant_id = $6
    `;
    const values = [
      id,
      data.facility_id,
      data.compliance_status,
      data.compliance_date,
      data.notes,
      data.tenant_id,
    ];
    await this.query(query, values);
  }

  async deleteEnvironmentalCompliance(id: number, tenant_id: string): Promise<void> {
    const query = `
      DELETE FROM environmental_compliance
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    await this.query(query, values);
  }
}

export default EnvironmentalComplianceRepository;