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
  Pencil,
  Save,
  X,
  Download,
  Plus,
  Minus,
} from 'lucide-react'
import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'
import { formatEnum } from '@/utils/format-enum'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format-helpers'

// ============================================================================
// SHARED UTILITIES
// ============================================================================

/** Generate a CSV download from an array of key-value rows */
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Generate a printable detail view and trigger browser print dialog */
function printDetailView(title: string, sections: { label: string; value: string }[]) {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return
  const rows = sections.map(s => `<tr><td style="padding:6px 12px;font-weight:600;white-space:nowrap">${s.label}</td><td style="padding:6px 12px">${s.value}</td></tr>`).join('')
  printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:system-ui,sans-serif;padding:40px}table{border-collapse:collapse;width:100%}tr:nth-child(even){background:#f5f5f5}h1{font-size:20px;margin-bottom:16px}@media print{body{padding:20px}}</style></head><body><h1>${title}</h1><table>${rows}</table></body></html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

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
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}
  const [editOpen, setEditOpen] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, string>>({})

  const asset = {
    id: assetId || data.assetId || data.id,
    name: data.assetName || data.name || `Asset ${assetId}`,
    type: data.assetType || data.type || 'Equipment',
    status: data.status || 'active',
    serialNumber: data.serialNumber || '—',
    manufacturer: data.manufacturer || '—',
    model: data.model || '—',
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
              value={asset.purchaseDate ? formatDate(asset.purchaseDate) : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="Warranty Expiry"
              value={asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
            <DetailRow
              label="Asset Value"
              value={asset.value ? formatCurrency(asset.value) : '-'}
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
          <Button variant="outline" size="sm" onClick={() => {
            setEditFields({
              name: asset.name || '',
              location: asset.location || '',
              assignedTo: asset.assignedTo || '',
              status: asset.status || 'active',
              notes: asset.notes || '',
            })
            setEditOpen(true)
          }}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit Asset
          </Button>
          <Button variant="outline" size="sm" onClick={() => push({ id: `asset-history-${asset.id}`, type: 'asset-history', label: `${asset.name} History`, data: { assetId: asset.id } })}>View History</Button>
          <Button variant="outline" size="sm" onClick={() => push({ id: 'work-order-create', type: 'work-order-create', label: 'Schedule Maintenance', data: { assetId: asset.id, createType: 'preventive' } })}>Schedule Maintenance</Button>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Asset: {asset.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="edit-asset-name">Name</Label>
                <Input id="edit-asset-name" value={editFields.name || ''} onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-asset-location">Location</Label>
                <Input id="edit-asset-location" value={editFields.location || ''} onChange={(e) => setEditFields(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-asset-assigned">Assigned To</Label>
                <Input id="edit-asset-assigned" value={editFields.assignedTo || ''} onChange={(e) => setEditFields(f => ({ ...f, assignedTo: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-asset-status">Status</Label>
                <Select value={editFields.status || 'active'} onValueChange={(v) => setEditFields(f => ({ ...f, status: v }))}>
                  <SelectTrigger id="edit-asset-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-asset-notes">Notes</Label>
                <Textarea id="edit-asset-notes" value={editFields.notes || ''} onChange={(e) => setEditFields(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}><X className="w-3 h-3 mr-1" />Cancel</Button>
              <Button onClick={() => {
                toast.success(`Asset "${editFields.name}" updated successfully`)
                setEditOpen(false)
              }}><Save className="w-3 h-3 mr-1" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}
  const [confirmPayOpen, setConfirmPayOpen] = useState(false)
  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null)

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
            <div className="text-sm font-bold mt-2">{formatCurrency(invoice.total)}</div>
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
              value={invoice.issueDate ? formatDate(invoice.issueDate) : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="Due Date"
              value={invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Amounts */}
        <DetailSection title="Amount Breakdown">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
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
          {(invoiceStatus || invoice.status) !== 'paid' && (
            <Button size="sm" onClick={() => setConfirmPayOpen(true)}>
              <DollarSign className="w-3 h-3 mr-1" />
              Mark as Paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            printDetailView(`Invoice ${invoice.number}`, [
              { label: 'Invoice Number', value: invoice.number },
              { label: 'Vendor', value: invoice.vendor },
              { label: 'Status', value: invoiceStatus || invoice.status },
              { label: 'Issue Date', value: invoice.issueDate ? formatDate(invoice.issueDate) : '-' },
              { label: 'Due Date', value: invoice.dueDate ? formatDate(invoice.dueDate) : '-' },
              { label: 'Subtotal', value: formatCurrency(invoice.amount) },
              { label: 'Tax', value: formatCurrency(invoice.tax) },
              { label: 'Total', value: formatCurrency(invoice.total) },
              { label: 'Description', value: invoice.description || '-' },
            ])
          }}>
            <Download className="w-3 h-3 mr-1" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => { if (invoice.vendorId) { push({ id: `vendor-${invoice.vendorId}`, type: 'vendor', label: invoice.vendor, data: { vendorId: invoice.vendorId } }) } else { toast.info('No vendor linked to this invoice') } }}>View Vendor</Button>
        </div>

        {/* Mark as Paid Confirmation Dialog */}
        <Dialog open={confirmPayOpen} onOpenChange={setConfirmPayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Mark invoice <strong>{invoice.number}</strong> ({formatCurrency(invoice.total)}) from <strong>{invoice.vendor}</strong> as paid?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmPayOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                setInvoiceStatus('paid')
                setConfirmPayOpen(false)
                toast.success(`Invoice ${invoice.number} marked as paid`)
              }}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  const [editOpen, setEditOpen] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, string>>({})

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
              value={route.startTime ? formatDateTime(route.startTime) : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="End Time"
              value={route.endTime ? formatDateTime(route.endTime) : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => push({ id: `route-map-${route.id}`, type: 'route-map', label: `${route.name} Map`, data: { routeId: route.id, startLocation: route.startLocation, endLocation: route.endLocation, stops: route.stops } })}>
            <MapPin className="w-3 h-3 mr-1" />
            View on Map
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setEditFields({
              name: route.name || '',
              startLocation: route.startLocation || '',
              endLocation: route.endLocation || '',
              status: route.status || 'active',
            })
            setEditOpen(true)
          }}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit Route
          </Button>
          <Button variant="outline" size="sm" onClick={() => push({ id: `route-stops-${route.id}`, type: 'route-stops', label: `${route.name} Stops`, data: { routeId: route.id, stops: route.stops } })}>View Stops</Button>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Route: {route.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="edit-route-name">Route Name</Label>
                <Input id="edit-route-name" value={editFields.name || ''} onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-route-start">Start Location</Label>
                <Input id="edit-route-start" value={editFields.startLocation || ''} onChange={(e) => setEditFields(f => ({ ...f, startLocation: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-route-end">End Location</Label>
                <Input id="edit-route-end" value={editFields.endLocation || ''} onChange={(e) => setEditFields(f => ({ ...f, endLocation: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-route-status">Status</Label>
                <Select value={editFields.status || 'active'} onValueChange={(v) => setEditFields(f => ({ ...f, status: v }))}>
                  <SelectTrigger id="edit-route-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}><X className="w-3 h-3 mr-1" />Cancel</Button>
              <Button onClick={() => {
                toast.success(`Route "${editFields.name}" updated successfully`)
                setEditOpen(false)
              }}><Save className="w-3 h-3 mr-1" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  const [editOpen, setEditOpen] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false)
  const [taskStatus, setTaskStatus] = useState<string | null>(null)

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
              value={task.dueDate ? formatDate(task.dueDate) : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="Created"
              value={task.createdAt ? formatDate(task.createdAt) : '-'}
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
          {(taskStatus || task.status) !== 'completed' && (
            <Button size="sm" onClick={() => setConfirmCompleteOpen(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Task
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            setEditFields({
              name: task.name || '',
              priority: task.priority || 'medium',
              status: task.status || 'pending',
              assignedTo: task.assignedTo || '',
              description: task.description || '',
            })
            setEditOpen(true)
          }}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit Task
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setNoteText(''); setNoteDialogOpen(true) }}>
            <Plus className="w-3 h-3 mr-1" />
            Add Note
          </Button>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task: {task.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="edit-task-name">Task Name</Label>
                <Input id="edit-task-name" value={editFields.name || ''} onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-task-assigned">Assigned To</Label>
                <Input id="edit-task-assigned" value={editFields.assignedTo || ''} onChange={(e) => setEditFields(f => ({ ...f, assignedTo: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-task-priority">Priority</Label>
                <Select value={editFields.priority || 'medium'} onValueChange={(v) => setEditFields(f => ({ ...f, priority: v }))}>
                  <SelectTrigger id="edit-task-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-task-status">Status</Label>
                <Select value={editFields.status || 'pending'} onValueChange={(v) => setEditFields(f => ({ ...f, status: v }))}>
                  <SelectTrigger id="edit-task-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-task-desc">Description</Label>
                <Textarea id="edit-task-desc" value={editFields.description || ''} onChange={(e) => setEditFields(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}><X className="w-3 h-3 mr-1" />Cancel</Button>
              <Button onClick={() => {
                toast.success(`Task "${editFields.name}" updated successfully`)
                setEditOpen(false)
              }}><Save className="w-3 h-3 mr-1" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Task Confirmation Dialog */}
        <Dialog open={confirmCompleteOpen} onOpenChange={setConfirmCompleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Task</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Mark task <strong>{task.name}</strong> as completed? This action indicates the task has been fully resolved.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmCompleteOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                setTaskStatus('completed')
                setConfirmCompleteOpen(false)
                toast.success(`Task "${task.name}" marked as complete`)
              }}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Note Dialog */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note to Task</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="task-note">Note</Label>
              <Textarea
                id="task-note"
                placeholder="Enter your note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!noteText.trim()) {
                  toast.error('Please enter a note')
                  return
                }
                setNoteDialogOpen(false)
                toast.success('Note added to task')
              }}>
                <Save className="w-3 h-3 mr-1" />
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [incidentNewStatus, setIncidentNewStatus] = useState('')
  const [incidentCurrentStatus, setIncidentCurrentStatus] = useState<string | null>(null)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [incidentNoteText, setIncidentNoteText] = useState('')

  const incident = {
    id: incidentId || data.incidentId || data.id,
    number: data.incidentNumber || data.number || `INC-${incidentId}`,
    type: data.type || '—',
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
            <p className="text-muted-foreground">{formatEnum(incident.type)}</p>
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
              value={incident.occurredAt ? formatDateTime(incident.occurredAt) : '-'}
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
              value={formatCurrency(incident.damageEstimate)}
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
          <Button variant="outline" size="sm" onClick={() => { setIncidentNewStatus(incidentCurrentStatus || incident.status); setStatusDialogOpen(true) }}>
            <Pencil className="w-3 h-3 mr-1" />
            Update Status
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setIncidentNoteText(''); setNotesDialogOpen(true) }}>
            <Plus className="w-3 h-3 mr-1" />
            Add Notes
          </Button>
          <Button variant="outline" size="sm" onClick={() => push({ id: `incident-docs-${incident.id}`, type: 'incident-documents', label: `${incident.number} Documents`, data: { incidentId: incident.id } })}>View Documents</Button>
        </div>

        {/* Update Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Incident Status</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="incident-status">Status</Label>
              <Select value={incidentNewStatus} onValueChange={setIncidentNewStatus}>
                <SelectTrigger id="incident-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                setIncidentCurrentStatus(incidentNewStatus)
                setStatusDialogOpen(false)
                toast.success(`Incident ${incident.number} status updated to ${formatEnum(incidentNewStatus)}`)
              }}>
                <Save className="w-3 h-3 mr-1" />
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Notes Dialog */}
        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Notes to Incident</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="incident-note">Notes</Label>
              <Textarea
                id="incident-note"
                placeholder="Enter notes about this incident..."
                value={incidentNoteText}
                onChange={(e) => setIncidentNoteText(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!incidentNoteText.trim()) {
                  toast.error('Please enter a note')
                  return
                }
                setNotesDialogOpen(false)
                toast.success('Notes added to incident record')
              }}>
                <Save className="w-3 h-3 mr-1" />
                Save Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}
  const [editOpen, setEditOpen] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, string>>({})

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
              value={formatCurrency(vendor.totalSpend)}
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
          <Button variant="outline" size="sm" onClick={() => {
            setEditFields({
              name: vendor.name || '',
              contactName: vendor.contactName || '',
              email: vendor.email || '',
              phone: vendor.phone || '',
              address: vendor.address || '',
              status: vendor.status || 'active',
            })
            setEditOpen(true)
          }}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit Vendor
          </Button>
          <Button variant="outline" size="sm" onClick={() => push({ id: `vendor-orders-${vendor.id}`, type: 'vendor-orders', label: `${vendor.name} Orders`, data: { vendorId: vendor.id } })}>View Orders</Button>
          <Button variant="outline" size="sm" onClick={() => push({ id: `vendor-invoices-${vendor.id}`, type: 'vendor-invoices', label: `${vendor.name} Invoices`, data: { vendorId: vendor.id } })}>View Invoices</Button>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Vendor: {vendor.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="edit-vendor-name">Vendor Name</Label>
                <Input id="edit-vendor-name" value={editFields.name || ''} onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-vendor-contact">Contact Name</Label>
                <Input id="edit-vendor-contact" value={editFields.contactName || ''} onChange={(e) => setEditFields(f => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-vendor-email">Email</Label>
                <Input id="edit-vendor-email" type="email" value={editFields.email || ''} onChange={(e) => setEditFields(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-vendor-phone">Phone</Label>
                <Input id="edit-vendor-phone" value={editFields.phone || ''} onChange={(e) => setEditFields(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-vendor-address">Address</Label>
                <Input id="edit-vendor-address" value={editFields.address || ''} onChange={(e) => setEditFields(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-vendor-status">Status</Label>
                <Select value={editFields.status || 'active'} onValueChange={(v) => setEditFields(f => ({ ...f, status: v }))}>
                  <SelectTrigger id="edit-vendor-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}><X className="w-3 h-3 mr-1" />Cancel</Button>
              <Button onClick={() => {
                toast.success(`Vendor "${editFields.name}" updated successfully`)
                setEditOpen(false)
              }}><Save className="w-3 h-3 mr-1" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  const [editOpen, setEditOpen] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [qtyDialogOpen, setQtyDialogOpen] = useState(false)
  const [qtyAdjustment, setQtyAdjustment] = useState(0)
  const [qtyReason, setQtyReason] = useState('')
  const [adjustedQty, setAdjustedQty] = useState<number | null>(null)

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
              value={formatCurrency(part.unitPrice)}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <DetailRow
              label="Total Value"
              value={formatCurrency(part.quantity * part.unitPrice)}
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
          <Button variant="outline" size="sm" onClick={() => {
            setEditFields({
              name: part.name || '',
              number: part.number || '',
              category: part.category || '',
              manufacturer: part.manufacturer || '',
              location: part.location || '',
              reorderLevel: String(part.reorderLevel || 0),
              unitPrice: String(part.unitPrice || 0),
            })
            setEditOpen(true)
          }}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit Part
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setQtyAdjustment(0); setQtyReason(''); setQtyDialogOpen(true) }}>
            <Plus className="w-3 h-3 mr-1" />
            Adjust Quantity
          </Button>
          <Button variant="outline" size="sm" onClick={() => push({ id: `po-create-${part.id}`, type: 'po-create', label: `PO for ${part.name}`, data: { partId: part.id, partName: part.name, vendorId: part.vendorId } })}>Create PO</Button>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Part: {part.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="edit-part-name">Part Name</Label>
                <Input id="edit-part-name" value={editFields.name || ''} onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-part-number">Part Number</Label>
                <Input id="edit-part-number" value={editFields.number || ''} onChange={(e) => setEditFields(f => ({ ...f, number: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-part-category">Category</Label>
                <Input id="edit-part-category" value={editFields.category || ''} onChange={(e) => setEditFields(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-part-manufacturer">Manufacturer</Label>
                <Input id="edit-part-manufacturer" value={editFields.manufacturer || ''} onChange={(e) => setEditFields(f => ({ ...f, manufacturer: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-part-location">Location</Label>
                <Input id="edit-part-location" value={editFields.location || ''} onChange={(e) => setEditFields(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-part-reorder">Reorder Level</Label>
                  <Input id="edit-part-reorder" type="number" value={editFields.reorderLevel || '0'} onChange={(e) => setEditFields(f => ({ ...f, reorderLevel: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="edit-part-price">Unit Price</Label>
                  <Input id="edit-part-price" type="number" step="0.01" value={editFields.unitPrice || '0'} onChange={(e) => setEditFields(f => ({ ...f, unitPrice: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}><X className="w-3 h-3 mr-1" />Cancel</Button>
              <Button onClick={() => {
                toast.success(`Part "${editFields.name}" updated successfully`)
                setEditOpen(false)
              }}><Save className="w-3 h-3 mr-1" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjust Quantity Dialog */}
        <Dialog open={qtyDialogOpen} onOpenChange={setQtyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Quantity: {part.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="text-sm text-muted-foreground">
                Current quantity: <strong>{adjustedQty ?? part.quantity}</strong>
              </div>
              <div>
                <Label htmlFor="qty-adjustment">Adjustment (+/-)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="sm" onClick={() => setQtyAdjustment(q => q - 1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    id="qty-adjustment"
                    type="number"
                    value={qtyAdjustment}
                    onChange={(e) => setQtyAdjustment(Number(e.target.value))}
                    className="w-24 text-center"
                  />
                  <Button variant="outline" size="sm" onClick={() => setQtyAdjustment(q => q + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="qty-reason">Reason</Label>
                <Select value={qtyReason} onValueChange={setQtyReason}>
                  <SelectTrigger id="qty-reason"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received Stock</SelectItem>
                    <SelectItem value="used">Used in Work Order</SelectItem>
                    <SelectItem value="damaged">Damaged/Defective</SelectItem>
                    <SelectItem value="returned">Returned to Vendor</SelectItem>
                    <SelectItem value="audit">Inventory Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm">
                New quantity: <strong>{(adjustedQty ?? part.quantity) + qtyAdjustment}</strong>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQtyDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (qtyAdjustment === 0) {
                  toast.error('Please enter a non-zero adjustment')
                  return
                }
                if (!qtyReason) {
                  toast.error('Please select a reason')
                  return
                }
                const newQty = (adjustedQty ?? part.quantity) + qtyAdjustment
                setAdjustedQty(newQty)
                setQtyDialogOpen(false)
                toast.success(`${part.name} quantity adjusted by ${qtyAdjustment > 0 ? '+' : ''}${qtyAdjustment} (now ${newQty})`)
              }}>
                <Save className="w-3 h-3 mr-1" />
                Apply Adjustment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  const [editOpen, setEditOpen] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [receiveConfirmOpen, setReceiveConfirmOpen] = useState(false)
  const [poCurrentStatus, setPoCurrentStatus] = useState<string | null>(null)

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
            <div className="text-sm font-bold mt-2">{formatCurrency(po.amount)}</div>
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
              value={po.orderDate ? formatDate(po.orderDate) : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="Expected Delivery"
              value={po.expectedDate ? formatDate(po.expectedDate) : '-'}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </DetailSection>

        {/* Items */}
        <DetailSection title={`Items (${po.items?.length || 0})`}>
          {po.items && po.items.length > 0 ? (
            <div className="space-y-2">
              {po.items.map((item: any) => (
                <div key={item.name || item.partName} className="flex justify-between p-2 bg-muted/30 rounded">
                  <span>{item.name || item.partName}</span>
                  <span className="text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
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
          <Button variant="outline" size="sm" onClick={() => {
            setEditFields({
              status: po.status || 'pending',
              notes: po.notes || '',
            })
            setEditOpen(true)
          }}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit PO
          </Button>
          {(poCurrentStatus || po.status) !== 'received' && (
            <Button variant="outline" size="sm" onClick={() => setReceiveConfirmOpen(true)}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Receive Items
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            printDetailView(`Purchase Order ${po.number}`, [
              { label: 'PO Number', value: po.number },
              { label: 'Vendor', value: po.vendor || '-' },
              { label: 'Status', value: poCurrentStatus || po.status },
              { label: 'Order Date', value: po.orderDate ? formatDate(po.orderDate) : '-' },
              { label: 'Expected Delivery', value: po.expectedDate ? formatDate(po.expectedDate) : '-' },
              { label: 'Amount', value: formatCurrency(po.amount) },
              { label: 'Items', value: po.items?.map((i: any) => `${i.name || i.partName} x${i.quantity}`).join(', ') || 'None' },
              { label: 'Notes', value: po.notes || '-' },
            ])
          }}>
            <Download className="w-3 h-3 mr-1" />
            Download PDF
          </Button>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit PO: {po.number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="edit-po-status">Status</Label>
                <Select value={editFields.status || 'pending'} onValueChange={(v) => setEditFields(f => ({ ...f, status: v }))}>
                  <SelectTrigger id="edit-po-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in-transit">In Transit</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-po-notes">Notes</Label>
                <Textarea id="edit-po-notes" value={editFields.notes || ''} onChange={(e) => setEditFields(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}><X className="w-3 h-3 mr-1" />Cancel</Button>
              <Button onClick={() => {
                toast.success(`Purchase Order "${po.number}" updated successfully`)
                setEditOpen(false)
              }}><Save className="w-3 h-3 mr-1" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receive Items Confirmation Dialog */}
        <Dialog open={receiveConfirmOpen} onOpenChange={setReceiveConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receive Items</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-2">
              <p className="text-sm text-muted-foreground">
                Confirm receipt of all items for <strong>{po.number}</strong> from <strong>{po.vendor}</strong>?
              </p>
              {po.items && po.items.length > 0 && (
                <div className="space-y-1">
                  {po.items.map((item: any) => (
                    <div key={item.name || item.partName} className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                      <span>{item.name || item.partName}</span>
                      <span className="text-muted-foreground">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReceiveConfirmOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                setPoCurrentStatus('received')
                setReceiveConfirmOpen(false)
                toast.success(`Items received for ${po.number}`)
              }}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Confirm Receipt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              value={`${formatNumber(trip.distance)} miles`}
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
              value={trip.startTime ? formatDateTime(trip.startTime) : '-'}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailRow
              label="End Time"
              value={trip.endTime ? formatDateTime(trip.endTime) : '-'}
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
          <Button variant="outline" size="sm" onClick={() => push({ id: `trip-map-${trip.id}`, type: 'trip-map', label: `${trip.name} Map`, data: { tripId: trip.id, startLocation: trip.startLocation, endLocation: trip.endLocation } })}>
            <MapPin className="w-3 h-3 mr-1" />
            View on Map
          </Button>
          <Button variant="outline" size="sm" onClick={() => push({ id: `trip-telemetry-${trip.id}`, type: 'trip-telemetry', label: 'Trip Telemetry', data: { tripId: trip.id } })}>View Telemetry</Button>
          <Button variant="outline" size="sm" onClick={() => {
            downloadCsv(`trip-${trip.id}-report.csv`, ['Field', 'Value'], [
              ['Trip ID', String(trip.id)],
              ['Trip Name', trip.name],
              ['Status', trip.status],
              ['Driver', trip.driver || '-'],
              ['Vehicle', trip.vehicle || '-'],
              ['Start', trip.startLocation || '-'],
              ['End', trip.endLocation || '-'],
              ['Start Time', trip.startTime ? formatDateTime(trip.startTime) : '-'],
              ['End Time', trip.endTime ? formatDateTime(trip.endTime) : '-'],
              ['Distance (miles)', String(trip.distance)],
              ['Duration (min)', String(trip.duration)],
              ['Fuel Used (gal)', trip.fuelUsed !== undefined ? trip.fuelUsed.toFixed(1) : '-'],
              ['Avg Speed (mph)', trip.avgSpeed ? String(trip.avgSpeed) : '-'],
              ['Max Speed (mph)', trip.maxSpeed ? String(trip.maxSpeed) : '-'],
            ])
            toast.success('Trip report downloaded')
          }}>
            <Download className="w-3 h-3 mr-1" />
            Download Report
          </Button>
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
              value={inspection.date ? formatDate(inspection.date) : '-'}
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
              {inspection.defects.map((defect: any) => (
                <div key={defect.description || defect} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
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
          <Button variant="outline" size="sm" onClick={() => push({ id: `inspection-form-${inspection.id}`, type: 'inspection-form', label: `${inspection.number} Form`, data: { inspectionId: inspection.id, type: inspection.type, defects: inspection.defects } })}>
            <FileText className="w-3 h-3 mr-1" />
            View Form
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            printDetailView(`Inspection ${inspection.number}`, [
              { label: 'Inspection #', value: inspection.number },
              { label: 'Type', value: inspection.type },
              { label: 'Status', value: inspection.status },
              { label: 'Result', value: inspection.result },
              { label: 'Date', value: inspection.date ? formatDate(inspection.date) : '-' },
              { label: 'Inspector', value: inspection.driver || '-' },
              { label: 'Vehicle', value: inspection.vehicle || '-' },
              { label: 'Defects', value: inspection.defects?.length ? inspection.defects.map((d: any) => d.description || d).join('; ') : 'None' },
              { label: 'Notes', value: inspection.notes || '-' },
            ])
          }}>
            <Download className="w-3 h-3 mr-1" />
            Download PDF
          </Button>
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
