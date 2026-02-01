/**
 * Fleet Operations Surfaces - Export Index
 *
 * Centralized exports for all operations surfaces and shared components
 */

// Operations Surfaces
export { VehiclesOperations } from './Vehicles';
export { MaintenanceOperations } from './Maintenance';
export { RoutesOperations } from './Routes';
export { DriversOperations } from './Drivers';

// Re-export shared components for convenience
export { SplitView } from "@/components/operations";
export {
  ActionButton,
  InlineEditPanel,
  ConfirmDialog,
  StatusBadge
} from "@/components/operations";

// Type exports
export type { SplitViewProps } from "@/components/operations";
export type {
  ActionButtonProps,
  InlineEditPanelProps,
  ConfirmDialogProps,
  StatusBadgeProps
} from "@/components/operations";
