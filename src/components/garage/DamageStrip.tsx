/**
 * DamageStrip - Bottom Panel for Damage Visualization
 *
 * Features:
 * - Visual damage indicators on vehicle silhouette
 * - Clickable damage zones
 * - Manual pin/annotation support
 * - Severity color coding
 * - Toggle between damage views
 *
 * Created: 2025-11-24
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Warning,
  Eye,
  EyeSlash,
  PushPin,
  Plus,
  CaretUp,
  CaretDown,
  X
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Damage zone definitions for vehicle silhouette
export type DamageZone =
  | 'front_bumper'
  | 'front_left_fender'
  | 'front_right_fender'
  | 'front_hood'
  | 'front_windshield'
  | 'driver_door'
  | 'passenger_door'
  | 'rear_left_door'
  | 'rear_right_door'
  | 'driver_mirror'
  | 'passenger_mirror'
  | 'roof'
  | 'rear_windshield'
  | 'trunk'
  | 'rear_bumper'
  | 'rear_left_fender'
  | 'rear_right_fender'
  | 'driver_front_wheel'
  | 'driver_rear_wheel'
  | 'passenger_front_wheel'
  | 'passenger_rear_wheel'
  | 'undercarriage'
  | 'custom'

interface DamagePin {
  id: string
  zone: DamageZone
  position: { x: number; y: number } // Percentage position on silhouette
  severity: 'minor' | 'moderate' | 'severe'
  description: string
  date?: Date
  photos?: string[]
  repairCost?: number
  repaired?: boolean
}

interface DamageStripProps {
  damages: DamagePin[]
  isExpanded: boolean
  onToggleExpand: () => void
  onDamageClick?: (damage: DamagePin) => void
  onAddDamage?: (zone: DamageZone, position: { x: number; y: number }) => void
  showAddMode?: boolean
  className?: string
}

// Severity colors
const SEVERITY_COLORS = {
  minor: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500' },
  moderate: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500' },
  severe: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500' }
}

// Vehicle silhouette zone positions (percentage-based)
const ZONE_POSITIONS: Record<DamageZone, { x: number; y: number; label: string }> = {
  front_bumper: { x: 95, y: 50, label: 'Front Bumper' },
  front_left_fender: { x: 85, y: 25, label: 'Front Left Fender' },
  front_right_fender: { x: 85, y: 75, label: 'Front Right Fender' },
  front_hood: { x: 80, y: 50, label: 'Hood' },
  front_windshield: { x: 70, y: 50, label: 'Windshield' },
  driver_door: { x: 55, y: 20, label: 'Driver Door' },
  passenger_door: { x: 55, y: 80, label: 'Passenger Door' },
  rear_left_door: { x: 40, y: 20, label: 'Rear Left Door' },
  rear_right_door: { x: 40, y: 80, label: 'Rear Right Door' },
  driver_mirror: { x: 65, y: 15, label: 'Driver Mirror' },
  passenger_mirror: { x: 65, y: 85, label: 'Passenger Mirror' },
  roof: { x: 50, y: 50, label: 'Roof' },
  rear_windshield: { x: 30, y: 50, label: 'Rear Windshield' },
  trunk: { x: 15, y: 50, label: 'Trunk' },
  rear_bumper: { x: 5, y: 50, label: 'Rear Bumper' },
  rear_left_fender: { x: 15, y: 25, label: 'Rear Left Fender' },
  rear_right_fender: { x: 15, y: 75, label: 'Rear Right Fender' },
  driver_front_wheel: { x: 75, y: 15, label: 'Front Left Wheel' },
  driver_rear_wheel: { x: 25, y: 15, label: 'Rear Left Wheel' },
  passenger_front_wheel: { x: 75, y: 85, label: 'Front Right Wheel' },
  passenger_rear_wheel: { x: 25, y: 85, label: 'Rear Right Wheel' },
  undercarriage: { x: 50, y: 50, label: 'Undercarriage' },
  custom: { x: 50, y: 50, label: 'Custom Location' }
}

// Damage Pin Component
function DamagePinMarker({
  damage,
  onClick,
  isSelected
}: {
  damage: DamagePin
  onClick?: () => void
  isSelected?: boolean
}) {
  const colors = SEVERITY_COLORS[damage.severity]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'absolute w-5 h-5 rounded-full flex items-center justify-center',
              'transform -translate-x-1/2 -translate-y-1/2 transition-all',
              colors.bg,
              isSelected && 'ring-2 ring-white scale-125',
              damage.repaired && 'opacity-50',
              'hover:scale-125 cursor-pointer'
            )}
            style={{
              left: `${damage.position.x}%`,
              top: `${damage.position.y}%`
            }}
            onClick={onClick}
          >
            {damage.repaired ? (
              <span className="text-[10px] text-white font-bold">R</span>
            ) : (
              <Warning className="w-3 h-3 text-white" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{ZONE_POSITIONS[damage.zone]?.label || 'Custom'}</p>
            <p className="text-xs text-muted-foreground">{damage.description}</p>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={damage.severity === 'severe' ? 'destructive' : 'secondary'}>
                {damage.severity}
              </Badge>
              {damage.repaired && <Badge variant="outline">Repaired</Badge>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Vehicle Silhouette SVG (Top-down view)
function VehicleSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 80"
      className={cn('w-full h-full', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vehicle body outline */}
      <path
        d="M180 40 C180 25 175 15 160 12 L140 10 C130 10 120 15 110 15 L90 15 C80 15 70 10 60 10 L40 12 C25 15 20 25 20 40 C20 55 25 65 40 68 L60 70 C70 70 80 65 90 65 L110 65 C120 65 130 70 140 70 L160 68 C175 65 180 55 180 40Z"
        fill="currentColor"
        className="text-slate-700"
        stroke="currentColor"
        strokeWidth="1"
        className="stroke-slate-500"
      />
      {/* Windshield */}
      <path
        d="M140 20 C135 22 130 30 130 40 C130 50 135 58 140 60 L145 60 L145 20 L140 20Z"
        fill="currentColor"
        className="text-slate-600"
      />
      {/* Rear windshield */}
      <path
        d="M60 20 C65 22 70 30 70 40 C70 50 65 58 60 60 L55 60 L55 20 L60 20Z"
        fill="currentColor"
        className="text-slate-600"
      />
      {/* Wheels */}
      <ellipse cx="150" cy="15" rx="12" ry="8" fill="currentColor" className="text-slate-800" />
      <ellipse cx="150" cy="65" rx="12" ry="8" fill="currentColor" className="text-slate-800" />
      <ellipse cx="50" cy="15" rx="12" ry="8" fill="currentColor" className="text-slate-800" />
      <ellipse cx="50" cy="65" rx="12" ry="8" fill="currentColor" className="text-slate-800" />
      {/* Headlights */}
      <ellipse cx="175" cy="30" rx="4" ry="8" fill="#FFF3" />
      <ellipse cx="175" cy="50" rx="4" ry="8" fill="#FFF3" />
      {/* Taillights */}
      <ellipse cx="25" cy="30" rx="3" ry="6" fill="#F003" />
      <ellipse cx="25" cy="50" rx="3" ry="6" fill="#F003" />
    </svg>
  )
}

