import React, { useMemo } from 'react'
import { UnifiedFleetMap } from './UnifiedFleetMap'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Vehicle, GISFacility } from '@/lib/types'
import {
  Car,
  MapPin,
  Circle,
  Zap as Lightning,
  Wrench,
  BatteryMedium as Battery,
  AlertTriangle
} from 'lucide-react'

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
  enableRealTime = true
}) => {
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
      if (metrics.hasOwnProperty(vehicle.status)) {
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
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    {
      icon: <Circle className="w-4 h-4" />,
      label: 'Idle',
      count: statusMetrics.idle,
      color: 'bg-gray-400',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50'
    },
    {
      icon: <Lightning className="w-4 h-4" />,
      label: 'Charging',
      count: statusMetrics.charging,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      icon: <Wrench className="w-4 h-4" />,
      label: 'Service',
      count: statusMetrics.service,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Emergency',
      count: statusMetrics.emergency,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50'
    },
    {
      icon: <Battery className="w-4 h-4" />,
      label: 'Offline',
      count: statusMetrics.offline,
      color: 'bg-gray-300',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ]

  const activeLegendItems = legendItems.filter(item => item.count > 0)

  return (
    <Card className="w-full" data-testid="fleet-map">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-primary" />
            Live Fleet Map
            {enableRealTime && (
              <Badge variant="outline" className="ml-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                Real-time
              </Badge>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} tracked
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Map Container */}
          <div style={{ height }} className="w-full">
            <UnifiedFleetMap
              vehicles={vehicles}
              facilities={facilities}
              enableRealTime={enableRealTime}
              onVehicleSelect={onVehicleSelect}
              height={height}
            />
          </div>

          {/* Map Legend */}
          {showLegend && activeLegendItems.length > 0 && (
            <div className="absolute bottom-4 left-4 z-10">
              <Card className="shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Vehicle Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="space-y-1.5">
                    {activeLegendItems.map((item, index) => (
                      <div
                        key={index}
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
                </CardContent>
              </Card>
            </div>
          )}

          {/* Facilities Legend (if facilities present) */}
          {showLegend && facilities.length > 0 && (
            <div className="absolute bottom-4 right-4 z-10">
              <Card className="shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {facilities.length} {facilities.length === 1 ? 'location' : 'locations'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
