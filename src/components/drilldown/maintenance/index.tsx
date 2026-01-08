/**
 * Maintenance Hub Drilldown Components - Main Export
 *
 * This module re-exports all maintenance-related drilldown components
 * from their individual files for better code organization and maintainability.
 */

// Export all types
export type {
  PreventiveMaintenanceSchedule,
  ServiceHistoryRecord,
  RepairRecord,
  InspectionRecord,
  ServiceVendor,
  GarageBayMatrixRow,
  WorkOrderListRow,
  PMScheduleMatrixRow,
  PartsInventoryRow,
  ServiceHistoryRow,
} from './types'

// Export PM Schedule Detail Panel
export { PMScheduleDetailPanel } from './PMScheduleDetailPanel'
export type { PMScheduleDetailPanelProps } from './PMScheduleDetailPanel'

// Re-export remaining components from the legacy file (temporary until fully refactored)
export {
  RepairDetailPanel,
  InspectionDetailPanel,
  ServiceRecordDetailPanel,
  ServiceVendorDetailPanel,
  GarageBaysMatrixPanel,
  WorkOrdersListPanel,
  PMSchedulesMatrixPanel,
  PartsInventoryPanel,
  ServiceHistoryPanel,
} from '../MaintenanceHubDrilldowns'
