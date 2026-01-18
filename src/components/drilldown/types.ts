import { ColumnDef } from '@tanstack/react-table';

export interface DrilldownColumn<T = any> extends ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: string;
  accessorFn?: (row: T) => any;
  cell?: (info: any) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  filterFn?: 'auto' | 'equals' | 'contains' | 'includesString' | 'includesStringSensitive' | 'equalsString' | 'between' | 'inNumberRange' | 'fuzzy';
  size?: number;
  minSize?: number;
  maxSize?: number;
  enableResizing?: boolean;
  enableHiding?: boolean;
  meta?: {
    align?: 'left' | 'center' | 'right';
    type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
    format?: string;
    className?: string;
  };
}

export interface DrilldownTableState {
  sorting: Array<{ id: string; desc: boolean }>;
  columnFilters: Array<{ id: string; value: any }>;
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  expanded: Record<string, boolean>;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  globalFilter: string;
}

export interface DrilldownTableProps<T = any> {
  data: T[];
  columns: DrilldownColumn<T>[];
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  enableSubRowSelection?: boolean;
  enableColumnResizing?: boolean;
  enableColumnVisibility?: boolean;
  enableDensityToggle?: boolean;
  initialState?: Partial<DrilldownTableState>;
  pageSize?: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((row: T) => string);
  cellClassName?: string | ((cell: any) => string);
}

export interface DrilldownRowData {
  id: string;
  [key: string]: any;
  _children?: DrilldownRowData[];
  _expanded?: boolean;
  _selected?: boolean;
  _depth?: number;
  _parentId?: string;
}

export interface DrilldownFilterProps {
  column: any;
  table: any;
}

export interface DrilldownPaginationProps {
  table: any;
  pageSizeOptions?: number[];
}

export interface DrilldownToolbarProps {
  table: any;
  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
  enableColumnVisibility?: boolean;
  enableDensityToggle?: boolean;
  globalFilterPlaceholder?: string;
}

export type DrilldownSortDirection = 'asc' | 'desc' | false;

export interface DrilldownSortingState {
  id: string;
  desc: boolean;
}

export interface DrilldownFilterValue {
  id: string;
  value: any;
}

export interface DrilldownColumnMeta {
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  format?: string;
  className?: string;
  filterVariant?: 'text' | 'range' | 'select' | 'multi-select' | 'date' | 'date-range';
  filterOptions?: Array<{ label: string; value: any }>;
  filterPlaceholder?: string;
}

export interface DrilldownCellContext<T = any> {
  row: {
    original: T;
    index: number;
    id: string;
    depth: number;
    parentId?: string;
    getIsExpanded: () => boolean;
    getCanExpand: () => boolean;
    toggleExpanded: () => void;
    getIsSelected: () => boolean;
    toggleSelected: () => void;
  };
  column: {
    id: string;
    columnDef: DrilldownColumn<T>;
  };
  cell: {
    getValue: () => any;
    renderValue: () => any;
    row: any;
    column: any;
  };
  table: any;
}

export interface DrilldownHeaderContext<T = any> {
  column: {
    id: string;
    columnDef: DrilldownColumn<T>;
    getCanSort: () => boolean;
    getIsSorted: () => false | 'asc' | 'desc';
    toggleSorting: (desc?: boolean) => void;
    getCanFilter: () => boolean;
    getFilterValue: () => any;
    setFilterValue: (value: any) => void;
    getCanResize: () => boolean;
    getSize: () => number;
    getCanHide: () => boolean;
    getIsVisible: () => boolean;
    toggleVisibility: (visible?: boolean) => void;
  };
  header: {
    id: string;
    index: number;
    depth: number;
    column: any;
    getContext: () => DrilldownHeaderContext<T>;
  };
  table: any;
}

export interface DrilldownTableInstance<T = any> {
  getRowModel: () => { rows: any[]; flatRows: any[] };
  getSelectedRowModel: () => { rows: any[]; flatRows: any[] };
  getFilteredRowModel: () => { rows: any[]; flatRows: any[] };
  getSortedRowModel: () => { rows: any[]; flatRows: any[] };
  getPaginationRowModel: () => { rows: any[]; flatRows: any[] };
  getExpandedRowModel: () => { rows: any[]; flatRows: any[] };
  getState: () => DrilldownTableState;
  setState: (updater: any) => void;
  resetSorting: () => void;
  resetColumnFilters: () => void;
  resetGlobalFilter: () => void;
  resetPagination: () => void;
  resetRowSelection: () => void;
  resetExpanded: () => void;
  setPageSize: (size: number) => void;
  setPageIndex: (index: number) => void;
  getCanPreviousPage: () => boolean;
  getCanNextPage: () => boolean;
  previousPage: () => void;
  nextPage: () => void;
  getPageCount: () => number;
  getRowCount: () => number;
}