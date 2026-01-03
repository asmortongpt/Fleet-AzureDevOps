/**
 * DrilldownDataElement - Universal wrapper for making any data element drilldown-enabled
 *
 * This component wraps any data element (text, badge, card, etc.) and makes it
 * clickable to drill down to the final record. It provides consistent styling,
 * accessibility, and behavior across all drilldown interactions.
 *
 * Usage:
 * ```tsx
 * // Simple text drilldown
 * <DrilldownDataElement
 *   recordType="vehicle"
 *   recordId="v-123"
 *   recordLabel="Vehicle #456"
 *   data={{ vehicleId: 'v-123' }}
 * >
 *   Vehicle #456
 * </DrilldownDataElement>
 *
 * // With custom styling
 * <DrilldownDataElement
 *   recordType="driver"
 *   recordId="d-789"
 *   recordLabel="John Smith"
 *   data={{ driverId: 'd-789' }}
 *   className="font-semibold text-primary"
 * >
 *   John Smith
 * </DrilldownDataElement>
 * ```
 */

import { ArrowRight, ExternalLink } from 'lucide-react'
import React, { forwardRef, ReactNode, MouseEvent, KeyboardEvent } from 'react'

import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

// Supported record types for drilldown navigation
export type DrilldownRecordType =
  // Core entities
  | 'vehicle'
  | 'driver'
  | 'workOrder'
  | 'work-order'
  | 'facility'
  | 'asset'
  | 'equipment'
  // Sub-entities
  | 'trip'
  | 'route'
  | 'task'
  | 'inspection'
  | 'incident'
  | 'alert'
  // Financial
  | 'invoice'
  | 'purchase-order'
  | 'vendor'
  | 'part'
  // Communication
  | 'message'
  | 'email'
  | 'notification'
  // Documents
  | 'document'
  | 'file'
  | 'report'
  // Custom/generic
  | 'record'
  | string

export interface DrilldownDataElementProps {
  /** Children to render as the clickable content */
  children: ReactNode
  /** Type of record being drilled into */
  recordType: DrilldownRecordType
  /** Unique identifier for the record */
  recordId: string | number
  /** Human-readable label for the drilldown breadcrumb */
  recordLabel: string
  /** Data payload to pass to the drilldown panel */
  data?: Record<string, any>
  /** Additional CSS classes */
  className?: string
  /** Show arrow indicator on hover */
  showArrow?: boolean
  /** Show external link icon (for records that open in new context) */
  showExternalIcon?: boolean
  /** Disable the drilldown interaction */
  disabled?: boolean
  /** Custom onClick handler (called before drilldown) */
  onClick?: (e: MouseEvent<HTMLSpanElement>) => void
  /** Render as block element instead of inline */
  block?: boolean
  /** Visual variant */
  variant?: 'default' | 'link' | 'subtle' | 'badge'
  /** Tooltip text */
  title?: string
}

/**
 * Maps record types to their drilldown type identifiers
 */
function getdrilldownType(recordType: DrilldownRecordType): string {
  const typeMap: Record<string, string> = {
    'work-order': 'workOrder',
    'purchase-order': 'purchase-orders',
    'record': 'record-detail',
  }
  return typeMap[recordType] || recordType
}

/**
 * Builds the data payload with appropriate ID field names
 */
function buildDataPayload(
  recordType: DrilldownRecordType,
  recordId: string | number,
  additionalData?: Record<string, any>
): Record<string, any> {
  const idField = `${recordType.replace(/-/g, '')}Id`
  return {
    [idField]: recordId,
    id: recordId,
    ...additionalData,
  }
}

