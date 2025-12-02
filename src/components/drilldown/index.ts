/**
 * Drilldown Components - Index
 * Exports all drilldown components and utilities
 */

// Core drilldown infrastructure
export { DrilldownPanel, DrilldownContent } from '../DrilldownPanel'
export { DrilldownBreadcrumbs } from '../DrilldownBreadcrumbs'
export { DrilldownManager, useDrilldown } from '../DrilldownManager'
export { DrilldownProvider } from '@/contexts/DrilldownContext'
export type { DrilldownLevel, DrilldownContextType } from '@/contexts/DrilldownContext'

// Vehicle drilldown components
export { VehicleDetailPanel } from './VehicleDetailPanel'
export { VehicleTripsList } from './VehicleTripsList'
export { TripTelemetryView } from './TripTelemetryView'

// Driver drilldown components
export { DriverDetailPanel } from './DriverDetailPanel'
export { DriverPerformanceView } from './DriverPerformanceView'
export { DriverTripsView } from './DriverTripsView'

// Maintenance drilldown components
export { WorkOrderDetailPanel } from './WorkOrderDetailPanel'
export { PartsBreakdownView } from './PartsBreakdownView'
export { LaborDetailsView } from './LaborDetailsView'

// Facility drilldown components
export { FacilityDetailPanel } from './FacilityDetailPanel'
export { FacilityVehiclesView } from './FacilityVehiclesView'

// Helper hooks
export { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'
