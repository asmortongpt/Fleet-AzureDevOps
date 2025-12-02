/**
 * Asset Combo Manager Component (Enhanced Version)
 * Manage asset relationships (tractor-trailer combos, equipment attachments)
 *
 * Enhanced Features:
 * - Toast notifications using sonner
 * - Shadcn UI components (Button, Select, AlertDialog)
 * - Smart asset type compatibility filtering
 * - Improved UX and error handling
 * - Props match Task 4.4 specification
 */

import React, { useState, useEffect } from 'react'
import {
  Link,
  LinkBreak,
  Clock,
  Plus,
  X,
  Warning,
  CheckCircle,
  CalendarBlank,
  User
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import type {
  ActiveAssetCombination,
  RelationshipHistoryEntry,
  RelationshipType,
  AssetType
} from '@/types/asset.types'

// Props interface matching Task 4.4 specification
interface AssetComboManagerProps {
  parentAssetId: string
  parentAssetType: AssetType
  onRelationshipChanged?: () => void
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  asset_type: AssetType
  asset_category: string
  operational_status: string
}

// Asset type compatibility map
const COMPATIBILITY_MAP: Record<string, string[]> = {
  // Tractors can tow trailers
  'ROAD_TRACTOR': ['FLATBED', 'ENCLOSED', 'DUMP', 'LOWBOY', 'REFRIGERATED'],
  'FARM_TRACTOR': ['FLATBED', 'DUMP'],

  // Heavy equipment can have attachments
  'EXCAVATOR': ['BACKHOE'],
  'LOADER': ['BACKHOE'],

  // Trucks can carry containers
  'TRUCK': ['OTHER'], // Shipping containers, etc.

  // Default: allow all if not specified
  'DEFAULT': []
}

const relationshipTypes: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'TOWS', label: 'Tows', description: 'Parent tows child (e.g., tractor-trailer)' },
  { value: 'ATTACHED', label: 'Attached', description: 'Child is attached to parent (e.g., backhoe attachment)' },
  { value: 'CARRIES', label: 'Carries', description: 'Parent carries child' },
  { value: 'POWERS', label: 'Powers', description: 'Parent powers child equipment' },
  { value: 'CONTAINS', label: 'Contains', description: 'Parent contains child asset' }
]

