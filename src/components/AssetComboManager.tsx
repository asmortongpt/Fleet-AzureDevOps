/**
 * Asset Combo Manager Component
 * Manage asset relationships (tractor-trailer combos, equipment attachments)
 *
 * Features:
 * - View active asset combinations
 * - Create new relationships (TOWS, ATTACHED, CARRIES, POWERS, CONTAINS)
 * - View relationship history
 * - Deactivate relationships
 * - Temporal tracking (effective_from/effective_to)
 * - Audit trail display
 */

import React, { useState, useEffect } from 'react'
import {
  Link,
  Unlink,
  Clock,
  Plus,
  X,
  Warning,
  CheckCircle,
  CalendarBlank,
  User,
  Trash
} from '@phosphor-icons/react'
import type {
  ActiveAssetCombination,
  RelationshipHistoryEntry,
  RelationshipType,
  CreateAssetRelationshipRequest
} from '../../api/src/types/asset.types'

interface AssetComboManagerProps {
  tenantId: string
  onRelationshipCreated?: () => void
  selectedAssetId?: string // If provided, show relationships for this asset
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  asset_type: string
}

const relationshipTypes: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'TOWS', label: 'Tows', description: 'Parent tows child (e.g., tractor-trailer)' },
  { value: 'ATTACHED', label: 'Attached', description: 'Child is attached to parent (e.g., backhoe attachment)' },
  { value: 'CARRIES', label: 'Carries', description: 'Parent carries child' },
  { value: 'POWERS', label: 'Powers', description: 'Parent powers child equipment' },
  { value: 'CONTAINS', label: 'Contains', description: 'Parent contains child asset' }
]

export const AssetComboManager: React.FC<AssetComboManagerProps> = ({
  tenantId,
  onRelationshipCreated,
  selectedAssetId
}) => {
  const [activeCombos, setActiveCombos] = useState<ActiveAssetCombination[]>([])
  const [relationshipHistory, setRelationshipHistory] = useState<RelationshipHistoryEntry[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Form state
  const [parentAssetId, setParentAssetId] = useState('')
  const [childAssetId, setChildAssetId] = useState('')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('TOWS')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchActiveCombos()
    fetchVehicles()
    if (selectedAssetId) {
      fetchRelationshipHistory(selectedAssetId)
    }
  }, [selectedAssetId])

  const fetchActiveCombos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/asset-relationships/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch active combinations')

      const data = await response.json()
      setActiveCombos(data.combinations || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch vehicles')

      const data = await response.json()
      setVehicles(data.data || [])
    } catch (err: any) {
      console.error('Error fetching vehicles:', err)
    }
  }

  const fetchRelationshipHistory = async (assetId: string) => {
    try {
      const response = await fetch(`/api/asset-relationships/history/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch relationship history')

      const data = await response.json()
      setRelationshipHistory(data.history || [])
    } catch (err: any) {
      console.error('Error fetching history:', err)
    }
  }

  const handleCreateRelationship = async () => {
    if (!parentAssetId || !childAssetId || !relationshipType) {
      setError('Please fill in all required fields')
      return
    }

    if (parentAssetId === childAssetId) {
      setError('Parent and child assets must be different')
      return
    }

    try {
      const payload: CreateAssetRelationshipRequest = {
        parent_asset_id: parentAssetId,
        child_asset_id: childAssetId,
        relationship_type: relationshipType,
        effective_from: effectiveFrom,
        notes: notes || undefined
      }

      const response = await fetch('/api/asset-relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create relationship')
      }

      // Reset form
      setParentAssetId('')
      setChildAssetId('')
      setRelationshipType('TOWS')
      setEffectiveFrom(new Date().toISOString().split('T')[0])
      setNotes('')
      setShowCreateDialog(false)
      setError(null)

      // Refresh data
      fetchActiveCombos()
      if (selectedAssetId) {
        fetchRelationshipHistory(selectedAssetId)
      }
      onRelationshipCreated?.()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeactivateRelationship = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to deactivate this relationship?')) {
      return
    }

    try {
      const response = await fetch(`/api/asset-relationships/${relationshipId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to deactivate relationship')

      fetchActiveCombos()
      if (selectedAssetId) {
        fetchRelationshipHistory(selectedAssetId)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getVehicleLabel = (vehicle: Vehicle) =>
    `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`

  const filteredCombos = selectedAssetId
    ? activeCombos.filter(combo =>
        combo.parent_asset_id === selectedAssetId || combo.child_asset_id === selectedAssetId
      )
    : activeCombos

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Asset Combinations</h2>
            <p className="text-sm text-gray-600">Manage tractor-trailer combos and equipment attachments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedAssetId && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Clock className="w-4 h-4" />
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          )}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Relationship
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <Warning className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Combinations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Active Combinations ({filteredCombos.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredCombos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No active asset combinations found
            </div>
          ) : (
            filteredCombos.map(combo => (
              <div key={combo.relationship_id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {combo.relationship_type}
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                      <span>{combo.parent_asset_name}</span>
                      <span className="text-gray-400">→</span>
                      <span>{combo.child_asset_name}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <CalendarBlank className="w-4 h-4" />
                        <span>Effective from: {new Date(combo.effective_from).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Parent:</span>
                        <span className="font-medium">{combo.parent_asset_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Child:</span>
                        <span className="font-medium">{combo.child_asset_type}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeactivateRelationship(combo.relationship_id)}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    Deactivate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Relationship History */}
      {showHistory && selectedAssetId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Relationship History ({relationshipHistory.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {relationshipHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No relationship history found
              </div>
            ) : (
              relationshipHistory.map((entry, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {entry.relationship_type}
                        </span>
                        {!entry.effective_to && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-900 mb-1">
                        <strong>{entry.parent_asset_name}</strong> → <strong>{entry.child_asset_name}</strong>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>From: {new Date(entry.effective_from).toLocaleDateString()}</span>
                        {entry.effective_to && (
                          <span>To: {new Date(entry.effective_to).toLocaleDateString()}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Created by: {entry.created_by_name}</span>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Relationship Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Create Asset Relationship</h3>
              <button
                onClick={() => {
                  setShowCreateDialog(false)
                  setError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Relationship Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Type *
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {relationshipTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parent Asset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Asset * (Tows/Powers/Contains)
                </label>
                <select
                  value={parentAssetId}
                  onChange={(e) => setParentAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select parent asset...</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {getVehicleLabel(vehicle)} - {vehicle.asset_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Child Asset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child Asset * (Towed/Powered/Contained)
                </label>
                <select
                  value={childAssetId}
                  onChange={(e) => setChildAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!parentAssetId}
                >
                  <option value="">Select child asset...</option>
                  {vehicles
                    .filter(v => v.id !== parentAssetId)
                    .map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {getVehicleLabel(vehicle)} - {vehicle.asset_type}
                      </option>
                    ))}
                </select>
              </div>

              {/* Effective From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective From *
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any relevant notes about this relationship..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowCreateDialog(false)
                  setError(null)
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRelationship}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Relationship
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetComboManager
