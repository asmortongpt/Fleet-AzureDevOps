/**
 * Universal Drill-Through System Type Definitions
 * Supports any metric with aggregated data to show underlying records
 */

export type DrillThroughEntityType =
  | 'vehicles'
  | 'trips'
  | 'fuel_transactions'
  | 'maintenance_records'
  | 'driver_assignments'
  | 'expenses'
  | 'telemetry'
  | 'incidents'
  | 'inspections'
  | 'work_orders'
  | 'traffic_cameras'
  | 'traffic_incidents'
  | 'charging_sessions'
  | 'safety_events';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

export interface DrillThroughConfig {
  /** Entity type being drilled into */
  entityType: DrillThroughEntityType;
  /** Filter criteria for the drill-through */
  filters: Record<string, any>;
  /** Display title for the modal */
  title: string;
  /** Description or subtitle */
  description?: string;
  /** Columns to display in the table */
  columns: DrillThroughColumn[];
  /** Whether to show export buttons */
  enableExport?: boolean;
  /** Whether to show advanced filters */
  enableFilters?: boolean;
  /** Custom API endpoint (optional) */
  apiEndpoint?: string;
}

export interface DrillThroughColumn {
  /** Column identifier */
  key: string;
  /** Display label */
  label: string;
  /** Data type for formatting */
  type?: 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'link';
  /** Column width (flex basis) */
  width?: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom render function */
  render?: (value: any, row: any) => React.ReactNode;
  /** Format function for exports */
  formatExport?: (value: any, row: any) => string;
}

export interface DrillThroughResult {
  /** Total count of records matching filters */
  totalCount: number;
  /** Current page of data */
  data: any[];
  /** Current page number (1-indexed) */
  page: number;
  /** Number of records per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Aggregated summary data (optional) */
  summary?: Record<string, any>;
}

export interface DrillThroughAnalytics {
  /** Entity type accessed */
  entityType: DrillThroughEntityType;
  /** User ID */
  userId: string;
  /** Timestamp of access */
  timestamp: Date;
  /** Filters applied */
  filters: Record<string, any>;
  /** Number of records viewed */
  recordCount: number;
  /** Whether data was exported */
  exported: boolean;
  /** Export format if exported */
  exportFormat?: ExportFormat;
}

export interface DrillThroughCacheEntry {
  /** Cache key */
  key: string;
  /** Entity type */
  entityType: DrillThroughEntityType;
  /** Cached result */
  result: DrillThroughResult;
  /** Cache timestamp */
  cachedAt: Date;
  /** Cache TTL in seconds */
  ttl: number;
}
