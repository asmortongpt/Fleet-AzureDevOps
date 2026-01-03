/**
 * Drilldown Components - Comprehensive record navigation system
 *
 * This module exports all drilldown-related components for navigating
 * to final record details from any data element in the application.
 *
 * Key Components:
 * - DrilldownDataElement: Universal wrapper for any clickable data
 * - DrilldownList: List with built-in drilldown per item
 * - DrilldownDataTable: Table with row and cell drilldown
 * - DrilldownMatrix: Excel-style grid with cell drilldown
 * - DrilldownCard: Stat/metric card with drilldown
 * - Record Detail Panels: Final record views for all entity types
 */

// ============================================================================
// CORE DRILLDOWN INFRASTRUCTURE
// ============================================================================

export { DrilldownPanel } from './DrilldownPanel'
export { DrilldownBreadcrumbs } from './DrilldownBreadcrumbs'
export { DrilldownProvider } from '@/contexts/DrilldownContext'
export { useDrilldown } from '@/contexts/DrilldownContext'
export type { DrilldownLevel, DrilldownContextType } from '@/contexts/DrilldownContext'

// ============================================================================
// DRILLDOWN DATA ELEMENT - Universal wrapper for clickable data
// ============================================================================

export {
  DrilldownDataElement,
  VehicleDrilldown,
  DriverDrilldown,
  WorkOrderDrilldown,
  FacilityDrilldown,
  AssetDrilldown,
  TripDrilldown,
  InvoiceDrilldown,
  VendorDrilldown,
  IncidentDrilldown,
  RouteDrilldown,
  TaskDrilldown,
  InspectionDrilldown,
  PurchaseOrderDrilldown,
  PartDrilldown,
} from './DrilldownDataElement'

export type {
  DrilldownDataElementProps,
  DrilldownRecordType,
} from './DrilldownDataElement'

// ============================================================================
// DRILLDOWN LIST - List with built-in drilldown per item
// ============================================================================

export {
  DrilldownList,
  DrilldownVehicleList,
  DrilldownDriverList,
  DrilldownWorkOrderList,
  DrilldownRecordList,
} from './DrilldownList'

export type {
  DrilldownListProps,
  DrilldownListItem,
} from './DrilldownList'

// ============================================================================
// DRILLDOWN DATA TABLE - Table with row and cell drilldown
// ============================================================================

export {
  DrilldownDataTable,
  DrilldownVehicleTable,
  DrilldownWorkOrderTable,
  DrilldownDriverTable,
} from './DrilldownDataTable'

export type {
  DrilldownDataTableProps,
  DrilldownColumn,
  CellDrilldownConfig,
} from './DrilldownDataTable'

// ============================================================================
// DRILLDOWN MATRIX - Excel-style grid with cell drilldown
// ============================================================================

export {
  DrilldownMatrix,
  VehicleMatrix,
  WorkOrderMatrix,
  DriverMatrix,
} from './DrilldownMatrix'

export type {
  DrilldownMatrixProps,
  MatrixColumn,
  MatrixCellDrilldown,
} from './DrilldownMatrix'

// ============================================================================
// DRILLDOWN CARD - Stat/metric card with drilldown
// ============================================================================

export {
  DrilldownCard,
  StatCardDrilldown,
  MetricCardDrilldown,
  KPICardDrilldown,
  CountCardDrilldown,
  DrilldownCardGrid,
} from './DrilldownCard'

export type {
  DrilldownCardProps,
} from './DrilldownCard'

// ============================================================================
// RECORD DETAIL PANELS - Final record views
// ============================================================================

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

// Email drilldown components
export { EmailDetailPanel } from './EmailDetailPanel'
export type { EmailRecord } from './EmailDetailPanel'

// Additional record detail panels
export {
  AssetDetailPanel,
  InvoiceDetailPanel,
  RouteDetailPanel,
  TaskDetailPanel,
  IncidentDetailPanel,
  VendorDetailPanel,
  PartDetailPanel,
  PurchaseOrderDetailPanel,
  TripDetailPanel,
  InspectionDetailPanel,
} from './RecordDetailPanels'

// ============================================================================
// HELPER HOOKS
// ============================================================================

export { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'

// ============================================================================
// CONVENIENCE UTILITIES
// ============================================================================

/**
 * Helper to create drilldown data payload
 */
export function createDrilldownPayload(
  recordType: string,
  recordId: string | number,
  additionalData?: Record<string, any>
): Record<string, any> {
  return {
    [`${recordType}Id`]: recordId,
    id: recordId,
    ...additionalData,
  }
}

/**
 * Standard record types supported by the drilldown system
 */
export const DRILLDOWN_RECORD_TYPES = [
  'vehicle',
  'driver',
  'workOrder',
  'facility',
  'asset',
  'trip',
  'route',
  'task',
  'inspection',
  'incident',
  'invoice',
  'vendor',
  'part',
  'purchase-order',
  'equipment',
] as const

/**
 * Check if a string is a valid drilldown record type
 */
export function isValidDrilldownType(type: string): boolean {
  return DRILLDOWN_RECORD_TYPES.includes(type as any)
}
