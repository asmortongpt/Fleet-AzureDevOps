/**
 * Shared Components Index
 * Central export point for all reusable components
 */

// ============================================================================
// NEW SHARED COMPONENTS - Code Deduplication Initiative
// ============================================================================

// Enhanced data table - eliminates duplicate table logic across 30+ modules
export { EnhancedDataTable } from './EnhancedDataTable'
export type { EnhancedDataTableProps } from './EnhancedDataTable'

// Filter bar - eliminates duplicate filter UI across 12+ modules
export { FilterBar } from './FilterBar'
export type { FilterBarProps } from './FilterBar'

// Metric cards - eliminates duplicate metric bar components across 15+ modules
export { MetricCard, MetricsBar } from './MetricCard'
export type { MetricCardProps, MetricsBarProps } from './MetricCard'

// ============================================================================
// EXISTING COMPONENTS
// ============================================================================

export { StatusBadge } from "./StatusBadge"
export type { VehicleStatus } from "./StatusBadge"
export { FormField } from "./FormField"
export { LoadingSkeleton } from "./LoadingSkeleton"
export { ErrorAlert, ErrorState, ErrorBanner } from "./ErrorAlert"
export { SearchInput } from "./SearchInput"
export { MetricsGrid } from "./MetricsGrid"
export { DataTable } from "./DataTable"
