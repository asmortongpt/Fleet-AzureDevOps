/**
 * Header Section Component
 * @module ArcGIS/components/HeaderSection
 */

import { Button } from "@/components/ui/button"
import { Plus, Download, ArrowClockwise } from "@phosphor-icons/react"

interface HeaderSectionProps {
  enabledLayersCount: number
  hasLayers: boolean
  onExport: () => void
  onRefresh: () => void
}

/**
 * Header section with title, description, and action buttons
 */
export function HeaderSection({ enabledLayersCount, hasLayers, onExport, onRefresh }: HeaderSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">ArcGIS Integration</h1>
        <p className="text-muted-foreground mt-1">
          Plug and play custom ArcGIS map layers{hasLayers && ` • ${enabledLayersCount} active`}
        </p>
      </div>
      <div className="flex gap-2">
        {hasLayers && (
          <>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <ArrowClockwise className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </>
        )}
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Layer
        </Button>
      </div>
    </div>
  )
}
