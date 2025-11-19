/**
 * AssetRelationshipsList - Display attached/related assets
 * Shows trailers attached to tractors, equipment attachments, etc.
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import useSWR from 'swr'
import { Link2, AlertCircle, Loader2 } from 'lucide-react'

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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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
  // Fetch active relationships for this vehicle
  const { data, error, isLoading } = useSWR<{
    relationships: AssetRelationship[]
  }>(
    `/api/asset-relationships/active?parent_asset_id=${vehicleId}`,
    fetcher,
    {
      // Don't retry if endpoint doesn't exist yet
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  )

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading relationships...</span>
      </div>
    )
  }

  // Show error state (API not implemented yet)
  if (error) {
    return (
      <Card className="p-4 bg-muted/50 border-dashed">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Asset Relationships Feature
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This feature will display attached trailers, equipment, and other related assets.
              API endpoint not yet implemented.
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Expected endpoint: GET /api/asset-relationships/active?parent_asset_id={vehicleId}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const relationships = data?.relationships || []

  // No relationships found
  if (relationships.length === 0) {
    return (
      <div className="text-center py-6">
        <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No attached assets
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This vehicle has no currently attached trailers or equipment
        </p>
      </div>
    )
  }

  // Display relationships
  return (
    <div className="space-y-3">
      {relationships.map((relationship) => (
        <Card key={relationship.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">
                  {relationship.child_asset_name ||
                    `${relationship.child_make} ${relationship.child_model}` ||
                    'Unknown Asset'}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {relationship.relationship_type}
                </Badge>
              </div>

              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
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
                    {new Date(relationship.effective_from).toLocaleDateString()}
                  </div>
                )}
                {relationship.notes && (
                  <div className="mt-2 text-xs italic">
                    {relationship.notes}
                  </div>
                )}
              </div>
            </div>

            <Button variant="ghost" size="sm" className="ml-2">
              View
            </Button>
          </div>
        </Card>
      ))}

      {/* Action button to manage relationships */}
      <Button variant="outline" className="w-full" size="sm">
        <Link2 className="h-4 w-4 mr-2" />
        Manage Attachments
      </Button>
    </div>
  )
}
