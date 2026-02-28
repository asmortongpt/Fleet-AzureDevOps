import {
  Car,
  MapPin,
  Circle,
  Zap as Zap,
  Wrench,
  BatteryMedium as Battery,
  AlertTriangle
} from 'lucide-react'
import React, { useMemo } from 'react'

import { MaintenanceRequestDialog } from '../modules/maintenance/MaintenanceRequestDialog'
import { Badge } from '../ui/badge'
import { Section } from '../ui/section'

import { UnifiedFleetMap } from './UnifiedFleetMap'

import { useFleetData } from '@/hooks/use-fleet-data'
import { Vehicle, GISFacility } from '@/lib/types'

// Re-export GISFacility for components that import from this module
export type { GISFacility }

/**
 * Props for ProfessionalFleetMap
 */
export interface ProfessionalFleetMapProps {
  /** Vehicles to display on the map */
  vehicles: Vehicle[]
  /** Optional facilities to display */
  facilities?: GISFacility[]
  /** Height of the map container */
  height?: string
  /** Callback when vehicle is selected */
  onVehicleSelect?: (vehicleId: string) => void
  /** Show map legend */
  showLegend?: boolean
  /** Enable real-time updates */
  enableRealTime?: boolean
  /** Visual variant */
  variant?: 'default' | 'immersive'
  /** Force the simulated grid view (fallback) */
  forceSimulatedView?: boolean
}

/**
 * Professional Fleet Map Component
 *
 * A production-ready map interface designed for fleet management dashboards.
 * Features:
 * - Real-time vehicle tracking with live GPS updates
 * - Color-coded vehicle status indicators
 * - Interactive map legend
 * - Facility and geofence visualization
 * - Responsive design for dashboard integration
 */
export const ProfessionalFleetMap: React.FC<ProfessionalFleetMapProps> = ({
  vehicles,
  facilities = [],
  height = '500px',
  onVehicleSelect,
  showLegend = true,
  enableRealTime = true,
  variant = 'default',
  forceSimulatedView = false
}) => {
  const fleetData = useFleetData()
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = React.useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>("")

  const handleVehicleAction = (action: string, vehicleId: string) => {
    if (action === 'maintenance') {
      setSelectedVehicleId(vehicleId)
      setMaintenanceDialogOpen(true)
    }
  }

  // Calculate vehicle status metrics for legend
  const statusMetrics = useMemo(() => {
    const metrics = {
      active: 0,
      idle: 0,
      charging: 0,
      service: 0,
      emergency: 0,
      offline: 0
    }

    vehicles.forEach(vehicle => {
      if (Object.prototype.hasOwnProperty.call(metrics, vehicle.status)) {
        metrics[vehicle.status as keyof typeof metrics]++
      }
    })

    return metrics
  }, [vehicles])

  const legendItems = [
    {
      icon: <Car className="w-4 h-4" />,
      label: 'Active',
      count: statusMetrics.active,
      color: 'bg-green-500',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      icon: <Circle className="w-4 h-4" />,
      label: 'Idle',
      count: statusMetrics.idle,
      color: 'bg-white/40',
      textColor: 'text-[var(--text-secondary)]',
      bgColor: 'bg-white/[0.03]'
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'Charging',
      count: statusMetrics.charging,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      icon: <Wrench className="w-4 h-4" />,
      label: 'Service',
      count: statusMetrics.service,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Emergency',
      count: statusMetrics.emergency,
      color: 'bg-red-500',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      icon: <Battery className="w-4 h-4" />,
      label: 'Offline',
      count: statusMetrics.offline,
      color: 'bg-white/20',
      textColor: 'text-[var(--text-tertiary)]',
      bgColor: 'bg-white/[0.03]'
    }
  ]

  const activeLegendItems = legendItems.filter(item => item.count > 0)

  if (variant === 'immersive') {
    return (
      <div className="relative w-full h-full">
        {/* Map Container */}
        <div style={{ height }} className="w-full">
          <UnifiedFleetMap
            vehicles={vehicles}
            facilities={facilities}
            enableRealTime={enableRealTime}
            onVehicleSelect={onVehicleSelect}
            height={height}
            forceSimulatedView={forceSimulatedView}
            onVehicleAction={handleVehicleAction}
          />
        </div>

        {/* Maintenance Request Dialog */}
        <MaintenanceRequestDialog
          open={maintenanceDialogOpen}
          onOpenChange={setMaintenanceDialogOpen}
          defaultVehicleId={selectedVehicleId}
          data={fleetData}
        />

        {/* Map Legend (Styled for Dark Mode/Immersive) */}
        {showLegend && activeLegendItems.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-3">
              <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                Vehicle Status
              </div>
              <div className="space-y-1.5">
                {activeLegendItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between gap-3 px-2 py-1.5 rounded-md hover:bg-[var(--surface-glass-hover)] transition-colors cursor-default`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px] bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-tertiary)]">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Facilities Legend (Immersive) */}
        {showLegend && facilities.length > 0 && (
          <div className="absolute bottom-4 right-4 z-10">
            <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-3 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {facilities.length} Locations
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Section
      title="Live Fleet Map"
      description={`${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'} tracked`}
      icon={<MapPin className="h-4 w-4 text-primary" />}
      actions={
        enableRealTime ? (
          <Badge variant="outline" className="ml-2">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
            Real-time
          </Badge>
        ) : null
      }
      className="w-full"
      contentClassName="p-0"
    >
      <div className="relative" data-testid="fleet-map">
        {/* Map Container */}
        <div style={{ height }} className="w-full">
          <UnifiedFleetMap
            vehicles={vehicles}
            facilities={facilities}
            enableRealTime={enableRealTime}
            onVehicleSelect={onVehicleSelect}
            height={height}
            forceSimulatedView={forceSimulatedView}
            onVehicleAction={handleVehicleAction}
          />

          {/* Maintenance Request Dialog */}
          <MaintenanceRequestDialog
            open={maintenanceDialogOpen}
            onOpenChange={setMaintenanceDialogOpen}
            defaultVehicleId={selectedVehicleId}
            data={fleetData}
          />
        </div>

        {/* Map Legend */}
        {showLegend && activeLegendItems.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)] p-3">
              <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                Vehicle Status
              </div>
              <div className="space-y-1.5">
                {activeLegendItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between gap-3 px-2 py-1.5 rounded-md ${item.bgColor} transition-colors hover:opacity-80`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color} flex items-center justify-center`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <span className={`text-sm font-medium ${item.textColor}`}>
                        {item.label}
                      </span>
                    </div>
                    <Badge variant="secondary" className="h-5 px-2 text-xs font-semibold">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Facilities Legend (if facilities present) */}
        {showLegend && facilities.length > 0 && (
          <div className="absolute bottom-4 right-4 z-10">
            <div className="bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)] px-3 py-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {facilities.length} {facilities.length === 1 ? 'location' : 'locations'}
              </span>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
