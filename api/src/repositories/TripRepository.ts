import { BaseRepository } from './BaseRepository'
import { Pool } from 'pg'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

export interface Trip {
  id: number
  tenant_id: number
  created_at: Date
  updated_at: Date
  // Add entity-specific fields
}

export class TripRepository extends BaseRepository<Trip> {
  constructor(pool: Pool) {
    super(pool, 'trips')
  }

  async findByTenantId(tenantId: number): Promise<Trip[]> {
    const query = `
      SELECT id, created_at, updated_at FROM ${this.tableName}
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `
    return this.query(query, [tenantId])
  }

  async findByIdAndTenant(id: number, tenantId: number): Promise<Trip | null> {
    const query = `
      SELECT id, created_at, updated_at FROM ${this.tableName}
      WHERE id = $1 AND tenant_id = $2
    `
    const results = await this.query(query, [id, tenantId])
    return results[0] || null
  }

  async create(data: Partial<Trip>): Promise<Trip> {
    const { columnNames, placeholders, values } = buildInsertClause(data, [], 1, 'trips')

    const query = `
      INSERT INTO ${this.tableName} (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `

    const results = await this.query(query, values)
    return results[0]
  }

  async update(id: number, tenantId: number, data: Partial<Trip>): Promise<Trip | null> {
    const { fields: setClause, values } = buildUpdateClause(data, 3, 'trips')

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `

    const results = await this.query(query, [id, tenantId, ...values])
    return results[0] || null
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE id = $1 AND tenant_id = $2
    `

    const result = await this.query(query, [id, tenantId])
    return result.rowCount > 0
  }
}
