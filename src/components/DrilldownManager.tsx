/**
 * DrilldownManager - Global manager for drilldown system
 * Wraps app with provider, renders breadcrumbs and panel, handles keyboard shortcuts
 */

import React from 'react'

import { DrilldownBreadcrumbs } from '@/components/DrilldownBreadcrumbs'
import { DrilldownPanel } from '@/components/DrilldownPanel'
import { DriverDetailPanel } from '@/components/drilldown/DriverDetailPanel'
import { DriverPerformanceView } from '@/components/drilldown/DriverPerformanceView'
import { DriverTripsView } from '@/components/drilldown/DriverTripsView'
import { FacilityDetailPanel } from '@/components/drilldown/FacilityDetailPanel'
import { FacilityVehiclesView } from '@/components/drilldown/FacilityVehiclesView'
import {
  FleetOverviewDrilldown,
  ActiveVehiclesDrilldown,
  MaintenanceDrilldown,
  FuelStatsDrilldown,
  PerformanceMetricsDrilldown,
  DriverStatsDrilldown,
  UtilizationDrilldown,
  SafetyScoreDrilldown,
  VehicleListDrilldown
} from '@/components/drilldown/FleetStatsDrilldowns'
import {
  DriversRosterDrilldown,
  DriverPerformanceDrilldown,
  DriverScorecardDrilldown,
  GarageDrilldown,
  PredictiveMaintenanceDrilldown,
  MaintenanceCalendarDrilldown,
  ExecutiveDashboardDrilldown,
  CostAnalysisDrilldown,
  FleetOptimizerDrilldown
} from '@/components/drilldown/HubDrilldowns'
import {
  IncidentsDrilldown,
  SafetyScoreDetailDrilldown,
  VideoTelematicsDrilldown,
  DispatchDrilldown,
  RoutesDrilldown,
  TasksDrilldown,
  VendorsDrilldown,
  PartsInventoryDrilldown,
  PurchaseOrdersDrilldown,
  FuelPurchasingDrilldown
} from '@/components/drilldown/AdditionalHubDrilldowns'
import { LaborDetailsView } from '@/components/drilldown/LaborDetailsView'
import { PartsBreakdownView } from '@/components/drilldown/PartsBreakdownView'
import { TripTelemetryView } from '@/components/drilldown/TripTelemetryView'
import { VehicleDetailPanel } from '@/components/drilldown/VehicleDetailPanel'
import { VehicleTripsList } from '@/components/drilldown/VehicleTripsList'
import { WorkOrderDetailPanel } from '@/components/drilldown/WorkOrderDetailPanel'
import { DrilldownProvider, useDrilldown } from '@/contexts/DrilldownContext'

interface DrilldownManagerProps {
  children: React.ReactNode
}

