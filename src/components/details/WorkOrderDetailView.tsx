import {
  Wrench, Clock, CheckCircle, XCircle,
  AlertTriangle, User, Package, Image as ImageIcon
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { secureFetch } from '@/hooks/use-api';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  vehicleId?: string;
  assignedTo?: string;
  createdDate?: string;
  dueDate?: string;
  [key: string]: any;
}

interface WorkOrderDetailViewProps {
  workOrder: WorkOrder;
  onClose?: () => void;
}

export function WorkOrderDetailView({ workOrder, onClose }: WorkOrderDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: parts = [] } = useQuery({
    queryKey: ['work-order', workOrder.id, 'parts'],
    queryFn: async () => {
      const response = await secureFetch(`/api/work-orders/${workOrder.id}/parts`)
      if (!response.ok) return []
      const payload = await response.json()
      return payload?.data ?? payload ?? []
    },
    enabled: !!workOrder.id
  })

  const { data: labor = [] } = useQuery({
    queryKey: ['work-order', workOrder.id, 'labor'],
    queryFn: async () => {
      const response = await secureFetch(`/api/work-orders/${workOrder.id}/labor`)
      if (!response.ok) return []
      const payload = await response.json()
      return payload?.data ?? payload ?? []
    },
    enabled: !!workOrder.id
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['work-order', workOrder.id, 'documents'],
    queryFn: async () => {
      const response = await secureFetch(`/api/documents?work_order_id=${workOrder.id}`)
      if (!response.ok) return []
      const payload = await response.json()
      return payload?.data ?? payload ?? []
    },
    enabled: !!workOrder.id
  })

  const photos = useMemo(() => {
    return documents
      .filter((doc: any) => (doc.mime_type || doc.type || '').startsWith('image'))
      .map((doc: any) => ({
        id: doc.id,
        url: doc.file_url || doc.storage_path || '#',
        caption: doc.description || doc.name || doc.title || 'Photo',
        timestamp: doc.created_at || doc.uploaded_at
      }))
  }, [documents])

  const totals = useMemo(() => {
    const partsCost = parts.reduce((sum: number, part: any) => {
      const qty = Number(part.quantity ?? 0)
      const unitCost = Number(part.unit_cost ?? part.unitCost ?? 0)
      const total = Number(part.total_cost ?? part.totalCost ?? (qty * unitCost))
      return sum + (Number.isFinite(total) ? total : 0)
    }, 0)
    const laborCost = labor.reduce((sum: number, entry: any) => {
      const hours = Number(entry.hours ?? 0)
      const rate = Number(entry.rate ?? 0)
      const total = Number(entry.total ?? entry.total_cost ?? (hours * rate))
      return sum + (Number.isFinite(total) ? total : 0)
    }, 0)
    const taxRate = Number((workOrder as any).taxRate || (workOrder as any).metadata?.taxRate || 0)
    const tax = Number.isFinite(taxRate) && taxRate > 0 ? (partsCost + laborCost) * (taxRate / 100) : 0
    const totalCost = partsCost + laborCost + tax
    return { partsCost, laborCost, tax, totalCost, taxRate }
  }, [parts, labor, workOrder])

  const normalizedParts = useMemo(() => {
    return parts.map((part: any) => {
      const qty = Number(part.quantity ?? 0)
      const unitCost = Number(part.unit_cost ?? part.unitCost ?? 0)
      const totalCost = Number(part.total_cost ?? part.totalCost ?? (qty * unitCost))
      return {
        id: part.id,
        name: part.name || part.part_name || part.part_number || part.sku || 'Part',
        partNumber: part.part_number || part.partNumber || part.sku || 'N/A',
        quantity: qty,
        unitCost,
        totalCost,
        status: part.status
      }
    })
  }, [parts])

  const normalizedLabor = useMemo(() => {
    return labor.map((entry: any) => {
      const hours = Number(entry.hours ?? 0)
      const rate = Number(entry.rate ?? 0)
      const total = Number(entry.total ?? entry.total_cost ?? (hours * rate))
      return {
        id: entry.id,
        task: entry.task || entry.description || 'Labor',
        technician: entry.technician_name || entry.technician || entry.user_name || 'Technician',
        hours,
        rate,
        total,
        status: entry.status,
        date: entry.date
      }
    })
  }, [labor])

  const timeline = useMemo(() => {
    const events: { date: string; event: string; user: string; type: string }[] = []
    const createdDate = workOrder.createdDate || (workOrder as any).created_at
    if (createdDate) {
      events.push({ date: createdDate, event: 'Work order created', user: 'System', type: 'created' })
    }
    const updatedDate = (workOrder as any).updated_at
    if (updatedDate) {
      events.push({ date: updatedDate, event: 'Work order updated', user: 'System', type: 'updated' })
    }
    parts.forEach((part: any) => {
      events.push({
        date: part.created_at || createdDate || new Date().toISOString(),
        event: `Part ${part.part_number || part.name} added`,
        user: part.user_name || 'Inventory',
        type: 'parts'
      })
    })
    labor.forEach((entry: any) => {
      events.push({
        date: entry.date || createdDate || new Date().toISOString(),
        event: `Labor recorded: ${entry.task || 'Work performed'}`,
        user: entry.technician_name || entry.technician || 'Technician',
        type: 'labor'
      })
    })
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [workOrder, parts, labor])

  const getStatusBadge = (status: string) => {
    const normalized = status === 'in_progress' ? 'in-progress' : status
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in-progress':
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'ordered':
        return <Badge variant="secondary"><Package className="w-3 h-3 mr-1" />Ordered</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{normalized}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />High Priority</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const createdAt = workOrder.createdDate || (workOrder as any).created_at
  const dueAt = workOrder.dueDate || (workOrder as any).scheduled_end || (workOrder as any).scheduled_end_date
  const vehicleLabel = workOrder.vehicleId || (workOrder as any).vehicle_id || 'N/A'
  const assignedToLabel = workOrder.assignedTo || (workOrder as any).assigned_to || (workOrder as any).assigned_technician_id || 'Unassigned'

  const statusProgress = (() => {
    const status = (workOrder.status || '').toLowerCase()
    if (status === 'completed') return 100
    if (status === 'in_progress' || status === 'in-progress') return 60
    if (status === 'on_hold') return 30
    if (status === 'cancelled') return 0
    return 10
  })()

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-4 h-4" />
              <div>
                <h1 className="text-sm font-bold">{workOrder.title}</h1>
                <p className="text-orange-100">Work Order #{workOrder.id}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <div>
                <p className="text-xs text-orange-200">Status</p>
                <p className="text-sm font-semibold">{workOrder.status}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Priority</p>
                <p className="text-sm font-semibold">{workOrder.priority}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Created</p>
                <p className="text-sm font-semibold">{createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Due Date</p>
                <p className="text-sm font-semibold">{dueAt ? new Date(dueAt).toLocaleString() : 'N/A'}</p>
              </div>
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
            <TabsTrigger value="photos">Photos</TabsTrigger>
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
                    {getStatusBadge(workOrder.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    {getPriorityBadge(workOrder.priority)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-blue-800">
                      {vehicleLabel}
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium">{assignedToLabel}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parts:</span>
                    <span className="font-medium">${totals.partsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Labor:</span>
                    <span className="font-medium">${totals.laborCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax {totals.taxRate ? `(${totals.taxRate}%)` : ''}:</span>
                    <span className="font-medium">${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total:</span>
                    <span className="text-sm text-orange-600">${totals.totalCost.toFixed(2)}</span>
                  </div>
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
                        <span className="font-medium">{statusProgress}%</span>
                      </div>
                      <Progress value={statusProgress} />
                    </div>
                    {dueAt && (
                      <div className="text-xs text-muted-foreground">
                        Estimated completion: {new Date(dueAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{workOrder.description}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parts */}
          <TabsContent value="parts">
            <Card>
              <CardHeader>
                <CardTitle>Parts Breakdown</CardTitle>
                <CardDescription>{parts.length} parts required</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {normalizedParts.length === 0 && (
                    <div className="text-sm text-muted-foreground">No parts recorded for this work order.</div>
                  )}
                  {normalizedParts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{part.name}</p>
                          {part.status && getStatusBadge(part.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">Part #: {part.partNumber} | Qty: {part.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${Number(part.totalCost || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">${Number(part.unitCost || 0).toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between">
                  <span className="font-semibold">Total Parts Cost:</span>
                  <span className="text-base font-bold text-orange-600">${totals.partsCost.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labor */}
          <TabsContent value="labor">
            <Card>
              <CardHeader>
                <CardTitle>Labor Breakdown</CardTitle>
                <CardDescription>{labor.length} labor items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {normalizedLabor.length === 0 && (
                    <div className="text-sm text-muted-foreground">No labor recorded for this work order.</div>
                  )}
                  {normalizedLabor.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{item.task}</p>
                            {item.status && getStatusBadge(item.status)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{item.technician}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${Number(item.total || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{item.hours}h × ${item.rate}/hr</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between">
                  <span className="font-semibold">Total Labor Cost:</span>
                  <span className="text-base font-bold text-orange-600">${totals.laborCost.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Work Order Timeline</CardTitle>
                <CardDescription>{timeline.length} events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-2">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-orange-600 border-4 border-orange-200" />
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-orange-200" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{event.event}</span>
                          <span className="text-muted-foreground">{event.date}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {event.user}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Documentation Photos</CardTitle>
                <CardDescription>{photos.length} photos uploaded</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {photos.length === 0 && (
                    <div className="text-sm text-muted-foreground">No photos uploaded for this work order.</div>
                  )}
                  {photos.map((photo) => (
                    <div key={photo.id} className="border rounded-lg overflow-hidden">
                      {photo.url && photo.url !== '#' ? (
                        <img src={photo.url} alt={photo.caption} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-12 h-9 text-gray-700" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium mb-1">{photo.caption}</p>
                        <p className="text-xs text-muted-foreground">{photo.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
