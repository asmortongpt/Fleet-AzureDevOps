/**
 * Layer Card Component
 * @module ArcGIS/components/LayerCard
 */

import { Eye, EyeSlash, DotsThree, Copy, Trash, CaretUp, CaretDown } from "@phosphor-icons/react"

import type { LayerWithStatus, LayerOperationState } from "../types"

import { LayerControls } from "./LayerControls"
import { LayerHealthBadge } from "./LayerHealthBadge"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LayerCardProps {
  layer: LayerWithStatus
  index: number
  totalLayers: number
  operation?: LayerOperationState
  onToggle: () => void
  onOpacityChange: (opacity: number) => void
  onDuplicate: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

/**
 * Individual layer card displaying layer info and controls
 */
export function LayerCard({
  layer,
  index,
  totalLayers,
  operation,
  onToggle,
  onOpacityChange,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: LayerCardProps) {
  const isLoading = operation?.loading

  return (
    <Card className={isLoading ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CardTitle className="text-lg">{layer.name}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {layer.layerType}
              </Badge>
              {layer.enabled ? (
                <Badge variant="default" className="text-xs bg-success">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              <LayerHealthBadge health={layer.health} />
            </div>
            {layer.description && <CardDescription>{layer.description}</CardDescription>}
            <p className="text-xs text-muted-foreground mt-2 font-mono truncate">{layer.serviceUrl}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={onMoveUp}
                disabled={index === 0 || isLoading}
               aria-label="Action button">
                <CaretUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={onMoveDown}
                disabled={index === totalLayers - 1 || isLoading}
               aria-label="Action button">
                <CaretDown className="w-3 h-3" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={onToggle} disabled={isLoading} aria-label="Action button">
              {layer.enabled ? <Eye className="w-4 h-4" /> : <EyeSlash className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading} aria-label="Action button">
                  <DotsThree className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <LayerControls opacity={layer.opacity} enabled={layer.enabled} loading={!!isLoading} onOpacityChange={onOpacityChange} />
      </CardContent>
    </Card>
  )
}
