import {
  Wrench, Clock, CheckCircle, XCircle,
  AlertTriangle, User, Package, Image as ImageIcon
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Mock comprehensive work order data
  const parts = [
    { id: '1', partNumber: 'BP-4523', name: 'Brake Pads - Front Set', quantity: 1, unitCost: 89.99, totalCost: 89.99, status: 'installed' },
    { id: '2', partNumber: 'BR-7821', name: 'Brake Rotors - Front Pair', quantity: 2, unitCost: 125.00, totalCost: 250.00, status: 'installed' },
    { id: '3', partNumber: 'BF-1105', name: 'Brake Fluid - DOT 4', quantity: 1, unitCost: 12.50, totalCost: 12.50, status: 'installed' },
    { id: '4', partNumber: 'GS-2240', name: 'Gasket Set', quantity: 1, unitCost: 24.99, totalCost: 24.99, status: 'ordered' }
  ];

  const labor = [
    { id: '1', task: 'Remove old brake pads and rotors', technician: 'Mike Johnson', hours: 1.5, rate: 85.00, total: 127.50, status: 'completed' },
    { id: '2', task: 'Install new brake pads and rotors', technician: 'Mike Johnson', hours: 1.0, rate: 85.00, total: 85.00, status: 'completed' },
    { id: '3', task: 'Brake system inspection and testing', technician: 'Mike Johnson', hours: 0.5, rate: 85.00, total: 42.50, status: 'completed' },
    { id: '4', task: 'Road test and final inspection', technician: 'Sarah Williams', hours: 0.5, rate: 95.00, total: 47.50, status: 'in-progress' }
  ];

  const timeline = [
    { date: '2025-12-15 08:00', event: 'Work order created', user: 'System', type: 'created' },
    { date: '2025-12-15 08:15', event: 'Assigned to Mike Johnson', user: 'Fleet Manager', type: 'assigned' },
    { date: '2025-12-15 09:00', event: 'Parts ordered', user: 'Mike Johnson', type: 'parts' },
    { date: '2025-12-15 14:30', event: 'Parts received', user: 'Inventory', type: 'parts' },
    { date: '2025-12-16 08:00', event: 'Work started', user: 'Mike Johnson', type: 'progress' },
    { date: '2025-12-16 12:00', event: 'Front brakes completed', user: 'Mike Johnson', type: 'progress' },
    { date: '2025-12-16 14:00', event: 'Quality inspection requested', user: 'Mike Johnson', type: 'inspection' }
  ];

  const photos = [
    { id: '1', url: '/placeholder-brake-before.jpg', caption: 'Worn brake pads - before', timestamp: '2025-12-15 09:00' },
    { id: '2', url: '/placeholder-rotor-damage.jpg', caption: 'Rotor damage assessment', timestamp: '2025-12-15 09:15' },
    { id: '3', url: '/placeholder-installation.jpg', caption: 'New parts installation', timestamp: '2025-12-16 10:30' },
    { id: '4', url: '/placeholder-completed.jpg', caption: 'Completed installation', timestamp: '2025-12-16 12:00' }
  ];

  const totals = {
    partsCost: parts.reduce((sum, p) => sum + p.totalCost, 0),
    laborCost: labor.reduce((sum, l) => sum + l.total, 0),
    tax: 0,
    totalCost: 0
  };
  totals.tax = (totals.partsCost + totals.laborCost) * 0.08;
  totals.totalCost = totals.partsCost + totals.laborCost + totals.tax;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'ordered':
        return <Badge variant="secondary"><Package className="w-3 h-3 mr-1" />Ordered</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">{workOrder.title}</h1>
                <p className="text-orange-100">Work Order #{workOrder.id}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div>
                <p className="text-xs text-orange-200">Status</p>
                <p className="text-lg font-semibold">{workOrder.status}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Priority</p>
                <p className="text-lg font-semibold">{workOrder.priority}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Created</p>
                <p className="text-lg font-semibold">{workOrder.createdDate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-orange-200">Due Date</p>
                <p className="text-lg font-semibold">{workOrder.dueDate || 'N/A'}</p>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-orange-700">
              <XCircle className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parts">Parts</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                      {workOrder.vehicleId || 'N/A'}
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium">{workOrder.assignedTo || 'Unassigned'}</span>
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
                    <span className="text-muted-foreground">Tax (8%):</span>
                    <span className="font-medium">${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total:</span>
                    <span className="text-lg text-orange-600">${totals.totalCost.toFixed(2)}</span>
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
                        <span className="font-medium">75%</span>
                      </div>
                      <Progress value={75} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Estimated completion: 2025-12-16 16:00
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
                  {parts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{part.name}</p>
                          {getStatusBadge(part.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">Part #: {part.partNumber} | Qty: {part.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${part.totalCost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">${part.unitCost} each</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between">
                  <span className="font-semibold">Total Parts Cost:</span>
                  <span className="text-xl font-bold text-orange-600">${totals.partsCost.toFixed(2)}</span>
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
                  {labor.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{item.task}</p>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{item.technician}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${item.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{item.hours}h × ${item.rate}/hr</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between">
                  <span className="font-semibold">Total Labor Cost:</span>
                  <span className="text-xl font-bold text-orange-600">${totals.laborCost.toFixed(2)}</span>
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
                <div className="relative space-y-4">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-orange-600 border-4 border-orange-200" />
                        {index < timeline.length - 1 && (
                          <div className="w-px h-full bg-orange-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">{event.event}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.date} • {event.user}
                        </p>
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
                <CardTitle>Work Order Photos</CardTitle>
                <CardDescription>{photos.length} photos attached</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="border rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium">{photo.caption}</p>
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
