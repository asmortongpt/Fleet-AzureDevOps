/**
 * DrilldownManager - Global manager for drilldown system
 * Wraps app with provider, renders breadcrumbs and panel, handles keyboard shortcuts
 */

import React from 'react'
import { DrilldownProvider, useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownBreadcrumbs } from '@/components/DrilldownBreadcrumbs'
import { DrilldownPanel } from '@/components/DrilldownPanel'
import { VehicleDetailPanel } from '@/components/drilldown/VehicleDetailPanel'
import { VehicleTripsList } from '@/components/drilldown/VehicleTripsList'
import { TripTelemetryView } from '@/components/drilldown/TripTelemetryView'
import { DriverDetailPanel } from '@/components/drilldown/DriverDetailPanel'
import { DriverPerformanceView } from '@/components/drilldown/DriverPerformanceView'
import { DriverTripsView } from '@/components/drilldown/DriverTripsView'
import { WorkOrderDetailPanel } from '@/components/drilldown/WorkOrderDetailPanel'
import { PartsBreakdownView } from '@/components/drilldown/PartsBreakdownView'
import { LaborDetailsView } from '@/components/drilldown/LaborDetailsView'
import { FacilityDetailPanel } from '@/components/drilldown/FacilityDetailPanel'
import { FacilityVehiclesView } from '@/components/drilldown/FacilityVehiclesView'

interface DrilldownManagerProps {
  children: React.ReactNode
}

function DrilldownContent() {
  const { currentLevel } = useDrilldown()

  if (!currentLevel) return null

  // Render the appropriate component based on the current level type
  switch (currentLevel.type) {
    // Vehicle drilldown hierarchy
    case 'vehicle-detail':
      return <VehicleDetailPanel vehicleId={currentLevel.data.vehicleId} />

    case 'vehicle-trips':
      return (
        <VehicleTripsList
          vehicleId={currentLevel.data.vehicleId}
          vehicleName={currentLevel.data.vehicleName}
        />
      )

    case 'trip-telemetry':
      return (
        <TripTelemetryView
          tripId={currentLevel.data.tripId}
          trip={currentLevel.data.trip}
        />
      )

    // Driver drilldown hierarchy
    case 'driver-detail':
      return <DriverDetailPanel driverId={currentLevel.data.driverId} />

    case 'driver-performance':
      return (
        <DriverPerformanceView
          driverId={currentLevel.data.driverId}
          driverName={currentLevel.data.driverName}
        />
      )

    case 'driver-trips':
      return (
        <DriverTripsView
          driverId={currentLevel.data.driverId}
          driverName={currentLevel.data.driverName}
        />
      )

    // Maintenance drilldown hierarchy
    case 'work-order-detail':
      return <WorkOrderDetailPanel workOrderId={currentLevel.data.workOrderId} />

    case 'work-order-parts':
      return (
        <PartsBreakdownView
          workOrderId={currentLevel.data.workOrderId}
          workOrderNumber={currentLevel.data.workOrderNumber}
        />
      )

    case 'work-order-labor':
      return (
        <LaborDetailsView
          workOrderId={currentLevel.data.workOrderId}
          workOrderNumber={currentLevel.data.workOrderNumber}
        />
      )

    // Facility drilldown hierarchy
    case 'facility-detail':
      return <FacilityDetailPanel facilityId={currentLevel.data.facilityId} />

    case 'facility-vehicles':
      return (
        <FacilityVehiclesView
          facilityId={currentLevel.data.facilityId}
          facilityName={currentLevel.data.facilityName}
        />
      )

    // Fallback for unknown types
    default:
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">
            Unknown drilldown type: {currentLevel.type}
          </p>
        </div>
      )
  }
}

export function DrilldownManager({ children }: DrilldownManagerProps) {
  return (
    <DrilldownProvider>
      <div className="relative">
        {/* Breadcrumbs - fixed at top when drilldown is active */}
        <DrilldownBreadcrumbs />

        {/* Main content */}
        {children}

        {/* Drilldown Panel */}
        <DrilldownPanel>
          <DrilldownContent />
        </DrilldownPanel>
      </div>
    </DrilldownProvider>
  )
}

/**
 * Hook to access drilldown functionality in any component
 * Re-exported for convenience
 */
export { useDrilldown } from '@/contexts/DrilldownContext'
