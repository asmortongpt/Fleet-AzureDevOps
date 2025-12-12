import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';
import { PartsInventory } from '../models/parts-inventory.model';

export class PartsInventoryRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAll(tenantId: string): Promise<PartsInventory[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM parts_inventory WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getById(id: string, tenantId: string): Promise<PartsInventory | null> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM parts_inventory WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(part: PartsInventory): Promise<PartsInventory> {
    const query = 'INSERT INTO parts_inventory (name, description, quantity, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [part.name, part.description, part.quantity, part.tenant_id];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id: string, part: PartsInventory): Promise<PartsInventory | null> {
    const query = 'UPDATE parts_inventory SET name = $1, description = $2, quantity = $3 WHERE id = $4 AND tenant_id = $5 RETURNING *';
    const values = [part.name, part.description, part.quantity, id, part.tenant_id];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM parts_inventory WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM partsinventory t
    WHERE t.id = \api/src/repositories/partsinventory.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM partsinventory t
    WHERE t.tenant_id = \api/src/repositories/partsinventory.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
