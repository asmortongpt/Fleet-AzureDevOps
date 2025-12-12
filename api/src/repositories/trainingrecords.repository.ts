import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';

export interface TrainingRecord {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class TrainingRecordsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Fetch all training records for a tenant
   * @param tenantId 
   * @param filters 
   * @returns 
   */
  async findAll(tenantId: number, filters?: any): Promise<TrainingRecord[]> {
    try {
      const query = `
        SELECT id, created_at, updated_at FROM training_records
        WHERE tenant_id = $1
        AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('Failed to fetch records');
    }
  }

  /**
   * Fetch a training record by id
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async findById(id: number, tenantId: number): Promise<TrainingRecord | null> {
    try {
      const query = `
        SELECT id, created_at, updated_at FROM training_records
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.pool.query(query, [id, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw new Error('Failed to fetch record');
    }
  }

  /**
   * Create a new training record
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async create(data: Partial<TrainingRecord>, tenantId: number): Promise<TrainingRecord> {
    try {
      const query = `
        INSERT INTO training_records (tenant_id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `;
      const result = await this.pool.query(query, [tenantId, data.name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw new Error('Failed to create record');
    }
  }

  /**
   * Update a training record
   * @param id 
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async update(id: number, data: Partial<TrainingRecord>, tenantId: number): Promise<TrainingRecord> {
    try {
      const query = `
        UPDATE training_records
        SET name = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
        RETURNING *
      `;
      const result = await this.pool.query(query, [data.name, id, tenantId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in update:', error);
      throw new Error('Failed to update record');
    }
  }

  /**
   * Soft delete a training record
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    try {
      const query = `
        UPDATE training_records
        SET deleted_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.pool.query(query, [id, tenantId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in softDelete:', error);
      throw new Error('Failed to delete record');
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
    FROM trainingrecords t
    WHERE t.id = \api/src/repositories/trainingrecords.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM trainingrecords t
    WHERE t.tenant_id = \api/src/repositories/trainingrecords.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
