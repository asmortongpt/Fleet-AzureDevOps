import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Package,
  Image as ImageIcon,
  ShieldAlert,
  CheckCircle2,
  Timer,
  Building2,
  Hash,
  FileSearch
} from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { swrFetcher } from '@/lib/fetcher'

interface WorkOrder {
  id: string
  title: string
  description: string
  status: string
  priority: string
  vehicleId?: string
  assignedTo?: string
  createdDate?: string
  dueDate?: string
  [key: string]: any
}

interface WorkOrderDetailViewProps {
  workOrder: WorkOrder
  onClose?: () => void
}

export function WorkOrderDetailView({ workOrder, onClose }: WorkOrderDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const workOrderId = workOrder.id

  const { data: workOrderResponse } = useSWR<any>(
    workOrderId ? `/api/work-orders/${workOrderId}` : null,
    swrFetcher
  )
  const { data: partsResponse } = useSWR<any[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/parts` : null,
    swrFetcher
  )
  const { data: laborResponse } = useSWR<any[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/labor` : null,
    swrFetcher
  )
  const { data: timelineResponse } = useSWR<any[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/timeline` : null,
    swrFetcher
  )
  const { data: documentsResponse } = useSWR<{ data: any[] }>(
    workOrderId ? `/api/documents?work_order_id=${workOrderId}` : null,
    swrFetcher
  )

  const workOrderDetails = (workOrderResponse?.data || workOrderResponse || workOrder) as WorkOrder
  const parts = Array.isArray(partsResponse) ? partsResponse : (partsResponse as any)?.data || []
  const labor = Array.isArray(laborResponse) ? laborResponse : (laborResponse as any)?.data || []
  const timeline = Array.isArray(timelineResponse) ? timelineResponse : (timelineResponse as any)?.data || []
  const documents = documentsResponse?.data || []

  const totals = useMemo(() => {
    const partsCost = parts.reduce((sum: number, p: any) => {
      const qty = Number(p.quantity ?? p.qty ?? 0)
      const unit = Number(p.unit_cost ?? p.unitCost ?? 0)
      const total = Number(p.total_cost ?? p.totalCost ?? 0)
      return sum + (total || qty * unit)
    }, 0)

    const laborCost = labor.reduce((sum: number, l: any) => {
      const hours = Number(l.hours ?? l.labor_hours ?? 0)
      const rate = Number(l.rate ?? l.hourly_rate ?? 0)
      const total = Number(l.total_cost ?? l.total ?? 0)
      return sum + (total || hours * rate)
    }, 0)

    const taxRate = Number(workOrderDetails.tax_rate ?? workOrderDetails.taxRate ?? 0)
    const tax = taxRate > 0 ? (partsCost + laborCost) * taxRate : 0
    const totalCost = partsCost + laborCost + tax

    return { partsCost, laborCost, taxRate, tax, totalCost }
  }, [parts, labor, workOrderDetails])

  const progress = useMemo(() => {
    const explicit = Number(workOrderDetails.completion_percent ?? workOrderDetails.progress ?? 0)
    if (Number.isFinite(explicit) && explicit > 0) return Math.min(100, Math.max(0, explicit))
    const status = (workOrderDetails.status || '').toLowerCase()
    if (status === 'completed') return 100
    if (status === 'in_progress' || status === 'in progress') return 60
    if (status === 'pending' || status === 'open') return 10
    if (status === 'cancelled') return 0
    return 0
  }, [workOrderDetails])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'in-progress':
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>
      case 'ordered':
        return <Badge variant="secondary"><Package className="w-3 h-3 mr-1" />Ordered</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />High Priority</Badge>
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500">Medium</Badge>
      default:
        return <Badge variant="secondary">Low</Badge>
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-4 h-4" />
              <div>
                <h1 className="text-sm font-bold">{workOrderDetails.title}</h1>
                <p className="text-orange-100">Work Order #{workOrderDetails.id}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <div>
                <p className="text-xs text-orange-200">Status</p>
                <p className="text-sm font-semibold">{workOrderDetails.status}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Priority</p>
                <p className="text-sm font-semibold">{workOrderDetails.priority}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Created</p>
                <p className="text-sm font-semibold">{workOrderDetails.createdDate || workOrderDetails.created_at || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Due Date</p>
                <p className="text-sm font-semibold">{workOrderDetails.dueDate || workOrderDetails.scheduled_end || 'N/A'}</p>
              </div>
              {workOrderDetails.category && (
                <div>
                  <p className="text-xs text-orange-200">Category</p>
                  <p className="text-sm font-semibold capitalize">{workOrderDetails.category.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {workOrderDetails.is_emergency && (
                <Badge variant="destructive" className="bg-red-600 text-white border-red-400 animate-pulse">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  EMERGENCY
                </Badge>
              )}
              {workOrderDetails.quality_check_passed != null && (
                <Badge variant={workOrderDetails.quality_check_passed ? 'default' : 'destructive'} className={workOrderDetails.quality_check_passed ? 'bg-green-600 text-white' : ''}>
                  {workOrderDetails.quality_check_passed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  QC {workOrderDetails.quality_check_passed ? 'Passed' : 'Failed'}
                </Badge>
              )}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-orange-700">
              <XCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parts">Parts</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="photos">Documents</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Work Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(workOrderDetails.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    {getPriorityBadge(workOrderDetails.priority)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-blue-800">
                      {workOrderDetails.vehicleId || workOrderDetails.vehicle_id || 'N/A'}
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium">
                      {workOrderDetails.assignedTo || workOrderDetails.assigned_to || 'Unassigned'}
                    </span>
                  </div>
                  {workOrderDetails.category && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <CategoryBadge category={workOrderDetails.category} />
                    </div>
                  )}
                  {workOrderDetails.subcategory && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subcategory:</span>
                      <span className="font-medium capitalize">{workOrderDetails.subcategory.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {workOrderDetails.facility_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />Facility:</span>
                      <span className="font-medium">{workOrderDetails.facility_id}</span>
                    </div>
                  )}
                  {workOrderDetails.bay_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" />Bay:</span>
                      <span className="font-medium">{workOrderDetails.bay_number}</span>
                    </div>
                  )}
                  {workOrderDetails.downtime_hours != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />Downtime:</span>
                      <span className="font-medium">{Number(workOrderDetails.downtime_hours).toFixed(1)} hours</span>
                    </div>
                  )}
                  {workOrderDetails.external_reference && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ext. Reference:</span>
                      <span className="font-medium font-mono text-xs">{workOrderDetails.external_reference}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parts:</span>
                    <span className="font-medium">${(Number(workOrderDetails.parts_cost) || totals.partsCost).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Labor:</span>
                    <span className="font-medium">${(Number(workOrderDetails.labor_cost) || totals.laborCost).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">
                      {totals.taxRate > 0 ? `${(totals.taxRate * 100).toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total:</span>
                    <span className="text-sm text-orange-600">${(Number(workOrderDetails.total_cost) || totals.totalCost).toFixed(2)}</span>
                  </div>
                  {/* Visual cost breakdown bar */}
                  {(Number(workOrderDetails.parts_cost) > 0 || Number(workOrderDetails.labor_cost) > 0) && (
                    <div className="pt-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(Number(workOrderDetails.total_cost) || totals.totalCost) > 0 ? ((Number(workOrderDetails.parts_cost) || totals.partsCost) / (Number(workOrderDetails.total_cost) || totals.totalCost) * 100) : 50}%` }}
                          title="Parts cost"
                        />
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${(Number(workOrderDetails.total_cost) || totals.totalCost) > 0 ? ((Number(workOrderDetails.labor_cost) || totals.laborCost) / (Number(workOrderDetails.total_cost) || totals.totalCost) * 100) : 50}%` }}
                          title="Labor cost"
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Parts</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Labor</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Estimated completion: {workOrderDetails.scheduled_end || workOrderDetails.dueDate || 'N/A'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{workOrderDetails.description}</p>
              </CardContent>
            </Card>

            {/* Root Cause & Resolution Notes */}
            {(workOrderDetails.root_cause || workOrderDetails.resolution_notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileSearch className="w-4 h-4" />
                    Diagnosis & Resolution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workOrderDetails.root_cause && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Root Cause</p>
                      <p className="text-sm bg-muted/50 rounded-md p-2">{workOrderDetails.root_cause}</p>
                    </div>
                  )}
                  {workOrderDetails.resolution_notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Resolution Notes</p>
                      <p className="text-sm bg-muted/50 rounded-md p-2">{workOrderDetails.resolution_notes}</p>
                    </div>
                  )}
                  {workOrderDetails.completed_at && (
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Completed At:</span>
                      <span className="font-medium">{new Date(workOrderDetails.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Parts */}
          <TabsContent value="parts">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Parts & Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {parts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No parts available.</div>
                  ) : (
                    parts.map((part: any) => (
                      <div key={part.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div>
                          <p className="font-medium">{part.name || part.part_name || 'Part'}</p>
                          <p className="text-xs text-muted-foreground">
                            {part.part_number || part.partNumber || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p>{part.quantity || part.qty || 0} × ${(part.unit_cost || part.unitCost || 0).toFixed(2)}</p>
                          <p className="font-medium">${(part.total_cost || part.totalCost || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labor */}
          <TabsContent value="labor">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Labor & Technicians
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {labor.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No labor entries available.</div>
                  ) : (
                    labor.map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div>
                          <p className="font-medium">{entry.technician_name || entry.technician || 'Technician'}</p>
                          <p className="text-xs text-muted-foreground">{entry.task_description || entry.task || 'Task'}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p>{entry.hours || 0} hrs × ${(entry.rate || 0).toFixed(2)}</p>
                          <p className="font-medium">${(entry.total || entry.total_cost || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeline.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No timeline events available.</div>
                  ) : (
                    timeline.map((event: any) => (
                      <div key={event.id || `${event.timestamp}-${event.description}`} className="flex gap-2">
                        <div className="w-2 h-2 mt-2 rounded-full bg-orange-500" />
                        <div>
                          <p className="text-sm font-medium">{event.description || event.event || 'Event'}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.timestamp || event.date || 'N/A'} {event.user_name ? `• ${event.user_name}` : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Work Order Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No documents available.</div>
                  ) : (
                    documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div>
                          <p className="font-medium">{doc.file_name || doc.name || 'Document'}</p>
                          <p className="text-xs text-muted-foreground">{doc.document_type || doc.type || 'file'}</p>
                        </div>
                        {doc.file_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noreferrer">Open</a>
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    preventive: 'bg-blue-100 text-blue-800 border-blue-200',
    corrective: 'bg-orange-100 text-orange-800 border-orange-200',
    inspection: 'bg-purple-100 text-purple-800 border-purple-200',
    body_work: 'bg-gray-100 text-gray-800 border-gray-200',
    electrical: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    tire_service: 'bg-green-100 text-green-800 border-green-200',
  }
  const colorClass = colorMap[category.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200'
  const label = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
