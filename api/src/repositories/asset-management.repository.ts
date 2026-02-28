
import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface Asset {
  id: string
  tenantId: string
  assetNumber: string
  assetName: string
  assetType: string
  description?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  ownershipType?: string
  acquisitionDate?: Date
  acquisitionCost?: number
  currentLocation?: string
  facilityId?: string
  gpsLatitude?: number
  gpsLongitude?: number
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'disposed'
  condition?: string
  assignedTo?: string
  assignedAt?: Date
  metadata?: any
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  depreciationMethod?: string
  usefulLifeYears?: number
  salvageValue?: number
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
      `SELECT id, tenant_id AS "tenantId", asset_number AS "assetNumber",
              asset_name AS "assetName", asset_type AS "assetType",
              description, manufacturer, model, serial_number AS "serialNumber",
              ownership_type AS "ownershipType",
              acquisition_date AS "acquisitionDate", acquisition_cost AS "acquisitionCost",
              current_location AS "currentLocation",
              facility_id AS "facilityId",
              gps_latitude AS "gpsLatitude", gps_longitude AS "gpsLongitude",
              status, condition,
              assigned_to AS "assignedTo", assigned_at AS "assignedAt",
              metadata,
              created_at AS "createdAt", updated_at AS "updatedAt",
              created_by AS "createdBy",
              depreciation_method AS "depreciationMethod",
              useful_life_years AS "usefulLifeYears",
              salvage_value AS "salvageValue"
       FROM assets
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  async findByTenant(tenantId: string): Promise<Asset[]> {
    const result = await this.pool.query(
      `SELECT id, asset_name AS "assetName", asset_number AS "assetNumber",
              asset_type AS "assetType", status,
              assigned_to AS "assignedTo"
       FROM assets
       WHERE tenant_id = $1
       ORDER BY asset_name ASC`,
      [tenantId]
    )
    return result.rows
  }

  async create(data: Partial<Asset>, tenantId: string): Promise<Asset> {
    if (!data.assetName || !data.assetType) {
      throw new ValidationError('Asset name and asset type are required')
    }

    const result = await this.pool.query(
      `INSERT INTO assets (
        tenant_id, asset_number, asset_name, asset_type,
        description, manufacturer, model, serial_number,
        ownership_type, acquisition_date, acquisition_cost,
        current_location, facility_id,
        assigned_to, status, condition
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, asset_name AS "assetName", asset_type AS "assetType", status`,
      [
        tenantId,
        data.assetNumber || `AST-${Date.now()}`,
        data.assetName,
        data.assetType,
        data.description || null,
        data.manufacturer || null,
        data.model || null,
        data.serialNumber || null,
        data.ownershipType || 'owned',
        data.acquisitionDate || null,
        data.acquisitionCost || null,
        data.currentLocation || null,
        data.facilityId || null,
        data.assignedTo || null,
        data.status || 'active',
        data.condition || null
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
       SET asset_name = COALESCE($1, asset_name),
           asset_type = COALESCE($2, asset_type),
           status = COALESCE($3, status),
           assigned_to = COALESCE($4, assigned_to),
           facility_id = COALESCE($5, facility_id),
           condition = COALESCE($6, condition),
           updated_at = NOW()
       WHERE id = $7 AND tenant_id = $8
       RETURNING id, asset_name AS "assetName", asset_type AS "assetType", status`,
      [
        data.assetName,
        data.assetType,
        data.status,
        data.assignedTo,
        data.facilityId,
        data.condition,
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
