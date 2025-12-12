/**
 * DataTable - Reusable data table component with sorting, filtering, and pagination
 *
 * A generic, composable table component that eliminates duplicate table code across modules.
 * Supports type-safe columns, sorting, filtering, row actions, and pagination.
 *
 * Features:
 * - Type-safe generic columns
 * - Built-in sorting
 * - Optional filtering
 * - Row click handlers
 * - Pagination support
 * - Loading and empty states
 * - Action menus per row
 *
 * Usage:
 * ```tsx
 * <DataTable
 *   data={vehicles}
 *   columns={[
 *     { key: 'id', header: 'ID', sortable: true },
 *     { key: 'make', header: 'Make', render: (row) => <Badge>{row.make}</Badge> }
 *   ]}
 *   onRowClick={(row) => navigate(row.id)}
 *   pagination={{ page: 1, pageSize: 10, total: 100 }}
 * />
 * ```
 */

import { CaretUp, CaretDown } from "@phosphor-icons/react"
import { useState, useMemo, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

// ============================================================================
// TYPES
// ============================================================================

export interface Column<T> {
  /** Unique key for the column (should match data property) */
  key: string
  /** Display header text */
  header: string
  /** Enable sorting for this column */
  sortable?: boolean
  /** Custom render function for cell content */
  render?: (row: T, index: number) => ReactNode
  /** Custom className for the column */
  className?: string
  /** Accessor function to get value from row (defaults to row[key]) */
  accessor?: (row: T) => any
}

export interface PaginationConfig {
  /** Current page number (1-indexed) */
  page: number
  /** Number of items per page */
  pageSize: number
  /** Total number of items */
  total: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
}

export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[]
  /** Column definitions */
  columns: Column<T>[]
  /** Loading state */
  isLoading?: boolean
  /** Message to show when no data */
  emptyMessage?: string
  /** Callback when row is clicked */
  onRowClick?: (row: T, index: number) => void
  /** Pagination configuration (optional) */
  pagination?: PaginationConfig
  /** Additional className for table container */
  className?: string
  /** Row className (can be function for conditional styling) */
  rowClassName?: string | ((row: T, index: number) => string)
  /** Show loading skeleton rows */
  skeletonRows?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data available",
  onRowClick,
  pagination,
  className = "",
  rowClassName,
  skeletonRows = 5
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Handle column header click for sorting
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    if (sortColumn === column.key) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new column with ascending default
      setSortColumn(column.key)
      setSortDirection("asc")
    }
  }

  // Sort data based on current sort state
  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    const column = columns.find(col => col.key === sortColumn)
    if (!column) return data

    return [...data].sort((a, b) => {
      const aValue = column.accessor ? column.accessor(a) : a[column.key]
      const bValue = column.accessor ? column.accessor(b) : b[column.key]

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection, columns])

  // Get cell content
  const getCellContent = (row: T, column: Column<T>, index: number) => {
    if (column.render) {
      return column.render(row, index)
    }

    const value = column.accessor ? column.accessor(row) : row[column.key]
    return value != null ? String(value) : "-"
  }

  // Get row class name
  const getRowClassName = (row: T, index: number) => {
    if (typeof rowClassName === "function") {
      return rowClassName(row, index)
    }
    return rowClassName || ""
  }

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Render empty state
  if (sortedData.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.className || ""} ${
                  column.sortable ? "cursor-pointer select-none hover:bg-muted/50" : ""
                }`}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable && sortColumn === column.key && (
                    <span className="text-muted-foreground">
                      {sortDirection === "asc" ? (
                        <CaretUp className="w-4 h-4" />
                      ) : (
                        <CaretDown className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow
              key={index}
              className={`${getRowClassName(row, index)} ${
                onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
              }`}
              onClick={() => onRowClick?.(row, index)}
            >
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {getCellContent(row, column, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
