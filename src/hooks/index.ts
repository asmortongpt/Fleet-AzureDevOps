/**
 * Hooks Index
 * Central export point for all shared hooks
 */

// ============================================================================
// NEW SHARED HOOKS - Code Deduplication Initiative
// ============================================================================

// Fleet filters - eliminates duplicate filter logic across 12+ modules
export { useVehicleFilters } from './useVehicleFilters'
export type { FilterOptions as VehicleFilters } from './useVehicleFilters'

// Fleet metrics - eliminates duplicate calculation logic across 8+ modules
export { useFleetMetrics } from './useFleetMetrics'
export type { FleetMetrics } from './useFleetMetrics'

// Confirmation dialogs - eliminates duplicate dialog management across 20+ modules
export {
  useConfirmationDialog,
  useDeleteConfirmation,
  useSaveConfirmation,
  useDiscardConfirmation
} from './useConfirmationDialog'
export type { ConfirmationConfig } from './useConfirmationDialog'

// ============================================================================
// EXISTING HOOKS
// ============================================================================

export { useDebounce } from "./useDebounce"
export { useLocalStorage } from "./useLocalStorage"
export { useAsync } from "./useAsync"
export { useErrorRecovery } from "./useErrorRecovery"
export { useInterval } from "./useInterval"
export {
  useTelemetry,
  useMapTelemetry,
  usePerformanceTelemetry,
  useErrorTelemetry,
  type UseTelemetryOptions,
  type TelemetryHook,
  MapInteractionType,
} from "./useTelemetry"