function DrilldownContent() {
  const { currentLevel } = useDrilldown()

  if (!currentLevel) return null

  // Render the appropriate component based on the current level type
  switch (currentLevel.type) {
    // ============================================
    // Fleet-Level Stats Drilldowns
    // ============================================
    case 'fleet-overview':
    case 'total-vehicles':
      return <FleetOverviewDrilldown />

    case 'active-vehicles':
      return <ActiveVehiclesDrilldown />

    case 'maintenance-stats':
    case 'maintenance':
      return <MaintenanceDrilldown />

    case 'fuel-stats':
    case 'fuel-today':
      return <FuelStatsDrilldown />

    case 'performance-metrics':
    case 'miles-day':
    case 'on-time':
    case 'idle-time':
    case 'mpg':
      return <PerformanceMetricsDrilldown metricType={currentLevel.type} />

    case 'drivers-stats':
      return <DriverStatsDrilldown />

    case 'utilization':
    case 'fleet-utilization':
      return <UtilizationDrilldown />

    case 'safety-score':
    case 'safety':
      return <SafetyScoreDrilldown />

    case 'vehicle-list':
      return <VehicleListDrilldown
        vehicles={currentLevel.data?.vehicles || []}
        filter={currentLevel.data?.filter || 'all'}
      />

    // ============================================
    // Vehicle drilldown hierarchy
    // ============================================
    case 'vehicle':
      return <VehicleDetailPanel vehicleId={currentLevel.data?.vehicleId} />

    case 'vehicle-detail':
      return <VehicleDetailPanel vehicleId={currentLevel.data?.vehicleId} />

    case 'vehicle-trips':
      return (
        <VehicleTripsList
          vehicleId={currentLevel.data?.vehicleId}
          vehicleName={currentLevel.data?.vehicleName}
        />
      )

    case 'trip-telemetry':
      return (
        <TripTelemetryView
          tripId={currentLevel.data?.tripId}
          trip={currentLevel.data?.trip}
        />
      )

    // ============================================
    // Driver drilldown hierarchy
    // ============================================
    case 'driver':
      return <DriverDetailPanel driverId={currentLevel.data?.driverId} />

    case 'driver-detail':
      return <DriverDetailPanel driverId={currentLevel.data?.driverId} />

    case 'driver-performance':
      return (
        <DriverPerformanceView
          driverId={currentLevel.data?.driverId}
          driverName={currentLevel.data?.driverName}
        />
      )

    case 'driver-trips':
      return (
        <DriverTripsView
          driverId={currentLevel.data?.driverId}
          driverName={currentLevel.data?.driverName}
        />
      )

    // ============================================
    // Maintenance drilldown hierarchy
    // ============================================
    case 'workOrder':
      return <WorkOrderDetailPanel workOrderId={currentLevel.data?.workOrderId} />

    case 'work-order-detail':
      return <WorkOrderDetailPanel workOrderId={currentLevel.data?.workOrderId} />

    case 'work-order-parts':
      return (
        <PartsBreakdownView
          workOrderId={currentLevel.data?.workOrderId}
          workOrderNumber={currentLevel.data?.workOrderNumber}
        />
      )

    case 'work-order-labor':
      return (
        <LaborDetailsView
          workOrderId={currentLevel.data?.workOrderId}
          workOrderNumber={currentLevel.data?.workOrderNumber}
        />
      )


    // ============================================
    // Drivers Hub Drilldowns
    // ============================================
    case 'drivers-roster':
    case 'total-drivers':
    case 'on-duty':
      return <DriversRosterDrilldown />

    case 'driver-performance-hub':
    case 'top-performers':
    case 'needs-coaching':
      return <DriverPerformanceDrilldown />

    case 'driver-scorecard':
    case 'fleet-avg-score':
      return <DriverScorecardDrilldown />

    // ============================================
    // Maintenance Hub Drilldowns
    // ============================================
    case 'garage-overview':
    case 'work-orders':
    case 'bay-utilization':
    case 'in-progress':
      return <GarageDrilldown />

    case 'predictive-maintenance':
    case 'predictions-active':
      return <PredictiveMaintenanceDrilldown />

    case 'maintenance-calendar':
    case 'maintenance-today':
    case 'maintenance-overdue':
      return <MaintenanceCalendarDrilldown />

    // ============================================
    // Analytics Hub Drilldowns
    // ============================================
    case 'executive-dashboard':
    case 'fleet-kpis':
      return <ExecutiveDashboardDrilldown />

    case 'cost-analysis':
    case 'total-tco':
    case 'fuel-cost':
      return <CostAnalysisDrilldown />

    case 'fleet-optimizer':
    case 'optimization-recommendations':
      return <FleetOptimizerDrilldown />

    // ============================================
    // Safety Hub Drilldowns
    // ============================================
    case 'incidents':
    case 'open-incidents':
    case 'under-review':
      return <IncidentsDrilldown />

    case 'safety-score-detail':
    case 'days-incident-free':
      return <SafetyScoreDetailDrilldown />

    case 'video-telematics':
    case 'cameras-online':
    case 'events-today':
      return <VideoTelematicsDrilldown />

    // ============================================
    // Operations Hub Drilldowns
    // ============================================
    case 'dispatch':
    case 'active-jobs':
    case 'in-transit':
    case 'delayed':
      return <DispatchDrilldown />

    case 'routes':
    case 'active-routes':
    case 'optimized-today':
      return <RoutesDrilldown />

    case 'tasks':
    case 'open-tasks':
    case 'overdue-tasks':
      return <TasksDrilldown />

    // ============================================
    // Procurement Hub Drilldowns
    // ============================================
    case 'vendors':
    case 'active-vendors':
      return <VendorsDrilldown />

    case 'parts-inventory':
    case 'total-skus':
    case 'low-stock':
    case 'out-of-stock':
      return <PartsInventoryDrilldown />

    case 'purchase-orders':
    case 'open-pos':
    case 'in-transit-pos':
      return <PurchaseOrdersDrilldown />

    case 'fuel-purchasing':
    case 'fuel-cards':
      return <FuelPurchasingDrilldown />

    // ============================================
    // Facility drilldown hierarchy
    // ============================================
    case 'facility':
      return <FacilityDetailPanel facilityId={currentLevel.data?.facilityId} />

    case 'facility-detail':
      return <FacilityDetailPanel facilityId={currentLevel.data?.facilityId} />

    case 'facility-vehicles':
      return (
        <FacilityVehiclesView
          facilityId={currentLevel.data?.facilityId}
          facilityName={currentLevel.data?.facilityName}
        />
      )

    // ============================================
    // Fallback for unknown types
    // ============================================
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
