
import { Pool } from 'pg';

import { PartsInventory } from '../models/parts-inventory.model';

import { BaseRepository } from './base/BaseRepository';

export class PartsInventoryRepository extends BaseRepository<any> {

  constructor(pool: Pool) {
    super(pool, 'parts_inventory');
  }

  async getAll(tenantId: string): Promise<PartsInventory[]> {
    const query = 'SELECT id, tenant_id, part_number, name, description, category, supplier, unit_cost, quantity_on_hand, reorder_point, reorder_quantity, location, facility_id, metadata, created_at, updated_at FROM parts_inventory WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getById(id: string, tenantId: string): Promise<PartsInventory | null> {
    const query = 'SELECT id, tenant_id, part_number, name, description, category, supplier, unit_cost, quantity_on_hand, reorder_point, reorder_quantity, location, facility_id, metadata, created_at, updated_at FROM parts_inventory WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(part: PartsInventory): Promise<PartsInventory> {
    const query = 'INSERT INTO parts_inventory (part_number, name, description, quantity_on_hand, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const values = [part.partNumber, part.name, part.description, part.quantity, part.tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id: string, part: PartsInventory): Promise<PartsInventory | null> {
    const query = 'UPDATE parts_inventory SET name = $1, description = $2, quantity_on_hand = $3, updated_at = NOW() WHERE id = $4 AND tenant_id = $5 RETURNING *';
    const values = [part.name, part.description, part.quantity, id, part.tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM parts_inventory WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return (result.rowCount ?? 0) > 0;
  }
}