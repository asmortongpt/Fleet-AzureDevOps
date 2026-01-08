/**
 * Loading State Component
 * @module ArcGIS/components/LoadingState
 */

import { ArrowClockwise } from "@phosphor-icons/react"

import { Card, CardContent } from "@/components/ui/card"

/**
 * Display loading state while fetching layers
 */
export function LoadingState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <ArrowClockwise className="w-16 h-16 text-muted-foreground mb-4 animate-spin" />
        <h3 className="text-lg font-semibold mb-2">Loading Layers...</h3>
      </CardContent>
    </Card>
  )
}
