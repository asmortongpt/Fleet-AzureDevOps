/**
 * VirtualGarage3D - Game-Like Garage Experience (Forza/GT Style)
 *
 * Enhanced Virtual Garage with:
 * - 3D vehicle viewer with game-like camera controls
 * - Vehicle HUD panel (left) with real-time stats
 * - Timeline drawer (right) with maintenance/damage history
 * - Damage strip (bottom) with visual damage indicators
 * - Real-time OBD2 telemetry integration
 *
 * Based on 3D Photogrammetry & Damage Detection Integration Plan
 * Created: 2025-11-24
 */

import {
  Car,
  Clock,
  Warning,
  Eye,
  ArrowsClockwise
} from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, Suspense, lazy, useEffect } from 'react'

import { DamageStrip, type DamagePin } from '@/components/garage/DamageStrip'
import { TimelineDrawer, type TimelineEvent } from '@/components/garage/TimelineDrawer'
import { VehicleHUD, type VehicleStats } from '@/components/garage/VehicleHUD'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'
import {
  AssetCategory,
  AssetType,
  OperationalStatus
} from '@/types/asset.types'


// Lazy load components
const Asset3DViewer = lazy(() => import('@/components/garage/Asset3DViewer'))
import logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface GarageVehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  vin?: string
  licensePlate?: string
  assetTag?: string
  category?: AssetCategory
  type?: AssetType
  color?: string
  department?: string
  status?: OperationalStatus
  mileage?: number
  engineHours?: number
  bayId?: string // Added for drilldowns
  // Health stats
  oilLife?: number
  brakeLife?: number
  tireHealth?: number
  batteryHealth?: number
}

interface OBD2Telemetry {
  vehicleId: string
  timestamp: Date
  rpm: number
  speed: number
  coolantTemp: number
  fuelLevel: number
  batteryVoltage: number
  engineLoad: number
  throttlePosition: number
  dtcCodes: string[]
  checkEngineLight: boolean
}

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

async function fetchVehicles(): Promise<GarageVehicle[]> {
  try {
    // Try emulator API first
    const res = await fetch('/api/emulator/vehicles')
    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map((v: any) => ({
          id: v.id,
          name: v.name || `${v.year} ${v.make} ${v.model}`,
          make: v.make,
          model: v.model,
          year: v.year,
          vin: v.vin,
          licensePlate: v.licensePlate,
          assetTag: v.assetTag || v.id,
          category: v.category,
          type: v.type,
          color: v.color,
          department: v.department,
          status: v.status,
          mileage: v.mileage || v.odometer,
          engineHours: v.engineHours,
          oilLife: v.oilLife,
          brakeLife: v.brakeLife,
          tireHealth: v.tireHealth,
          batteryHealth: v.batteryHealth
        }))
      }
    }
  } catch (e) {
    logger.debug('[VirtualGarage3D] API unavailable')
  }
  return []
}

async function fetchTelemetry(vehicleId: string): Promise<OBD2Telemetry | null> {
  if (!vehicleId) return null
  try {
    const res = await fetch(`/api/emulator/vehicles/${vehicleId}/telemetry`)
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.data) {
        return data.data
      }
    }
  } catch {
    return null
  }
  return null
}

// ============================================================================
// VEHICLE SELECTOR
// ============================================================================

