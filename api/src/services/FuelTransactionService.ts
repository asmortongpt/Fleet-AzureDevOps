import { Pool } from 'pg';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

/**
 * FueltransactionService - Business Logic Layer for Fueltransaction Operations
 * Extracted from route handlers for better separation of concerns
 */
@injectable()
export class FueltransactionService {
  constructor(@inject(TYPES.DatabasePool) private db: Pool) { }

  async getAll(tenantId: number, filters?: any) {
    const query = `
      SELECT *
      FROM fueltransactions
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  async getById(id: number, tenantId: number) {
    const query = `
      SELECT *
      FROM fueltransactions
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(data: any, tenantId: number) {
    // TODO: Add business validation logic here

    const query = `
      INSERT INTO fueltransactions (data, tenant_id, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.db.query(query, [JSON.stringify(data), tenantId]);
    return result.rows[0];
  }

  async update(id: number, data: any, tenantId: number) {
    // Verify ownership
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new Error('Fueltransaction not found or access denied');
    }

    const query = `
      UPDATE fueltransactions
      SET data = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.db.query(query, [JSON.stringify(data), id, tenantId]);
    return result.rows[0];
  }

  async delete(id: number, tenantId: number) {
    // Soft delete
    const query = `
      UPDATE fueltransactions
      SET deleted_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}

