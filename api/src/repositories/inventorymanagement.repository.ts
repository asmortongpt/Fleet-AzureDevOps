
import { Pool } from 'pg';

import { InventoryItem } from '../models/inventory-item.model';
import { BaseRepository } from '../repositories/BaseRepository';

export class InventoryManagementRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAllItems(tenantId: string): Promise<InventoryItem[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM inventory_items WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return result.rows.map(row => new InventoryItem(row));
  }

  async getItemById(itemId: string, tenantId: string): Promise<InventoryItem | null> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM inventory_items WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [itemId, tenantId]);
    return result.rows.length > 0 ? new InventoryItem(result.rows[0]) : null;
  }

  async createItem(item: InventoryItem, tenantId: string): Promise<InventoryItem> {
    const query = 'INSERT INTO inventory_items (name, quantity, price, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [item.name, item.quantity, item.price, tenantId];
    const result = await this.pool.query(query, values);
    return new InventoryItem(result.rows[0]);
  }

  async updateItem(itemId: string, item: InventoryItem, tenantId: string): Promise<InventoryItem | null> {
    const query = 'UPDATE inventory_items SET name = $1, quantity = $2, price = $3 WHERE id = $4 AND tenant_id = $5 RETURNING *';
    const values = [item.name, item.quantity, item.price, itemId, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? new InventoryItem(result.rows[0]) : null;
  }

  async deleteItem(itemId: string, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM inventory_items WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [itemId, tenantId]);
    return result.rowCount > 0;
  }
}