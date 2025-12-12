import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export interface FuelTransaction {
  id: number;
  tenant_id: number;
  transaction_date: Date;
  vehicle_id: number;
  fuel_type: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class FuelTransactionsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<FuelTransaction[]> {
    try {
      const query = 'SELECT id, created_at, updated_at FROM fuel_transactions WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY transaction_date DESC';
      const result: QueryResult<FuelTransaction> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching fuel transactions: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<FuelTransaction | null> {
    try {
      const query = 'SELECT id, created_at, updated_at FROM fuel_transactions WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult<FuelTransaction> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching fuel transaction by ID: ${error.message}`);
    }
  }

  async create(tenantId: number, transaction: Omit<FuelTransaction, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<FuelTransaction> {
    try {
      const query = `
        INSERT INTO fuel_transactions (tenant_id, transaction_date, vehicle_id, fuel_type, quantity, unit_price, total_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [tenantId, transaction.transaction_date, transaction.vehicle_id, transaction.fuel_type, transaction.quantity, transaction.unit_price, transaction.total_cost];
      const result: QueryResult<FuelTransaction> = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating fuel transaction: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, transaction: Partial<Omit<FuelTransaction, 'id' | 'tenant_id' | 'created_at' | 'deleted_at'>>): Promise<FuelTransaction> {
    try {
      const setClause = Object.keys(transaction).map((key, index) => `${key} = $${index + 3}`).join(', ');
      const query = `
        UPDATE fuel_transactions
        SET ${setClause}, updated_at = NOW()
        WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL
        RETURNING *
      `;
      const values = [tenantId, id, ...Object.values(transaction)];
      const result: QueryResult<FuelTransaction> = await this.pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error('Fuel transaction not found or already deleted');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating fuel transaction: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<void> {
    try {
      const query = 'UPDATE fuel_transactions SET deleted_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult = await this.pool.query(query, [tenantId, id]);
      if (result.rowCount === 0) {
        throw new Error('Fuel transaction not found or already deleted');
      }
    } catch (error) {
      throw new Error(`Error soft deleting fuel transaction: ${error.message}`);
    }
  }
}

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM fueltransactions t
    WHERE t.id = \api/src/repositories/fueltransactions.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM fueltransactions t
    WHERE t.tenant_id = \api/src/repositories/fueltransactions.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
