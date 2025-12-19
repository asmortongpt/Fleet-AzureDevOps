import { Pool } from 'pg'

import { BaseRepository } from './BaseRepository'

export interface ChargingSession {
  id: number
  tenant_id: number
  created_at: Date
  updated_at: Date
  // Add entity-specific fields
}

export class ChargingSessionRepository extends BaseRepository<ChargingSession> {
  constructor(pool: Pool) {
    super(pool, 'charging_sessions')
  }

  async findByTenantId(tenantId: number): Promise<ChargingSession[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `
    return this.query(query, [tenantId])
  }

  async findByIdAndTenant(id: number, tenantId: number): Promise<ChargingSession | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE id = $1 AND tenant_id = $2
    `
    const results = await this.query(query, [id, tenantId])
    return results[0] || null
  }

  async create(data: Partial<ChargingSession>): Promise<ChargingSession> {
    const fields = Object.keys(data).join(', ')
    const placeholders = Object.keys(data).map((_, i) => `${i + 1}`).join(', ')

    const query = `
      INSERT INTO ${this.tableName} (${fields})
      VALUES (${placeholders})
      RETURNING *
    `

    const results = await this.query(query, Object.values(data))
    return results[0]
  }

  async update(id: number, tenantId: number, data: Partial<ChargingSession>): Promise<ChargingSession | null> {
    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ')

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $${Object.keys(data).length + 2}
      RETURNING *
    `

    const results = await this.query(query, [id, ...Object.values(data), tenantId])
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
