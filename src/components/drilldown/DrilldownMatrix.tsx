/**
 * DrilldownMatrix - Excel-style data grid with drilldown support
 *
 * Displays data in a spreadsheet-like matrix format where every cell
 * can be clicked to drill down to the underlying record.
 *
 * Features:
 * - Excel-like grid layout with fixed headers
 * - Cell-level drilldown to final records
 * - Row and column grouping
 * - Sticky headers and first column
 * - Keyboard navigation
 * - Responsive scrolling
 *
 * Usage:
 * ```tsx
 * <DrilldownMatrix
 *   data={vehicles}
 *   columns={[
 *     { key: 'number', header: 'Vehicle #' },
 *     { key: 'driver', header: 'Driver', drilldown: { recordType: 'driver', ... } },
 *   ]}
 *   recordType="vehicle"
 *   getRecordId={(v) => v.id}
 *   getRecordLabel={(v) => v.name}
 * />
 * ```
 */

import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import React, { useState, useRef, useCallback, KeyboardEvent, MouseEvent } from 'react'

import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export interface MatrixCellDrilldown<T> {
  /** Record type for the cell's linked entity */
  recordType: string
  /** Extract the record ID from the row */
  getRecordId: (row: T) => string | number | undefined
  /** Get the label for the drilldown breadcrumb */
  getRecordLabel: (row: T) => string
  /** Get additional data for the drilldown */
  getRecordData?: (row: T) => Record<string, any>
}

export interface MatrixColumn<T> {
  /** Unique key for the column */
  key: string
  /** Display header text */
  header: string
  /** Column width (CSS value) */
  width?: string
  /** Minimum width */
  minWidth?: string
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Custom render function */
  render?: (row: T, index: number) => React.ReactNode
  /** Accessor function */
  accessor?: (row: T) => any
  /** Cell-level drilldown configuration */
  drilldown?: MatrixCellDrilldown<T>
  /** Fixed column (sticky) */
  sticky?: boolean
  /** Column className */
  className?: string
  /** Header className */
  headerClassName?: string
}

export interface DrilldownMatrixProps<T> {
  /** Array of data to display */
  data: T[]
  /** Column definitions */
  columns: MatrixColumn<T>[]
  /** Record type for row drilldown */
  recordType: string
  /** Extract record ID for row drilldown */
  getRecordId: (row: T) => string | number
  /** Get record label for breadcrumb */
  getRecordLabel: (row: T) => string
  /** Get additional data for row drilldown */
  getRecordData?: (row: T) => Record<string, any>
  /** Loading state */
  loading?: boolean
  /** Empty message */
  emptyMessage?: string
  /** Container className */
  className?: string
  /** Row height */
  rowHeight?: 'compact' | 'default' | 'comfortable'
  /** Show row numbers */
  showRowNumbers?: boolean
  /** Zebra striping */
  striped?: boolean
  /** Show grid lines */
  showGridLines?: boolean
  /** Max height for scroll */
  maxHeight?: string
  /** Caption for accessibility */
  caption?: string
  /** Group by column key */
  groupBy?: string
  /** Initial expanded groups */
  expandedGroups?: string[]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DrilldownMatrix<T extends Record<string, any>>({
  data,
  columns,
  recordType,
  getRecordId,
  getRecordLabel,
  getRecordData,
  loading = false,
  emptyMessage = 'No data available',
  className,
  rowHeight = 'default',
  showRowNumbers = true,
  striped = true,
  showGridLines = true,
  maxHeight = '600px',
  caption,
  groupBy,
  expandedGroups: initialExpandedGroups,
}: DrilldownMatrixProps<T>) {
  const { push } = useDrilldown()
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(initialExpandedGroups || [])
  )
  const tableRef = useRef<HTMLTableElement>(null)

  const rowHeightClasses = {
    compact: 'h-7',
    default: 'h-9',
    comfortable: 'h-11',
  }

  // Handle row click for drilldown
  const handleRowDrilldown = useCallback(
    (row: T, e: MouseEvent) => {
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
    },
    [recordType, getRecordId, getRecordLabel, getRecordData, push]
  )

