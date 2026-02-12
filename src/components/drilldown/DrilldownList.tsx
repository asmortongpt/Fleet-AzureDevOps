/**
 * DrilldownList - List component with built-in drilldown support
 *
 * Renders a list of items where each item can be clicked to drill down
 * to its record detail. Supports various layouts and styling options.
 *
 * Usage:
 * ```tsx
 * <DrilldownList
 *   items={vehicles}
 *   recordType="vehicle"
 *   getRecordId={(v) => v.id}
 *   getRecordLabel={(v) => v.name}
 *   renderItem={(v) => <VehicleCard vehicle={v} />}
 * />
 * ```
 */

import { ChevronRight, Loader2 } from 'lucide-react'
import React, { ReactNode, KeyboardEvent } from 'react'

import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

export interface DrilldownListItem {
  id: string | number
  [key: string]: any
}

export interface DrilldownListProps<T extends DrilldownListItem> {
  /** Array of items to display */
  items: T[]
  /** Record type for drilldown */
  recordType: string
  /** Function to extract the record ID */
  getRecordId: (item: T) => string | number
  /** Function to get the record label for breadcrumbs */
  getRecordLabel: (item: T) => string
  /** Function to build additional data for drilldown */
  getRecordData?: (item: T) => Record<string, any>
  /** Custom render function for each item */
  renderItem?: (item: T, index: number) => ReactNode
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Additional CSS classes for container */
  className?: string
  /** Additional CSS classes for list items */
  itemClassName?: string
  /** Layout variant */
  variant?: 'default' | 'compact' | 'cards' | 'striped'
  /** Show chevron indicator */
  showChevron?: boolean
  /** Show dividers between items */
  showDividers?: boolean
  /** Gap between items */
  gap?: 'none' | 'sm' | 'md' | 'lg'
  /** Disable all drilldown interactions */
  disabled?: boolean
  /** Header content */
  header?: ReactNode
  /** Footer content */
  footer?: ReactNode
}

