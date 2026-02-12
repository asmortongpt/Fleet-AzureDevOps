import { Wrench, Clock, AlertTriangle, DollarSign, Calendar, Car, ListChecks, ShieldAlert, CheckCircle2, XCircle, Timer, Building2, Hash } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { MaintenanceHubMap } from './MaintenanceHubMap';

import { MapFirstLayout } from '@/components/layout/MapFirstLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { useFleetData } from '@/hooks/use-fleet-data';

interface WorkOrderItem {
  id: string;
  vehicleUnit: string;
  vehicleId: string;
  type?: 'scheduled' | 'active' | 'urgent' | 'completed';
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  assignedTo?: string;
  estimatedCost?: number;
  estimatedTime?: string;
  scheduledDate?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  // Expanded fields
  category?: string;
  subcategory?: string;
  facility_id?: string;
  total_cost?: number;
  parts_cost?: number;
  labor_cost?: number;
  downtime_hours?: number;
  root_cause?: string;
  resolution_notes?: string;
  vendor_id?: string;
  driver_id?: string;
  bay_number?: string;
  is_emergency?: boolean;
  quality_check_passed?: boolean;
  completed_at?: string;
  external_reference?: string;
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
  const { push } = useDrilldown();
  const fleetData = useFleetData();
  const [selectedTab, setSelectedTab] = useState<'queue' | 'history' | 'schedule'>('queue');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderItem | null>(null);

  const vehicleLookup = useMemo(() => {
    const vehicles = fleetData.vehicles || []
    return new Map(vehicles.map((vehicle: any) => [vehicle.id, vehicle]))
  }, [fleetData.vehicles])

  // Transform work orders from fleet data
  const workOrders: WorkOrderItem[] = useMemo(() => {
    const rawWorkOrders = fleetData.workOrders || [];
    return rawWorkOrders.map((wo: any) => ({
      id: String(wo.id),
      vehicleUnit: String(
        wo.vehicleNumber ||
        wo.vehicle_unit ||
        wo.vehicle_name ||
        wo.vehicleName ||
        wo.vehicleId ||
        wo.vehicle_id ||
        wo.vehicle?.name ||
        ''
      ),
      vehicleId: String(wo.vehicleId || wo.vehicle_id || wo.vehicle?.id || wo.id || ''),
      type: String(wo.status || '').toLowerCase() === 'in-progress'
        ? 'active'
        : String(wo.status || '').toLowerCase() === 'completed'
          ? 'completed'
          : String(wo.priority || '').toLowerCase() === 'urgent'
            ? 'urgent'
            : wo.scheduledDate || wo.scheduled_date || wo.scheduled_start
              ? 'scheduled'
              : undefined,
      description: String(wo.description || wo.serviceType || wo.title || wo.work_order_description || ''),
      priority: (String(wo.priority || '').toLowerCase() as WorkOrderItem['priority']) || undefined,
      assignedTo: wo.assignedTo || wo.technician || wo.assigned_to_name,
      estimatedCost: Number(wo.estimatedCost ?? wo.estimated_cost ?? wo.actual_cost ?? wo.cost) || undefined,
      estimatedTime: wo.estimatedHours ? `${wo.estimatedHours} hours` : undefined,
      scheduledDate: wo.scheduledDate || wo.scheduled_date || wo.createdAt || wo.created_at,
      location: (() => {
        const rawLocation = wo.location || wo.gps_location
        if (rawLocation?.lat && rawLocation?.lng) {
          return { lat: Number(rawLocation.lat), lng: Number(rawLocation.lng), address: rawLocation.address }
        }
        const vehicle = vehicleLookup.get(wo.vehicleId || wo.vehicle_id)
        if (vehicle?.location?.lat && vehicle?.location?.lng) {
          return {
            lat: Number(vehicle.location.lat),
            lng: Number(vehicle.location.lng),
            address: vehicle.location.address || vehicle.location_address || vehicle.locationAddress
          }
        }
        return undefined
      })(),
      // Expanded fields
      category: wo.category || undefined,
      subcategory: wo.subcategory || undefined,
      facility_id: wo.facility_id || undefined,
      total_cost: wo.total_cost != null ? Number(wo.total_cost) : undefined,
      parts_cost: wo.parts_cost != null ? Number(wo.parts_cost) : undefined,
      labor_cost: wo.labor_cost != null ? Number(wo.labor_cost) : undefined,
      downtime_hours: wo.downtime_hours != null ? Number(wo.downtime_hours) : undefined,
      root_cause: wo.root_cause || undefined,
      resolution_notes: wo.resolution_notes || undefined,
      vendor_id: wo.vendor_id || undefined,
      driver_id: wo.driver_id || undefined,
      bay_number: wo.bay_number || undefined,
      is_emergency: wo.is_emergency === true || wo.is_emergency === 'true',
      quality_check_passed: wo.quality_check_passed != null ? (wo.quality_check_passed === true || wo.quality_check_passed === 'true') : undefined,
      completed_at: wo.completed_at || undefined,
      external_reference: wo.external_reference || undefined,
    }));
  }, [fleetData.workOrders, vehicleLookup]);

