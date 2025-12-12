import { BaseRepository } from '../repositories/BaseRepository';

/**
 * Asset Management Repository
 * 
 * Comprehensive repository for fleet asset tracking and lifecycle management
 * Eliminates direct database queries from routes
 * 
 * Features:
 * - Asset CRUD operations
 * - QR code generation and tracking
 * - Asset depreciation calculations
 * - Maintenance history
 * - Assignment tracking
 * - Asset transfers
 * - Disposal management
 * - Analytics
 */

import { Pool, PoolClient } from 'pg'
import { connectionManager } from '../config/connection-manager'
import { NotFoundError, ValidationError, DatabaseError } from '../errors/app-error'
import logger from '../config/logger'

export interface Asset {
  id: string
  tenant_id: string
  asset_name: string
  asset_type: 'vehicle' | 'equipment' | 'tool' | 'trailer' | 'other'
  asset_tag?: string
  serial_number?: string
  manufacturer?: string
  model?: string
  purchase_date?: Date
  purchase_price?: number
  current_value?: number
  depreciation_rate?: number
  warranty_expiry?: Date
  location?: string
  assigned_to?: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'disposed'
  description?: string
  specifications?: any
  photo_url?: string
  qr_code_data?: string
  disposal_date?: Date
  disposal_reason?: string
  disposal_value?: number
  created_at: Date
  updated_at: Date
  created_by: string
}

export interface AssetHistory {
  id: string
  asset_id: string
  action: string
  performed_by: string
  assigned_to?: string
  location?: string
  notes?: string
  timestamp: Date
}

export interface AssetFilters {
  type?: string
  status?: string
  location?: string
  assigned_to?: string
  search?: string
}

export interface DepreciationCalculation {
  asset_id: string
  purchase_price: string
  depreciation_rate: number
  years_owned: string
  annual_depreciation: string
  total_depreciation: string
  current_value: string
  projections: Array<{
    year: number
    value: string
    depreciation: string
  }>
}

export interface AssetAnalytics {
  by_status: Array<{ status: string; count: number }>
  by_type: Array<{ asset_type: string; count: number }>
  total_assets: number
  total_purchase_value: number
  total_current_value: number
  total_depreciation: number
}

