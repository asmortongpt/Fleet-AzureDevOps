import {
  Wrench,
  Clock,
  Warning,
  CurrencyDollar,
  CalendarDots,
  CarProfile,
  ListChecks
} from '@phosphor-icons/react';
import React, { useState, useMemo } from 'react';

import { MaintenanceHubMap } from './MaintenanceHubMap';

import { MapFirstLayout } from '@/components/layout/MapFirstLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WorkOrderItem {
  id: string;
  vehicleUnit: string;
  vehicleId: string;
  type: 'scheduled' | 'active' | 'urgent' | 'completed';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  estimatedCost: number;
  estimatedTime: string;
  scheduledDate: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface VehicleMaintenanceHistory {
  vehicleId: string;
  vehicleUnit: string;
  totalWorkOrders: number;
  completedThisMonth: number;
  totalCostYTD: number;
  lastService: string;
  nextScheduled: string;
  status: 'good' | 'attention' | 'critical';
}

export function MaintenanceHub() {
  const [selectedTab, setSelectedTab] = useState<'queue' | 'history' | 'schedule'>('queue');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderItem | null>(null);

  // Sample work order queue
  const workOrders: WorkOrderItem[] = useMemo(() => [
    {
      id: 'WO-2025-001',
      vehicleUnit: 'Unit 45',
      vehicleId: 'V-45',
      type: 'active',
      description: 'Oil change and tire rotation',
      priority: 'medium',
      assignedTo: 'Mike Johnson',
      estimatedCost: 125.00,
      estimatedTime: '2 hours',
      scheduledDate: '2025-12-16 10:00 AM',
      location: {
        lat: 28.5383,
        lng: -81.3792,
        address: '123 Service Way, Orlando, FL'
      }
    },
    {
      id: 'WO-2025-002',
      vehicleUnit: 'Unit 23',
      vehicleId: 'V-23',
      type: 'urgent',
      description: 'Brake system repair - Safety critical',
      priority: 'critical',
      assignedTo: 'Sarah Williams',
      estimatedCost: 850.00,
      estimatedTime: '4 hours',
      scheduledDate: '2025-12-16 08:00 AM',
      location: {
        lat: 28.5500,
        lng: -81.3700,
        address: '456 Repair Blvd, Orlando, FL'
      }
    },
    {
      id: 'WO-2025-003',
      vehicleUnit: 'Unit 67',
      vehicleId: 'V-67',
      type: 'scheduled',
      description: 'Preventive maintenance inspection (PMI)',
      priority: 'medium',
      assignedTo: 'John Smith',
      estimatedCost: 200.00,
      estimatedTime: '3 hours',
      scheduledDate: '2025-12-17 09:00 AM',
      location: {
        lat: 28.5200,
        lng: -81.3900,
        address: '789 Fleet St, Orlando, FL'
      }
    },
    {
      id: 'WO-2025-004',
      vehicleUnit: 'Unit 89',
      vehicleId: 'V-89',
      type: 'scheduled',
      description: 'AC system service',
      priority: 'low',
      estimatedCost: 175.00,
      estimatedTime: '2.5 hours',
      scheduledDate: '2025-12-18 11:00 AM',
      location: {
        lat: 28.5383,
        lng: -81.3792,
        address: '123 Service Way, Orlando, FL'
      }
    }
  ], []);

  // Sample vehicle maintenance history
  const vehicleHistory: VehicleMaintenanceHistory[] = useMemo(() => [
    {
      vehicleId: 'V-45',
      vehicleUnit: 'Unit 45',
      totalWorkOrders: 24,
      completedThisMonth: 3,
      totalCostYTD: 4250.00,
      lastService: '2025-12-01',
      nextScheduled: '2025-12-16',
      status: 'good'
    },
    {
      vehicleId: 'V-23',
      vehicleUnit: 'Unit 23',
      totalWorkOrders: 31,
      completedThisMonth: 2,
      totalCostYTD: 6890.00,
      lastService: '2025-11-28',
      nextScheduled: '2025-12-16',
      status: 'attention'
    },
    {
      vehicleId: 'V-67',
      vehicleUnit: 'Unit 67',
      totalWorkOrders: 18,
      completedThisMonth: 1,
      totalCostYTD: 3120.00,
      lastService: '2025-12-05',
      nextScheduled: '2025-12-17',
      status: 'good'
    }
  ], []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeCount = workOrders.filter(wo => wo.type === 'active').length;
    const urgentCount = workOrders.filter(wo => wo.type === 'urgent').length;
    const scheduledCount = workOrders.filter(wo => wo.type === 'scheduled').length;
    const totalCost = workOrders.reduce((sum, wo) => sum + wo.estimatedCost, 0);

    return {
      activeCount,
      urgentCount,
      scheduledCount,
      totalCost
    };
  }, [workOrders]);

  const getWorkOrderBadgeVariant = (type: WorkOrderItem['type']): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'urgent': return 'destructive';
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: WorkOrderItem['priority']): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: VehicleMaintenanceHistory['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'attention': return 'default';
      case 'good': return 'secondary';
      default: return 'secondary';
    }
  };

  // Map component
  const mapComponent = (
    <MaintenanceHubMap
      workOrders={workOrders.map(wo => ({
        id: wo.id,
        vehicleId: wo.vehicleId,
        vehicleUnit: wo.vehicleUnit,
        type: wo.type,
        description: wo.description,
        location: wo.location,
        scheduledDate: wo.scheduledDate,
        estimatedCompletion: wo.estimatedTime
      }))}
      onWorkOrderClick={(workOrder) => {
        const fullWorkOrder = workOrders.find(wo => wo.id === workOrder.id);
        if (fullWorkOrder) {
          setSelectedWorkOrder(fullWorkOrder);
        }
      }}
      height="100%"
    />
  );

  // Side panel with metrics and work order queue
  const sidePanel = (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Maintenance Hub</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Service locations, work orders, and maintenance tracking
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{metrics.activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{metrics.urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDots className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{metrics.scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CurrencyDollar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Est. Cost</p>
                <p className="text-lg font-bold">${metrics.totalCost.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Order Queue Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Work Order Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {workOrders.slice(0, 5).map((wo) => (
                <div
                  key={wo.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedWorkOrder(wo)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-medium">{wo.id}</span>
                        <Badge variant={getWorkOrderBadgeVariant(wo.type)} className="text-xs">
                          {wo.type}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{wo.vehicleUnit}</p>
                      <p className="text-xs text-muted-foreground truncate">{wo.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {wo.estimatedTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <CurrencyDollar className="w-3 h-3" />
                          ${wo.estimatedCost.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  // Drawer content with detailed tabs
  const drawerContent = (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Work Order Queue Tab */}
        <TabsContent value="queue" className="space-y-3 mt-4">
          <div className="space-y-3">
            {workOrders.map((wo) => (
              <Card key={wo.id} className={selectedWorkOrder?.id === wo.id ? 'border-blue-500' : ''}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono font-semibold">{wo.id}</span>
                          <Badge variant={getWorkOrderBadgeVariant(wo.type)}>
                            {wo.type}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(wo.priority)}>
                            {wo.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{wo.vehicleUnit}</p>
                      </div>
                    </div>

                    <p className="text-sm">{wo.description}</p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
                        <p className="font-medium">{wo.scheduledDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                        <p className="font-medium">{wo.assignedTo || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Est. Time</p>
                        <p className="font-medium">{wo.estimatedTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Est. Cost</p>
                        <p className="font-medium">${wo.estimatedCost.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="text-xs">{wo.location.address}</p>
                    </div>

                    <Button className="w-full" size="sm">
                      View Full Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vehicle History Tab */}
        <TabsContent value="history" className="space-y-3 mt-4">
          {vehicleHistory.map((vh) => (
            <Card key={vh.vehicleId}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CarProfile className="w-5 h-5" />
                      <div>
                        <p className="font-semibold">{vh.vehicleUnit}</p>
                        <p className="text-xs text-muted-foreground">{vh.vehicleId}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(vh.status)}>
                      {vh.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Work Orders</p>
                      <p className="font-bold">{vh.totalWorkOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">This Month</p>
                      <p className="font-bold">{vh.completedThisMonth}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cost YTD</p>
                      <p className="font-bold">${vh.totalCostYTD.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Service</p>
                      <p className="font-medium">{vh.lastService}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Next Scheduled</p>
                    <p className="text-sm font-medium">{vh.nextScheduled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Maintenance Schedule Tab */}
        <TabsContent value="schedule" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upcoming Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workOrders
                  .filter(wo => wo.type === 'scheduled')
                  .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                  .map((wo) => (
                    <div key={wo.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <CalendarDots className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{wo.vehicleUnit}</p>
                        <p className="text-xs text-muted-foreground">{wo.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{wo.scheduledDate}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {wo.estimatedTime}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <MapFirstLayout
      mapComponent={mapComponent}
      sidePanel={sidePanel}
      drawerContent={drawerContent}
    />
  );
}
