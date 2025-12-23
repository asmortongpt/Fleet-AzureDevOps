import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface ComplianceCalendarItem {
  id: number;
  title: string;
  description: string;
  date: Date;
  tenant_id: number;
}

export class ComplianceCalendarRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('compliance_calendar', pool);
    this.pool = pool;
  }

  async create(tenantId: number, item: Omit<ComplianceCalendarItem, 'id'>): Promise<ComplianceCalendarItem> {
    const query = `
      INSERT INTO compliance_calendar (title, description, date, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [item.title, item.description, item.date, tenantId];
    const result: QueryResult<ComplianceCalendarItem> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAll(tenantId: number): Promise<ComplianceCalendarItem[]> {
    const query = `
      SELECT id, title, description, date, tenant_id
      FROM compliance_calendar
      WHERE tenant_id = $1
      ORDER BY date
    `;
    const result: QueryResult<ComplianceCalendarItem> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getById(tenantId: number, id: number): Promise<ComplianceCalendarItem | null> {
    const query = `
      SELECT id, title, description, date, tenant_id
      FROM compliance_calendar
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<ComplianceCalendarItem> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async update(tenantId: number, id: number, item: Partial<ComplianceCalendarItem>): Promise<ComplianceCalendarItem | null> {
    const setClause = Object.keys(item)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getById(tenantId, id);
    }

    const query = `UPDATE compliance_calendar SET ${setClause} WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(item)];
    const result: QueryResult<ComplianceCalendarItem> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM compliance_calendar WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}