import {
  Wrench,
  Clock,
  Warning,
  CurrencyDollar,
  CalendarDots,
  CarProfile,
  ListChecks,
  ShieldCheck
} from '@phosphor-icons/react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { MaintenanceHubMap } from './MaintenanceHubMap';

import { DrilldownCard, DrilldownCardGrid } from '@/components/drilldown/DrilldownCard';
import { DrilldownDataTable, DrilldownColumn } from '@/components/drilldown/DrilldownDataTable';
import { MapFirstLayout } from '@/components/layout/MapFirstLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { usePolicies } from '@/contexts/PolicyContext';
import {
  enforceMaintenancePolicy,
  shouldBlockAction,
  getApprovalRequirements
} from '@/lib/policy-engine/policy-enforcement';

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
  const { getPoliciesByType, policies } = usePolicies()
  const maintenancePolicies = getPoliciesByType('maintenance')
  const activeMaintenancePolicies = maintenancePolicies.filter(p => p.status === 'active')
  const { push } = useDrilldown()

  const [selectedTab, setSelectedTab] = useState<'queue' | 'history' | 'schedule'>('queue');

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

  // Handler for creating new work orders with policy enforcement
  // Note: This is currently unused but kept for future policy enforcement integration
  const handleCreateWorkOrder = async (workOrder: WorkOrderItem) => {
    try {
      // Enforce maintenance policy before allowing work order creation
      const result = await enforceMaintenancePolicy(policies, {
        vehicleId: workOrder.vehicleId,
        type: workOrder.type,
        estimatedCost: workOrder.estimatedCost,
        priority: workOrder.priority,
        scheduledDate: workOrder.scheduledDate
      });

      // Check if action should be blocked
      if (shouldBlockAction(result)) {
        toast.error("Policy Violation", {
          description: "This work order cannot be created without resolving policy violations"
        });
        return;
      }

      // Check if approval is required
      const approvalReq = getApprovalRequirements(result);
      if (approvalReq.required) {
        toast.warning(`${approvalReq.level?.toUpperCase()} Approval Required`, {
          description: approvalReq.reason
        });
        // In real implementation, route to approval workflow
      }

      // If we reach here, either policy allows it or requires approval
      if (result.allowed) {
        toast.success("Work Order Created", {
          description: approvalReq.required
            ? "Work order submitted for approval"
            : "Work order created successfully"
        });
        // Proceed with work order creation
      }
    } catch {
      toast.error("Error", {
        description: "Failed to validate work order against policies"
      });
    }
  };

  // Suppress unused warning - this function is kept for future policy enforcement
  void handleCreateWorkOrder;

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
          // Trigger work order detail drilldown
          push({
            id: `work-order-detail-${fullWorkOrder.id}`,
            type: 'work-order-detail',
            label: `WO #${fullWorkOrder.id}`,
            data: {
              workOrderId: fullWorkOrder.id,
              workOrderNumber: fullWorkOrder.id,
              vehicleId: fullWorkOrder.vehicleId,
              vehicleUnit: fullWorkOrder.vehicleUnit,
              description: fullWorkOrder.description,
              priority: fullWorkOrder.priority,
              estimatedCost: fullWorkOrder.estimatedCost,
            },
          });
        }
      }}
      height="100%"
    />
  );

  // Side panel with metrics and work order queue
  const sidePanel = (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Maintenance Hub</h2>
          {activeMaintenancePolicies.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="w-3 h-3" />
              {activeMaintenancePolicies.length} Active {activeMaintenancePolicies.length === 1 ? 'Policy' : 'Policies'}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Service locations, work orders, and maintenance tracking
          {activeMaintenancePolicies.length > 0 && ` · Policy Engine: Active`}
        </p>
      </div>

      {/* Metrics Cards with Drilldown */}
      <DrilldownCardGrid columns={2} gap="sm">
        <DrilldownCard
          title="Active"
          value={metrics.activeCount}
          icon={<Wrench className="w-5 h-5" />}
          drilldownType="work-orders"
          drilldownLabel="Active Work Orders"
          drilldownData={{ status: 'in_progress' }}
          color="primary"
          variant="compact"
        />

        <DrilldownCard
          title="Urgent"
          value={metrics.urgentCount}
          icon={<Warning className="w-5 h-5" />}
          drilldownType="work-orders"
          drilldownLabel="Urgent Work Orders"
          drilldownData={{ priority: 'urgent' }}
          color="danger"
          variant="compact"
        />

        <DrilldownCard
          title="Scheduled"
          value={metrics.scheduledCount}
          icon={<CalendarDots className="w-5 h-5" />}
          drilldownType="work-orders"
          drilldownLabel="Scheduled Work Orders"
          drilldownData={{ status: 'scheduled' }}
          color="warning"
          variant="compact"
        />

        <DrilldownCard
          title="Est. Cost"
          value={`$${metrics.totalCost.toFixed(0)}`}
          icon={<CurrencyDollar className="w-5 h-5" />}
          drilldownType="garage-overview"
          drilldownLabel="Cost Overview"
          drilldownData={{ totalCost: metrics.totalCost }}
          color="success"
          variant="compact"
        />
      </DrilldownCardGrid>

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
                  role="button"
                  tabIndex={0}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onClick={() => {
                    push({
                      id: `work-order-detail-${wo.id}`,
                      type: 'work-order-detail',
                      label: `WO #${wo.id}`,
                      data: {
                        workOrderId: wo.id,
                        workOrderNumber: wo.id,
                        vehicleId: wo.vehicleId,
                        vehicleUnit: wo.vehicleUnit,
                        description: wo.description,
                        priority: wo.priority,
                        estimatedCost: wo.estimatedCost,
                      },
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      push({
                        id: `work-order-detail-${wo.id}`,
                        type: 'work-order-detail',
                        label: `WO #${wo.id}`,
                        data: {
                          workOrderId: wo.id,
                          workOrderNumber: wo.id,
                          vehicleId: wo.vehicleId,
                          vehicleUnit: wo.vehicleUnit,
                          description: wo.description,
                          priority: wo.priority,
                          estimatedCost: wo.estimatedCost,
                        },
                      });
                    }
                  }}
                  aria-label={`View work order ${wo.id}`}
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
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'queue' | 'history' | 'schedule')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Work Order Queue Tab */}
        <TabsContent value="queue" className="space-y-3 mt-4">
          <DrilldownDataTable
            data={workOrders}
            columns={[
              {
                key: 'id',
                header: 'WO #',
                sortable: true,
                render: (wo) => (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{wo.id}</span>
                    <Badge variant={getWorkOrderBadgeVariant(wo.type)} className="text-xs">
                      {wo.type}
                    </Badge>
                  </div>
                ),
              },
              {
                key: 'vehicleUnit',
                header: 'Vehicle',
                sortable: true,
                drilldown: {
                  recordType: 'vehicle',
                  getRecordId: (wo) => wo.vehicleId,
                  getRecordLabel: (wo) => wo.vehicleUnit,
                },
              },
              {
                key: 'description',
                header: 'Description',
                className: 'max-w-xs',
                render: (wo) => (
                  <div className="truncate" title={wo.description}>
                    {wo.description}
                  </div>
                ),
              },
              {
                key: 'priority',
                header: 'Priority',
                sortable: true,
                render: (wo) => (
                  <Badge variant={getPriorityBadgeVariant(wo.priority)} className="text-xs">
                    {wo.priority}
                  </Badge>
                ),
              },
              {
                key: 'estimatedTime',
                header: 'Est. Time',
                render: (wo) => (
                  <span className="text-sm text-muted-foreground">{wo.estimatedTime}</span>
                ),
              },
              {
                key: 'estimatedCost',
                header: 'Est. Cost',
                sortable: true,
                render: (wo) => (
                  <span className="font-medium">${wo.estimatedCost.toFixed(2)}</span>
                ),
              },
            ] as DrilldownColumn<WorkOrderItem>[]}
            recordType="work-order-detail"
            getRecordId={(wo) => wo.id}
            getRecordLabel={(wo) => `WO #${wo.id}`}
            getRecordData={(wo) => ({
              workOrderId: wo.id,
              workOrderNumber: wo.id,
              vehicleId: wo.vehicleId,
              vehicleUnit: wo.vehicleUnit,
              description: wo.description,
              priority: wo.priority,
              estimatedCost: wo.estimatedCost,
            })}
            compact
            striped
            emptyMessage="No work orders in queue"
          />
        </TabsContent>

        {/* Vehicle History Tab */}
        <TabsContent value="history" className="space-y-3 mt-4">
          <DrilldownDataTable
            data={vehicleHistory}
            columns={[
              {
                key: 'vehicleUnit',
                header: 'Vehicle',
                sortable: true,
                drilldown: {
                  recordType: 'vehicle-detail',
                  getRecordId: (vh) => vh.vehicleId,
                  getRecordLabel: (vh) => vh.vehicleUnit,
                },
                render: (vh) => (
                  <div className="flex items-center gap-2">
                    <CarProfile className="w-4 h-4" />
                    <span>{vh.vehicleUnit}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                sortable: true,
                render: (vh) => (
                  <Badge variant={getStatusBadgeVariant(vh.status)} className="text-xs">
                    {vh.status}
                  </Badge>
                ),
              },
              {
                key: 'totalWorkOrders',
                header: 'Total WOs',
                sortable: true,
                render: (vh) => (
                  <span className="font-medium">{vh.totalWorkOrders}</span>
                ),
              },
              {
                key: 'completedThisMonth',
                header: 'This Month',
                sortable: true,
                render: (vh) => (
                  <span className="text-muted-foreground">{vh.completedThisMonth}</span>
                ),
              },
              {
                key: 'totalCostYTD',
                header: 'Cost YTD',
                sortable: true,
                render: (vh) => (
                  <span className="font-medium">${vh.totalCostYTD.toLocaleString()}</span>
                ),
              },
              {
                key: 'lastService',
                header: 'Last Service',
                sortable: true,
                render: (vh) => (
                  <span className="text-sm">{vh.lastService}</span>
                ),
              },
              {
                key: 'nextScheduled',
                header: 'Next Scheduled',
                sortable: true,
                render: (vh) => (
                  <span className="text-sm font-medium">{vh.nextScheduled}</span>
                ),
              },
            ] as DrilldownColumn<VehicleMaintenanceHistory>[]}
            recordType="vehicle-detail"
            getRecordId={(vh) => vh.vehicleId}
            getRecordLabel={(vh) => vh.vehicleUnit}
            getRecordData={(vh) => ({
              vehicleId: vh.vehicleId,
              vehicleUnit: vh.vehicleUnit,
              maintenanceStatus: vh.status,
              totalWorkOrders: vh.totalWorkOrders,
              totalCostYTD: vh.totalCostYTD,
            })}
            compact
            striped
            emptyMessage="No vehicle maintenance history available"
          />
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
      hubType="maintenance"
    />
  );
}
