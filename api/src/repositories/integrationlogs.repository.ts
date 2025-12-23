import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface IntegrationLog {
  id: number;
  tenant_id: number;
  integration_name: string;
  action: string;
  status: string;
  request_payload?: any;
  response_payload?: any;
  error_message?: string;
  created_at: Date;
}

export class IntegrationLogsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('integration_logs', pool);
    this.pool = pool;
  }

  async createLog(tenantId: number, log: Omit<IntegrationLog, 'id' | 'created_at'>): Promise<IntegrationLog> {
    const query = `
      INSERT INTO integration_logs (tenant_id, integration_name, action, status, request_payload, response_payload, error_message, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      log.integration_name,
      log.action,
      log.status,
      log.request_payload,
      log.response_payload,
      log.error_message
    ];
    const result: QueryResult<IntegrationLog> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getLogs(tenantId: number): Promise<IntegrationLog[]> {
    const query = `SELECT id, tenant_id, integration_name, action, status, request_payload, response_payload, error_message, created_at FROM integration_logs WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const result: QueryResult<IntegrationLog> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getLog(tenantId: number, id: number): Promise<IntegrationLog | null> {
    const query = `SELECT id, tenant_id, integration_name, action, status, request_payload, response_payload, error_message, created_at FROM integration_logs WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<IntegrationLog> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async deleteLog(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM integration_logs WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}