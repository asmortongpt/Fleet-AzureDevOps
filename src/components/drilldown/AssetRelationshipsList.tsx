/**
 * AssetRelationshipsList - Display attached/related assets
 * Shows trailers attached to tractors, equipment attachments, etc.
 */

import { Link2, Loader2 } from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatDate } from '@/utils/format-helpers'
import { formatVehicleShortName } from '@/utils/vehicle-display'

export interface AssetRelationshipsListProps {
  /** ID of the vehicle to show relationships for */
  vehicleId: string
}

interface AssetRelationship {
  id: string
  relationship_type: string
  child_asset_id: string
  child_asset_name?: string
  child_make?: string
  child_model?: string
  child_vin?: string
  child_type?: string
  effective_from: string
  notes?: string
}

/**
 * AssetRelationshipsList Component
 *
 * Displays a list of assets related to the current vehicle.
 * For example, shows trailers attached to a tractor.
 *
 * Note: This is a placeholder component. The API endpoint
 * /api/asset-relationships will need to be implemented.
 */
export function AssetRelationshipsList({ vehicleId }: AssetRelationshipsListProps) {
  const { push } = useDrilldown()

  // Fetch active relationships for this vehicle
  const { data, error, isLoading } = useSWR<{
    relationships: AssetRelationship[]
  }>(
    `/api/asset-relationships/active?parent_asset_id=${vehicleId}`,
    apiFetcher,
    {
      // Don't retry if endpoint doesn't exist yet
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  )

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
        <span className="ml-2 text-sm text-[var(--text-secondary)]">Loading relationships...</span>
      </div>
    )
  }

  // Show empty state when data is unavailable
  if (error) {
    return (
      <div className="text-center py-3">
        <Link2 className="h-8 w-8 text-[var(--text-secondary)] mx-auto mb-2" />
        <p className="text-sm text-[var(--text-secondary)]">
          No asset relationships found
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          No attached trailers, equipment, or related assets for this vehicle
        </p>
      </div>
    )
  }

  const relationships = data?.relationships || []

  // No relationships found
  if (relationships.length === 0) {
    return (
      <div className="text-center py-3">
        <Link2 className="h-8 w-8 text-[var(--text-secondary)] mx-auto mb-2" />
        <p className="text-sm text-[var(--text-secondary)]">
          No attached assets
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          This vehicle has no currently attached trailers or equipment
        </p>
      </div>
    )
  }

  // Display relationships
  return (
    <div className="space-y-3">
      {relationships.map((relationship) => (
        <Card key={relationship.id} className="p-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[var(--text-secondary)]" />
                <h4 className="font-medium">
                  {relationship.child_asset_name ||
                    formatVehicleShortName({ make: relationship.child_make, model: relationship.child_model }) ||
                    'Unknown Asset'}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {relationship.relationship_type}
                </Badge>
              </div>

              <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                {relationship.child_vin && (
                  <div>
                    <span className="font-medium">VIN:</span> {relationship.child_vin}
                  </div>
                )}
                {relationship.child_type && (
                  <div>
                    <span className="font-medium">Type:</span> {relationship.child_type}
                  </div>
                )}
                {relationship.effective_from && (
                  <div>
                    <span className="font-medium">Attached:</span>{' '}
                    {formatDate(relationship.effective_from)}
                  </div>
                )}
                {relationship.notes && (
                  <div className="mt-2 text-xs italic">
                    {relationship.notes}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => {
                push({
                  id: `vehicle-${relationship.child_asset_id}`,
                  type: 'vehicle',
                  label: relationship.child_asset_name ||
                    formatVehicleShortName({ make: relationship.child_make, model: relationship.child_model }) ||
                    'Asset',
                  data: { vehicleId: relationship.child_asset_id }
                })
              }}
            >
              View
            </Button>
          </div>
        </Card>
      ))}

      {/* Action button to manage relationships */}
      <Button
        variant="outline"
        className="w-full"
        size="sm"
        onClick={() => {
          push({
            id: `asset-mgmt-${vehicleId}`,
            type: 'vehicle',
            label: 'Manage Attachments',
            data: { vehicleId, tab: 'attachments' }
          })
        }}
      >
        <Link2 className="h-4 w-4 mr-2" />
        Manage Attachments
      </Button>
    </div>
  )
}
