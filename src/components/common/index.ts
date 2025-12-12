/**
 * Common Components Index
 *
 * Reusable component library for Fleet application.
 * These components eliminate code duplication and provide consistent UI/UX.
 */

export { DataTable } from "./DataTable"
export type { DataTableProps, Column, PaginationConfig } from "./DataTable"

export { FilterPanel } from "./FilterPanel"
export type {
  FilterPanelProps,
  FilterDefinition,
  FilterValues,
  FilterOption,
  FilterType
} from "./FilterPanel"

export { PageHeader } from "./PageHeader"
export type { PageHeaderProps, StatCard, StatTrend } from "./PageHeader"

export { ConfirmDialog } from "./ConfirmDialog"
export type { ConfirmDialogProps, ConfirmDialogVariant } from "./ConfirmDialog"

export { FileUpload } from "./FileUpload"
export type { FileUploadProps } from "./FileUpload"

export { DialogForm } from "./DialogForm"
export type { DialogFormProps, FormField, SelectOption, FieldType } from "./DialogForm"