  // Transform vehicle maintenance history from fleet data
  const vehicleHistory: VehicleMaintenanceHistory[] = useMemo(() => {
    const vehicles = fleetData.vehicles || [];
    return vehicles.slice(0, 10).map((v: any) => ({
      vehicleId: v.id,
      vehicleUnit: v.name || v.vehicleNumber || `Unit ${v.id}`,
      totalWorkOrders: v.maintenanceCount || 0,
      completedThisMonth: v.completedThisMonth || 0,
      totalCostYTD: v.maintenanceCostYTD || 0,
      lastService: v.lastServiceDate || '',
      nextScheduled: v.nextServiceDate || '',
      status: v.maintenanceStatus || (v.alerts?.length ? 'attention' : 'good') as 'good' | 'attention' | 'critical'
    }));
  }, [fleetData.vehicles]);

  const handleWorkOrderClick = (wo: WorkOrderItem) => {
    setSelectedWorkOrder(wo);
    push({
      type: 'workOrder',
      label: `WO #${wo.id}`,
      data: { workOrderId: wo.id, vehicleId: wo.vehicleId, description: wo.description }
    });
  };

  const handleVehicleHistoryClick = (vh: VehicleMaintenanceHistory) => {
    push({
      type: 'vehicle',
      label: vh.vehicleUnit,
      data: { vehicleId: vh.vehicleId, vehicleName: vh.vehicleUnit }
    });
  };

