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

import React, { useState, useMemo, Suspense, lazy, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Car,
  Clock,
  Warning,
  Gauge,
  ListBullets,
  CaretRight,
  X,
  Eye,
  ArrowsClockwise
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  AssetCategory,
  AssetType,
  OperationalStatus
} from '@/types/asset.types'

// Lazy load components
const Asset3DViewer = lazy(() => import('@/components/garage/Asset3DViewer').then(m => ({ default: m.Asset3DViewer })))
import { VehicleHUD, type VehicleStats } from '@/components/garage/VehicleHUD'
import { TimelineDrawer, generateDemoEvents, type TimelineEvent } from '@/components/garage/TimelineDrawer'
import { DamageStrip, generateDemoDamages, type DamagePin } from '@/components/garage/DamageStrip'

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
// DEMO DATA
// ============================================================================

const DEMO_VEHICLES: GarageVehicle[] = [
  {
    id: 'demo-1',
    name: 'Fleet Truck #1',
    make: 'Ford',
    model: 'F-150 Lightning',
    year: 2024,
    vin: '1FTFW1E82NFA12345',
    licensePlate: 'FL-ELEC-01',
    assetTag: 'FLT-001',
    category: 'LIGHT_COMMERCIAL',
    type: 'PICKUP_TRUCK',
    color: '#2563eb',
    department: 'Operations',
    status: 'ACTIVE',
    mileage: 45230,
    oilLife: 72,
    brakeLife: 65,
    tireHealth: 80,
    batteryHealth: 95
  },
  {
    id: 'demo-2',
    name: 'Executive SUV',
    make: 'Tesla',
    model: 'Model Y',
    year: 2024,
    vin: '5YJSA1E26FF123456',
    licensePlate: 'FL-EV-002',
    assetTag: 'EXEC-002',
    category: 'PASSENGER_VEHICLE',
    type: 'SUV',
    color: '#dc2626',
    department: 'Executive',
    status: 'ACTIVE',
    mileage: 28500,
    oilLife: 100, // EV
    brakeLife: 90,
    tireHealth: 75,
    batteryHealth: 98
  },
  {
    id: 'demo-3',
    name: 'Service Van #3',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2023,
    vin: 'WD3PF0CD5PP123456',
    licensePlate: 'FL-VAN-03',
    assetTag: 'SVC-003',
    category: 'LIGHT_COMMERCIAL',
    type: 'CARGO_VAN',
    color: '#6366f1',
    department: 'Service',
    status: 'ACTIVE',
    mileage: 62400,
    oilLife: 45,
    brakeLife: 55,
    tireHealth: 60,
    batteryHealth: 85
  }
]

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
          oilLife: v.oilLife || Math.floor(Math.random() * 40 + 60),
          brakeLife: v.brakeLife || Math.floor(Math.random() * 40 + 50),
          tireHealth: v.tireHealth || Math.floor(Math.random() * 30 + 60),
          batteryHealth: v.batteryHealth || Math.floor(Math.random() * 20 + 75)
        }))
      }
    }
  } catch (e) {
    console.log('[VirtualGarage3D] API unavailable, using demo data')
  }
  return DEMO_VEHICLES
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
    // Return simulated data
  }
  // Return simulated telemetry
  return {
    vehicleId,
    timestamp: new Date(),
    rpm: Math.floor(Math.random() * 2000 + 800),
    speed: Math.floor(Math.random() * 45),
    coolantTemp: Math.floor(Math.random() * 30 + 180),
    fuelLevel: Math.floor(Math.random() * 40 + 40),
    batteryVoltage: 12.4 + Math.random() * 1.2,
    engineLoad: Math.floor(Math.random() * 40 + 20),
    throttlePosition: Math.floor(Math.random() * 30),
    dtcCodes: [],
    checkEngineLight: false
  }
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
            'flex items-center gap-3 px-4 py-2 rounded-lg shrink-0',
            'border transition-all',
            selectedId === vehicle.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
          )}
        >
          <Car className="w-5 h-5" />
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
        <ArrowsClockwise className="w-12 h-12 mx-auto mb-3 animate-spin" />
        <p className="text-sm">Loading 3D viewer...</p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VirtualGarage3D({ data }: { data?: any }) {
  // State
  const [selectedVehicle, setSelectedVehicle] = useState<GarageVehicle | null>(null)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [isDamageStripExpanded, setIsDamageStripExpanded] = useState(false)

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['garage-vehicles'],
    queryFn: fetchVehicles,
    staleTime: 30 * 1000,
    refetchInterval: 30000
  })

  // Fetch real-time telemetry
  const { data: telemetry } = useQuery({
    queryKey: ['vehicle-telemetry', selectedVehicle?.id],
    queryFn: () => fetchTelemetry(selectedVehicle?.id || ''),
    enabled: !!selectedVehicle?.id,
    staleTime: 1000,
    refetchInterval: 2000
  })

  // Select first vehicle by default
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0])
    }
  }, [vehicles, selectedVehicle])

  // Generate demo timeline and damage data for selected vehicle
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!selectedVehicle) return []
    return generateDemoEvents(selectedVehicle.id)
  }, [selectedVehicle])

  const damageData = useMemo<DamagePin[]>(() => {
    if (!selectedVehicle) return []
    return generateDemoDamages(selectedVehicle.id)
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
    <div className="relative w-full h-[calc(100vh-200px)] min-h-[600px] bg-slate-950 rounded-xl overflow-hidden">
      {/* Header with vehicle selector */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-slate-950 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Virtual Garage</h2>
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
          onSelect={setSelectedVehicle}
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
          <ScrollArea className="h-full">
            <VehicleHUD stats={vehicleStats} />
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
        onEventClick={(event) => console.log('Event clicked:', event)}
      />

      {/* Damage Strip (Bottom Panel) */}
      <DamageStrip
        damages={damageData}
        isExpanded={isDamageStripExpanded}
        onToggleExpand={() => setIsDamageStripExpanded(!isDamageStripExpanded)}
        onDamageClick={(damage) => console.log('Damage clicked:', damage)}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-30">
          <div className="text-center">
            <ArrowsClockwise className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm text-slate-400">Loading garage...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default VirtualGarage3D
