/**
 * DrilldownDataTable - Data table with built-in drilldown support at row and cell level
 *
 * Extends the base DataTable functionality with:
 * - Automatic row drilldown to record detail
 * - Cell-level drilldown for related records (e.g., vehicle column links to vehicle detail)
 * - Visual indicators for drilldown-enabled cells
 * - Consistent drilldown behavior across the application
 *
 * Usage:
 * ```tsx
 * <DrilldownDataTable
 *   data={workOrders}
 *   recordType="workOrder"
 *   getRecordId={(wo) => wo.id}
 *   getRecordLabel={(wo) => wo.title}
 *   columns={[
 *     { key: 'title', header: 'Title' },
 *     {
 *       key: 'vehicleId',
 *       header: 'Vehicle',
 *       drilldown: {
 *         recordType: 'vehicle',
 *         getRecordId: (row) => row.vehicleId,
 *         getRecordLabel: (row) => row.vehicleName,
 *       }
 *     }
 *   ]}
 * />
 * ```
 */

import { CaretUp, CaretDown } from '@phosphor-icons/react'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { useState, useMemo, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export interface CellDrilldownConfig<T> {
  /** Record type for the linked entity */
  recordType: string
  /** Extract the record ID from the row */
  getRecordId: (row: T) => string | number | undefined
  /** Get the label for the drilldown breadcrumb */
  getRecordLabel: (row: T) => string
  /** Get additional data for the drilldown */
  getRecordData?: (row: T) => Record<string, any>
}

export interface DrilldownColumn<T> {
  /** Unique key for the column */
  key: string
  /** Display header text */
  header: string
  /** Enable sorting */
  sortable?: boolean
  /** Custom render function */
  render?: (row: T, index: number) => ReactNode
  /** Column className */
  className?: string
  /** Accessor function */
  accessor?: (row: T) => any
  /** Cell-level drilldown configuration */
  drilldown?: CellDrilldownConfig<T>
  /** Show drilldown indicator icon */
  showDrilldownIcon?: boolean
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export interface DrilldownDataTableProps<T> {
  /** Array of data to display */
  data: T[]
  /** Column definitions with drilldown support */
  columns: DrilldownColumn<T>[]
  /** Record type for row-level drilldown */
  recordType: string
  /** Extract record ID for row drilldown */
  getRecordId: (row: T) => string | number
  /** Get record label for breadcrumb */
  getRecordLabel: (row: T) => string
  /** Get additional data for row drilldown */
  getRecordData?: (row: T) => Record<string, any>
  /** Loading state */
  isLoading?: boolean
  /** Empty message */
  emptyMessage?: string
  /** Pagination config */
  pagination?: PaginationConfig
  /** Container className */
  className?: string
  /** Row className */
  rowClassName?: string | ((row: T, index: number) => string)
  /** Skeleton rows count */
  skeletonRows?: number
  /** Disable row drilldown */
  disableRowDrilldown?: boolean
  /** Show row chevron indicator */
  showRowChevron?: boolean
  /** Compact mode */
  compact?: boolean
  /** Striped rows */
  striped?: boolean
  /** Caption for accessibility */
  caption?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DrilldownDataTable<T extends Record<string, any>>({
  data,
  columns,
  recordType,
  getRecordId,
  getRecordLabel,
  getRecordData,
  isLoading = false,
  emptyMessage = 'No data available',
  pagination,
  className = '',
  rowClassName,
  skeletonRows = 5,
  disableRowDrilldown = false,
  showRowChevron = true,
  compact = false,
  striped = false,
  caption,
}: DrilldownDataTableProps<T>) {
  const { push } = useDrilldown()
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Handle column header click for sorting
  const handleSort = (column: DrilldownColumn<T>) => {
    if (!column.sortable) return

    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column.key)
      setSortDirection('asc')
    }
  }

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    const column = columns.find((col) => col.key === sortColumn)
    if (!column) return data

    return [...data].sort((a, b) => {
      const aValue = column.accessor ? column.accessor(a) : a[column.key]
      const bValue = column.accessor ? column.accessor(b) : b[column.key]

      if (aValue === bValue) return 0
      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection, columns])

  // Handle row click for drilldown
  const handleRowClick = (row: T, e: React.MouseEvent) => {
    if (disableRowDrilldown) return

    // Don't trigger row drilldown if clicking on a cell with its own drilldown
    const target = e.target as HTMLElement
    if (target.closest('[data-cell-drilldown="true"]')) return

    const recordId = getRecordId(row)
    const recordLabel = getRecordLabel(row)
    const additionalData = getRecordData?.(row) || {}

    push({
      id: `${recordType}-${recordId}`,
      type: recordType,
      label: recordLabel,
      data: {
        [`${recordType}Id`]: recordId,
        id: recordId,
        ...additionalData,
        ...row,
      },
    })
  }

  // Handle cell drilldown
  const handleCellDrilldown = (
    row: T,
    drilldown: CellDrilldownConfig<T>,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()

    const recordId = drilldown.getRecordId(row)
    if (!recordId) return

    const recordLabel = drilldown.getRecordLabel(row)
    const additionalData = drilldown.getRecordData?.(row) || {}

    push({
      id: `${drilldown.recordType}-${recordId}`,
      type: drilldown.recordType,
      label: recordLabel,
      data: {
        [`${drilldown.recordType}Id`]: recordId,
        id: recordId,
        ...additionalData,
      },
    })
  }

  // Get cell content
  const getCellContent = (
    row: T,
    column: DrilldownColumn<T>,
    index: number
  ) => {
    const baseContent = column.render
      ? column.render(row, index)
      : column.accessor
        ? column.accessor(row)
        : row[column.key]

    // If column has drilldown config, wrap content
    if (column.drilldown) {
      const recordId = column.drilldown.getRecordId(row)
      if (!recordId) return baseContent ?? '-'

      return (
        <span
          data-cell-drilldown="true"
          role="button"
          tabIndex={0}
          onClick={(e) => handleCellDrilldown(row, column.drilldown!, e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleCellDrilldown(row, column.drilldown!, e as unknown as React.MouseEvent)
            }
          }}
          className={cn(
            'inline-flex items-center gap-1 cursor-pointer',
            'text-primary hover:underline underline-offset-2',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded'
          )}
          title={`View ${column.drilldown.getRecordLabel(row)}`}
        >
          {baseContent ?? recordId}
          {column.showDrilldownIcon !== false && (
            <ExternalLink className="w-3 h-3 opacity-50" />
          )}
        </span>
      )
    }

    return baseContent != null ? baseContent : '-'
  }

  // Get row class name
  const getRowClassName = (row: T, index: number) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row, index)
    }
    return rowClassName || ''
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
              {showRowChevron && <TableHead className="w-10" />}
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
                {showRowChevron && (
                  <TableCell>
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                )}
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
      <div className={cn('text-center py-12', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.className,
                  compact && 'py-2 text-xs',
                  column.sortable && 'cursor-pointer select-none hover:bg-muted/50'
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable && sortColumn === column.key && (
                    <span className="text-muted-foreground">
                      {sortDirection === 'asc' ? (
                        <CaretUp className="w-4 h-4" />
                      ) : (
                        <CaretDown className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
            {showRowChevron && !disableRowDrilldown && (
              <TableHead className="w-10" />
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow
              key={getRecordId(row)}
              className={cn(
                getRowClassName(row, index),
                !disableRowDrilldown && 'cursor-pointer hover:bg-muted/50',
                striped && index % 2 === 0 && 'bg-muted/20',
                'group transition-colors'
              )}
              onClick={(e) => handleRowClick(row, e)}
              tabIndex={disableRowDrilldown ? undefined : 0}
              onKeyDown={(e) => {
                if (!disableRowDrilldown && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleRowClick(row, e as unknown as React.MouseEvent)
                }
              }}
              role={disableRowDrilldown ? undefined : 'button'}
              aria-label={
                disableRowDrilldown
                  ? undefined
                  : `View ${getRecordLabel(row)}`
              }
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(column.className, compact && 'py-2 text-sm')}
                >
                  {getCellContent(row, column, index)}
                </TableCell>
              ))}
              {showRowChevron && !disableRowDrilldown && (
                <TableCell className="w-10">
                  <ChevronRight
                    className={cn(
                      'w-3 h-3 text-muted-foreground',
                      'opacity-0 group-hover:opacity-100 transition-opacity'
                    )}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
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

// ============================================================================
// PRE-CONFIGURED VARIANTS
// ============================================================================

export interface VehicleTableData {
  id: string
  number?: string
  name?: string
  make?: string
  model?: string
  year?: number
  status?: string
  driver?: string
  driverId?: string
  location?: { address?: string }
  [key: string]: any
}

export interface DrilldownVehicleTableProps {
  vehicles: VehicleTableData[]
  loading?: boolean
  showDriver?: boolean
  showLocation?: boolean
  compact?: boolean
  className?: string
}

/**
 * Pre-configured drilldown table for vehicles
 */
export function DrilldownVehicleTable({
  vehicles,
  loading,
  showDriver = true,
  showLocation = true,
  compact = false,
  className,
}: DrilldownVehicleTableProps) {
  const columns: DrilldownColumn<VehicleTableData>[] = [
    {
      key: 'number',
      header: 'Vehicle #',
      sortable: true,
      render: (row) => row.number || row.name || `V-${row.id}`,
    },
    {
      key: 'make',
      header: 'Make/Model',
      render: (row) =>
        row.make && row.model
          ? `${row.year || ''} ${row.make} ${row.model}`.trim()
          : '-',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            row.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            row.status === 'idle' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            row.status === 'service' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            row.status === 'offline' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
          )}
        >
          {row.status || 'Unknown'}
        </span>
      ),
    },
  ]

  if (showDriver) {
    columns.push({
      key: 'driver',
      header: 'Driver',
      drilldown: {
        recordType: 'driver',
        getRecordId: (row) => row.driverId,
        getRecordLabel: (row) => row.driver || `Driver ${row.driverId}`,
      },
      render: (row) => row.driver || '-',
    })
  }

  if (showLocation) {
    columns.push({
      key: 'location',
      header: 'Location',
      render: (row) => row.location?.address || '-',
    })
  }

  return (
    <DrilldownDataTable
      data={vehicles}
      columns={columns}
      recordType="vehicle"
      getRecordId={(v) => v.id}
      getRecordLabel={(v) => v.name || v.number || `Vehicle ${v.id}`}
      getRecordData={(v) => ({ vehicleId: v.id })}
      isLoading={loading}
      compact={compact}
      className={className}
      emptyMessage="No vehicles found"
    />
  )
}

export interface WorkOrderTableData {
  id: string
  title?: string
  number?: string
  status?: string
  priority?: string
  vehicleId?: string
  vehicleName?: string
  assignedTo?: string
  dueDate?: string
  [key: string]: any
}

export interface DrilldownWorkOrderTableProps {
  workOrders: WorkOrderTableData[]
  loading?: boolean
  showVehicle?: boolean
  compact?: boolean
  className?: string
}

/**
 * Pre-configured drilldown table for work orders
 */
export function DrilldownWorkOrderTable({
  workOrders,
  loading,
  showVehicle = true,
  compact = false,
  className,
}: DrilldownWorkOrderTableProps) {
  const columns: DrilldownColumn<WorkOrderTableData>[] = [
    {
      key: 'number',
      header: 'WO #',
      sortable: true,
      render: (row) => row.number || `WO-${row.id}`,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            row.status === 'open' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            row.status === 'in-progress' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            row.status === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          )}
        >
          {row.status || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            row.priority === 'high' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            row.priority === 'medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            row.priority === 'low' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          )}
        >
          {row.priority || '-'}
        </span>
      ),
    },
  ]

  if (showVehicle) {
    columns.push({
      key: 'vehicle',
      header: 'Vehicle',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (row) => row.vehicleId,
        getRecordLabel: (row) => row.vehicleName || `Vehicle ${row.vehicleId}`,
      },
      render: (row) => row.vehicleName || '-',
    })
  }

  columns.push({
    key: 'dueDate',
    header: 'Due Date',
    sortable: true,
    render: (row) =>
      row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-',
  })

  return (
    <DrilldownDataTable
      data={workOrders}
      columns={columns}
      recordType="workOrder"
      getRecordId={(wo) => wo.id}
      getRecordLabel={(wo) => wo.title || wo.number || `WO-${wo.id}`}
      getRecordData={(wo) => ({ workOrderId: wo.id })}
      isLoading={loading}
      compact={compact}
      className={className}
      emptyMessage="No work orders found"
    />
  )
}