export class AssetManagementRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LAsset_LManagement_LRepository extends _LBases');
  }

  private pool: Pool

  constructor() {
    this.pool = connectionManager.getPool()
  }

  /**
   * Get connection pool (supports transactions)
   */
  getPool(): Pool {
    return this.pool
  }

  /**
   * Query 1: Get all assets with filters and joins
   */
  async findAllAssets(
    tenantId: string,
    filters: AssetFilters = {}
  ): Promise<{ assets: any[]; total: number }> {
    try {
      const { type, status, location, assigned_to, search } = filters

      let query = `
        SELECT
          a.*,
          u.first_name || ' ' || u.last_name as assigned_to_name,
          COUNT(DISTINCT ah.id) as history_count,
          MAX(m.scheduled_date) as next_maintenance
        FROM assets a
        LEFT JOIN users u ON a.assigned_to = u.id
        LEFT JOIN asset_history ah ON a.id = ah.asset_id
        LEFT JOIN maintenance_schedules m ON a.id = m.asset_id AND m.status = 'scheduled'
        WHERE a.tenant_id = $1
      `

      const params: any[] = [tenantId]
      let paramCount = 1

      if (type) {
        paramCount++
        query += ` AND a.asset_type = $${paramCount}`
        params.push(type)
      }

      if (status) {
        paramCount++
        query += ` AND a.status = $${paramCount}`
        params.push(status)
      }

      if (location) {
        paramCount++
        query += ` AND a.location = $${paramCount}`
        params.push(location)
      }

      if (assigned_to) {
        paramCount++
        query += ` AND a.assigned_to = $${paramCount}`
        params.push(assigned_to)
      }

      if (search) {
        paramCount++
        query += ` AND (
          a.asset_name ILIKE $${paramCount} OR
          a.asset_tag ILIKE $${paramCount} OR
          a.serial_number ILIKE $${paramCount} OR
          a.description ILIKE $${paramCount}
        )`
        params.push(`%${search}%`)
      }

      query += ` GROUP BY a.id, u.first_name, u.last_name ORDER BY a.created_at DESC`

      const result = await this.pool.query(query, params)

      return {
        assets: result.rows,
        total: result.rows.length
      }
    } catch (error) {
      logger.error('Error in findAllAssets:', error)
      throw new DatabaseError('Failed to fetch assets', { tenantId, filters, error })
    }
  }

  /**
   * Query 2: Get asset by ID with basic info
   */
  async findAssetById(assetId: string, tenantId: string): Promise<any | null> {
    try {
      const result = await this.pool.query(
        `SELECT
          a.*,
          u.first_name || ' ' || u.last_name as assigned_to_name,
          u.email as assigned_to_email
        FROM assets a
        LEFT JOIN users u ON a.assigned_to = u.id
        WHERE a.id = $1 AND a.tenant_id = $2`,
        [assetId, tenantId]
      )

      return result.rows[0] || null
    } catch (error) {
      logger.error('Error in findAssetById:', error)
      throw new DatabaseError('Failed to fetch asset', { assetId, tenantId, error })
    }
  }

  /**
   * Query 3: Get asset history
   */
  async getAssetHistory(assetId: string, limit: number = 50): Promise<AssetHistory[]> {
    try {
      const result = await this.pool.query(
        `SELECT
          ah.*,
          u.first_name || ' ' || u.last_name as performed_by_name
        FROM asset_history ah
        LEFT JOIN users u ON ah.performed_by = u.id
        WHERE ah.asset_id = $1
        ORDER BY ah.timestamp DESC
        LIMIT $2`,
        [assetId, limit]
      )

      return result.rows
    } catch (error) {
      logger.error('Error in getAssetHistory:', error)
      throw new DatabaseError('Failed to fetch asset history', { assetId, error })
    }
  }

  /**
   * Query 4: Get asset maintenance records
   */
  async getAssetMaintenance(assetId: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT id, tenant_id, vehicle_id, service_type, description, scheduled_date, status 
         FROM maintenance_schedules
         WHERE asset_id = $1
         ORDER BY scheduled_date DESC
         LIMIT $2`,
        [assetId, limit]
      )

      return result.rows
    } catch (error) {
      logger.error('Error in getAssetMaintenance:', error)
      throw new DatabaseError('Failed to fetch asset maintenance', { assetId, error })
    }
  }

  /**
   * Query 5-6: Create new asset with transaction
   */
  async createAsset(
    assetData: Partial<Asset>,
    userId: string,
    tenantId: string
  ): Promise<Asset> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Generate QR code data
      const qrData = `ASSET:${assetData.asset_tag || Date.now()}`

      // Query 5: Insert asset
      const result = await client.query(
        `INSERT INTO assets (
          tenant_id, asset_name, asset_type, asset_tag, serial_number,
          manufacturer, model, purchase_date, purchase_price, current_value,
          depreciation_rate, warranty_expiry, location, assigned_to, status,
          description, specifications, photo_url, qr_code_data, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          tenantId,
          assetData.asset_name,
          assetData.asset_type,
          assetData.asset_tag,
          assetData.serial_number,
          assetData.manufacturer,
          assetData.model,
          assetData.purchase_date,
          assetData.purchase_price,
          assetData.current_value,
          assetData.depreciation_rate,
          assetData.warranty_expiry,
          assetData.location,
          assetData.assigned_to,
          assetData.status || 'active',
          assetData.description,
          assetData.specifications ? JSON.stringify(assetData.specifications) : null,
          assetData.photo_url,
          qrData,
          userId
        ]
      )

      // Query 6: Log asset creation
      await client.query(
        `INSERT INTO asset_history (
          asset_id, action, performed_by, notes
        ) VALUES ($1, $2, $3, $4)`,
        [result.rows[0].id, 'created', userId, 'Asset created']
      )

      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Error in createAsset:', error)
      throw new DatabaseError('Failed to create asset', { assetData, error })
    } finally {
      client.release()
    }
  }

  /**
   * Query 7-8: Update asset with transaction
   */
  async updateAsset(
    assetId: string,
    tenantId: string,
    updates: Partial<Asset>,
    userId: string
  ): Promise<Asset> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Build dynamic update query
      const setClauses: string[] = []
      const values: any[] = []
      let paramCount = 1

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'id' && key !== 'tenant_id') {
          setClauses.push(`${key} = $${paramCount}`)
          values.push(updates[key])
          paramCount++
        }
      })

      if (setClauses.length === 0) {
        throw new ValidationError('No fields to update')
      }

      setClauses.push('updated_at = NOW()')
      values.push(assetId, tenantId)

      // Query 7: Update asset
      const result = await client.query(
        `UPDATE assets
         SET ${setClauses.join(', ')}
         WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
         RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        await client.query('ROLLBACK')
        throw new NotFoundError('Asset not found')
      }

      // Query 8: Log the update
      const changedFields = Object.keys(updates).join(', ')
      await client.query(
        `INSERT INTO asset_history (
          asset_id, action, performed_by, notes
        ) VALUES ($1, $2, $3, $4)`,
        [assetId, 'updated', userId, `Updated fields: ${changedFields}`]
      )

      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Error in updateAsset:', error)
      throw new DatabaseError('Failed to update asset', { assetId, updates, error })
    } finally {
      client.release()
    }
  }

  /**
   * Query 9-10: Assign asset to user with transaction
   */
  async assignAsset(
    assetId: string,
    tenantId: string,
    assignedTo: string,
    userId: string,
    notes?: string
  ): Promise<Asset> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Query 9: Update assignment
      const result = await client.query(
        `UPDATE assets
         SET assigned_to = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3
         RETURNING *`,
        [assignedTo, assetId, tenantId]
      )

      if (result.rows.length === 0) {
        await client.query('ROLLBACK')
        throw new NotFoundError('Asset not found')
      }

      // Query 10: Log assignment
      await client.query(
        `INSERT INTO asset_history (
          asset_id, action, performed_by, assigned_to, notes
        ) VALUES ($1, $2, $3, $4, $5)`,
        [assetId, 'assigned', userId, assignedTo, notes || 'Asset assigned']
      )

      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Error in assignAsset:', error)
      throw new DatabaseError('Failed to assign asset', { assetId, assignedTo, error })
    } finally {
      client.release()
    }
  }

  /**
   * Query 11-12: Transfer asset to different location with transaction
   */
  async transferAsset(
    assetId: string,
    tenantId: string,
    newLocation: string,
    transferReason: string,
    userId: string,
    notes?: string
  ): Promise<Asset> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Query 11: Update location
      const result = await client.query(
        `UPDATE assets
         SET location = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3
         RETURNING *`,
        [newLocation, assetId, tenantId]
      )

      if (result.rows.length === 0) {
        await client.query('ROLLBACK')
        throw new NotFoundError('Asset not found')
      }

      // Query 12: Log transfer
      await client.query(
        `INSERT INTO asset_history (
          asset_id, action, performed_by, location, notes
        ) VALUES ($1, $2, $3, $4, $5)`,
        [assetId, 'transferred', userId, newLocation, `${transferReason}: ${notes || ''}`]
      )

      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Error in transferAsset:', error)
      throw new DatabaseError('Failed to transfer asset', { assetId, newLocation, error })
    } finally {
      client.release()
    }
  }

  /**
   * Query 13: Get asset for depreciation calculation
   */
  async getAssetForDepreciation(assetId: string, tenantId: string): Promise<any | null> {
    try {
      const result = await this.pool.query(
        `SELECT 
          id,
          tenant_id,
          asset_tag,
          asset_name,
          asset_type,
          category,
          description,
          manufacturer,
          model,
          serial_number,
          purchase_date,
          purchase_price,
          current_value,
          depreciation_rate,
          condition,
          status,
          location,
          assigned_to,
          warranty_expiration,
          last_maintenance,
          qr_code,
          metadata,
          created_at,
          updated_at,
          created_by,
          updated_by 
        FROM assets 
        WHERE id = $1 AND tenant_id = $2`,
        [assetId, tenantId]
      )

      return result.rows[0] || null
    } catch (error) {
      logger.error('Error in getAssetForDepreciation:', error)
      throw new DatabaseError('Failed to fetch asset for depreciation', { assetId, error })
    }
  }

  /**
   * Calculate asset depreciation
   */
  calculateDepreciation(asset: any): DepreciationCalculation {
    const purchasePrice = parseFloat(asset.purchase_price) || 0
    const depreciationRate = parseFloat(asset.depreciation_rate) || 0
    const purchaseDate = new Date(asset.purchase_date)
    const currentDate = new Date()

    // Calculate years since purchase
    const yearsSincePurchase =
      (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    // Straight-line depreciation
    const annualDepreciation = purchasePrice * (depreciationRate / 100)
    const totalDepreciation = Math.min(annualDepreciation * yearsSincePurchase, purchasePrice)
    const currentValue = Math.max(purchasePrice - totalDepreciation, 0)

    // Projected values
    const projections = []
    for (let year = 1; year <= 10; year++) {
      const futureDepreciation = Math.min(annualDepreciation * year, purchasePrice)
      const futureValue = Math.max(purchasePrice - futureDepreciation, 0)
      projections.push({
        year,
        value: futureValue.toFixed(2),
        depreciation: futureDepreciation.toFixed(2)
      })
    }

    return {
      asset_id: asset.id,
      purchase_price: purchasePrice.toFixed(2),
      depreciation_rate: depreciationRate,
      years_owned: yearsSincePurchase.toFixed(2),
      annual_depreciation: annualDepreciation.toFixed(2),
      total_depreciation: totalDepreciation.toFixed(2),
      current_value: currentValue.toFixed(2),
      projections
    }
  }

  /**
   * Query 14-17: Get asset analytics
   */
  async getAssetAnalytics(tenantId: string): Promise<AssetAnalytics> {
    try {
      // Run all queries in parallel
      const [statusCounts, typeCounts, totalValue, depreciationSum] = await Promise.all([
        // Query 14: Status counts
        this.pool.query(
          `SELECT status, COUNT(*) as count
           FROM assets
           WHERE tenant_id = $1
           GROUP BY status`,
          [tenantId]
        ),
        // Query 15: Type counts
        this.pool.query(
          `SELECT asset_type, COUNT(*) as count
           FROM assets
           WHERE tenant_id = $1
           GROUP BY asset_type`,
          [tenantId]
        ),
        // Query 16: Total value
        this.pool.query(
          `SELECT
             SUM(CAST(purchase_price AS DECIMAL)) as total_purchase_value,
             SUM(CAST(current_value AS DECIMAL)) as total_current_value,
             COUNT(*) as total_assets
           FROM assets
           WHERE tenant_id = $1 AND status != 'disposed'`,
          [tenantId]
        ),
        // Query 17: Depreciation sum
        this.pool.query(
          `SELECT
             SUM(CAST(purchase_price AS DECIMAL) - CAST(current_value AS DECIMAL)) as total_depreciation
           FROM assets
           WHERE tenant_id = $1`,
          [tenantId]
        )
      ])

      return {
        by_status: statusCounts.rows,
        by_type: typeCounts.rows,
        total_assets: totalValue.rows[0].total_assets || 0,
        total_purchase_value: totalValue.rows[0].total_purchase_value || 0,
        total_current_value: totalValue.rows[0].total_current_value || 0,
        total_depreciation: depreciationSum.rows[0].total_depreciation || 0
      }
    } catch (error) {
      logger.error('Error in getAssetAnalytics:', error)
      throw new DatabaseError('Failed to fetch asset analytics', { tenantId, error })
    }
  }

  /**
   * Query 18-19: Dispose/retire asset with transaction
   */
  async disposeAsset(
    assetId: string,
    tenantId: string,
    disposalReason: string,
    disposalValue: number,
    userId: string
  ): Promise<Asset> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Query 18: Update asset as disposed
      const result = await client.query(
        `UPDATE assets
         SET status = 'disposed',
             disposal_date = NOW(),
             disposal_reason = $1,
             disposal_value = $2,
             updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4
         RETURNING *`,
        [disposalReason, disposalValue, assetId, tenantId]
      )

      if (result.rows.length === 0) {
        await client.query('ROLLBACK')
        throw new NotFoundError('Asset not found')
      }

      // Query 19: Log disposal
      await client.query(
        `INSERT INTO asset_history (
          asset_id, action, performed_by, notes
        ) VALUES ($1, $2, $3, $4)`,
        [assetId, 'disposed', userId, `Disposed: ${disposalReason}`]
      )

      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Error in disposeAsset:', error)
      throw new DatabaseError('Failed to dispose asset', { assetId, error })
    } finally {
      client.release()
    }
  }
}

// Export singleton instance
export const assetManagementRepository = new AssetManagementRepository()
