import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface AuditLog {
  id: number;
  tenant_id: string;
  action: string;
  user_id: string;
  timestamp: Date;
  details: string;
  created_at: Date;
  updated_at: Date;
}

export class AuditLogsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('audit_logs', pool);
    this.pool = pool;
  }

  async create(tenantId: string, auditLog: Omit<AuditLog, 'id' | 'created_at' | 'updated_at'>): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_logs (tenant_id, action, user_id, timestamp, details, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      auditLog.action,
      auditLog.user_id,
      auditLog.timestamp,
      auditLog.details
    ];
    const result: QueryResult<AuditLog> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: string, limit: number = 10, offset: number = 0): Promise<AuditLog[]> {
    const query = `
      SELECT id, tenant_id, action, user_id, timestamp, details, created_at, updated_at
      FROM audit_logs
      WHERE tenant_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [tenantId, limit, offset];
    const result: QueryResult<AuditLog> = await this.pool.query(query, values);
    return result.rows;
  }

  async update(tenantId: string, id: number, updates: Partial<AuditLog>): Promise<AuditLog | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return null;
    }

    const query = `UPDATE audit_logs SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(updates)];
    const result: QueryResult<AuditLog> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM audit_logs
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}