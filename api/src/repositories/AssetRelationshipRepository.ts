import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'
import { PoolClient } from 'pg'

export interface AssetRelationship {
  id: string
  tenant_id?: string
  parent_asset_id: string
  child_asset_id: string
  relationship_type: 'TOWS' | 'ATTACHED' | 'CARRIES' | 'POWERS' | 'CONTAINS'
  effective_from: Date
  effective_to?: Date | null
  created_by: string
  notes?: string | null
  created_at?: Date
  updated_at?: Date
}

export interface EnrichedAssetRelationship extends AssetRelationship {
  parent_asset_name?: string
  parent_asset_type?: string
  child_asset_name?: string
  child_asset_type?: string
  created_by_name?: string
}

export interface ActiveAssetCombo {
  parent_id: string
  child_id: string
  relationship_type: string
  parent_make?: string
  parent_model?: string
  parent_vin?: string
  parent_asset_type?: string
  child_make?: string
  child_model?: string
  child_vin?: string
  child_asset_type?: string
  effective_from: Date
}

export class AssetRelationshipRepository extends BaseRepository<AssetRelationship> {
  constructor() {
    super('asset_relationships', connectionManager.getWritePool())
  }

  async findByTenantWithFilters(
    tenantId: string,
    filters: {
      parent_asset_id?: string
      child_asset_id?: string
      relationship_type?: string
      active_only?: boolean
    } = {},
    client?: PoolClient
  ): Promise<EnrichedAssetRelationship[]> {
    const whereConditions: string[] = ['vp.tenant_id = $1']
    const values: any[] = [tenantId]
    let paramIndex = 2

    if (filters.parent_asset_id) {
      whereConditions.push('ar.parent_asset_id = $' + paramIndex++)
      values.push(filters.parent_asset_id)
    }

    if (filters.child_asset_id) {
      whereConditions.push('ar.child_asset_id = $' + paramIndex++)
      values.push(filters.child_asset_id)
    }

    if (filters.relationship_type) {
      whereConditions.push('ar.relationship_type = $' + paramIndex++)
      values.push(filters.relationship_type)
    }

    if (filters.active_only !== false) {
      whereConditions.push('(ar.effective_to IS NULL OR ar.effective_to > NOW())')
    }

    const query = 'SELECT ar.*, vp.make || \' \' || vp.model || \' (\' || vp.vin || \')\' as parent_asset_name, vp.asset_type as parent_asset_type, vc.make || \' \' || vc.model || \' (\' || vc.vin || \')\' as child_asset_name, vc.asset_type as child_asset_type, u.first_name || \' \' || u.last_name as created_by_name FROM asset_relationships ar LEFT JOIN vehicles vp ON ar.parent_asset_id = vp.id LEFT JOIN vehicles vc ON ar.child_asset_id = vc.id LEFT JOIN users u ON ar.created_by = u.id WHERE ' + whereConditions.join(' AND ') + ' ORDER BY ar.effective_from DESC'

    const result = await this.query<EnrichedAssetRelationship>(query, values, client)
    return result.rows
  }

  async findActiveCombos(tenantId: string, client?: PoolClient): Promise<ActiveAssetCombo[]> {
    const query = 'SELECT vw.* FROM vw_active_asset_combos vw JOIN vehicles v ON vw.parent_id = v.id WHERE v.tenant_id = $1 ORDER BY vw.parent_make, vw.parent_model'
    const result = await this.query<ActiveAssetCombo>(query, [tenantId], client)
    return result.rows
  }

  async findByIdEnriched(id: string, tenantId: string, client?: PoolClient): Promise<EnrichedAssetRelationship | null> {
    const query = 'SELECT ar.*, vp.make || \' \' || vp.model || \' (\' || vp.vin || \')\' as parent_asset_name, vp.asset_type as parent_asset_type, vc.make || \' \' || vc.model || \' (\' || vc.vin || \')\' as child_asset_name, vc.asset_type as child_asset_type, u.first_name || \' \' || u.last_name as created_by_name FROM asset_relationships ar LEFT JOIN vehicles vp ON ar.parent_asset_id = vp.id LEFT JOIN vehicles vc ON ar.child_asset_id = vc.id LEFT JOIN users u ON ar.created_by = u.id WHERE ar.id = $1 AND vp.tenant_id = $2'
    const result = await this.query<EnrichedAssetRelationship>(query, [id, tenantId], client)
    return result.rows[0] || null
  }