function VehicleSelector({
  vehicles,
  selectedId,
  onSelect,
  className
}: {
  vehicles: GarageVehicle[]
  selectedId?: string
  onSelect: (vehicle: GarageVehicle) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
      {vehicles.map((vehicle) => (
        <button
          key={vehicle.id}
          onClick={() => onSelect(vehicle)}
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg shrink-0',
            'border transition-all',
            selectedId === vehicle.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
          )}
        >
          <Car className="w-3 h-3" />
          <div className="text-left">
            <p className="font-medium text-sm">{vehicle.name}</p>
            <p className="text-xs opacity-70">{vehicle.licensePlate || vehicle.assetTag}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// 3D VIEWER FALLBACK
// ============================================================================

function Viewer3DFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center text-white">
        <ArrowsClockwise className="w-12 h-9 mx-auto mb-3 animate-spin" />
        <p className="text-sm">Loading 3D viewer...</p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VirtualGarage3D({ data: _data }: { data?: any }) {
  const { push } = useDrilldown()
  // State
  const [selectedVehicle, setSelectedVehicle] = useState<GarageVehicle | null>(null)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [isDamageStripExpanded, setIsDamageStripExpanded] = useState(false)

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['garage-vehicles'],
    queryFn: fetchVehicles,
    staleTime: 30 * 1000,
    refetchInterval: 30000,
    gcTime: 5 * 60 * 1000
  })

  // Fetch real-time telemetry
  const { data: telemetry } = useQuery({
    queryKey: ['vehicle-telemetry', selectedVehicle?.id],
    queryFn: () => fetchTelemetry(selectedVehicle?.id || ''),
    enabled: !!selectedVehicle?.id,
    staleTime: 1000,
    refetchInterval: 2000,
    gcTime: 5 * 60 * 1000
  })

  // Select first vehicle by default
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0])
    }
  }, [vehicles, selectedVehicle])

  // Timeline and damage data (real API integration pending)
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!selectedVehicle) return []
    return []
  }, [selectedVehicle])

  const damageData = useMemo<DamagePin[]>(() => {
    if (!selectedVehicle) return []
    return []
  }, [selectedVehicle])

  // Build vehicle stats for HUD
  const vehicleStats = useMemo<VehicleStats | null>(() => {
    if (!selectedVehicle) return null
    return {
      name: selectedVehicle.name,
      make: selectedVehicle.make,
      model: selectedVehicle.model,
      year: selectedVehicle.year,
      vin: selectedVehicle.vin,
      licensePlate: selectedVehicle.licensePlate,
      mileage: selectedVehicle.mileage,
      engineHours: selectedVehicle.engineHours,
      oilLife: selectedVehicle.oilLife,
      brakeLife: selectedVehicle.brakeLife,
      tireHealth: selectedVehicle.tireHealth,
      batteryHealth: selectedVehicle.batteryHealth,
      // Real-time telemetry
      rpm: telemetry?.rpm,
      speed: telemetry?.speed,
      coolantTemp: telemetry?.coolantTemp,
      fuelLevel: telemetry?.fuelLevel,
      batteryVoltage: telemetry?.batteryVoltage,
      engineLoad: telemetry?.engineLoad,
      dtcCodes: telemetry?.dtcCodes,
      checkEngineLight: telemetry?.checkEngineLight
    }
  }, [selectedVehicle, telemetry])

  return (
    <div className="relative w-full h-[calc(100vh-200px)] min-h-[600px] bg-slate-950 rounded-md overflow-hidden">
      {/* Header with vehicle selector */}
      <div className="absolute top-0 left-0 right-0 z-20 p-2 bg-gradient-to-b from-slate-950 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">Virtual Garage</h2>
            <Badge variant="secondary" className="text-xs">
              {vehicles.length} Vehicles
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTimelineOpen(!isTimelineOpen)}
              className={cn(isTimelineOpen && 'bg-primary text-primary-foreground')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDamageStripExpanded(!isDamageStripExpanded)}
              className={cn(isDamageStripExpanded && 'bg-primary text-primary-foreground')}
            >
              <Warning className="w-4 h-4 mr-2" />
              Damage
            </Button>
          </div>
        </div>

        {/* Vehicle Selector */}
        <VehicleSelector
          vehicles={vehicles}
          selectedId={selectedVehicle?.id}
          onSelect={(vehicle) => setSelectedVehicle(vehicle)}
        />
      </div>

      {/* Main 3D Viewer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<Viewer3DFallback />}>
          {selectedVehicle && (
            <Asset3DViewer
              assetCategory={selectedVehicle.category}
              assetType={selectedVehicle.type}
              color={selectedVehicle.color}
              make={selectedVehicle.make}
              model={selectedVehicle.model}
              autoRotate={true}
            />
          )}
        </Suspense>
      </div>

      {/* Vehicle HUD (Left Panel) */}
      {vehicleStats && (
        <div className="absolute left-4 top-32 bottom-20 w-72 z-10">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2">
              <VehicleHUD stats={vehicleStats} />

              {/* Deep Drilldowns Integration */}
              <div className="space-y-3 pt-2 border-t border-slate-700/50">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Deep Intel</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-14 bg-slate-900/60 border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center gap-1 group"
                    onClick={() => {
                      if (selectedVehicle?.bayId) {
                        push({
                          id: `bay-${selectedVehicle.bayId}`,
                          type: 'garage-bay',
                          label: `Bay ${selectedVehicle.bayId.split('-')[1] || selectedVehicle.bayId}`,
                          data: { bayId: selectedVehicle.bayId }
                        })
                      }
                    }}
                  >
                    <ArrowsClockwise className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Bay Intel</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 bg-slate-900/60 border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center gap-1 group"
                    onClick={() => {
                      if (selectedVehicle?.id) {
                        push({
                          id: `vehicle-${selectedVehicle.id}`,
                          type: 'vehicle',
                          label: selectedVehicle.name,
                          data: { vehicleId: selectedVehicle.id }
                        })
                      }
                    }}
                  >
                    <Car className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Asset Data</span>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Camera Controls Hint */}
      <div className="absolute bottom-24 right-4 z-10 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>Drag to rotate | Scroll to zoom</span>
        </div>
      </div>

      {/* Timeline Drawer (Right Panel) */}
      <TimelineDrawer
        events={timelineEvents}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        onEventClick={(event) => logger.debug('Event clicked:', event)}
      />

      {/* Damage Strip (Bottom Panel) */}
      <DamageStrip
        damages={damageData}
        isExpanded={isDamageStripExpanded}
        onToggleExpand={() => setIsDamageStripExpanded(!isDamageStripExpanded)}
        onDamageClick={(damage) => logger.debug('Damage clicked:', damage)}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-30">
          <div className="text-center">
            <ArrowsClockwise className="w-4 h-4 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm text-slate-400">Loading garage...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default VirtualGarage3D