  const handleMetricClick = (metricType: string, filter: string) => {
    push({
      type: metricType as any,
      label: `${filter} Work Orders`,
      data: { filter }
    });
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeCount = workOrders.filter(wo => wo.type === 'active').length;
    const urgentCount = workOrders.filter(wo => wo.type === 'urgent').length;
    const scheduledCount = workOrders.filter(wo => wo.type === 'scheduled').length;
    const emergencyCount = workOrders.filter(wo => wo.is_emergency).length;
    const totalCost = workOrders.reduce((sum, wo) => sum + Number(wo.total_cost || wo.estimatedCost || 0), 0);
    const totalDowntime = workOrders.reduce((sum, wo) => sum + Number(wo.downtime_hours || 0), 0);

    return {
      activeCount,
      urgentCount,
      scheduledCount,
      emergencyCount,
      totalCost,
      totalDowntime
    };
  }, [workOrders]);

  const getWorkOrderBadgeVariant = (type?: WorkOrderItem['type']): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'urgent': return 'destructive';
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority?: WorkOrderItem['priority']): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'urgent': return 'destructive';
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

  const getCategoryBadgeColor = (category?: string): string => {
    switch (category?.toLowerCase()) {
      case 'preventive': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'corrective': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'inspection': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'body_work': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'electrical': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'tire_service': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatCategoryLabel = (category?: string): string => {
    if (!category) return '';
    return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Map component
  const mapComponent = (
    <MaintenanceHubMap
      workOrders={workOrders
        .filter(wo => !!wo.location)
        .map(wo => ({
          id: wo.id,
          vehicleId: wo.vehicleId,
          vehicleUnit: wo.vehicleUnit,
          type: wo.type || 'scheduled',
          description: wo.description,
          location: { lat: wo.location!.lat, lng: wo.location!.lng, address: wo.location!.address || "" },
          scheduledDate: wo.scheduledDate,
          estimatedCompletion: wo.estimatedTime
        }))}
      serviceLocations={(fleetData.facilities || [])
        .map((facility: any) => ({
          id: facility.id,
          name: facility.name || facility.number || facility.id,
          type: (facility.type === 'parts_warehouse' ? 'parts_warehouse' : facility.type === 'vendor' ? 'vendor' : 'service_center') as 'vendor' | 'service_center' | 'parts_warehouse',
          location: {
            lat: Number(facility.location?.lat ?? facility.lat),
            lng: Number(facility.location?.lng ?? facility.lng),
            address: facility.address || ''
          },
          services: Array.isArray(facility.services) ? facility.services : [],
          phone: facility.phone
        }))
        .filter((loc: any) => Number.isFinite(loc.location?.lat) && Number.isFinite(loc.location?.lng))}
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
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-bold">Maintenance Hub</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Service locations, work orders, and maintenance tracking
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMetricClick('workOrder', 'active')}>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-3 h-3 text-blue-800" />
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-sm font-bold">{metrics.activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMetricClick('workOrder', 'urgent')}>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Urgent</p>
                <p className="text-sm font-bold">{metrics.urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMetricClick('workOrder', 'scheduled')}>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-sm font-bold">{metrics.scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMetricClick('maintenance-costs', 'all')}>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="text-sm font-bold">${metrics.totalCost.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMetricClick('workOrder', 'downtime')}>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Timer className="w-3 h-3 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Downtime</p>
                <p className="text-sm font-bold">{metrics.totalDowntime.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMetricClick('workOrder', 'emergency')}>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3 h-3 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">Emergency</p>
                <p className="text-sm font-bold">{metrics.emergencyCount}</p>
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
                  className={`p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors ${wo.is_emergency ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                  onClick={() => handleWorkOrderClick(wo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleWorkOrderClick(wo)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-medium">{wo.id}</span>
                        <Badge variant={getWorkOrderBadgeVariant(wo.type)} className="text-xs">
                          {wo.type || 'unknown'}
                        </Badge>
                        {wo.category && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getCategoryBadgeColor(wo.category)}`}>
                            {formatCategoryLabel(wo.category)}
                          </span>
                        )}
                        {wo.is_emergency && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            <ShieldAlert className="w-2.5 h-2.5 mr-0.5" />
                            EMERGENCY
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{wo.vehicleUnit}</p>
                      <p className="text-xs text-muted-foreground truncate">{wo.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {wo.estimatedTime || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {wo.total_cost != null ? `$${wo.total_cost.toFixed(0)}` : wo.estimatedCost != null ? `$${wo.estimatedCost.toFixed(0)}` : '—'}
                        </span>
                        {wo.downtime_hours != null && wo.downtime_hours > 0 && (
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {wo.downtime_hours.toFixed(1)}h
                          </span>
                        )}
                        {wo.quality_check_passed != null && (
                          <span className="flex items-center gap-1">
                            {wo.quality_check_passed ? (
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            QC
                          </span>
                        )}
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
    <div className="space-y-2">
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Work Order Queue Tab */}
        <TabsContent value="queue" className="space-y-3 mt-2">
          <div className="space-y-3">
            {workOrders.map((wo) => (
              <Card key={wo.id} className={`${selectedWorkOrder?.id === wo.id ? 'border-blue-500' : ''} ${wo.is_emergency ? 'border-red-400 shadow-red-100 dark:shadow-red-950/30' : ''}`}>
                <CardContent className="p-2">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-mono font-semibold">{wo.id}</span>
                          <Badge variant={getWorkOrderBadgeVariant(wo.type)}>
                            {wo.type || 'unknown'}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(wo.priority)}>
                            {wo.priority || '—'}
                          </Badge>
                          {wo.category && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getCategoryBadgeColor(wo.category)}`}>
                              {formatCategoryLabel(wo.category)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{wo.vehicleUnit}</p>
                          {wo.is_emergency && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              EMERGENCY
                            </Badge>
                          )}
                        </div>
                      </div>
                      {wo.quality_check_passed != null && (
                        <div className="flex items-center gap-1 text-xs" title={wo.quality_check_passed ? 'Quality check passed' : 'Quality check failed'}>
                          {wo.quality_check_passed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-sm">{wo.description}</p>

                    {wo.subcategory && (
                      <p className="text-xs text-muted-foreground">Subcategory: {formatCategoryLabel(wo.subcategory)}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
                        <p className="font-medium">{wo.scheduledDate || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                        <p className="font-medium">{wo.assignedTo || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Est. Time</p>
                        <p className="font-medium">{wo.estimatedTime || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Cost</p>
                        <p className="font-medium">
                          {wo.total_cost != null ? `$${wo.total_cost.toFixed(2)}` : wo.estimatedCost != null ? `$${wo.estimatedCost.toFixed(2)}` : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Cost Breakdown (parts + labor) */}
                    {(wo.parts_cost != null || wo.labor_cost != null) && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Cost Breakdown</p>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Parts</span>
                              <span className="font-medium">${(wo.parts_cost || 0).toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${wo.total_cost ? ((wo.parts_cost || 0) / wo.total_cost * 100) : 50}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Labor</span>
                              <span className="font-medium">${(wo.labor_cost || 0).toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${wo.total_cost ? ((wo.labor_cost || 0) / wo.total_cost * 100) : 50}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Downtime & Bay Info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {wo.downtime_hours != null && wo.downtime_hours > 0 && (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-purple-500" />
                          Downtime: {wo.downtime_hours.toFixed(1)}h
                        </span>
                      )}
                      {wo.bay_number && (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Bay {wo.bay_number}
                        </span>
                      )}
                      {wo.facility_id && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Facility {wo.facility_id}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="text-xs">{wo.location?.address || '—'}</p>
                    </div>

                    {/* Root Cause & Resolution (expanded detail) */}
                    {(wo.root_cause || wo.resolution_notes) && (
                      <div className="pt-2 border-t space-y-2">
                        {wo.root_cause && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Root Cause</p>
                            <p className="text-xs bg-muted/50 rounded p-1.5">{wo.root_cause}</p>
                          </div>
                        )}
                        {wo.resolution_notes && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Resolution</p>
                            <p className="text-xs bg-muted/50 rounded p-1.5">{wo.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    )}

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
        <TabsContent value="history" className="space-y-3 mt-2">
          {/* Completed Work Orders with cost breakdown */}
          {workOrders.filter(wo => wo.type === 'completed').length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Completed Work Orders - Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workOrders.filter(wo => wo.type === 'completed').slice(0, 8).map((wo) => (
                    <div key={wo.id} className="p-2 border rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{wo.id}</span>
                          <span className="font-medium truncate max-w-[120px]">{wo.vehicleUnit}</span>
                          {wo.category && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getCategoryBadgeColor(wo.category)}`}>
                              {formatCategoryLabel(wo.category)}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-sm">
                          ${(wo.total_cost || wo.estimatedCost || 0).toFixed(0)}
                        </span>
                      </div>
                      {(wo.parts_cost != null || wo.labor_cost != null) && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${wo.total_cost ? ((wo.parts_cost || 0) / wo.total_cost * 100) : 50}%` }}
                              title={`Parts: $${(wo.parts_cost || 0).toFixed(2)}`}
                            />
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${wo.total_cost ? ((wo.labor_cost || 0) / wo.total_cost * 100) : 50}%` }}
                              title={`Labor: $${(wo.labor_cost || 0).toFixed(2)}`}
                            />
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-2 whitespace-nowrap">
                            <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />P: ${(wo.parts_cost || 0).toFixed(0)}</span>
                            <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />L: ${(wo.labor_cost || 0).toFixed(0)}</span>
                          </div>
                        </div>
                      )}
                      {wo.downtime_hours != null && wo.downtime_hours > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          <Timer className="w-2.5 h-2.5" />
                          {wo.downtime_hours.toFixed(1)}h downtime
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {vehicleHistory.map((vh) => (
            <Card
              key={vh.vehicleId}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => handleVehicleHistoryClick(vh)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleVehicleHistoryClick(vh)}
            >
              <CardContent className="p-2">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="w-3 h-3" />
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
                      <p className="font-medium">{vh.lastService || '—'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Next Scheduled</p>
                    <p className="text-sm font-medium">{vh.nextScheduled || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Maintenance Schedule Tab */}
        <TabsContent value="schedule" className="space-y-3 mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upcoming Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workOrders
                  .filter(wo => wo.type === 'scheduled')
                  .sort((a, b) => {
                    const aTime = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Number.POSITIVE_INFINITY
                    const bTime = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Number.POSITIVE_INFINITY
                    return aTime - bTime
                  })
                  .map((wo) => (
                    <div key={wo.id} className={`flex items-start gap-3 p-3 border rounded-lg ${wo.is_emergency ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <Calendar className="w-3 h-3 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-medium text-sm">{wo.vehicleUnit}</p>
                          {wo.category && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getCategoryBadgeColor(wo.category)}`}>
                              {formatCategoryLabel(wo.category)}
                            </span>
                          )}
                          {wo.is_emergency && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">
                              <ShieldAlert className="w-2.5 h-2.5 mr-0.5" />
                              EMR
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{wo.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{wo.scheduledDate || '—'}</span>
                          {wo.facility_id && (
                            <span className="flex items-center gap-0.5">
                              <Building2 className="w-2.5 h-2.5" />
                              {wo.facility_id}
                            </span>
                          )}
                          {wo.bay_number && (
                            <span className="flex items-center gap-0.5">
                              <Hash className="w-2.5 h-2.5" />
                              Bay {wo.bay_number}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {wo.estimatedTime || '—'}
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
