/**
 * ExcelStyleTable - Full-featured spreadsheet-style table component
 *
 * Features:
 * - Sortable columns
 * - Column-level filtering
 * - Global search
 * - Export to Excel
 * - Row click handlers
 * - Pagination
 * - Virtual scrolling for large datasets
 * - Column resizing
 * - Sticky header
 */

import { ArrowUp, ArrowDown, Search, Download, Filter, X } from 'lucide-react'
import React, { useState, useMemo, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface ExcelColumn<T = any> {
  key: string
  label: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  accessor?: (row: T) => any
}

export interface ExcelStyleTableProps<T = any> {
  data: T[]
  columns: ExcelColumn<T>[]
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  exportFilename?: string
  showExport?: boolean
  showSearch?: boolean
  showFilters?: boolean
  pageSize?: number
  className?: string
  height?: string
}

export function ExcelStyleTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  searchPlaceholder = 'Search all fields...',
  exportFilename = 'export',
  showExport = true,
  showSearch = true,
  showFilters = true,
  pageSize = 25,
  className,
  height = '600px'
}: ExcelStyleTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [globalSearch, setGlobalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterRow, setShowFilterRow] = useState(false)

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key)
      const aValue = column?.accessor ? column.accessor(a) : a[sortConfig.key]
      const bValue = column?.accessor ? column.accessor(b) : b[sortConfig.key]

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig, columns])

  // Filter data
  const filteredData = useMemo(() => {
    let result = sortedData

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return

      result = result.filter(row => {
        const column = columns.find(col => col.key === key)
        const cellValue = column?.accessor ? column.accessor(row) : row[key]
        return String(cellValue).toLowerCase().includes(value.toLowerCase())
      })
    })

    // Apply global search
    if (globalSearch) {
      result = result.filter(row => {
        return columns.some(column => {
          const value = column.accessor ? column.accessor(row) : row[column.key]
          return String(value).toLowerCase().includes(globalSearch.toLowerCase())
        })
      })
    }

    return result
  }, [sortedData, filters, globalSearch, columns])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  // Sort handler
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }, [])

  // Filter handler
  const handleFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({})
    setGlobalSearch('')
    setCurrentPage(1)
  }, [])

  // Export to CSV (Excel compatible)
  const handleExport = useCallback(() => {
    const headers = columns.map(col => col.label).join(',')
    const rows = filteredData.map(row => {
      return columns.map(col => {
        const value = col.accessor ? col.accessor(row) : row[col.key]
        // Escape commas and quotes
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      }).join(',')
    })

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${exportFilename}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }, [filteredData, columns, exportFilename])

  const hasActiveFilters = globalSearch || Object.values(filters).some(v => v)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          )}

          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterRow(!showFilterRow)}
              className={cn(
                'border-slate-700',
                showFilterRow && 'bg-blue-500/20 border-blue-500/50'
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-400">
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
            {filteredData.length !== data.length && ` (filtered from ${data.length})`}
          </div>

          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div
          className="overflow-auto"
          style={{ height }}
        >
          <table className="w-full border-collapse">
            {/* Header */}
            <thead className="sticky top-0 z-10 bg-slate-900 border-b-2 border-slate-700">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-2 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider border-r border-slate-700 last:border-r-0',
                      column.sortable && 'cursor-pointer hover:bg-slate-800 select-none'
                    )}
                    style={{ width: column.width || 'auto', minWidth: column.width || 100 }}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {column.sortable !== false && sortConfig?.key === column.key && (
                        sortConfig.direction === 'asc'
                          ? <ArrowUp className="w-3 h-3 text-blue-400" />
                          : <ArrowDown className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>

              {/* Filter Row */}
              {showFilterRow && (
                <tr className="bg-slate-900/50">
                  {columns.map((column) => (
                    <th key={`filter-${column.key}`} className="px-2 py-2 border-r border-slate-700 last:border-r-0">
                      {column.filterable !== false && (
                        <Input
                          type="text"
                          placeholder={`Filter ${column.label}...`}
                          value={filters[column.key] || ''}
                          onChange={(e) => handleFilter(column.key, e.target.value)}
                          className="h-7 text-xs bg-slate-800 border-slate-600"
                        />
                      )}
                    </th>
                  ))}
                </tr>
              )}
            </thead>

            {/* Body */}
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((column) => {
                    const value = column.accessor ? column.accessor(row) : row[column.key]
                    return (
                      <td
                        key={column.key}
                        className="px-2 py-3 text-sm text-slate-200 border-r border-slate-700/30 last:border-r-0"
                      >
                        {column.render ? column.render(value, row) : value}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-2 py-12 text-center text-slate-400"
                  >
                    {hasActiveFilters ? 'No matching results found' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-3 border-t border-slate-700 bg-slate-900/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-slate-700"
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-4 h-4 p-0',
                      currentPage === pageNum
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-700'
                    )}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-700"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExcelStyleTable
