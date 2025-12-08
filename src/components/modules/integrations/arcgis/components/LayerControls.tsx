/**
 * Layer Controls Component
 * @module ArcGIS/components/LayerControls
 */

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface LayerControlsProps {
  opacity: number
  enabled: boolean
  loading: boolean
  onOpacityChange: (opacity: number) => void
}

/**
 * Layer opacity control slider
 */
export function LayerControls({ opacity, enabled, loading, onOpacityChange }: LayerControlsProps) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Opacity</Label>
          <span className="text-sm font-medium">{Math.round(opacity * 100)}%</span>
        </div>
        <Slider
          value={[opacity * 100]}
          onValueChange={([value]) => onOpacityChange(value / 100)}
          max={100}
          step={1}
          disabled={!enabled || loading}
        />
      </div>
    </div>
  )
}