// Damage List Item
function DamageListItem({
  damage,
  onClick,
  isSelected
}: {
  damage: DamagePin
  onClick?: () => void
  isSelected?: boolean
}) {
  const colors = SEVERITY_COLORS[damage.severity]

  return (
    <button
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg w-full text-left',
        'hover:bg-slate-800/50 transition-colors',
        isSelected && 'bg-slate-800/80 ring-1 ring-slate-600'
      )}
      onClick={onClick}
    >
      <div className={cn('w-3 h-3 rounded-full', colors.bg)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {ZONE_POSITIONS[damage.zone]?.label || 'Custom'}
        </p>
        <p className="text-xs text-slate-400 truncate">{damage.description}</p>
      </div>
      <Badge
        variant={damage.repaired ? 'outline' : damage.severity === 'severe' ? 'destructive' : 'secondary'}
        className="text-[10px] shrink-0"
      >
        {damage.repaired ? 'Fixed' : damage.severity}
      </Badge>
    </button>
  )
}

export function DamageStrip({
  damages,
  isExpanded,
  onToggleExpand,
  onDamageClick,
  onAddDamage,
  showAddMode = false,
  className
}: DamageStripProps) {
  const [selectedDamage, setSelectedDamage] = useState<string | null>(null)
  const [showPins, setShowPins] = useState(true)

  const activeDamages = damages.filter(d => !d.repaired)
  const repairedDamages = damages.filter(d => d.repaired)

  const handleDamageClick = (damage: DamagePin) => {
    setSelectedDamage(damage.id)
    onDamageClick?.(damage)
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-gradient-to-t from-slate-950 to-slate-900/95',
        'border-t border-slate-700/50',
        'transition-all duration-300',
        isExpanded ? 'h-64' : 'h-16',
        className
      )}
    >
      {/* Collapsed Header */}
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <CaretDown className="w-5 h-5" />
            ) : (
              <CaretUp className="w-5 h-5" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Warning className="w-5 h-5 text-amber-400" />
            <span className="font-medium text-white">Damage Inspector</span>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 ml-4">
            <Badge variant="destructive" className="text-xs">
              {activeDamages.length} Active
            </Badge>
            {repairedDamages.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {repairedDamages.length} Repaired
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPins(!showPins)}
            className="h-8"
          >
            {showPins ? (
              <Eye className="w-4 h-4 mr-2" />
            ) : (
              <EyeSlash className="w-4 h-4 mr-2" />
            )}
            {showPins ? 'Hide' : 'Show'} Pins
          </Button>

          {onAddDamage && (
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="w-4 h-4 mr-2" />
              Add Damage
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 grid grid-cols-[1fr,300px] gap-4 h-48">
          {/* Vehicle Silhouette with Damage Pins */}
          <div className="relative bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <VehicleSilhouette className="opacity-60" />

            {/* Damage pins */}
            {showPins && damages.map((damage) => (
              <DamagePinMarker
                key={damage.id}
                damage={damage}
                onClick={() => handleDamageClick(damage)}
                isSelected={selectedDamage === damage.id}
              />
            ))}

            {/* View label */}
            <div className="absolute bottom-2 left-2 text-xs text-slate-500">
              Top-down view
            </div>
          </div>

          {/* Damage List */}
          <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
            <div className="p-2 border-b border-slate-700/50">
              <h4 className="text-xs font-medium text-slate-400 uppercase">Damage Points</h4>
            </div>
            <div className="h-36 overflow-y-auto p-2 space-y-1">
              {damages.length > 0 ? (
                damages.map((damage) => (
                  <DamageListItem
                    key={damage.id}
                    damage={damage}
                    onClick={() => handleDamageClick(damage)}
                    isSelected={selectedDamage === damage.id}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <PushPin className="w-6 h-6 mb-2 opacity-50" />
                  <p className="text-xs">No damage reported</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Demo data generator
export function generateDemoDamages(vehicleId: string): DamagePin[] {
  return [
    {
      id: `${vehicleId}-dmg-1`,
      zone: 'rear_bumper',
      position: { x: 5, y: 50 },
      severity: 'moderate',
      description: 'Parking lot collision - scratches and dent',
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      repairCost: 450,
      repaired: true
    },
    {
      id: `${vehicleId}-dmg-2`,
      zone: 'front_left_fender',
      position: { x: 85, y: 25 },
      severity: 'minor',
      description: 'Door ding from parking lot',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      repairCost: 150,
      repaired: false
    },
    {
      id: `${vehicleId}-dmg-3`,
      zone: 'front_windshield',
      position: { x: 70, y: 40 },
      severity: 'minor',
      description: 'Small rock chip',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      repairCost: 75,
      repaired: false
    }
  ]
}

export type { DamagePin }
export default DamageStrip