  async verifyAssetsExist(parentAssetId: string, childAssetId: string, tenantId: string, client?: PoolClient): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM vehicles WHERE id IN ($1, $2) AND tenant_id = $3'
    const result = await this.query<{ count: string }>(query, [parentAssetId, childAssetId, tenantId], client)
    return parseInt(result.rows[0].count, 10)
  }

  async checkCircularRelationship(parentAssetId: string, childAssetId: string, client?: PoolClient): Promise<boolean> {
    const query = 'SELECT id FROM asset_relationships WHERE parent_asset_id = $1 AND child_asset_id = $2 AND (effective_to IS NULL OR effective_to > NOW())'
    const result = await this.query(query, [childAssetId, parentAssetId], client)
    return result.rows.length > 0
  }

  async createRelationship(data: { parent_asset_id: string; child_asset_id: string; relationship_type: string; effective_from?: string; effective_to?: string | null; created_by: string; notes?: string | null }, client?: PoolClient): Promise<AssetRelationship> {
    const query = 'INSERT INTO asset_relationships (parent_asset_id, child_asset_id, relationship_type, effective_from, effective_to, created_by, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *'
    const values = [data.parent_asset_id, data.child_asset_id, data.relationship_type, data.effective_from || new Date().toISOString(), data.effective_to || null, data.created_by, data.notes || null]
    const result = await this.query<AssetRelationship>(query, values, client)
    return result.rows[0]
  }

  async updateRelationship(id: string, tenantId: string, data: { relationship_type?: string; effective_from?: string; effective_to?: string; notes?: string }, client?: PoolClient): Promise<AssetRelationship | null> {
    const existsCheck = await this.query('SELECT ar.id FROM asset_relationships ar LEFT JOIN vehicles v ON ar.parent_asset_id = v.id WHERE ar.id = $1 AND v.tenant_id = $2', [id, tenantId], client)
    if (existsCheck.rows.length === 0) {
      return null
    }
    const query = 'UPDATE asset_relationships SET relationship_type = COALESCE($1, relationship_type), effective_from = COALESCE($2, effective_from), effective_to = COALESCE($3, effective_to), notes = COALESCE($4, notes), updated_at = NOW() WHERE id = $5 RETURNING *'
    const values = [data.relationship_type, data.effective_from, data.effective_to, data.notes, id]
    const result = await this.query<AssetRelationship>(query, values, client)
    return result.rows[0] || null
  }

  async deactivateRelationship(id: string, tenantId: string, client?: PoolClient): Promise<AssetRelationship | null> {
    const query = 'UPDATE asset_relationships ar SET effective_to = NOW(), updated_at = NOW() FROM vehicles v WHERE ar.id = $1 AND ar.parent_asset_id = v.id AND v.tenant_id = $2 RETURNING ar.*'
    const result = await this.query<AssetRelationship>(query, [id, tenantId], client)
    return result.rows[0] || null
  }

  async deleteRelationship(id: string, tenantId: string, client?: PoolClient): Promise<boolean> {
    const query = 'DELETE FROM asset_relationships ar USING vehicles v WHERE ar.id = $1 AND ar.parent_asset_id = v.id AND v.tenant_id = $2 RETURNING ar.id'
    const result = await this.query(query, [id, tenantId], client)
    return result.rows.length > 0
  }

  async findHistoryByAsset(assetId: string, tenantId: string, client?: PoolClient): Promise<EnrichedAssetRelationship[]> {
    const query = 'SELECT ar.*, vp.make || \' \' || vp.model || \' (\' || vp.vin || \')\' as parent_asset_name, vc.make || \' \' || vc.model || \' (\' || vc.vin || \')\' as child_asset_name, u.first_name || \' \' || u.last_name as created_by_name FROM asset_relationships ar LEFT JOIN vehicles vp ON ar.parent_asset_id = vp.id LEFT JOIN vehicles vc ON ar.child_asset_id = vc.id LEFT JOIN users u ON ar.created_by = u.id WHERE (ar.parent_asset_id = $1 OR ar.child_asset_id = $1) AND vp.tenant_id = $2 ORDER BY ar.effective_from DESC'
    const result = await this.query<EnrichedAssetRelationship>(query, [assetId, tenantId], client)
    return result.rows
  }
}