export const DrilldownDataElement = forwardRef<HTMLSpanElement, DrilldownDataElementProps>(
  (
    {
      children,
      recordType,
      recordId,
      recordLabel,
      data,
      className,
      showArrow = false,
      showExternalIcon = false,
      disabled = false,
      onClick,
      block = false,
      variant = 'default',
      title,
    },
    ref
  ) => {
    const { push } = useDrilldown()

    const handleClick = (e: MouseEvent<HTMLSpanElement>) => {
      if (disabled) return

      // Call custom onClick if provided
      onClick?.(e)

      // Prevent event bubbling
      e.stopPropagation()

      // Push drilldown level
      push({
        id: `${recordType}-${recordId}`,
        type: getdrilldownType(recordType),
        label: recordLabel,
        data: buildDataPayload(recordType, recordId, data),
      })
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
      if (disabled) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick(e as unknown as MouseEvent<HTMLSpanElement>)
      }
    }

    const variantClasses = {
      default: 'hover:text-primary hover:underline',
      link: 'text-primary hover:underline underline-offset-2',
      subtle: 'hover:bg-muted/50 rounded px-1 -mx-1',
      badge: 'bg-muted hover:bg-muted/80 rounded-full px-2 py-0.5 text-sm',
    }

    return (
      <span
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        title={title || `View ${recordLabel}`}
        aria-label={`Drill down to ${recordLabel}`}
        aria-disabled={disabled}
        className={cn(
          'cursor-pointer transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded',
          block ? 'block' : 'inline-flex items-center gap-1',
          variantClasses[variant],
          disabled && 'cursor-not-allowed opacity-50 pointer-events-none',
          className
        )}
      >
        {children}
        {showArrow && !disabled && (
          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        {showExternalIcon && !disabled && (
          <ExternalLink className="w-3 h-3 opacity-50" />
        )}
      </span>
    )
  }
)

DrilldownDataElement.displayName = 'DrilldownDataElement'

// ============================================================================
// SPECIALIZED VARIANTS
// ============================================================================

export interface VehicleDrilldownProps {
  vehicleId: string
  vehicleNumber?: string
  vehicleName?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for vehicles
 */
export function VehicleDrilldown({
  vehicleId,
  vehicleNumber,
  vehicleName,
  children,
  className,
}: VehicleDrilldownProps) {
  const label = vehicleName || vehicleNumber || `Vehicle ${vehicleId}`
  return (
    <DrilldownDataElement
      recordType="vehicle"
      recordId={vehicleId}
      recordLabel={label}
      data={{ vehicleId, vehicleNumber, vehicleName }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface DriverDrilldownProps {
  driverId: string
  driverName?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for drivers
 */
export function DriverDrilldown({
  driverId,
  driverName,
  children,
  className,
}: DriverDrilldownProps) {
  const label = driverName || `Driver ${driverId}`
  return (
    <DrilldownDataElement
      recordType="driver"
      recordId={driverId}
      recordLabel={label}
      data={{ driverId, driverName }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface WorkOrderDrilldownProps {
  workOrderId: string
  workOrderNumber?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for work orders
 */
export function WorkOrderDrilldown({
  workOrderId,
  workOrderNumber,
  children,
  className,
}: WorkOrderDrilldownProps) {
  const label = workOrderNumber || `WO-${workOrderId}`
  return (
    <DrilldownDataElement
      recordType="workOrder"
      recordId={workOrderId}
      recordLabel={label}
      data={{ workOrderId, workOrderNumber }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface FacilityDrilldownProps {
  facilityId: string
  facilityName?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for facilities
 */
export function FacilityDrilldown({
  facilityId,
  facilityName,
  children,
  className,
}: FacilityDrilldownProps) {
  const label = facilityName || `Facility ${facilityId}`
  return (
    <DrilldownDataElement
      recordType="facility"
      recordId={facilityId}
      recordLabel={label}
      data={{ facilityId, facilityName }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface AssetDrilldownProps {
  assetId: string
  assetName?: string
  assetType?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for assets
 */
export function AssetDrilldown({
  assetId,
  assetName,
  assetType,
  children,
  className,
}: AssetDrilldownProps) {
  const label = assetName || `${assetType || 'Asset'} ${assetId}`
  return (
    <DrilldownDataElement
      recordType="asset"
      recordId={assetId}
      recordLabel={label}
      data={{ assetId, assetName, assetType }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface TripDrilldownProps {
  tripId: string
  tripLabel?: string
  vehicleId?: string
  driverId?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for trips
 */
export function TripDrilldown({
  tripId,
  tripLabel,
  vehicleId,
  driverId,
  children,
  className,
}: TripDrilldownProps) {
  const label = tripLabel || `Trip ${tripId}`
  return (
    <DrilldownDataElement
      recordType="trip"
      recordId={tripId}
      recordLabel={label}
      data={{ tripId, vehicleId, driverId }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface InvoiceDrilldownProps {
  invoiceId: string
  invoiceNumber?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for invoices
 */
export function InvoiceDrilldown({
  invoiceId,
  invoiceNumber,
  children,
  className,
}: InvoiceDrilldownProps) {
  const label = invoiceNumber || `Invoice ${invoiceId}`
  return (
    <DrilldownDataElement
      recordType="invoice"
      recordId={invoiceId}
      recordLabel={label}
      data={{ invoiceId, invoiceNumber }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface VendorDrilldownProps {
  vendorId: string
  vendorName?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for vendors
 */
export function VendorDrilldown({
  vendorId,
  vendorName,
  children,
  className,
}: VendorDrilldownProps) {
  const label = vendorName || `Vendor ${vendorId}`
  return (
    <DrilldownDataElement
      recordType="vendor"
      recordId={vendorId}
      recordLabel={label}
      data={{ vendorId, vendorName }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface IncidentDrilldownProps {
  incidentId: string
  incidentNumber?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for incidents
 */
export function IncidentDrilldown({
  incidentId,
  incidentNumber,
  children,
  className,
}: IncidentDrilldownProps) {
  const label = incidentNumber || `Incident ${incidentId}`
  return (
    <DrilldownDataElement
      recordType="incident"
      recordId={incidentId}
      recordLabel={label}
      data={{ incidentId, incidentNumber }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface RouteDrilldownProps {
  routeId: string
  routeName?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for routes
 */
export function RouteDrilldown({
  routeId,
  routeName,
  children,
  className,
}: RouteDrilldownProps) {
  const label = routeName || `Route ${routeId}`
  return (
    <DrilldownDataElement
      recordType="route"
      recordId={routeId}
      recordLabel={label}
      data={{ routeId, routeName }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface TaskDrilldownProps {
  taskId: string
  taskName?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for tasks
 */
export function TaskDrilldown({
  taskId,
  taskName,
  children,
  className,
}: TaskDrilldownProps) {
  const label = taskName || `Task ${taskId}`
  return (
    <DrilldownDataElement
      recordType="task"
      recordId={taskId}
      recordLabel={label}
      data={{ taskId, taskName }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface InspectionDrilldownProps {
  inspectionId: string
  inspectionNumber?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for inspections
 */
export function InspectionDrilldown({
  inspectionId,
  inspectionNumber,
  children,
  className,
}: InspectionDrilldownProps) {
  const label = inspectionNumber || `Inspection ${inspectionId}`
  return (
    <DrilldownDataElement
      recordType="inspection"
      recordId={inspectionId}
      recordLabel={label}
      data={{ inspectionId, inspectionNumber }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface PurchaseOrderDrilldownProps {
  purchaseOrderId: string
  purchaseOrderNumber?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for purchase orders
 */
export function PurchaseOrderDrilldown({
  purchaseOrderId,
  purchaseOrderNumber,
  children,
  className,
}: PurchaseOrderDrilldownProps) {
  const label = purchaseOrderNumber || `PO-${purchaseOrderId}`
  return (
    <DrilldownDataElement
      recordType="purchase-order"
      recordId={purchaseOrderId}
      recordLabel={label}
      data={{ purchaseOrderId, purchaseOrderNumber }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export interface PartDrilldownProps {
  partId: string
  partNumber?: string
  partName?: string
  children?: ReactNode
  className?: string
}

/**
 * Pre-configured drilldown element for parts
 */
export function PartDrilldown({
  partId,
  partNumber,
  partName,
  children,
  className,
}: PartDrilldownProps) {
  const label = partName || partNumber || `Part ${partId}`
  return (
    <DrilldownDataElement
      recordType="part"
      recordId={partId}
      recordLabel={label}
      data={{ partId, partNumber, partName }}
      className={className}
    >
      {children || label}
    </DrilldownDataElement>
  )
}

export default DrilldownDataElement
