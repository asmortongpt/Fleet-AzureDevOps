/**
 * Empty State Component
 * @module ArcGIS/components/EmptyState
 */

import { GlobeHemisphereWest } from "@phosphor-icons/react"

import { Card, CardContent } from "@/components/ui/card"

/**
 * Display empty state when no layers exist
 */
export function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <GlobeHemisphereWest className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No ArcGIS Layers Yet</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Add your first ArcGIS layer to visualize custom data
        </p>
      </CardContent>
    </Card>
  )
}
