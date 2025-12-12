/**
 * Layer Health Badge Component
 * @module ArcGIS/components/LayerHealthBadge
 */

import { CheckCircle, XCircle, Info } from "@phosphor-icons/react"

import type { LayerHealth } from "../types"

import { Badge } from "@/components/ui/badge"

interface LayerHealthBadgeProps {
  health?: LayerHealth
}

/**
 * Displays the health status of a layer
 */
export function LayerHealthBadge({ health }: LayerHealthBadgeProps) {
  switch (health) {
    case "healthy":
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" weight="fill" />
          Healthy
        </Badge>
      )
    case "error":
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="w-3 h-3 mr-1" weight="fill" />
          Error
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-xs">
          <Info className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      )
  }
}