export interface DriverTableData {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  status?: string
  vehicleId?: string
  vehicleName?: string
  score?: number
  [key: string]: any
}

export interface DrilldownDriverTableProps {
  drivers: DriverTableData[]
  loading?: boolean
  showVehicle?: boolean
  showScore?: boolean
  compact?: boolean
  className?: string
}

/**
 * Pre-configured drilldown table for drivers
 */
export function DrilldownDriverTable({
  drivers,
  loading,
  showVehicle = true,
  showScore = true,
  compact = false,
  className,
}: DrilldownDriverTableProps) {
  const columns: DrilldownColumn<DriverTableData>[] = [
    {
      key: 'name',
      header: 'Driver',
      sortable: true,
      render: (row) =>
        row.name ||
        (row.firstName && row.lastName
          ? `${row.firstName} ${row.lastName}`
          : `Driver ${row.id}`),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            row.status === 'on-duty' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            row.status === 'driving' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            row.status === 'off-duty' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
          )}
        >
          {row.status || 'Unknown'}
        </span>
      ),
    },
  ]

  if (showVehicle) {
    columns.push({
      key: 'vehicle',
      header: 'Assigned Vehicle',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (row) => row.vehicleId,
        getRecordLabel: (row) => row.vehicleName || `Vehicle ${row.vehicleId}`,
      },
      render: (row) => row.vehicleName || '-',
    })
  }

  if (showScore) {
    columns.push({
      key: 'score',
      header: 'Safety Score',
      sortable: true,
      render: (row) =>
        row.score !== undefined ? (
          <span
            className={cn(
              'font-medium',
              (row.score ?? 0) >= 90 && 'text-green-600',
              (row.score ?? 0) >= 70 && (row.score ?? 0) < 90 && 'text-yellow-600',
              (row.score ?? 0) < 70 && 'text-red-600'
            )}
          >
            {row.score}%
          </span>
        ) : (
          '-'
        ),
    })
  }

  return (
    <DrilldownDataTable
      data={drivers}
      columns={columns}
      recordType="driver"
      getRecordId={(d) => d.id}
      getRecordLabel={(d) =>
        d.name ||
        (d.firstName && d.lastName ? `${d.firstName} ${d.lastName}` : `Driver ${d.id}`)
      }
      getRecordData={(d) => ({ driverId: d.id })}
      isLoading={loading}
      compact={compact}
      className={className}
      emptyMessage="No drivers found"
    />
  )
}

export default DrilldownDataTable
