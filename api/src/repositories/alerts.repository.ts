import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface Alert {
  id: number;
  tenant_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class AlertsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('alerts', pool);
    this.pool = pool;
  }

  async createAlert(alert: {
    tenant_id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
  }): Promise<Alert> {
    const query = `
      INSERT INTO alerts (tenant_id, title, description, severity, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      alert.tenant_id,
      alert.title,
      alert.description,
      alert.severity,
      alert.status,
    ];
    const result: QueryResult<Alert> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAllAlerts(tenant_id: string): Promise<Alert[]> {
    const query = `
      SELECT id, tenant_id, title, description, severity, status, created_at, updated_at
      FROM alerts
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result: QueryResult<Alert> = await this.pool.query(query, [tenant_id]);
    return result.rows;
  }

  async getAlertById(tenant_id: string, alert_id: number): Promise<Alert | null> {
    const query = `
      SELECT id, tenant_id, title, description, severity, status, created_at, updated_at
      FROM alerts
      WHERE tenant_id = $1 AND id = $2
    `;
    const result: QueryResult<Alert> = await this.pool.query(query, [tenant_id, alert_id]);
    return result.rows[0] || null;
  }

  async updateAlert(
    tenant_id: string,
    alert_id: number,
    updates: {
      title?: string;
      description?: string;
      severity?: string;
      status?: string;
    }
  ): Promise<Alert | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getAlertById(tenant_id, alert_id);
    }

    const query = `UPDATE alerts SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [alert_id, tenant_id, ...Object.values(updates)];
    const result: QueryResult<Alert> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteAlert(tenant_id: string, alert_id: number): Promise<boolean> {
    const query = `
      DELETE FROM alerts
      WHERE tenant_id = $1 AND id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [tenant_id, alert_id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}