  // Handle cell drilldown
  const handleCellDrilldown = useCallback(
    (row: T, drilldown: MatrixCellDrilldown<T>, e: MouseEvent) => {
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
    },
    [push]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent, row: T, rowIndex: number, colIndex: number) => {
      const totalRows = data.length
      const totalCols = columns.length

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (rowIndex > 0) setFocusedCell({ row: rowIndex - 1, col: colIndex })
          break
        case 'ArrowDown':
          e.preventDefault()
          if (rowIndex < totalRows - 1) setFocusedCell({ row: rowIndex + 1, col: colIndex })
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (colIndex > 0) setFocusedCell({ row: rowIndex, col: colIndex - 1 })
          break
        case 'ArrowRight':
          e.preventDefault()
          if (colIndex < totalCols - 1) setFocusedCell({ row: rowIndex, col: colIndex + 1 })
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          const column = columns[colIndex]
          if (column.drilldown) {
            handleCellDrilldown(row, column.drilldown, e as unknown as MouseEvent)
          } else {
            handleRowDrilldown(row, e as unknown as MouseEvent)
          }
          break
        case 'Home':
          e.preventDefault()
          setFocusedCell({ row: e.ctrlKey ? 0 : rowIndex, col: 0 })
          break
        case 'End':
          e.preventDefault()
          setFocusedCell({
            row: e.ctrlKey ? totalRows - 1 : rowIndex,
            col: totalCols - 1,
          })
          break
      }
    },
    [data.length, columns, handleCellDrilldown, handleRowDrilldown]
  )

  // Get cell content
  const getCellContent = (row: T, column: MatrixColumn<T>, index: number) => {
    if (column.render) {
      return column.render(row, index)
    }
    const value = column.accessor ? column.accessor(row) : row[column.key]
    return value != null ? String(value) : '-'
  }

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  // Group data if groupBy is specified
  const groupedData = React.useMemo(() => {
    if (!groupBy) return null

    const groups = new Map<string, T[]>()
    data.forEach((item) => {
      const key = String(item[groupBy] ?? 'Other')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(item)
    })
    return groups
  }, [data, groupBy])

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading data...</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn('text-center py-12 text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    )
  }

  const stickyColumns = columns.filter((c) => c.sticky)
  const regularColumns = columns.filter((c) => !c.sticky)
  const orderedColumns = [...stickyColumns, ...regularColumns]

  let stickyOffset = showRowNumbers ? 40 : 0

  return (
    <div
      className={cn(
        'relative overflow-auto border rounded-lg bg-background',
        className
      )}
      style={{ maxHeight }}
    >
      <table
        ref={tableRef}
        className="w-full border-collapse text-sm"
        role="grid"
      >
        {caption && <caption className="sr-only">{caption}</caption>}

        {/* Header */}
        <thead className="sticky top-0 z-20 bg-muted">
          <tr>
            {/* Row number header */}
            {showRowNumbers && (
              <th
                className={cn(
                  'sticky left-0 z-30 bg-muted px-2 text-center text-xs font-medium text-muted-foreground',
                  rowHeightClasses[rowHeight],
                  showGridLines && 'border-r border-b border-border'
                )}
                style={{ width: '40px', minWidth: '40px' }}
              >
                #
              </th>
            )}
            {orderedColumns.map((column, colIndex) => {
              const isStickyCol = column.sticky
              let leftOffset = stickyOffset
              if (isStickyCol) {
                stickyOffset += parseInt(column.width || column.minWidth || '120')
              }

              return (
                <th
                  key={column.key}
                  className={cn(
                    'px-3 font-medium text-left',
                    rowHeightClasses[rowHeight],
                    showGridLines && 'border-r border-b border-border',
                    isStickyCol && 'sticky z-20 bg-muted',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.headerClassName
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth || '100px',
                    left: isStickyCol ? `${leftOffset}px` : undefined,
                  }}
                >
                  {column.header}
                </th>
              )
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {groupedData
            ? // Render grouped data
              Array.from(groupedData.entries()).map(([groupKey, groupItems]) => {
                const isExpanded = expandedGroups.has(groupKey)

                return (
                  <React.Fragment key={groupKey}>
                    {/* Group header row */}
                    <tr
                      className="bg-muted/50 cursor-pointer hover:bg-muted"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <td
                        colSpan={(showRowNumbers ? 1 : 0) + orderedColumns.length}
                        className={cn(
                          'px-3 font-medium',
                          rowHeightClasses[rowHeight],
                          showGridLines && 'border-b border-border'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span>{groupKey}</span>
                          <span className="text-muted-foreground">({groupItems.length})</span>
                        </div>
                      </td>
                    </tr>
                    {/* Group items */}
                    {isExpanded &&
                      groupItems.map((row, rowIndex) =>
                        renderRow(row, rowIndex, orderedColumns, rowIndex)
                      )}
                  </React.Fragment>
                )
              })
            : // Render flat data
              data.map((row, rowIndex) => renderRow(row, rowIndex, orderedColumns, rowIndex))}
        </tbody>
      </table>
    </div>
  )

  function renderRow(
    row: T,
    rowIndex: number,
    cols: MatrixColumn<T>[],
    globalRowIndex: number
  ) {
    let colStickyOffset = showRowNumbers ? 40 : 0

    return (
      <tr
        key={getRecordId(row)}
        className={cn(
          'group cursor-pointer transition-colors',
          'hover:bg-primary/5',
          striped && globalRowIndex % 2 === 0 && 'bg-muted/30'
        )}
        onClick={(e) => handleRowDrilldown(row, e)}
      >
        {/* Row number */}
        {showRowNumbers && (
          <td
            className={cn(
              'sticky left-0 z-10 bg-inherit px-2 text-center text-xs text-muted-foreground',
              rowHeightClasses[rowHeight],
              showGridLines && 'border-r border-b border-border',
              striped && globalRowIndex % 2 === 0 ? 'bg-muted/30' : 'bg-background',
              'group-hover:bg-primary/5'
            )}
          >
            {globalRowIndex + 1}
          </td>
        )}

        {/* Data cells */}
        {cols.map((column, colIndex) => {
          const isStickyCol = column.sticky
          let leftOffset = colStickyOffset
          if (isStickyCol) {
            colStickyOffset += parseInt(column.width || column.minWidth || '120')
          }

          const isFocused =
            focusedCell?.row === rowIndex && focusedCell?.col === colIndex
          const hasDrilldown = !!column.drilldown
          const drilldownId = hasDrilldown ? column.drilldown!.getRecordId(row) : undefined

          return (
            <td
              key={column.key}
              tabIndex={0}
              data-cell-drilldown={hasDrilldown && drilldownId ? 'true' : undefined}
              onClick={(e) => {
                if (hasDrilldown && drilldownId) {
                  handleCellDrilldown(row, column.drilldown!, e)
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, row, rowIndex, colIndex)}
              onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
              className={cn(
                'px-3',
                rowHeightClasses[rowHeight],
                showGridLines && 'border-r border-b border-border',
                isStickyCol && 'sticky z-10',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right',
                hasDrilldown && drilldownId && [
                  'text-primary cursor-pointer',
                  'hover:underline hover:bg-primary/10',
                ],
                isFocused && 'ring-2 ring-inset ring-primary',
                striped && globalRowIndex % 2 === 0 ? 'bg-muted/30' : 'bg-background',
                isStickyCol && 'group-hover:bg-primary/5',
                column.className
              )}
              style={{
                left: isStickyCol ? `${leftOffset}px` : undefined,
              }}
            >
              {getCellContent(row, column, rowIndex)}
            </td>
          )
        })}
      </tr>
    )
  }
}

// ============================================================================
// SPECIALIZED MATRIX COMPONENTS
// ============================================================================

export interface VehicleMatrixProps {
  vehicles: Array<{
    id: string
    number?: string
    make?: string
    model?: string
    year?: number
    status?: string
    driver?: string
    driverId?: string
    location?: { address?: string }
    fuelLevel?: number
    mileage?: number
    [key: string]: any
  }>
  loading?: boolean
  className?: string
}

/**
 * Pre-configured Excel-style matrix for vehicles
 */
export function VehicleMatrix({ vehicles, loading, className }: VehicleMatrixProps) {
  const columns: MatrixColumn<VehicleMatrixProps['vehicles'][0]>[] = [
    {
      key: 'number',
      header: 'Vehicle #',
      sticky: true,
      width: '100px',
      render: (row) => row.number || `V-${row.id}`,
    },
    {
      key: 'makeModel',
      header: 'Make/Model',
      width: '150px',
      render: (row) => (row.make && row.model ? `${row.make} ${row.model}` : '-'),
    },
    {
      key: 'year',
      header: 'Year',
      width: '80px',
      align: 'center',
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (row) => (
        <span
          className={cn(
            'px-2 py-0.5 text-xs rounded',
            row.status === 'active' && 'bg-green-100 text-green-700',
            row.status === 'idle' && 'bg-yellow-100 text-yellow-700',
            row.status === 'service' && 'bg-orange-100 text-orange-700',
            row.status === 'offline' && 'bg-gray-100 text-gray-700'
          )}
        >
          {row.status || '-'}
        </span>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      width: '150px',
      drilldown: {
        recordType: 'driver',
        getRecordId: (row) => row.driverId,
        getRecordLabel: (row) => row.driver || `Driver ${row.driverId}`,
      },
      render: (row) => row.driver || '-',
    },
    {
      key: 'fuelLevel',
      header: 'Fuel %',
      width: '80px',
      align: 'right',
      render: (row) =>
        row.fuelLevel !== undefined ? (
          <span
            className={cn(
              (row.fuelLevel ?? 0) < 25 && 'text-red-600',
              (row.fuelLevel ?? 0) >= 25 && (row.fuelLevel ?? 0) < 50 && 'text-yellow-600'
            )}
          >
            {row.fuelLevel}%
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'mileage',
      header: 'Mileage',
      width: '100px',
      align: 'right',
      render: (row) => (row.mileage ? row.mileage.toLocaleString() : '-'),
    },
    {
      key: 'location',
      header: 'Location',
      width: '200px',
      render: (row) => row.location?.address || '-',
    },
  ]

  return (
    <DrilldownMatrix
      data={vehicles}
      columns={columns}
      recordType="vehicle"
      getRecordId={(v) => v.id}
      getRecordLabel={(v) => v.number || `Vehicle ${v.id}`}
      loading={loading}
      className={className}
      caption="Vehicle fleet matrix"
    />
  )
}

export interface WorkOrderMatrixProps {
  workOrders: Array<{
    id: string
    number?: string
    title?: string
    status?: string
    priority?: string
    vehicleId?: string
    vehicleName?: string
    assignedTo?: string
    dueDate?: string
    [key: string]: any
  }>
  loading?: boolean
  className?: string
}

/**
 * Pre-configured Excel-style matrix for work orders
 */
export function WorkOrderMatrix({ workOrders, loading, className }: WorkOrderMatrixProps) {
  const columns: MatrixColumn<WorkOrderMatrixProps['workOrders'][0]>[] = [
    {
      key: 'number',
      header: 'WO #',
      sticky: true,
      width: '100px',
      render: (row) => row.number || `WO-${row.id}`,
    },
    {
      key: 'title',
      header: 'Title',
      width: '200px',
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (row) => (
        <span
          className={cn(
            'px-2 py-0.5 text-xs rounded',
            row.status === 'open' && 'bg-blue-100 text-blue-700',
            row.status === 'in-progress' && 'bg-yellow-100 text-yellow-700',
            row.status === 'completed' && 'bg-green-100 text-green-700'
          )}
        >
          {row.status || '-'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '80px',
      align: 'center',
      render: (row) => (
        <span
          className={cn(
            'px-2 py-0.5 text-xs rounded',
            row.priority === 'high' && 'bg-red-100 text-red-700',
            row.priority === 'medium' && 'bg-yellow-100 text-yellow-700',
            row.priority === 'low' && 'bg-green-100 text-green-700'
          )}
        >
          {row.priority || '-'}
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      width: '120px',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (row) => row.vehicleId,
        getRecordLabel: (row) => row.vehicleName || `Vehicle ${row.vehicleId}`,
      },
      render: (row) => row.vehicleName || '-',
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      width: '150px',
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      width: '100px',
      align: 'center',
      render: (row) =>
        row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-',
    },
  ]

  return (
    <DrilldownMatrix
      data={workOrders}
      columns={columns}
      recordType="workOrder"
      getRecordId={(wo) => wo.id}
      getRecordLabel={(wo) => wo.title || wo.number || `WO-${wo.id}`}
      loading={loading}
      className={className}
      caption="Work orders matrix"
    />
  )
}

export interface DriverMatrixProps {
  drivers: Array<{
    id: string
    name?: string
    firstName?: string
    lastName?: string
    status?: string
    vehicleId?: string
    vehicleName?: string
    score?: number
    trips?: number
    miles?: number
    [key: string]: any
  }>
  loading?: boolean
  className?: string
}

/**
 * Pre-configured Excel-style matrix for drivers
 */
export function DriverMatrix({ drivers, loading, className }: DriverMatrixProps) {
  const columns: MatrixColumn<DriverMatrixProps['drivers'][0]>[] = [
    {
      key: 'name',
      header: 'Driver Name',
      sticky: true,
      width: '150px',
      render: (row) =>
        row.name ||
        (row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : `Driver ${row.id}`),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (row) => (
        <span
          className={cn(
            'px-2 py-0.5 text-xs rounded',
            row.status === 'on-duty' && 'bg-green-100 text-green-700',
            row.status === 'driving' && 'bg-blue-100 text-blue-700',
            row.status === 'off-duty' && 'bg-gray-100 text-gray-700'
          )}
        >
          {row.status || '-'}
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      width: '120px',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (row) => row.vehicleId,
        getRecordLabel: (row) => row.vehicleName || `Vehicle ${row.vehicleId}`,
      },
      render: (row) => row.vehicleName || '-',
    },
    {
      key: 'score',
      header: 'Safety Score',
      width: '100px',
      align: 'right',
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
    },
    {
      key: 'trips',
      header: 'Trips',
      width: '80px',
      align: 'right',
      render: (row) => row.trips?.toLocaleString() || '-',
    },
    {
      key: 'miles',
      header: 'Miles',
      width: '100px',
      align: 'right',
      render: (row) => row.miles?.toLocaleString() || '-',
    },
  ]

  return (
    <DrilldownMatrix
      data={drivers}
      columns={columns}
      recordType="driver"
      getRecordId={(d) => d.id}
      getRecordLabel={(d) =>
        d.name ||
        (d.firstName && d.lastName ? `${d.firstName} ${d.lastName}` : `Driver ${d.id}`)
      }
      loading={loading}
      className={className}
      caption="Drivers matrix"
    />
  )
}

export default DrilldownMatrix
