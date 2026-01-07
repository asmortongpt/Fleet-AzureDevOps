/**
 * Enterprise-grade Table Component (USWDS 3.0 Compliant)
 *
 * Professional data table for government applications
 * - WCAG 2.1 AA accessible
 * - Keyboard navigable
 * - Screen reader optimized
 * - Sortable, filterable, paginated
 * - Export to CSV/Excel
 */

import React, { useState, useMemo, useCallback } from 'react'

import { colors, typography, spacing } from '../tokens'

export interface Column<T> {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface PaginationConfig {
  pageSize: number
  showSizeOptions?: boolean
  pageSizeOptions?: number[]
}

export interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  sortable?: boolean
  filterable?: boolean
  pagination?: PaginationConfig
  onRowClick?: (row: T) => void
  striped?: boolean
  compact?: boolean
  stickyHeader?: boolean
  loading?: boolean
  emptyMessage?: string
  ariaLabel?: string
  exportable?: boolean
  exportFilename?: string
}

type SortDirection = 'asc' | 'desc' | null

export function Table<T extends Record<string, any>>({
  data,
  columns,
  sortable = true,
  filterable = false,
  pagination,
  onRowClick,
  striped = true,
  compact = false,
  stickyHeader = false,
  loading = false,
  emptyMessage = 'No data available',
  ariaLabel = 'Data table',
  exportable = true,
  exportFilename = 'export',
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 25)
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    if (!sortable) return

    if (sortColumn === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }, [sortColumn, sortDirection, sortable])

  // Filter data
  const filteredData = useMemo(() => {
    if (!filterable || Object.keys(filters).length === 0) return data

    return data.filter((row) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true
        const column = columns.find((col) => col.key === key)
        if (!column) return true
        const cellValue = column.accessor(row)
        return String(cellValue).toLowerCase().includes(value.toLowerCase())
      })
    })
  }, [data, filters, filterable, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData

    const column = columns.find((col) => col.key === sortColumn)
    if (!column) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = column.accessor(a)
      const bValue = column.accessor(b)

      // Handle null/undefined
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortColumn, sortDirection, columns])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = pagination ? Math.ceil(sortedData.length / pageSize) : 1

  // Export to CSV
  const handleExport = useCallback(() => {
    const headers = columns.map((col) => col.header).join(',')
    const rows = sortedData.map((row) =>
      columns.map((col) => {
        const value = col.accessor(row)
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value).replace(/"/g, '""')
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue
      }).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportFilename}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [columns, sortedData, exportFilename])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onRowClick?.(row)
    }
  }, [onRowClick])

  return (
    <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
      {/* Table controls */}
      {(filterable || exportable) && (
        <div
          className="table-controls"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing[4],
            borderBottom: `1px solid ${colors.border.light}`,
            backgroundColor: colors.background.subtle,
          }}
        >
          {filterable && (
            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
              {columns.filter((col) => col.filterable !== false).map((col) => (
                <input
                  key={col.key}
                  type="text"
                  placeholder={`Filter ${col.header}`}
                  value={filters[col.key] || ''}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, [col.key]: e.target.value }))
                    setCurrentPage(1) // Reset to first page on filter
                  }}
                  style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    border: `1px solid ${colors.border.base}`,
                    borderRadius: '4px',
                    fontSize: typography.fontSize.sm,
                    fontFamily: typography.fontFamily.sans,
                  }}
                  aria-label={`Filter ${col.header}`}
                />
              ))}
            </div>
          )}

          {exportable && (
            <button
              onClick={handleExport}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                backgroundColor: colors.primary.base,
                color: colors.white,
                border: 'none',
                borderRadius: '4px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                fontFamily: typography.fontFamily.sans,
              }}
              aria-label="Export table data to CSV"
            >
              Export CSV
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <table
        role="table"
        aria-label={ariaLabel}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: typography.fontFamily.sans,
          fontSize: typography.fontSize.base,
          backgroundColor: colors.white,
        }}
      >
        <thead
          style={{
            backgroundColor: colors.background.subtle,
            position: stickyHeader ? 'sticky' : 'static',
            top: 0,
            zIndex: 10,
          }}
        >
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                role="columnheader"
                scope="col"
                onClick={() => column.sortable !== false && handleSort(column.key)}
                style={{
                  padding: compact ? spacing[2] : spacing[4],
                  textAlign: column.align || 'left',
                  fontWeight: typography.fontWeight.bold,
                  fontSize: typography.fontSize.sm,
                  color: colors.gray[900],
                  borderBottom: `2px solid ${colors.border.dark}`,
                  cursor: column.sortable !== false && sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  width: column.width,
                }}
                aria-sort={
                  sortColumn === column.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  {column.header}
                  {sortable && column.sortable !== false && (
                    <span aria-hidden="true" style={{ opacity: 0.5 }}>
                      {sortColumn === column.key
                        ? sortDirection === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: spacing[8],
                  textAlign: 'center',
                  color: colors.gray[600],
                }}
              >
                Loading...
              </td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: spacing[8],
                  textAlign: 'center',
                  color: colors.gray[600],
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                role="row"
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => onRowClick && handleKeyDown(e, row)}
                style={{
                  backgroundColor:
                    striped && rowIndex % 2 === 1
                      ? colors.background.subtle
                      : colors.white,
                  cursor: onRowClick ? 'pointer' : 'default',
                  borderBottom: `1px solid ${colors.border.light}`,
                }}
                className="table-row"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    role="cell"
                    style={{
                      padding: compact ? spacing[2] : spacing[4],
                      textAlign: column.align || 'left',
                      color: colors.gray[800],
                      fontSize: typography.fontSize.base,
                      lineHeight: typography.lineHeight.normal,
                    }}
                  >
                    {column.accessor(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && !loading && sortedData.length > 0 && (
        <div
          className="pagination"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing[4],
            borderTop: `1px solid ${colors.border.light}`,
            backgroundColor: colors.background.subtle,
          }}
        >
          <div style={{ color: colors.gray[700], fontSize: typography.fontSize.sm }}>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}{' '}
            entries
          </div>

          <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
            {pagination.showSizeOptions && (
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                style={{
                  padding: spacing[2],
                  border: `1px solid ${colors.border.base}`,
                  borderRadius: '4px',
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.sans,
                }}
                aria-label="Rows per page"
              >
                {(pagination.pageSizeOptions || [10, 25, 50, 100]).map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                border: `1px solid ${colors.border.base}`,
                borderRadius: '4px',
                backgroundColor: colors.white,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.sans,
              }}
              aria-label="Previous page"
            >
              Previous
            </button>

            <span style={{ color: colors.gray[700], fontSize: typography.fontSize.sm }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                border: `1px solid ${colors.border.base}`,
                borderRadius: '4px',
                backgroundColor: colors.white,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.sans,
              }}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <style>{`
        .table-row:hover {
          background-color: ${colors.background.medium} !important;
        }

        .table-row:focus {
          outline: 2px solid ${colors.focus.outline};
          outline-offset: -2px;
        }
      `}</style>
    </div>
  )
}
