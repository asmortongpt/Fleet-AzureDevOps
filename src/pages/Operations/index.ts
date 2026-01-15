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
export { SplitView } from '@/components/operations/SplitView';
export {
  ActionButton,
  InlineEditPanel,
  ConfirmDialog,
  StatusBadge
} from '@/components/operations/InlineActions';

// Type exports
export type { SplitViewProps } from '@/components/operations/SplitView';
export type {
  ActionButtonProps,
  InlineEditPanelProps,
  ConfirmDialogProps,
  StatusBadgeProps
} from '@/components/operations/InlineActions';
