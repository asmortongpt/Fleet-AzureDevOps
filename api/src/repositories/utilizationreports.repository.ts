import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

interface UtilizationReport {
  id: number;
  tenant_id: number;
  report_date: Date;
  usage_hours: number;
  cost: number;
  // Add other fields as needed
}

export class UtilizationReportsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('utilization_reports', pool);
    this.pool = pool;
  }

  /**
   * Create a new utilization report
   * @param report - The utilization report to create
   * @returns The created utilization report
   */
  async create(report: Omit<UtilizationReport, 'id'>): Promise<UtilizationReport> {
    const query = `
      INSERT INTO utilization_reports (tenant_id, report_date, usage_hours, cost)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [report.tenant_id, report.report_date, report.usage_hours, report.cost];

    const result: QueryResult<UtilizationReport> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Read a utilization report by id
   * @param id - The id of the utilization report to read
   * @param tenant_id - The tenant id to filter by
   * @returns The utilization report, or null if not found
   */
  async read(id: number, tenant_id: number): Promise<UtilizationReport | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM utilization_reports
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<UtilizationReport> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update a utilization report
   * @param id - The id of the utilization report to update
   * @param report - The updated utilization report data
   * @param tenant_id - The tenant id to filter by
   * @returns The updated utilization report, or null if not found
   */
  async update(id: number, report: Partial<UtilizationReport>, tenant_id: number): Promise<UtilizationReport | null> {
    const setClause = Object.keys(report)
      .filter(key => key !== 'id' && key !== 'tenant_id')
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE utilization_reports
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `;
    const values = [id, tenant_id, ...Object.values(report).filter(value => value !== undefined)];

    const result: QueryResult<UtilizationReport> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a utilization report
   * @param id - The id of the utilization report to delete
   * @param tenant_id - The tenant id to filter by
   * @returns True if the report was deleted, false otherwise
   */
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM utilization_reports
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * List utilization reports for a tenant
   * @param tenant_id - The tenant id to filter by
   * @param limit - The maximum number of reports to return
   * @param offset - The number of reports to skip
   * @returns An array of utilization reports
   */
  async list(tenant_id: number, limit: number = 10, offset: number = 0): Promise<UtilizationReport[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM utilization_reports
      WHERE tenant_id = $1
      ORDER BY report_date DESC
      LIMIT $2 OFFSET $3;
    `;
    const values = [tenant_id, limit, offset];

    const result: QueryResult<UtilizationReport> = await this.pool.query(query, values);
    return result.rows;
  }
}