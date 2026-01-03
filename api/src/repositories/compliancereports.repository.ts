import { Pool } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export interface ComplianceReport {
  id: number;
  tenant_id: number;
  report_name: string;
  report_data: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class ComplianceReportsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<ComplianceReport[]> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM compliance_reports WHERE tenant_id = $1 AND deleted_at IS NULL';
      const result = await this.pool.query<ComplianceReport>(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch compliance reports: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<ComplianceReport | null> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM compliance_reports WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result = await this.pool.query<ComplianceReport>(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch compliance report by ID: ${error.message}`);
    }
  }

  async create(tenantId: number, report: Omit<ComplianceReport, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<ComplianceReport> {
    try {
      const query = 'INSERT INTO compliance_reports (tenant_id, report_name, report_data) VALUES ($1, $2, $3) RETURNING *';
      const result = await this.pool.query<ComplianceReport>(query, [tenantId, report.report_name, report.report_data]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create compliance report: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, report: Partial<Omit<ComplianceReport, 'id' | 'tenant_id' | 'created_at' | 'deleted_at'>>): Promise<ComplianceReport> {
    try {
      const setClause = Object.keys(report).map((key, index) => `${key} = $${index + 3}`).join(', ');
      const query = `UPDATE compliance_reports SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *`;
      const values = [tenantId, id, ...Object.values(report)];
      const result = await this.pool.query<ComplianceReport>(query, values);
      if (result.rowCount === 0) {
        throw new Error('Compliance report not found or already deleted');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update compliance report: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<void> {
    try {
      const query = 'UPDATE compliance_reports SET deleted_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result = await this.pool.query(query, [tenantId, id]);
      if (result.rowCount === 0) {
        throw new Error('Compliance report not found or already deleted');
      }
    } catch (error) {
      throw new Error(`Failed to soft delete compliance report: ${error.message}`);
    }
  }
}