export function DrilldownList<T extends DrilldownListItem>({
  items,
  recordType,
  getRecordId,
  getRecordLabel,
  getRecordData,
  renderItem,
  loading = false,
  emptyMessage = 'No items found',
  className,
  itemClassName,
  variant = 'default',
  showChevron = true,
  showDividers = true,
  gap = 'none',
  disabled = false,
  header,
  footer,
}: DrilldownListProps<T>) {
  const { push } = useDrilldown()

  const handleItemClick = (item: T) => {
    if (disabled) return

    const recordId = getRecordId(item)
    const recordLabel = getRecordLabel(item)
    const additionalData = getRecordData?.(item) || {}

    push({
      id: `${recordType}-${recordId}`,
      type: recordType,
      label: recordLabel,
      data: {
        [`${recordType}Id`]: recordId,
        ...additionalData,
        ...item,
        id: recordId,
      },
    })
  }

  const handleKeyDown = (e: KeyboardEvent, item: T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemClick(item)
    }
  }

  const gapClasses = {
    none: '',
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-2',
  }

  const variantClasses = {
    default: '',
    compact: 'text-sm',
    cards: 'gap-3',
    striped: '',
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-3', className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-3 text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {header}
      <ul
        role="list"
        className={cn(
          'flex flex-col',
          gapClasses[gap],
          variantClasses[variant]
        )}
      >
        {items.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === items.length - 1

          return (
            <li
              key={getRecordId(item)}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              aria-label={`View ${getRecordLabel(item)}`}
              className={cn(
                'group cursor-pointer transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50',
                // Variant-specific styles
                variant === 'default' && [
                  'px-2 py-3 hover:bg-muted/50',
                  showDividers && !isLast && 'border-b border-border/50',
                ],
                variant === 'compact' && [
                  'px-3 py-2 hover:bg-muted/50',
                  showDividers && !isLast && 'border-b border-border/50',
                ],
                variant === 'cards' && [
                  'px-2 py-3 rounded-lg border bg-card hover:bg-muted/30',
                  'shadow-sm hover:shadow-md',
                ],
                variant === 'striped' && [
                  'px-2 py-3 hover:bg-muted/50',
                  index % 2 === 0 && 'bg-muted/20',
                  showDividers && !isLast && 'border-b border-border/50',
                ],
                // Rounded corners for first/last items
                variant !== 'cards' && isFirst && 'rounded-t-lg',
                variant !== 'cards' && isLast && 'rounded-b-lg',
                disabled && 'cursor-not-allowed opacity-50',
                itemClassName
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {renderItem ? (
                    renderItem(item, index)
                  ) : (
                    <span className="font-medium truncate">
                      {getRecordLabel(item)}
                    </span>
                  )}
                </div>
                {showChevron && !disabled && (
                  <ChevronRight
                    className={cn(
                      'w-3 h-3 text-muted-foreground flex-shrink-0 ml-2',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'group-focus:opacity-100'
                    )}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {footer}
    </div>
  )
}

// ============================================================================
// SPECIALIZED VARIANTS
// ============================================================================

export interface VehicleListItem {
  id: string
  number?: string
  name?: string
  make?: string
  model?: string
  status?: string
  [key: string]: any
}

export interface DrilldownVehicleListProps {
  vehicles: VehicleListItem[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  variant?: 'default' | 'compact' | 'cards' | 'striped'
  showStatus?: boolean
}

/**
 * Pre-configured drilldown list for vehicles
 */
export function DrilldownVehicleList({
  vehicles,
  loading,
  emptyMessage = 'No vehicles found',
  className,
  variant = 'default',
  showStatus = true,
}: DrilldownVehicleListProps) {
  return (
    <DrilldownList
      items={vehicles}
      recordType="vehicle"
      getRecordId={(v) => v.id}
      getRecordLabel={(v) => v.name || v.number || `Vehicle ${v.id}`}
      getRecordData={(v) => ({ vehicleId: v.id })}
      loading={loading}
      emptyMessage={emptyMessage}
      className={className}
      variant={variant}
      renderItem={(vehicle) => (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              {vehicle.name || vehicle.number || `Vehicle ${vehicle.id}`}
            </div>
            {vehicle.make && vehicle.model && (
              <div className="text-sm text-muted-foreground">
                {vehicle.make} {vehicle.model}
              </div>
            )}
          </div>
          {showStatus && vehicle.status && (
            <span
              className={cn(
                'px-2 py-1 text-xs rounded-full',
                vehicle.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                vehicle.status === 'idle' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                vehicle.status === 'service' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
                vehicle.status === 'offline' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-600'
              )}
            >
              {vehicle.status}
            </span>
          )}
        </div>
      )}
    />
  )
}

export interface DriverListItem {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  status?: string
  [key: string]: any
}

export interface DrilldownDriverListProps {
  drivers: DriverListItem[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  variant?: 'default' | 'compact' | 'cards' | 'striped'
  showStatus?: boolean
}

/**
 * Pre-configured drilldown list for drivers
 */
export function DrilldownDriverList({
  drivers,
  loading,
  emptyMessage = 'No drivers found',
  className,
  variant = 'default',
  showStatus = true,
}: DrilldownDriverListProps) {
  return (
    <DrilldownList
      items={drivers}
      recordType="driver"
      getRecordId={(d) => d.id}
      getRecordLabel={(d) =>
        d.name || (d.firstName && d.lastName ? `${d.firstName} ${d.lastName}` : `Driver ${d.id}`)
      }
      getRecordData={(d) => ({ driverId: d.id })}
      loading={loading}
      emptyMessage={emptyMessage}
      className={className}
      variant={variant}
      renderItem={(driver) => (
        <div className="flex items-center justify-between">
          <div className="font-medium">
            {driver.name ||
              (driver.firstName && driver.lastName
                ? `${driver.firstName} ${driver.lastName}`
                : `Driver ${driver.id}`)}
          </div>
          {showStatus && driver.status && (
            <span
              className={cn(
                'px-2 py-1 text-xs rounded-full',
                driver.status === 'on-duty' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                driver.status === 'off-duty' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-600',
                driver.status === 'driving' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-700'
              )}
            >
              {driver.status}
            </span>
          )}
        </div>
      )}
    />
  )
}

export interface WorkOrderListItem {
  id: string
  title?: string
  number?: string
  status?: string
  priority?: string
  [key: string]: any
}

export interface DrilldownWorkOrderListProps {
  workOrders: WorkOrderListItem[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  variant?: 'default' | 'compact' | 'cards' | 'striped'
  showStatus?: boolean
  showPriority?: boolean
}

/**
 * Pre-configured drilldown list for work orders
 */
export function DrilldownWorkOrderList({
  workOrders,
  loading,
  emptyMessage = 'No work orders found',
  className,
  variant = 'default',
  showStatus = true,
  showPriority = true,
}: DrilldownWorkOrderListProps) {
  return (
    <DrilldownList
      items={workOrders}
      recordType="workOrder"
      getRecordId={(wo) => wo.id}
      getRecordLabel={(wo) => wo.title || wo.number || `WO-${wo.id}`}
      getRecordData={(wo) => ({ workOrderId: wo.id })}
      loading={loading}
      emptyMessage={emptyMessage}
      className={className}
      variant={variant}
      renderItem={(workOrder) => (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              {workOrder.title || workOrder.number || `WO-${workOrder.id}`}
            </div>
            {workOrder.number && workOrder.title && (
              <div className="text-sm text-muted-foreground">{workOrder.number}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showPriority && workOrder.priority && (
              <span
                className={cn(
                  'px-2 py-1 text-xs rounded-full',
                  workOrder.priority === 'high' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                  workOrder.priority === 'medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                  workOrder.priority === 'low' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                )}
              >
                {workOrder.priority}
              </span>
            )}
            {showStatus && workOrder.status && (
              <span
                className={cn(
                  'px-2 py-1 text-xs rounded-full',
                  workOrder.status === 'open' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-700',
                  workOrder.status === 'in-progress' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                  workOrder.status === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                  workOrder.status === 'cancelled' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-600'
                )}
              >
                {workOrder.status}
              </span>
            )}
          </div>
        </div>
      )}
    />
  )
}

export interface GenericRecordListItem {
  id: string
  name?: string
  title?: string
  label?: string
  description?: string
  status?: string
  [key: string]: any
}

export interface DrilldownRecordListProps {
  records: GenericRecordListItem[]
  recordType: string
  loading?: boolean
  emptyMessage?: string
  className?: string
  variant?: 'default' | 'compact' | 'cards' | 'striped'
  showStatus?: boolean
}

/**
 * Generic drilldown list for any record type
 */
export function DrilldownRecordList({
  records,
  recordType,
  loading,
  emptyMessage = 'No records found',
  className,
  variant = 'default',
  showStatus = true,
}: DrilldownRecordListProps) {
  return (
    <DrilldownList
      items={records}
      recordType={recordType}
      getRecordId={(r) => r.id}
      getRecordLabel={(r) => r.name || r.title || r.label || `${recordType} ${r.id}`}
      getRecordData={(r) => ({ [`${recordType}Id`]: r.id })}
      loading={loading}
      emptyMessage={emptyMessage}
      className={className}
      variant={variant}
      renderItem={(record) => (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              {record.name || record.title || record.label || `${recordType} ${record.id}`}
            </div>
            {record.description && (
              <div className="text-sm text-muted-foreground truncate max-w-xs">
                {record.description}
              </div>
            )}
          </div>
          {showStatus && record.status && (
            <span className="px-2 py-1 text-xs rounded-full bg-muted">
              {record.status}
            </span>
          )}
        </div>
      )}
    />
  )
}

export default DrilldownList
