
import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface Asset {
  id: string
  tenantId: string
  name: string
  assetNumber?: string
  serialNumber?: string
  type: string
  category?: string
  manufacturer?: string
  model?: string
  purchaseDate?: Date
  purchasePrice?: number
  currentValue?: number
  warrantyExpiryDate?: Date
  assignedToId?: string
  assignedFacilityId?: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'disposed'
  condition?: string
  notes?: string
  description?: string
  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  maintenanceSchedule?: any
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

/**
 * AssetsRepository
 * Comprehensive repository for fleet asset tracking
 */
export class AssetsRepository extends BaseRepository<Asset> {
  constructor(pool: Pool) {
    super(pool, 'assets');
  }

  async findById(id: string, tenantId: string): Promise<Asset | null> {
    const result = await this.pool.query(
      `SELECT id, tenant_id AS "tenantId", name, asset_number AS "assetNumber", 
              serial_number AS "serialNumber", type, category, manufacturer, model, 
              purchase_date AS "purchaseDate", purchase_price AS "purchasePrice", 
              current_value AS "currentValue", warranty_expiry_date AS "warrantyExpiryDate", 
              assigned_to_id AS "assignedToId", assigned_facility_id AS "assignedFacilityId", 
              status, condition, notes, description, 
              last_maintenance_date AS "lastMaintenanceDate", 
              next_maintenance_date AS "nextMaintenanceDate", 
              maintenance_schedule AS "maintenanceSchedule",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM assets 
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  async findByTenant(tenantId: string): Promise<Asset[]> {
    const result = await this.pool.query(
      `SELECT id, name, asset_number AS "assetNumber", type, status, 
              assigned_to_id AS "assignedToId"
       FROM assets 
       WHERE tenant_id = $1 
       ORDER BY name ASC`,
      [tenantId]
    )
    return result.rows
  }

  async create(data: Partial<Asset>, tenantId: string): Promise<Asset> {
    if (!data.name || !data.type) {
      throw new ValidationError('Name and type are required')
    }

    const result = await this.pool.query(
      `INSERT INTO assets (
        tenant_id, name, asset_number, serial_number, type, category, 
        manufacturer, model, purchase_date, purchase_price, current_value, 
        warranty_expiry_date, assigned_to_id, assigned_facility_id, status, 
        condition, notes, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, name, type, status`,
      [
        tenantId,
        data.name,
        data.assetNumber || null,
        data.serialNumber || null,
        data.type,
        data.category || null,
        data.manufacturer || null,
        data.model || null,
        data.purchaseDate || null,
        data.purchasePrice || null,
        data.currentValue || null,
        data.warrantyExpiryDate || null,
        data.assignedToId || null,
        data.assignedFacilityId || null,
        data.status || 'active',
        data.condition || null,
        data.notes || null,
        data.description || null
      ]
    )
    return result.rows[0]
  }

  async update(id: string, data: Partial<Asset>, tenantId: string): Promise<Asset> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Asset')
    }

    const result = await this.pool.query(
      `UPDATE assets 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           status = COALESCE($3, status),
           assigned_to_id = COALESCE($4, assigned_to_id),
           assigned_facility_id = COALESCE($5, assigned_facility_id),
           current_value = COALESCE($6, current_value),
           updated_at = NOW()
       WHERE id = $7 AND tenant_id = $8
       RETURNING id, name, type, status`,
      [
        data.name,
        data.type,
        data.status,
        data.assignedToId,
        data.assignedFacilityId,
        data.currentValue,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM assets WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }
}
