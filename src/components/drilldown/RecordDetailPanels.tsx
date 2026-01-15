/**
 * RecordDetailPanels - Comprehensive detail panels for all record types
 *
 * These panels provide the final record detail view for drilldown navigation.
 * Each panel shows complete information about a specific record type.
 */

import {
  MapPin,
  Calendar,
  Clock,
  User,
  Package,
  FileText,
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Phone,
  Mail,
  Building,
  Route,
  Target,
  Activity,
} from 'lucide-react'
import React from 'react'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

interface DetailRowProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}

function DetailRow({ label, value, icon }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="mt-0.5 font-medium">{value || '-'}</div>
      </div>
    </div>
  )
}

interface DetailSectionProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

function DetailSection({ title, children, actions }: DetailSectionProps) {
  return (
    <Card className="mb-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <Badge className={cn('capitalize', variants[variant])}>{status}</Badge>
  )
}

// ============================================================================
// ASSET DETAIL PANEL
// ============================================================================

interface AssetDetailPanelProps {
  assetId?: string
}

export function AssetDetailPanel({ assetId }: AssetDetailPanelProps) {
  const { currentLevel } = useDrilldown()
  const data = currentLevel?.data || {}

  const asset = {
    id: assetId || data.assetId || data.id,
    name: data.assetName || data.name || `Asset ${assetId}`,
    type: data.assetType || data.type || 'Equipment',
    status: data.status || 'active',
    serialNumber: data.serialNumber || 'N/A',
    manufacturer: data.manufacturer || 'Unknown',
    model: data.model || 'Unknown',
    purchaseDate: data.purchaseDate,
    warrantyExpiry: data.warrantyExpiry,
    location: data.location || 'Main Facility',
    assignedTo: data.assignedTo,
    value: data.value,
    notes: data.notes,
    ...data,
  }

  const statusVariant =
    asset.status === 'active' ? 'success' :
    asset.status === 'maintenance' ? 'warning' :
    asset.status === 'retired' ? 'danger' : 'default'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{asset.name}</h2>
            <p className="text-muted-foreground">{asset.type}</p>
          </div>
          <StatusBadge status={asset.status} variant={statusVariant} />
        </div>

        <Separator />

        {/* Basic Info */}
        <DetailSection title="Asset Information">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Asset ID" value={asset.id} icon={<Package className="w-4 h-4" />} />
            <DetailRow label="Serial Number" value={asset.serialNumber} icon={<FileText className="w-4 h-4" />} />
            <DetailRow label="Manufacturer" value={asset.manufacturer} icon={<Building className="w-4 h-4" />} />
            <DetailRow label="Model" value={asset.model} icon={<Wrench className="w-4 h-4" />} />
          </div>
        </DetailSection>

        {/* Location & Assignment */}
        <DetailSection title="Location & Assignment">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Location" value={asset.location} icon={<MapPin className="w-4 h-4" />} />
            <DetailRow label="Assigned To" value={asset.assignedTo} icon={<User className="w-4 h-4" />} />
          </div>
        </DetailSection>

        {/* Dates & Value */}
        <DetailSection title="Purchase & Warranty">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow
              label="Purchase Date"
              value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="Warranty Expiry"
              value={asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
            <DetailRow
              label="Asset Value"
              value={asset.value ? `$${asset.value.toLocaleString()}` : '-'}
              icon={<DollarSign className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Notes */}
        {asset.notes && (
          <DetailSection title="Notes">
            <p className="text-sm text-muted-foreground">{asset.notes}</p>
          </DetailSection>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit Asset</Button>
          <Button variant="outline" size="sm">View History</Button>
          <Button variant="outline" size="sm">Schedule Maintenance</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// INVOICE DETAIL PANEL
// ============================================================================

interface InvoiceDetailPanelProps {
  invoiceId?: string
}

export function InvoiceDetailPanel({ invoiceId }: InvoiceDetailPanelProps) {
  const { currentLevel } = useDrilldown()
  const data = currentLevel?.data || {}

  const invoice = {
    id: invoiceId || data.invoiceId || data.id,
    number: data.invoiceNumber || data.number || `INV-${invoiceId}`,
    status: data.status || 'pending',
    vendor: data.vendor || data.vendorName || 'Unknown Vendor',
    vendorId: data.vendorId,
    amount: data.amount || 0,
    tax: data.tax || 0,
    total: data.total || data.amount || 0,
    dueDate: data.dueDate,
    issueDate: data.issueDate,
    paidDate: data.paidDate,
    description: data.description,
    lineItems: data.lineItems || [],
    ...data,
  }

  const statusVariant =
    invoice.status === 'paid' ? 'success' :
    invoice.status === 'overdue' ? 'danger' :
    invoice.status === 'pending' ? 'warning' : 'default'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{invoice.number}</h2>
            <p className="text-muted-foreground">{invoice.vendor}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={invoice.status} variant={statusVariant} />
            <div className="text-sm font-bold mt-2">${invoice.total.toLocaleString()}</div>
          </div>
        </div>

        <Separator />

        {/* Invoice Details */}
        <DetailSection title="Invoice Details">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Invoice Number" value={invoice.number} icon={<FileText className="w-4 h-4" />} />
            <DetailRow label="Vendor" value={invoice.vendor} icon={<Building className="w-4 h-4" />} />
            <DetailRow
              label="Issue Date"
              value={invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="Due Date"
              value={invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Amounts */}
        <DetailSection title="Amount Breakdown">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${invoice.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${invoice.tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </DetailSection>

        {/* Description */}
        {invoice.description && (
          <DetailSection title="Description">
            <p className="text-sm text-muted-foreground">{invoice.description}</p>
          </DetailSection>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm">Mark as Paid</Button>
          <Button variant="outline" size="sm">Download PDF</Button>
          <Button variant="outline" size="sm">View Vendor</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// ROUTE DETAIL PANEL
// ============================================================================

interface RouteDetailPanelProps {
  routeId?: string
}

export function RouteDetailPanel({ routeId }: RouteDetailPanelProps) {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const route = {
    id: routeId || data.routeId || data.id,
    name: data.routeName || data.name || `Route ${routeId}`,
    status: data.status || 'active',
    driver: data.driver || data.driverName,
    driverId: data.driverId,
    vehicle: data.vehicle || data.vehicleName,
    vehicleId: data.vehicleId,
    startLocation: data.startLocation || 'Origin',
    endLocation: data.endLocation || 'Destination',
    distance: data.distance || 0,
    estimatedTime: data.estimatedTime || 0,
    stops: data.stops || [],
    startTime: data.startTime,
    endTime: data.endTime,
    ...data,
  }

  const statusVariant =
    route.status === 'completed' ? 'success' :
    route.status === 'in-progress' ? 'info' :
    route.status === 'delayed' ? 'warning' : 'default'

  const handleVehicleDrilldown = () => {
    if (route.vehicleId) {
      push({
        id: `vehicle-${route.vehicleId}`,
        type: 'vehicle',
        label: route.vehicle,
        data: { vehicleId: route.vehicleId },
      })
    }
  }

  const handleDriverDrilldown = () => {
    if (route.driverId) {
      push({
        id: `driver-${route.driverId}`,
        type: 'driver',
        label: route.driver,
        data: { driverId: route.driverId },
      })
    }
  }

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{route.name}</h2>
            <p className="text-muted-foreground">
              {route.startLocation} → {route.endLocation}
            </p>
          </div>
          <StatusBadge status={route.status} variant={statusVariant} />
        </div>

        <Separator />

        {/* Route Details */}
        <DetailSection title="Route Information">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Route ID" value={route.id} icon={<Route className="w-4 h-4" />} />
            <DetailRow
              label="Distance"
              value={`${route.distance} miles`}
              icon={<MapPin className="w-4 h-4" />}
            />
            <DetailRow
              label="Est. Time"
              value={`${Math.floor(route.estimatedTime / 60)}h ${route.estimatedTime % 60}m`}
              icon={<Clock className="w-4 h-4" />}
            />
            <DetailRow
              label="Stops"
              value={route.stops?.length || 0}
              icon={<Target className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Assignment */}
        <DetailSection title="Assignment">
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(route.driverId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={handleDriverDrilldown}
            >
              <DetailRow label="Driver" value={route.driver} icon={<User className="w-4 h-4" />} />
            </div>
            <div
              className={cn(route.vehicleId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={handleVehicleDrilldown}
            >
              <DetailRow label="Vehicle" value={route.vehicle} icon={<Truck className="w-4 h-4" />} />
            </div>
          </div>
        </DetailSection>

        {/* Timing */}
        <DetailSection title="Schedule">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow
              label="Start Time"
              value={route.startTime ? new Date(route.startTime).toLocaleString() : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="End Time"
              value={route.endTime ? new Date(route.endTime).toLocaleString() : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">View on Map</Button>
          <Button variant="outline" size="sm">Edit Route</Button>
          <Button variant="outline" size="sm">View Stops</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// TASK DETAIL PANEL
// ============================================================================

interface TaskDetailPanelProps {
  taskId?: string
}

export function TaskDetailPanel({ taskId }: TaskDetailPanelProps) {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const task = {
    id: taskId || data.taskId || data.id,
    name: data.taskName || data.name || data.title || `Task ${taskId}`,
    status: data.status || 'pending',
    priority: data.priority || 'medium',
    assignedTo: data.assignedTo,
    assignedToId: data.assignedToId,
    dueDate: data.dueDate,
    completedDate: data.completedDate,
    description: data.description,
    vehicle: data.vehicle || data.vehicleName,
    vehicleId: data.vehicleId,
    createdAt: data.createdAt,
    notes: data.notes,
    ...data,
  }

  const statusVariant =
    task.status === 'completed' ? 'success' :
    task.status === 'in-progress' ? 'info' :
    task.status === 'overdue' ? 'danger' : 'warning'

  const priorityVariant =
    task.priority === 'high' ? 'danger' :
    task.priority === 'medium' ? 'warning' : 'default'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{task.name}</h2>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={task.status} variant={statusVariant} />
              <StatusBadge status={`${task.priority} priority`} variant={priorityVariant} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Task Details */}
        <DetailSection title="Task Information">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Task ID" value={task.id} icon={<Target className="w-4 h-4" />} />
            <DetailRow label="Assigned To" value={task.assignedTo} icon={<User className="w-4 h-4" />} />
            <DetailRow
              label="Due Date"
              value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="Created"
              value={task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Related Vehicle */}
        {task.vehicle && (
          <DetailSection title="Related Vehicle">
            <div
              className={cn(task.vehicleId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (task.vehicleId) {
                  push({
                    id: `vehicle-${task.vehicleId}`,
                    type: 'vehicle',
                    label: task.vehicle,
                    data: { vehicleId: task.vehicleId },
                  })
                }
              }}
            >
              <DetailRow label="Vehicle" value={task.vehicle} icon={<Truck className="w-4 h-4" />} />
            </div>
          </DetailSection>
        )}

        {/* Description */}
        {task.description && (
          <DetailSection title="Description">
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </DetailSection>
        )}

        {/* Notes */}
        {task.notes && (
          <DetailSection title="Notes">
            <p className="text-sm text-muted-foreground">{task.notes}</p>
          </DetailSection>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {task.status !== 'completed' && (
            <Button size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Task
            </Button>
          )}
          <Button variant="outline" size="sm">Edit Task</Button>
          <Button variant="outline" size="sm">Add Note</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// INCIDENT DETAIL PANEL
// ============================================================================

interface IncidentDetailPanelProps {
  incidentId?: string
}

export function IncidentDetailPanel({ incidentId }: IncidentDetailPanelProps) {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const incident = {
    id: incidentId || data.incidentId || data.id,
    number: data.incidentNumber || data.number || `INC-${incidentId}`,
    type: data.type || 'Unknown',
    status: data.status || 'open',
    severity: data.severity || 'medium',
    driver: data.driver || data.driverName,
    driverId: data.driverId,
    vehicle: data.vehicle || data.vehicleName,
    vehicleId: data.vehicleId,
    location: data.location,
    occurredAt: data.occurredAt || data.date,
    reportedAt: data.reportedAt,
    description: data.description,
    injuries: data.injuries || false,
    damageEstimate: data.damageEstimate,
    ...data,
  }

  const statusVariant =
    incident.status === 'closed' ? 'success' :
    incident.status === 'under-review' ? 'warning' : 'danger'

  const severityVariant =
    incident.severity === 'critical' ? 'danger' :
    incident.severity === 'high' ? 'warning' : 'default'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{incident.number}</h2>
            <p className="text-muted-foreground">{incident.type}</p>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={incident.status} variant={statusVariant} />
              <StatusBadge status={`${incident.severity} severity`} variant={severityVariant} />
            </div>
          </div>
          {incident.injuries && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Injuries Reported
            </Badge>
          )}
        </div>

        <Separator />

        {/* Incident Details */}
        <DetailSection title="Incident Details">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Incident #" value={incident.number} icon={<AlertTriangle className="w-4 h-4" />} />
            <DetailRow label="Type" value={incident.type} icon={<Activity className="w-4 h-4" />} />
            <DetailRow
              label="Occurred"
              value={incident.occurredAt ? new Date(incident.occurredAt).toLocaleString() : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow label="Location" value={incident.location} icon={<MapPin className="w-4 h-4" />} />
          </div>
        </DetailSection>

        {/* Involved Parties */}
        <DetailSection title="Involved Parties">
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(incident.driverId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (incident.driverId) {
                  push({
                    id: `driver-${incident.driverId}`,
                    type: 'driver',
                    label: incident.driver,
                    data: { driverId: incident.driverId },
                  })
                }
              }}
            >
              <DetailRow label="Driver" value={incident.driver} icon={<User className="w-4 h-4" />} />
            </div>
            <div
              className={cn(incident.vehicleId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (incident.vehicleId) {
                  push({
                    id: `vehicle-${incident.vehicleId}`,
                    type: 'vehicle',
                    label: incident.vehicle,
                    data: { vehicleId: incident.vehicleId },
                  })
                }
              }}
            >
              <DetailRow label="Vehicle" value={incident.vehicle} icon={<Truck className="w-4 h-4" />} />
            </div>
          </div>
        </DetailSection>

        {/* Damage */}
        {incident.damageEstimate !== undefined && (
          <DetailSection title="Damage Assessment">
            <DetailRow
              label="Estimated Damage"
              value={`$${incident.damageEstimate.toLocaleString()}`}
              icon={<DollarSign className="w-4 h-4" />}
            />
          </DetailSection>
        )}

        {/* Description */}
        {incident.description && (
          <DetailSection title="Description">
            <p className="text-sm text-muted-foreground">{incident.description}</p>
          </DetailSection>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Update Status</Button>
          <Button variant="outline" size="sm">Add Notes</Button>
          <Button variant="outline" size="sm">View Documents</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// VENDOR DETAIL PANEL
// ============================================================================

interface VendorDetailPanelProps {
  vendorId?: string
}

export function VendorDetailPanel({ vendorId }: VendorDetailPanelProps) {
  const { currentLevel } = useDrilldown()
  const data = currentLevel?.data || {}

  const vendor = {
    id: vendorId || data.vendorId || data.id,
    name: data.vendorName || data.name || `Vendor ${vendorId}`,
    status: data.status || 'active',
    type: data.type || 'General',
    contactName: data.contactName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    rating: data.rating,
    totalSpend: data.totalSpend || 0,
    openOrders: data.openOrders || 0,
    ...data,
  }

  const statusVariant =
    vendor.status === 'active' ? 'success' :
    vendor.status === 'suspended' ? 'danger' : 'default'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{vendor.name}</h2>
            <p className="text-muted-foreground">{vendor.type}</p>
          </div>
          <StatusBadge status={vendor.status} variant={statusVariant} />
        </div>

        <Separator />

        {/* Vendor Details */}
        <DetailSection title="Vendor Information">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Vendor ID" value={vendor.id} icon={<Building className="w-4 h-4" />} />
            <DetailRow label="Type" value={vendor.type} icon={<Package className="w-4 h-4" />} />
            {vendor.rating && (
              <DetailRow label="Rating" value={`${vendor.rating}/5`} icon={<Activity className="w-4 h-4" />} />
            )}
          </div>
        </DetailSection>

        {/* Contact */}
        <DetailSection title="Contact Information">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Contact Name" value={vendor.contactName} icon={<User className="w-4 h-4" />} />
            <DetailRow label="Email" value={vendor.email} icon={<Mail className="w-4 h-4" />} />
            <DetailRow label="Phone" value={vendor.phone} icon={<Phone className="w-4 h-4" />} />
            <DetailRow label="Address" value={vendor.address} icon={<MapPin className="w-4 h-4" />} />
          </div>
        </DetailSection>

        {/* Financial Summary */}
        <DetailSection title="Financial Summary">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow
              label="Total Spend"
              value={`$${vendor.totalSpend.toLocaleString()}`}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <DetailRow
              label="Open Orders"
              value={vendor.openOrders}
              icon={<FileText className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit Vendor</Button>
          <Button variant="outline" size="sm">View Orders</Button>
          <Button variant="outline" size="sm">View Invoices</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// PART DETAIL PANEL
// ============================================================================

interface PartDetailPanelProps {
  partId?: string
}

export function PartDetailPanel({ partId }: PartDetailPanelProps) {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const part = {
    id: partId || data.partId || data.id,
    name: data.partName || data.name || `Part ${partId}`,
    number: data.partNumber || data.number,
    status: data.status || 'in-stock',
    category: data.category || 'General',
    manufacturer: data.manufacturer,
    quantity: data.quantity || 0,
    reorderLevel: data.reorderLevel || 0,
    unitPrice: data.unitPrice || 0,
    location: data.location || 'Warehouse A',
    vendor: data.vendor || data.vendorName,
    vendorId: data.vendorId,
    ...data,
  }

  const statusVariant =
    part.status === 'in-stock' ? 'success' :
    part.status === 'low-stock' ? 'warning' :
    part.status === 'out-of-stock' ? 'danger' : 'default'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{part.name}</h2>
            <p className="text-muted-foreground">{part.number}</p>
          </div>
          <StatusBadge status={part.status.replace('-', ' ')} variant={statusVariant} />
        </div>

        <Separator />

        {/* Part Details */}
        <DetailSection title="Part Information">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Part Number" value={part.number} icon={<Package className="w-4 h-4" />} />
            <DetailRow label="Category" value={part.category} icon={<FileText className="w-4 h-4" />} />
            <DetailRow label="Manufacturer" value={part.manufacturer} icon={<Building className="w-4 h-4" />} />
            <DetailRow label="Location" value={part.location} icon={<MapPin className="w-4 h-4" />} />
          </div>
        </DetailSection>

        {/* Inventory */}
        <DetailSection title="Inventory">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Quantity" value={part.quantity} icon={<Package className="w-4 h-4" />} />
            <DetailRow label="Reorder Level" value={part.reorderLevel} icon={<AlertTriangle className="w-4 h-4" />} />
            <DetailRow
              label="Unit Price"
              value={`$${part.unitPrice.toLocaleString()}`}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <DetailRow
              label="Total Value"
              value={`$${(part.quantity * part.unitPrice).toLocaleString()}`}
              icon={<DollarSign className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Supplier */}
        {part.vendor && (
          <DetailSection title="Supplier">
            <div
              className={cn(part.vendorId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (part.vendorId) {
                  push({
                    id: `vendor-${part.vendorId}`,
                    type: 'vendor',
                    label: part.vendor,
                    data: { vendorId: part.vendorId },
                  })
                }
              }}
            >
              <DetailRow label="Vendor" value={part.vendor} icon={<Building className="w-4 h-4" />} />
            </div>
          </DetailSection>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit Part</Button>
          <Button variant="outline" size="sm">Adjust Quantity</Button>
          <Button variant="outline" size="sm">Create PO</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// PURCHASE ORDER DETAIL PANEL
// ============================================================================

interface PurchaseOrderDetailPanelProps {
  purchaseOrderId?: string
}

export function PurchaseOrderDetailPanel({ purchaseOrderId }: PurchaseOrderDetailPanelProps) {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const po = {
    id: purchaseOrderId || data.purchaseOrderId || data.id,
    number: data.purchaseOrderNumber || data.number || `PO-${purchaseOrderId}`,
    status: data.status || 'pending',
    vendor: data.vendor || data.vendorName,
    vendorId: data.vendorId,
    amount: data.amount || 0,
    orderDate: data.orderDate,
    expectedDate: data.expectedDate,
    receivedDate: data.receivedDate,
    items: data.items || [],
    notes: data.notes,
    ...data,
  }

  const statusVariant =
    po.status === 'received' ? 'success' :
    po.status === 'in-transit' ? 'info' :
    po.status === 'pending' ? 'warning' : 'default'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{po.number}</h2>
            <p className="text-muted-foreground">{po.vendor}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={po.status} variant={statusVariant} />
            <div className="text-sm font-bold mt-2">${po.amount.toLocaleString()}</div>
          </div>
        </div>

        <Separator />

        {/* PO Details */}
        <DetailSection title="Purchase Order Details">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="PO Number" value={po.number} icon={<FileText className="w-4 h-4" />} />
            <div
              className={cn(po.vendorId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (po.vendorId) {
                  push({
                    id: `vendor-${po.vendorId}`,
                    type: 'vendor',
                    label: po.vendor,
                    data: { vendorId: po.vendorId },
                  })
                }
              }}
            >
              <DetailRow label="Vendor" value={po.vendor} icon={<Building className="w-4 h-4" />} />
            </div>
            <DetailRow
              label="Order Date"
              value={po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="Expected Delivery"
              value={po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Items */}
        <DetailSection title={`Items (${po.items?.length || 0})`}>
          {po.items && po.items.length > 0 ? (
            <div className="space-y-2">
              {po.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between p-2 bg-muted/30 rounded">
                  <span>{item.name || item.partName}</span>
                  <span className="text-muted-foreground">
                    {item.quantity} x ${item.unitPrice?.toLocaleString() || '0'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items</p>
          )}
        </DetailSection>

        {/* Notes */}
        {po.notes && (
          <DetailSection title="Notes">
            <p className="text-sm text-muted-foreground">{po.notes}</p>
          </DetailSection>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit PO</Button>
          <Button variant="outline" size="sm">Receive Items</Button>
          <Button variant="outline" size="sm">Download PDF</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// TRIP DETAIL PANEL
// ============================================================================

interface TripDetailPanelProps {
  tripId?: string
}

export function TripDetailPanel({ tripId }: TripDetailPanelProps) {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const trip = {
    id: tripId || data.tripId || data.id,
    name: data.tripLabel || data.name || `Trip ${tripId}`,
    status: data.status || 'completed',
    driver: data.driver || data.driverName,
    driverId: data.driverId,
    vehicle: data.vehicle || data.vehicleName,
    vehicleId: data.vehicleId,
    startLocation: data.startLocation || data.origin,
    endLocation: data.endLocation || data.destination,
    startTime: data.startTime,
    endTime: data.endTime,
    distance: data.distance || 0,
    duration: data.duration || 0,
    fuelUsed: data.fuelUsed,
    avgSpeed: data.avgSpeed,
    maxSpeed: data.maxSpeed,
    ...data,
  }

  const statusVariant =
    trip.status === 'completed' ? 'success' :
    trip.status === 'in-progress' ? 'info' : 'default'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{trip.name}</h2>
            <p className="text-muted-foreground">
              {trip.startLocation} → {trip.endLocation}
            </p>
          </div>
          <StatusBadge status={trip.status} variant={statusVariant} />
        </div>

        <Separator />

        {/* Trip Details */}
        <DetailSection title="Trip Information">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Trip ID" value={trip.id} icon={<Route className="w-4 h-4" />} />
            <DetailRow
              label="Distance"
              value={`${trip.distance.toLocaleString()} miles`}
              icon={<MapPin className="w-4 h-4" />}
            />
            <DetailRow
              label="Duration"
              value={`${Math.floor(trip.duration / 60)}h ${trip.duration % 60}m`}
              icon={<Clock className="w-4 h-4" />}
            />
            {trip.fuelUsed !== undefined && (
              <DetailRow
                label="Fuel Used"
                value={`${trip.fuelUsed.toFixed(1)} gal`}
                icon={<Activity className="w-4 h-4" />}
              />
            )}
          </div>
        </DetailSection>

        {/* Driver & Vehicle */}
        <DetailSection title="Driver & Vehicle">
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(trip.driverId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (trip.driverId) {
                  push({
                    id: `driver-${trip.driverId}`,
                    type: 'driver',
                    label: trip.driver,
                    data: { driverId: trip.driverId },
                  })
                }
              }}
            >
              <DetailRow label="Driver" value={trip.driver} icon={<User className="w-4 h-4" />} />
            </div>
            <div
              className={cn(trip.vehicleId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (trip.vehicleId) {
                  push({
                    id: `vehicle-${trip.vehicleId}`,
                    type: 'vehicle',
                    label: trip.vehicle,
                    data: { vehicleId: trip.vehicleId },
                  })
                }
              }}
            >
              <DetailRow label="Vehicle" value={trip.vehicle} icon={<Truck className="w-4 h-4" />} />
            </div>
          </div>
        </DetailSection>

        {/* Timing */}
        <DetailSection title="Schedule">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow
              label="Start Time"
              value={trip.startTime ? new Date(trip.startTime).toLocaleString() : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="End Time"
              value={trip.endTime ? new Date(trip.endTime).toLocaleString() : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Speed Stats */}
        {(trip.avgSpeed || trip.maxSpeed) && (
          <DetailSection title="Speed Statistics">
            <div className="grid grid-cols-2 gap-2">
              {trip.avgSpeed && (
                <DetailRow
                  label="Average Speed"
                  value={`${trip.avgSpeed} mph`}
                  icon={<Activity className="w-4 h-4" />}
                />
              )}
              {trip.maxSpeed && (
                <DetailRow
                  label="Max Speed"
                  value={`${trip.maxSpeed} mph`}
                  icon={<Activity className="w-4 h-4" />}
                />
              )}
            </div>
          </DetailSection>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">View on Map</Button>
          <Button variant="outline" size="sm">View Telemetry</Button>
          <Button variant="outline" size="sm">Download Report</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

// ============================================================================
// INSPECTION DETAIL PANEL
// ============================================================================

interface InspectionDetailPanelProps {
  inspectionId?: string
}

export function InspectionDetailPanel({ inspectionId }: InspectionDetailPanelProps) {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const inspection = {
    id: inspectionId || data.inspectionId || data.id,
    number: data.inspectionNumber || data.number || `INSP-${inspectionId}`,
    type: data.type || 'Pre-Trip',
    status: data.status || 'completed',
    result: data.result || 'pass',
    driver: data.driver || data.driverName,
    driverId: data.driverId,
    vehicle: data.vehicle || data.vehicleName,
    vehicleId: data.vehicleId,
    date: data.date || data.inspectionDate,
    notes: data.notes,
    defects: data.defects || [],
    ...data,
  }

  const statusVariant =
    inspection.status === 'completed' ? 'success' :
    inspection.status === 'pending' ? 'warning' : 'default'

  const resultVariant =
    inspection.result === 'pass' ? 'success' :
    inspection.result === 'fail' ? 'danger' : 'warning'

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold">{inspection.number}</h2>
            <p className="text-muted-foreground">{inspection.type} Inspection</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={inspection.status} variant={statusVariant} />
            <StatusBadge status={inspection.result} variant={resultVariant} />
          </div>
        </div>

        <Separator />

        {/* Inspection Details */}
        <DetailSection title="Inspection Details">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow label="Inspection #" value={inspection.number} icon={<FileText className="w-4 h-4" />} />
            <DetailRow label="Type" value={inspection.type} icon={<CheckCircle className="w-4 h-4" />} />
            <DetailRow
              label="Date"
              value={inspection.date ? new Date(inspection.date).toLocaleDateString() : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Driver & Vehicle */}
        <DetailSection title="Driver & Vehicle">
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(inspection.driverId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (inspection.driverId) {
                  push({
                    id: `driver-${inspection.driverId}`,
                    type: 'driver',
                    label: inspection.driver,
                    data: { driverId: inspection.driverId },
                  })
                }
              }}
            >
              <DetailRow label="Inspector" value={inspection.driver} icon={<User className="w-4 h-4" />} />
            </div>
            <div
              className={cn(inspection.vehicleId && 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2')}
              onClick={() => {
                if (inspection.vehicleId) {
                  push({
                    id: `vehicle-${inspection.vehicleId}`,
                    type: 'vehicle',
                    label: inspection.vehicle,
                    data: { vehicleId: inspection.vehicleId },
                  })
                }
              }}
            >
              <DetailRow label="Vehicle" value={inspection.vehicle} icon={<Truck className="w-4 h-4" />} />
            </div>
          </div>
        </DetailSection>

        {/* Defects */}
        {inspection.defects && inspection.defects.length > 0 && (
          <DetailSection title={`Defects Found (${inspection.defects.length})`}>
            <div className="space-y-2">
              {inspection.defects.map((defect: any, index: number) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  <span className="text-sm">{defect.description || defect}</span>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Notes */}
        {inspection.notes && (
          <DetailSection title="Notes">
            <p className="text-sm text-muted-foreground">{inspection.notes}</p>
          </DetailSection>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">View Form</Button>
          <Button variant="outline" size="sm">Download PDF</Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

export default {
  AssetDetailPanel,
  InvoiceDetailPanel,
  RouteDetailPanel,
  TaskDetailPanel,
  IncidentDetailPanel,
  VendorDetailPanel,
  PartDetailPanel,
  PurchaseOrderDetailPanel,
  TripDetailPanel,
  InspectionDetailPanel,
}
