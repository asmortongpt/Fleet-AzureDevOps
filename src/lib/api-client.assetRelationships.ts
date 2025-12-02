/**
 * Asset Relationships API Client Extension
 * Add this to the main api-client.ts file
 *
 * Usage:
 * 1. Import this in api-client.ts
 * 2. Add to APIClient class
 */

export const assetRelationshipsEndpoints = {
  /**
   * List all asset relationships with optional filters
   * @param params - Query parameters (parent_asset_id, child_asset_id, relationship_type, active_only)
   */
  list: function(params?: {
    parent_asset_id?: string
    child_asset_id?: string
    relationship_type?: string
    active_only?: boolean
  }) {
    return this.get('/api/asset-relationships', params)
  },

  /**
   * Get active asset combinations from vw_active_asset_combos view
   * @returns List of currently active parent-child asset relationships
   */
  listActive: function() {
    return this.get('/api/asset-relationships/active')
  },

  /**
   * Get a specific relationship by ID
   * @param id - Relationship ID
   */
  get: function(id: string) {
    return this.get(`/api/asset-relationships/${id}`)
  },

  /**
   * Get relationship history for a specific asset
   * @param assetId - Asset ID (can be parent or child)
   * @returns All relationships (past and present) for the asset
   */
  getHistory: function(assetId: string) {
    return this.get(`/api/asset-relationships/history/${assetId}`)
  },

  /**
   * Create a new asset relationship
   * @param data - Relationship data
   * @example
   * apiClient.assetRelationships.create({
   *   parent_asset_id: 'tractor-123',
   *   child_asset_id: 'trailer-456',
   *   relationship_type: 'TOWS',
   *   effective_from: '2025-11-19T00:00:00Z',
   *   notes: 'Winter haul configuration'
   * })
   */
  create: function(data: {
    parent_asset_id: string
    child_asset_id: string
    relationship_type: 'TOWS' | 'ATTACHED' | 'CARRIES' | 'POWERS' | 'CONTAINS'
    effective_from?: string
    effective_to?: string
    notes?: string
  }) {
    return this.post('/api/asset-relationships', data)
  },

  /**
   * Update an existing asset relationship
   * @param id - Relationship ID
   * @param data - Fields to update
   */
  update: function(id: string, data: {
    relationship_type?: 'TOWS' | 'ATTACHED' | 'CARRIES' | 'POWERS' | 'CONTAINS'
    effective_from?: string
    effective_to?: string
    notes?: string
  }) {
    return this.put(`/api/asset-relationships/${id}`, data)
  },

  /**
   * Deactivate a relationship (set effective_to = NOW())
   * This is the recommended way to "delete" relationships to preserve history
   * @param id - Relationship ID
   */
  deactivate: function(id: string) {
    return this.patch(`/api/asset-relationships/${id}/deactivate`, {})
  },

  /**
   * Hard delete a relationship (removes from database)
   * WARNING: This permanently deletes the relationship and loses history
   * Use deactivate() instead unless you really need to delete
   * @param id - Relationship ID
   */
  delete: function(id: string) {
    return this.delete(`/api/asset-relationships/${id}`)
  }
}

// TypeScript types for asset relationships
export interface AssetRelationship {
  id: string
  parent_asset_id: string
  child_asset_id: string
  relationship_type: 'TOWS' | 'ATTACHED' | 'CARRIES' | 'POWERS' | 'CONTAINS'
  effective_from: Date
  effective_to?: Date
  created_by: string
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface ActiveAssetCombination {
  relationship_id: string
  parent_asset_id: string
  parent_asset_name: string
  parent_asset_type: string
  child_asset_id: string
  child_asset_name: string
  child_asset_type: string
  relationship_type: string
  effective_from: Date
  tenant_id: string
}

export interface RelationshipHistoryEntry extends AssetRelationship {
  parent_asset_name: string
  child_asset_name: string
  created_by_name: string
}

/**
 * Instructions for adding to api-client.ts:
 *
 * 1. Add this import at the top:
 *    import { assetRelationshipsEndpoints } from './api-client.assetRelationships'
 *
 * 2. Add this property to the APIClient class:
 *    assetRelationships = {
 *      list: (params?: any) => assetRelationshipsEndpoints.list.call(this, params),
 *      listActive: () => assetRelationshipsEndpoints.listActive.call(this),
 *      get: (id: string) => assetRelationshipsEndpoints.get.call(this, id),
 *      getHistory: (assetId: string) => assetRelationshipsEndpoints.getHistory.call(this, assetId),
 *      create: (data: any) => assetRelationshipsEndpoints.create.call(this, data),
 *      update: (id: string, data: any) => assetRelationshipsEndpoints.update.call(this, id, data),
 *      deactivate: (id: string) => assetRelationshipsEndpoints.deactivate.call(this, id),
 *      delete: (id: string) => assetRelationshipsEndpoints.delete.call(this, id)
 *    }
 *
 * 3. Usage example:
 *    import { apiClient } from '@/lib/api-client'
 *
 *    // List active combinations
 *    const { combinations } = await apiClient.assetRelationships.listActive()
 *
 *    // Create relationship
 *    await apiClient.assetRelationships.create({
 *      parent_asset_id: tractorId,
 *      child_asset_id: trailerId,
 *      relationship_type: 'TOWS'
 *    })
 *
 *    // Detach (deactivate)
 *    await apiClient.assetRelationships.deactivate(relationshipId)
 */
