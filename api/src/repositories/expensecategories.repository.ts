import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface ExpenseCategory {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ExpenseCategoriesRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('expense_categories', pool);
    this.pool = pool;
  }

  async findAll(tenantId: number): Promise<ExpenseCategory[]> {
    const query = `SELECT id, tenant_id, name, description, is_active, created_at, updated_at FROM expense_categories WHERE tenant_id = $1 ORDER BY name ASC`;
    const result: QueryResult<ExpenseCategory> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async findById(id: number, tenantId: number): Promise<ExpenseCategory | null> {
    const query = `SELECT id, tenant_id, name, description, is_active, created_at, updated_at FROM expense_categories WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<ExpenseCategory> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(tenantId: number, expenseCategoryData: Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ExpenseCategory> {
    const query = `
      INSERT INTO expense_categories (tenant_id, name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      expenseCategoryData.name,
      expenseCategoryData.description,
      expenseCategoryData.is_active
    ];
    const result: QueryResult<ExpenseCategory> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(tenantId: number, id: number, expenseCategoryData: Partial<ExpenseCategory>): Promise<ExpenseCategory | null> {
    const setClause = Object.keys(expenseCategoryData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.findById(id, tenantId);
    }

    const query = `UPDATE expense_categories SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(expenseCategoryData)];
    const result: QueryResult<ExpenseCategory> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM expense_categories WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}