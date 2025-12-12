import { BaseRepository } from './BaseRepository'
import { Pool } from 'pg'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

export interface ChargingStation {
  id: number
  tenant_id: number
  created_at: Date
  updated_at: Date
  // Add entity-specific fields
}

export class ChargingStationRepository extends BaseRepository<ChargingStation> {
  constructor(pool: Pool) {
    super(pool, 'charging_stations')
  }

  async findByTenantId(tenantId: number): Promise<ChargingStation[]> {
    const query = `
      SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `
    return this.query(query, [tenantId])
  }

  async findByIdAndTenant(id: number, tenantId: number): Promise<ChargingStation | null> {
    const query = `
      SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
      WHERE id = $1 AND tenant_id = $2
    `
    const results = await this.query(query, [id, tenantId])
    return results[0] || null
  }

  async create(data: Partial<ChargingStation>): Promise<ChargingStation> {
    const { columnNames, placeholders, values } = buildInsertClause(data, [], 1, 'charging_stations')

    const query = `
      INSERT INTO ${this.tableName} (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `

    const results = await this.query(query, values)
    return results[0]
  }

  async update(id: number, tenantId: number, data: Partial<ChargingStation>): Promise<ChargingStation | null> {
    const { fields: setClause, values } = buildUpdateClause(data, 3, 'charging_stations')

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
