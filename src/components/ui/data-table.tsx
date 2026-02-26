/**
 * Professional DataTable Component - ArchonY Brand
 *
 * Features:
 * - Sortable columns
 * - Search/filter functionality
 * - Pagination (10, 25, 50, 100 rows)
 * - Row selection with checkboxes
 * - Responsive design
 * - Loading states
 */

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, X } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  onRowSelect?: (selectedRows: TData[]) => void
  enableRowSelection?: boolean
  enableSearch?: boolean
  enablePagination?: boolean
  defaultPageSize?: 10 | 25 | 50 | 100
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onRowSelect,
  enableRowSelection = true,
  enableSearch = true,
  enablePagination = true,
  defaultPageSize = 25,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Add selection column if enabled
  const tableColumns = useMemo(() => {
    if (!enableRowSelection) return columns

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-[rgba(0,204,254,0.2)]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-[rgba(0,204,254,0.2)]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  })

  // Notify parent of selection changes
  const handleSelectionChange = useCallback(() => {
    if (onRowSelect) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original)
      onRowSelect(selectedRows)
    }
  }, [table, onRowSelect])

  // Trigger selection callback when rowSelection changes
  useMemo(() => {
    handleSelectionChange()
  }, [rowSelection, handleSelectionChange])

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Compact Search Bar */}
      {enableSearch && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgba(255,255,255,0.40)]" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-7 pl-7 text-xs bg-[#1A0648] border-[rgba(0,204,254,0.08)] focus:border-[#00CCFE] text-white placeholder:text-[rgba(255,255,255,0.40)]"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.40)] hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {enableRowSelection && Object.keys(rowSelection).length > 0 && (
            <div className="text-xs text-[#00CCFE]">
              {Object.keys(rowSelection).length} of {table.getFilteredRowModel().rows.length} selected
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[rgba(0,204,254,0.08)] overflow-hidden bg-[#221060]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-[rgba(0,204,254,0.08)] bg-[#2A1878] hover:bg-[#2A1878]"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-white font-semibold uppercase tracking-wide text-[10px] py-2 px-3 h-8"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center gap-1.5',
                            header.column.getCanSort() && 'cursor-pointer select-none hover:text-[#00CCFE] transition-colors'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="ml-auto">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#00CCFE]" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="h-3.5 w-3.5 text-[#00CCFE]" />
                              ) : (
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'border-b border-[rgba(0,204,254,0.08)] transition-colors',
                      'hover:bg-[#2A1878]',
                      row.getIsSelected() && 'bg-[#00CCFE]/10',
                      index % 2 === 0 && 'bg-[#221060]',
                      index % 2 === 1 && 'bg-[#1A0648]/50'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-2 px-3 text-xs text-white"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-20 text-center text-[rgba(255,255,255,0.40)] text-xs"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Compact Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[rgba(255,255,255,0.65)]">Rows:</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-6 w-[60px] text-xs bg-[#1A0648] border-[rgba(0,204,254,0.08)] text-white">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-[#221060] border-[rgba(0,204,254,0.08)]">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-white hover:bg-[#2A1878] text-xs"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-[rgba(255,255,255,0.65)]">
              <span>Page</span>
              <span className="font-medium text-white">
                {table.getState().pagination.pageIndex + 1}
              </span>
              <span>of</span>
              <span className="font-medium text-white">{table.getPageCount()}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-6 px-2 text-[10px] bg-[#1A0648] border-[rgba(0,204,254,0.08)] text-white hover:bg-[#2A1878] disabled:opacity-30"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-6 px-2 text-[10px] bg-[#1A0648] border-[rgba(0,204,254,0.08)] text-white hover:bg-[#2A1878] disabled:opacity-30"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-6 px-2 text-[10px] bg-[#1A0648] border-[rgba(0,204,254,0.08)] text-white hover:bg-[#2A1878] disabled:opacity-30"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-6 px-2 text-[10px] bg-[#1A0648] border-[rgba(0,204,254,0.08)] text-white hover:bg-[#2A1878] disabled:opacity-30"
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Helper to create a status badge column
 */
export function createStatusColumn<T>(
  accessorKey: keyof T,
  header: string = 'Status'
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ row }) => {
      const status = row.getValue(accessorKey as string) as string
      const statusLower = status?.toLowerCase() || ''

      let badgeClass = 'bg-[#2A1878]/30 text-[rgba(255,255,255,0.65)] border-[rgba(0,204,254,0.08)]'

      if (statusLower === 'active' || statusLower === 'online' || statusLower === 'available') {
        badgeClass = 'bg-[hsl(var(--chart-2)/0.2)] text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2)/0.3)]'
      } else if (statusLower === 'inactive' || statusLower === 'offline') {
        badgeClass = 'bg-[#2A1878]/30 text-[rgba(255,255,255,0.65)] border-[rgba(0,204,254,0.08)]'
      } else if (statusLower === 'warning' || statusLower === 'maintenance') {
        badgeClass = 'bg-[hsl(var(--chart-3)/0.2)] text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3)/0.3)]'
      } else if (statusLower === 'critical' || statusLower === 'alert') {
        badgeClass = 'bg-[hsl(var(--chart-6)/0.2)] text-[hsl(var(--chart-6))] border-[hsl(var(--chart-6)/0.3)]'
      }

      return (
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
          badgeClass
        )}>
          {status}
        </span>
      )
    },
  }
}

/**
 * Helper to create a monospace text column (VIN, license plates, etc.)
 */
export function createMonospaceColumn<T>(
  accessorKey: keyof T,
  header: string
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey as string) as string
      return <span className="font-mono text-[#00CCFE] text-xs">{value}</span>
    },
  }
}
