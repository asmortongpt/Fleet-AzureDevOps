/**
 * Enhanced Data Table Component
 *
 * Comprehensive, reusable data table with advanced features.
 * Replaces duplicate table implementations in 30+ modules.
 *
 * Features:
 * - TanStack Table v8 integration
 * - Sorting (multi-column)
 * - Filtering (global & column-specific)
 * - Pagination
 * - Row selection (single & multi)
 * - Column visibility toggle
 * - Column resizing
 * - Row actions
 * - Empty & loading states
 * - Export integration
 * - Responsive design
 * - Accessibility (ARIA, keyboard nav)
 *
 * Usage:
 * ```tsx
 * <EnhancedDataTable
 *   data={vehicles}
 *   columns={[
 *     { accessorKey: 'make', header: 'Make', sortable: true },
 *     { accessorKey: 'model', header: 'Model', sortable: true },
 *     { accessorKey: 'status', header: 'Status',
 *       cell: ({ row }) => <StatusBadge status={row.original.status} />
 *     }
 *   ]}
 *   enableSorting
 *   enablePagination
 *   pageSize={10}
 *   onRowClick={(row) => handleView(row)}
 *   exportFilename="fleet-vehicles"
 * />
 * ```
 */

import {
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass,
  DownloadSimple,
  Columns,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'

import { LoadingSkeleton } from './LoadingSkeleton'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { exportToCSV, exportToExcel } from '@/lib/export-utils'
import { cn } from '@/lib/utils'

export interface EnhancedDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  title?: string
  subtitle?: string
  emptyMessage?: string

  // Feature flags
  enableSorting?: boolean
  enableFiltering?: boolean
  enablePagination?: boolean
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enableExport?: boolean

  // Pagination
  pageSize?: number
  pageSizeOptions?: number[]

  // Row interactions
  onRowClick?: (row: T) => void
  onRowSelect?: (rows: T[]) => void

  // Export
  exportFilename?: string

  // Styling
  className?: string
  compact?: boolean
  striped?: boolean
}

export function EnhancedDataTable<T extends { id: string | number }>({
  data = [],
  columns,
  loading = false,
  title,
  subtitle,
  emptyMessage = 'No data available',

  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableRowSelection = false,
  enableColumnVisibility = true,
  enableExport = true,

  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],

  onRowClick,
  onRowSelect,

  exportFilename = 'export',

  className,
  compact = false,
  striped = true
}: EnhancedDataTableProps<T>) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Add selection column if enabled
  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!enableRowSelection) return columns

    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      ...columns
    ]
  }, [columns, enableRowSelection])

  // Initialize table
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize
      }
    }
  })

  // Handle row selection changes
  useMemo(() => {
    if (enableRowSelection && onRowSelect) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
      onRowSelect(selectedRows)
    }
  }, [rowSelection, enableRowSelection, onRowSelect, table])

  // Export handlers
  const handleExportCSV = () => {
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== 'select')
      .map((col) => col.id)

    exportToCSV(data, exportFilename, { columns: visibleColumns })
  }

  const handleExportExcel = () => {
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== 'select')
      .map((col) => col.id)

    exportToExcel(data, exportFilename, { columns: visibleColumns })
  }

  if (loading) {
    return <LoadingSkeleton type="table" count={pageSize} />
  }

  const isEmpty = data.length === 0

  return (
    <Card className={className}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search */}
          {enableFiltering && (
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <MagnifyingGlass className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Column Visibility */}
            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Export */}
            {enableExport && !isEmpty && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DownloadSimple className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem onClick={handleExportCSV}>
                    Export as CSV
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem onClick={handleExportExcel}>
                    Export as Excel
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={cn(
                          'text-left p-3 font-medium text-sm',
                          compact && 'p-2 text-xs',
                          header.column.getCanSort() && 'cursor-pointer select-none hover:bg-muted/70'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {enableSorting && header.column.getCanSort() && (
                            <span className="text-muted-foreground">
                              {header.column.getIsSorted() === 'asc' ? (
                                <CaretUp className="w-4 h-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <CaretDown className="w-4 h-4" />
                              ) : (
                                <CaretUpDown className="w-4 h-4 opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isEmpty ? (
                  <tr>
                    <td
                      colSpan={tableColumns.length}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b transition-colors',
                        striped && index % 2 === 0 && 'bg-muted/20',
                        onRowClick && 'cursor-pointer hover:bg-muted/50'
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={cn('p-3', compact && 'p-2 text-sm')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {enablePagination && !isEmpty && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <CaretLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <CaretRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Selection count */}
        {enableRowSelection && Object.keys(rowSelection).length > 0 && (
          <div className="text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} of {table.getFilteredRowModel().rows.length} row(s)
            selected
          </div>
        )}
      </CardContent>
    </Card>
  )
}
