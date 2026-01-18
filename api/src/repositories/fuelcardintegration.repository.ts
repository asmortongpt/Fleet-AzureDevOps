import { Pool } from 'pg';
import { pool } from '../config/database';

export interface FuelCardIntegration {
  id: string;
  tenant_id: string;
  provider: string;
  card_number?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class FuelCardIntegrationRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(data: Partial<FuelCardIntegration>, tenant_id: string): Promise<FuelCardIntegration> {
    const result = await this.pool.query(
      `INSERT INTO fuel_card_integrations (provider, card_number, status, tenant_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.provider, data.card_number, data.status || 'active', tenant_id]
    );
    return result.rows[0];
  }

  async read(id: string, tenant_id: string): Promise<FuelCardIntegration | null> {
    const result = await this.pool.query(
      `SELECT * FROM fuel_card_integrations WHERE id = $1 AND tenant_id = $2`,
      [id, tenant_id]
    );
    return result.rows[0] || null;
  }

  async update(id: string, data: Partial<FuelCardIntegration>, tenant_id: string): Promise<FuelCardIntegration | null> {
    const result = await this.pool.query(
      `UPDATE fuel_card_integrations
       SET provider = COALESCE($1, provider),
           card_number = COALESCE($2, card_number),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [data.provider, data.card_number, data.status, id, tenant_id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string, tenant_id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM fuel_card_integrations WHERE id = $1 AND tenant_id = $2`,
      [id, tenant_id]
    );
    return (result.rowCount || 0) > 0;
  }

  async list(filters: any, tenant_id: string): Promise<FuelCardIntegration[]> {
    const result = await this.pool.query(
      `SELECT * FROM fuel_card_integrations WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenant_id]
    );
    return result.rows;
  }
}