export const AssetComboManager: React.FC<AssetComboManagerProps> = ({
  parentAssetId,
  parentAssetType,
  onRelationshipChanged
}) => {
  const [currentAttachments, setCurrentAttachments] = useState<ActiveAssetCombination[]>([])
  const [availableAssets, setAvailableAssets] = useState<Vehicle[]>([])
  const [relationshipHistory, setRelationshipHistory] = useState<RelationshipHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Form state
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('TOWS')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  // Fetch current attachments
  const fetchCurrentAttachments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/asset-relationships/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch active combinations')

      const data = await response.json()
      // Filter to only show relationships where this asset is the parent
      const filtered = (data.combinations || []).filter(
        (combo: ActiveAssetCombination) => combo.parent_asset_id === parentAssetId
      )
      setCurrentAttachments(filtered)
    } catch (err: any) {
      toast.error('Failed to load current attachments', {
        description: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch available assets based on parent type
  const fetchAvailableAssets = async () => {
    try {
      // Determine compatible asset types
      const compatibleTypes = COMPATIBILITY_MAP[parentAssetType] || COMPATIBILITY_MAP['DEFAULT']

      // Build query parameters
      const params = new URLSearchParams({
        operational_status: 'AVAILABLE',
        limit: '1000'
      })

      // If we have specific compatible types, filter by them
      if (compatibleTypes.length > 0) {
        // Note: This would need API support for multiple asset_type filters
        // For now, we'll filter client-side
      }

      const response = await fetch(`/api/vehicles?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch vehicles')

      const data = await response.json()
      let vehicles = data.data || []

      // Client-side filtering by compatible types
      if (compatibleTypes.length > 0) {
        vehicles = vehicles.filter((v: Vehicle) =>
          compatibleTypes.includes(v.asset_type)
        )
      }

      // Filter out the parent asset itself
      vehicles = vehicles.filter((v: Vehicle) => v.id !== parentAssetId)

      // Filter out already attached assets
      const attachedIds = currentAttachments.map(a => a.child_asset_id)
      vehicles = vehicles.filter((v: Vehicle) => !attachedIds.includes(v.id))

      setAvailableAssets(vehicles)
    } catch (err: any) {
      toast.error('Failed to load available assets', {
        description: err.message
      })
    }
  }

  // Fetch relationship history
  const fetchRelationshipHistory = async () => {
    try {
      const response = await fetch(`/api/asset-relationships/history/${parentAssetId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch relationship history')

      const data = await response.json()
      setRelationshipHistory(data.history || [])
    } catch (err: any) {
      toast.error('Failed to load relationship history')
    }
  }

  // Load data on mount and when parent changes
  useEffect(() => {
    fetchCurrentAttachments()
  }, [parentAssetId])

  // Fetch available assets when attachments change
  useEffect(() => {
    fetchAvailableAssets()
  }, [currentAttachments, parentAssetType])

  // Handle attach asset
  const handleAttach = async () => {
    if (!selectedAssetId) {
      toast.error('Please select an asset to attach')
      return
    }

    try {
      const payload = {
        parent_asset_id: parentAssetId,
        child_asset_id: selectedAssetId,
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

      // Success!
      toast.success('Asset attached successfully', {
        description: `${relationshipType} relationship created`
      })

      // Reset form
      setSelectedAssetId('')
      setRelationshipType('TOWS')
      setEffectiveFrom(new Date().toISOString().split('T')[0])
      setNotes('')
      setShowCreateDialog(false)

      // Refresh data
      await fetchCurrentAttachments()
      onRelationshipChanged?.()
    } catch (err: any) {
      toast.error('Failed to attach asset', {
        description: err.message
      })
    }
  }

  // Handle detach asset
  const handleDetach = async (relationshipId: string, childName: string) => {
    try {
      const response = await fetch(`/api/asset-relationships/${relationshipId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to deactivate relationship')

      toast.success('Asset detached successfully', {
        description: `${childName} has been detached`
      })

      // Refresh data
      await fetchCurrentAttachments()
      if (showHistory) {
        await fetchRelationshipHistory()
      }
      onRelationshipChanged?.()
    } catch (err: any) {
      toast.error('Failed to detach asset', {
        description: err.message
      })
    }
  }

  const getVehicleLabel = (vehicle: Vehicle) =>
    `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Attached Assets</h2>
            <p className="text-sm text-gray-600">Manage trailers, attachments, and equipment</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory) fetchRelationshipHistory()
            }}
          >
            <Clock className="w-4 h-4 mr-2" />
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={availableAssets.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Attach Asset
          </Button>
        </div>
      </div>

      {/* No available assets warning */}
      {availableAssets.length === 0 && !loading && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
          <Warning className="w-5 h-5 flex-shrink-0" />
          <span>No compatible assets available to attach. All assets are either in use or incompatible.</span>
        </div>
      )}

      {/* Current Attachments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Currently Attached ({currentAttachments.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : currentAttachments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No assets currently attached to this {parentAssetType.toLowerCase().replace('_', ' ')}
            </div>
          ) : (
            currentAttachments.map(combo => (
              <div key={combo.relationship_id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {combo.relationship_type}
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {combo.child_asset_name}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <CalendarBlank className="w-4 h-4" />
                        <span>Attached: {new Date(combo.effective_from).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Type:</span>
                        <span className="font-medium">{combo.child_asset_type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detach Button with Confirmation */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <LinkBreak className="w-4 h-4 mr-2" />
                        Detach
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Detach Asset?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to detach <strong>{combo.child_asset_name}</strong>?
                          This will end the current relationship but preserve the history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDetach(combo.relationship_id, combo.child_asset_name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Detach Asset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Relationship History */}
      {showHistory && (
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
              <h3 className="text-xl font-semibold text-gray-900">Attach Asset</h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Asset Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Asset to Attach *
                </label>
                <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an asset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {getVehicleLabel(vehicle)} - {vehicle.asset_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">
                  Showing only compatible, available assets
                </p>
              </div>

              {/* Relationship Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Type *
                </label>
                <Select
                  value={relationshipType}
                  onValueChange={(value) => setRelationshipType(value as RelationshipType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Add any relevant notes about this attachment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAttach}
                disabled={!selectedAssetId}
              >
                <Link className="w-4 h-4 mr-2" />
                Attach Asset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetComboManager
