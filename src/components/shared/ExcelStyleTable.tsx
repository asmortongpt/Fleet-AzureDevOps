/**
 * ExcelStyleTable - Full-featured spreadsheet-style data table
 *
 * Features:
 * - Excel-like appearance with gridlines and alternating rows
 * - Multi-column sorting
 * - Advanced filtering (text, date range, select)
 * - Column visibility toggle
 * - Export to Excel/CSV
 * - Color coding support
 * - Running totals/aggregations
 * - Frozen headers
 * - Cell click handlers
 * - Responsive with horizontal scroll
 *
 * Usage:
 * ```tsx
 * <ExcelStyleTable
 *   data={workOrders}
 *   columns={[
 *     { key: 'wo_number', header: 'WO #', sortable: true, filterable: true },
 *     { key: 'vehicle', header: 'Vehicle', sortable: true },
 *     { key: 'cost', header: 'Cost', type: 'currency', aggregate: 'sum' }
 *   ]}
 *   onRowClick={(row) => handleViewDetails(row)}
 *   enableExport
 *   exportFilename="work-orders"
 * />
 * ```
 */

import { ChevronUp, ChevronDown, CaretUpDown, Search, Columns, X } from 'lucide-react'
import { Download } from 'lucide-react'
import { useState, useMemo, useCallback, ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { useBreakpoints } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export type FilterType = 'text' | 'select' | 'dateRange' | 'number'
export type AggregateType = 'sum' | 'avg' | 'count' | 'min' | 'max'
export type CellType = 'text' | 'number' | 'currency' | 'date' | 'percentage' | 'badge' | 'custom'

export interface FilterConfig {
  type: FilterType
  options?: Array<{ label: string; value: string }>
  placeholder?: string
}

export interface ColorRule {
  condition: (value: any, row?: any) => boolean
  className: string
  textClassName?: string
}

export interface ExcelColumn<T> {
  key: string
  header: string
  type?: CellType
  sortable?: boolean
  filterable?: boolean | FilterConfig
  filterType?: FilterType
  filterOptions?: Array<{ label: string; value: string }>
  width?: string
  className?: string
  headerClassName?: string
  cellClassName?: string | ((row: T) => string)
  render?: (value: any, row: T, index: number) => ReactNode
  accessor?: (row: T) => any
  aggregate?: AggregateType
  colorRules?: ColorRule[]
  hidden?: boolean
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface ExcelStyleTableProps<T> {
  data: T[]
  columns: ExcelColumn<T>[]
  title?: string
  subtitle?: string
  loading?: boolean
  emptyMessage?: string

  // Features
  enableSorting?: boolean
  enableFiltering?: boolean
  enableExport?: boolean
  enableColumnVisibility?: boolean
  enableRowSelection?: boolean
  enableAggregates?: boolean

  // Interactions
  onRowClick?: (row: T, index: number) => void
  onCellClick?: (value: any, row: T, column: ExcelColumn<T>) => void
  onSelectionChange?: (selectedRows: T[]) => void

  // Export
  exportFilename?: string

  // Styling
  className?: string
  compact?: boolean
  stickyHeader?: boolean
  showGridlines?: boolean
  striped?: boolean
  highlightOnHover?: boolean

  // Misc
  rowKey?: (row: T) => string | number
  pageSize?: number
  initialSort?: SortConfig[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCellValue(value: any, type?: CellType): ReactNode {
  if (value == null || value === '') return '-'

  switch (type) {
    case 'currency':
      return `$${Number(value).toFixed(2)}`
    case 'percentage':
      return `${Number(value).toFixed(1)}%`
    case 'date':
      return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    case 'number':
      return Number(value).toLocaleString()
    default:
      return String(value)
  }
}

function calculateAggregate(data: any[], type: AggregateType): number {
  const values = data.filter((v) => v != null && !isNaN(Number(v))).map(Number)
  if (values.length === 0) return 0

  switch (type) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0)
    case 'avg':
      return values.reduce((sum, val) => sum + val, 0) / values.length
    case 'count':
      return values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    default:
      return 0
  }
}

function exportToCSV(data: any[], columns: ExcelColumn<any>[], filename: string) {
  const visibleColumns = columns.filter((col) => !col.hidden)
  const headers = visibleColumns.map((col) => col.header).join(',')
  const rows = data.map((row) =>
    visibleColumns
      .map((col) => {
        const value = col.accessor ? col.accessor(row) : row[col.key]
        return `"${String(value ?? '').replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportToExcel(data: any[], columns: ExcelColumn<any>[], filename: string) {
  // Simple Excel export using CSV with .xlsx extension
  // For production, use a library like SheetJS
  exportToCSV(data, columns, filename)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ExcelStyleTable<T extends Record<string, any>>({
  data = [],
  columns,
  title,
  subtitle,
  loading = false,
  emptyMessage = 'No data available',

  enableSorting = true,
  enableFiltering = true,
  enableExport = true,
  enableColumnVisibility = true,
  enableRowSelection = false,
  enableAggregates = true,

  onRowClick,
  onCellClick,
  onSelectionChange,

  exportFilename = 'export',

  className,
  compact = false,
  stickyHeader = true,
  showGridlines = true,
  striped = true,
  highlightOnHover = true,

  rowKey = (row) => row.id,
  pageSize = 50,
  initialSort = [],
}: ExcelStyleTableProps<T>) {
  // Responsive breakpoints
  const { isMobile, isTablet, isDesktop } = useBreakpoints()

  // State
  const [sorting, setSorting] = useState<SortConfig[]>(initialSort)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedMobileRow, setExpandedMobileRow] = useState<string | number | null>(null)

  // Debounced search for performance
  const debouncedGlobalFilter = useDebounce(globalFilter, 300)

  // Get visible columns (responsive: limit on mobile/tablet)
  const visibleColumns = useMemo(() => {
    const cols = columns.filter((col) => !col.hidden && columnVisibility[col.key] !== false)

    // On mobile, show only first 2-3 essential columns
    if (isMobile && cols.length > 3) {
      return cols.slice(0, 3)
    }

    // On tablet, show up to 5 columns
    if (isTablet && cols.length > 5) {
      return cols.slice(0, 5)
    }

    return cols
  }, [columns, columnVisibility, isMobile, isTablet])

  // Filter data (use debounced search for performance)
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply global filter with debounced value
    if (debouncedGlobalFilter) {
      const search = debouncedGlobalFilter.toLowerCase()
      result = result.filter((row) =>
        visibleColumns.some((col) => {
          const value = col.accessor ? col.accessor(row) : row[col.key]
          return String(value ?? '').toLowerCase().includes(search)
        })
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (!filterValue) return
      const search = filterValue.toLowerCase()
      result = result.filter((row) => {
        const column = columns.find((col) => col.key === key)
        const value = column?.accessor ? column.accessor(row) : row[key]
        return String(value ?? '').toLowerCase().includes(search)
      })
    })

    return result
  }, [data, debouncedGlobalFilter, filters, visibleColumns, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (sorting.length === 0) return filteredData

    return [...filteredData].sort((a, b) => {
      for (const sort of sorting) {
        const column = columns.find((col) => col.key === sort.key)
        if (!column) continue

        const aValue = column.accessor ? column.accessor(a) : a[sort.key]
        const bValue = column.accessor ? column.accessor(b) : b[sort.key]

        if (aValue === bValue) continue

        const comparison = aValue < bValue ? -1 : 1
        return sort.direction === 'asc' ? comparison : -comparison
      }
      return 0
    })
  }, [filteredData, sorting, columns])

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle sort (memoized for performance)
  const handleSort = useCallback((key: string) => {
    setSorting((prev) => {
      const existing = prev.find((s) => s.key === key)
      if (!existing) {
        return [{ key, direction: 'asc' }, ...prev]
      }
      if (existing.direction === 'asc') {
        return prev.map((s) => (s.key === key ? { ...s, direction: 'desc' as const } : s))
      }
      return prev.filter((s) => s.key !== key)
    })
  }, [])

  // Handle row selection (memoized for performance)
  const handleRowSelect = useCallback((rowId: string | number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }

      if (onSelectionChange) {
        const selected = data.filter((row) => newSet.has(rowKey(row)))
        onSelectionChange(selected)
      }

      return newSet
    })
  }, [data, onSelectionChange, rowKey])

  // Handle select all (memoized for performance)
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    } else {
      const allIds = new Set(paginatedData.map(rowKey))
      setSelectedRows(allIds)
      if (onSelectionChange) {
        const selected = data.filter((row) => allIds.has(rowKey(row)))
        onSelectionChange(selected)
      }
    }
  }, [selectedRows.size, paginatedData, onSelectionChange, data, rowKey])

  // Handle mobile row expansion (memoized for performance)
  const handleMobileRowToggle = useCallback((rowId: string | number) => {
    setExpandedMobileRow((prev) => (prev === rowId ? null : rowId))
  }, [])

  // Get cell className
  const getCellClassName = (value: any, row: T, column: ExcelColumn<T>) => {
    let className = ''

    if (typeof column.cellClassName === 'function') {
      className = column.cellClassName(row)
    } else if (column.cellClassName) {
      className = column.cellClassName
    }

    // Apply color rules
    if (column.colorRules) {
      for (const rule of column.colorRules) {
        if (rule.condition(value, row)) {
          className = cn(className, rule.className)
          if (rule.textClassName) {
            className = cn(className, rule.textClassName)
          }
          break
        }
      }
    }

    return className
  }

  // Render cell content
  const renderCell = (row: T, column: ExcelColumn<T>, index: number) => {
    const value = column.accessor ? column.accessor(row) : row[column.key]

    if (column.render) {
      return column.render(value, row, index)
    }

    if (column.type === 'badge' && typeof value === 'string') {
      return (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      )
    }

    return formatCellValue(value, column.type)
  }

  // Calculate aggregates
  const aggregates = useMemo(() => {
    if (!enableAggregates) return {}

    const result: Record<string, number> = {}
    columns.forEach((col) => {
      if (col.aggregate) {
        const values = sortedData.map((row) =>
          col.accessor ? col.accessor(row) : row[col.key]
        )
        result[col.key] = calculateAggregate(values, col.aggregate)
      }
    })
    return result
  }, [sortedData, columns, enableAggregates])

  if (loading) {
    return (
      <Card className={className}>
        {(title || subtitle) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const allSelected = paginatedData.length > 0 && selectedRows.size === paginatedData.length
  const someSelected = selectedRows.size > 0 && !allSelected

  return (
    <Card className={className}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </CardHeader>
      )}

      <CardContent className="space-y-2">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Global Search */}
          {enableFiltering && (
            <div className="flex items-center gap-2 w-full sm:flex-1 sm:max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                placeholder={isMobile ? "Search..." : "Search all columns..."}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-9 text-base sm:text-sm"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGlobalFilter('')}
                  className="h-9 px-2 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Column Visibility */}
            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-0">
                    <Columns className="w-4 h-4 mr-2" />
                    {!isMobile && "Columns"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      checked={columnVisibility[column.key] !== false}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({ ...prev, [column.key]: checked }))
                      }
                    >
                      {column.header}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Clear Filters */}
            {enableFiltering && (Object.keys(filters).length > 0 || sorting.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({})
                  setSorting([])
                }}
                className="min-h-[44px] sm:min-h-0"
              >
                <X className="w-4 h-4 mr-2" />
                {!isMobile && "Clear Filters"}
              </Button>
            )}

            {/* Export */}
            {enableExport && sortedData.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-0">
                    <Download className="w-4 h-4 mr-2" />
                    {!isMobile && "Export"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    onClick={() => exportToCSV(sortedData, visibleColumns, exportFilename)}
                  >
                    Export as CSV
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    onClick={() => exportToExcel(sortedData, visibleColumns, exportFilename)}
                  >
                    Export as Excel
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="text-xs sm:text-sm">
            {isMobile ? (
              <>{sortedData.length} results {data.length !== sortedData.length && `(${data.length} total)`}</>
            ) : (
              <>
                Showing {paginatedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
                {data.length !== sortedData.length && ` (filtered from ${data.length})`}
              </>
            )}
          </div>
          {selectedRows.size > 0 && (
            <div className="font-medium text-xs sm:text-sm">{selectedRows.size} row(s) selected</div>
          )}
        </div>

        {/* Table Container */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[400px] sm:max-h-[600px] overflow-y-auto">
            <table className="w-full border-collapse">
              {/* Header */}
              <thead
                className={cn(
                  'bg-muted/80 border-b-2 border-border',
                  stickyHeader && 'sticky top-0 z-10'
                )}
              >
                <tr>
                  {/* Selection column */}
                  {enableRowSelection && (
                    <th className="p-2 text-left border-r border-border w-12">
                      <Checkbox
                        checked={allSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = someSelected
                          }
                        }}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                  )}

                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm',
                        compact && 'p-1 sm:p-2 text-xs',
                        showGridlines && 'border-r border-border',
                        column.sortable && 'cursor-pointer select-none hover:bg-muted/60 active:bg-muted/80',
                        column.headerClassName
                      )}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="truncate">{column.header}</span>
                        {enableSorting && column.sortable && (
                          <span className="text-muted-foreground">
                            {sorting.find((s) => s.key === column.key)?.direction === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : sorting.find((s) => s.key === column.key)?.direction === 'desc' ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <CaretUpDown className="w-4 h-4 opacity-30" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Column filter */}
                      {enableFiltering && column.filterable && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          {column.filterOptions ? (
                            <Select
                              value={filters[column.key] || ''}
                              onValueChange={(value) =>
                                setFilters((prev) => ({ ...prev, [column.key]: value }))
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="All" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All</SelectItem>
                                {column.filterOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="Filter..."
                              value={filters[column.key] || ''}
                              onChange={(e) =>
                                setFilters((prev) => ({ ...prev, [column.key]: e.target.value }))
                              }
                              className="h-7 text-xs"
                            />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + (enableRowSelection ? 1 : 0)}
                      className="p-3 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => {
                    const rowId = rowKey(row)
                    const isSelected = selectedRows.has(rowId)

                    return (
                      <tr
                        key={rowId}
                        className={cn(
                          'border-b border-border transition-colors',
                          striped && index % 2 === 0 && 'bg-muted/20',
                          highlightOnHover && 'hover:bg-muted/40',
                          onRowClick && 'cursor-pointer',
                          isSelected && 'bg-primary/10'
                        )}
                        onClick={() => onRowClick?.(row, index)}
                      >
                        {/* Selection cell */}
                        {enableRowSelection && (
                          <td className={cn('p-2', showGridlines && 'border-r border-border')}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleRowSelect(rowId)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Select row ${index + 1}`}
                            />
                          </td>
                        )}

                        {visibleColumns.map((column) => {
                          const value = column.accessor ? column.accessor(row) : row[column.key]

                          return (
                            <td
                              key={column.key}
                              className={cn(
                                'p-2 sm:p-3 text-xs sm:text-sm',
                                compact && 'p-1 sm:p-2 text-xs',
                                showGridlines && 'border-r border-border',
                                column.className,
                                getCellClassName(value, row, column),
                                'truncate max-w-[150px] sm:max-w-none'
                              )}
                              onClick={(e) => {
                                if (onCellClick) {
                                  e.stopPropagation()
                                  onCellClick(value, row, column)
                                }
                              }}
                              title={typeof value === 'string' ? value : undefined}
                            >
                              {renderCell(row, column, index)}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })
                )}
              </tbody>

              {/* Footer with aggregates */}
              {enableAggregates && Object.keys(aggregates).length > 0 && paginatedData.length > 0 && (
                <tfoot className="bg-muted/80 border-t-2 border-border font-semibold">
                  <tr>
                    {enableRowSelection && <td className="p-2 border-r border-border" />}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'p-3',
                          compact && 'p-2 text-sm',
                          showGridlines && 'border-r border-border'
                        )}
                      >
                        {column.aggregate && aggregates[column.key] !== undefined ? (
                          <div className="text-primary">
                            {column.type === 'currency' && '$'}
                            {aggregates[column.key].toLocaleString()}
                            {column.type === 'percentage' && '%'}
                          </div>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="min-h-[44px] sm:min-h-0"
            >
              {isMobile ? "Prev" : "Previous"}
            </Button>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {isMobile ? `${currentPage}/${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="min-h-[44px] sm:min-h-0"
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
