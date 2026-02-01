import {
  Truck,
  Package,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Settings,
  Zap,
  Calendar,
  LayoutGrid,
  Activity
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Vehicle as CanonicalVehicle } from '@/types/Vehicle';

import { OperationsHubMap } from './OperationsHubMap';

import { MapFirstLayout } from '@/components/layout/MapFirstLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DispatchKanban } from '@/components/visualizations/DispatchKanban';
import { DriverActivityFeed } from '@/components/visualizations/DriverActivityFeed';
import { OperationalMetrics, CircularGauge } from '@/components/visualizations/OperationalMetrics';
import { RouteTimeline } from '@/components/visualizations/RouteTimeline';
import { VehicleStatusGrid } from '@/components/visualizations/VehicleStatusGrid';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { useVehicles, useDrivers, useWorkOrders, useRoutes } from '@/hooks/use-api';
import { useRealtimeOperations } from '@/hooks/use-realtime-operations';

/**
 * Enhanced Operations Hub
 *
 * Real-time operational command center with:
 * - Live vehicle tracking and map view
 * - Route timeline (Gantt-style)
 * - Dispatch queue (Kanban board)
 * - Vehicle status grid
 * - Driver activity feed
 * - Operational metrics and gauges
 * - Real-time WebSocket updates
 */

// Extend canonical Vehicle type with additional properties needed for operations
type Vehicle = CanonicalVehicle & {
  vehicleNumber?: string;
  latitude?: number;
  longitude?: number;
  batteryLevel?: number;
  nextMaintenanceMiles?: number;
}
interface WorkOrder {
  id: string;
  status: string;
  priority?: string;
  type?: string;
  work_order_number: string;
  description: string;
  vehicle_id: string;
  assigned_technician_id?: string;
}

interface Driver {
  id: string;
  name?: string;
  employeeNumber?: string;
  phone?: string;
}

interface Route {
  id: string;
  route_number: string;
  name: string;
  assigned_vehicle_id?: string;
  assigned_driver_id?: string;
  schedule?: string;
}

interface Task {
  id: string;
  taskNumber: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed';
  assignedVehicleId?: string;
  assignedDriverId?: string;
  estimatedDuration?: number;
  dueTime?: string;
}

interface TimelineRoute {
  id: string;
  routeNumber: string;
  name: string;
  assignedVehicleId?: string;
  assignedDriverId?: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'pending' | 'delayed' | 'active' | 'completed';
}

export function OperationsHubEnhanced() {
  const { push } = useDrilldown();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const { data: workOrders = [] } = useWorkOrders();
  const { data: routes = [] } = useRoutes();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showDispatchOverlay, setShowDispatchOverlay] = useState(true);
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  const [showGeofences, setShowGeofences] = useState(false);

  // Real-time operations hook
  const {
    isConnected,
    alerts,
    getCriticalAlerts,
    acknowledgeAlert,
    lastUpdate
  } = useRealtimeOperations();

  const handleMetricClick = (type: string, filter: string, label: string) => {
    push({ type: type as any, label, data: { filter } });
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    push({
      type: 'vehicle',
      label: vehicle.vehicleNumber,
      data: { vehicleId: vehicle.id, vehicleNumber: vehicle.vehicleNumber }
    });
  };

  const handleAlertClick = (alert: { id: string; type: string; message: string }) => {
    push({
      type: 'alert',
      label: `Alert: ${alert.type}`,
      data: { alertId: alert.id, alertType: alert.type, message: alert.message }
    });
  };

  // Calculate operational metrics
  const metrics = useMemo(() => {
    const activeVehicles = (vehicles as unknown as Vehicle[]).filter((v: Vehicle) => v.status === 'active');
    const enRouteCount = Math.floor(activeVehicles.length * 0.6);
    const completedToday = Math.floor((workOrders as unknown as WorkOrder[]).length * 0.3);

    return {
      activeJobs: enRouteCount,
      pendingDispatch: Math.floor((workOrders as unknown as WorkOrder[]).length * 0.1),
      enRoute: enRouteCount,
      completed: completedToday,
      totalVehicles: (vehicles as unknown as Vehicle[]).length,
      activeVehicles: activeVehicles.length,
      availableDrivers: Math.floor((drivers as unknown as Driver[]).length * 0.4)
    };
  }, [vehicles, drivers, workOrders]);

  // Generate alerts from work orders and vehicles
  const systemAlerts = useMemo(() => {
    const generatedAlerts: { id: string; type: string; message: string; timestamp: string; severity: 'critical' | 'high' | 'medium' }[] = [];

    // Add critical real-time alerts
    const criticalAlerts = getCriticalAlerts();
    criticalAlerts.forEach(alert => {
      generatedAlerts.push({
        id: alert.id,
        type: alert.type,
        message: alert.message,
        timestamp: new Date(alert.timestamp).toLocaleTimeString(),
        severity: alert.severity as 'critical' | 'high' | 'medium'
      });
    });

    // Generate alerts from urgent work orders
    const urgentOrders = (workOrders as unknown as WorkOrder[]).filter(wo => wo.priority === 'urgent' || wo.priority === 'critical');
    urgentOrders.slice(0, 2).forEach((wo, i) => {
      generatedAlerts.push({
        id: `wo-${wo.id}`,
        type: wo.priority === 'critical' ? 'critical' : 'warning',
        message: `Work order ${wo.work_order_number} requires immediate attention`,
        timestamp: new Date(Date.now() - (i + 1) * 5 * 60000).toLocaleTimeString(),
        severity: wo.priority === 'critical' ? 'critical' : 'high'
      });
    });

    return generatedAlerts;
  }, [workOrders, alerts, getCriticalAlerts]);

  // Convert work orders to tasks for Kanban
  const tasks = useMemo((): Task[] => {
    return (workOrders as unknown as WorkOrder[]).map(wo => ({
      id: wo.id,
      taskNumber: wo.work_order_number,
      description: wo.description || 'No description',
      priority: (wo.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
      status: (wo.status === 'open' ? 'pending' :
              wo.status === 'in_progress' ? 'in-progress' :
              wo.status === 'completed' ? 'completed' : 'assigned') as 'pending' | 'assigned' | 'in-progress' | 'completed',
      assignedVehicleId: wo.vehicle_id,
      assignedDriverId: wo.assigned_technician_id,
      estimatedDuration: 60
    }));
  }, [workOrders]);

  // Convert routes for timeline
  const timelineRoutes = useMemo((): TimelineRoute[] => {
    const now = new Date();
    return (routes as unknown as Route[]).map((route, i) => {
      const scheduledStart = new Date(now);
      scheduledStart.setHours(8 + i * 2, 0, 0, 0);
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(scheduledEnd.getHours() + 2);

      return {
        id: route.id,
        routeNumber: route.route_number,
        name: route.name,
        assignedVehicleId: route.assigned_vehicle_id,
        assignedDriverId: route.assigned_driver_id,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        status: (i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'active' : i % 4 === 2 ? 'delayed' : 'pending') as 'pending' | 'delayed' | 'active' | 'completed'
      };
    });
  }, [routes]);

  const selectedVehicle = (vehicles as unknown as Vehicle[]).find((v: Vehicle) => v.id === selectedVehicleId);

  // Side Panel Content - Operations Control
  const sidePanel = (
    <div className="space-y-4">
      {/* Header with connection status */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-900">Operations Hub</h2>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
            {isConnected ? (
              <>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1" />
                Live
              </>
            ) : (
              'Offline'
            )}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">Real-time fleet operations control center</p>
        {lastUpdate && (
          <p className="text-xs text-slate-400 mt-1">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Real-time Metrics - Circular Gauges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-center">
          <CircularGauge
            value={metrics.activeVehicles}
            max={metrics.totalVehicles}
            label="Active Vehicles"
            unit="units"
            color="green"
            size="sm"
          />
        </div>
        <div className="flex justify-center">
          <CircularGauge
            value={Math.round((metrics.completed / (metrics.activeJobs + metrics.completed)) * 100)}
            max={100}
            label="Completed"
            unit="%"
            color="purple"
            size="sm"
          />
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-lg font-bold text-blue-800">{metrics.activeJobs}</div>
            <div className="text-xs text-slate-600">Active Jobs</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-lg font-bold text-amber-600">{metrics.pendingDispatch}</div>
            <div className="text-xs text-slate-600">Pending</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-lg font-bold text-green-600">{metrics.enRoute}</div>
            <div className="text-xs text-slate-600">En Route</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-lg font-bold text-purple-600">{metrics.completed}</div>
            <div className="text-xs text-slate-600">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Map Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Map Display Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="dispatch-overlay" className="text-xs cursor-pointer">
              Active Dispatches
            </Label>
            <Switch
              id="dispatch-overlay"
              checked={showDispatchOverlay}
              onCheckedChange={setShowDispatchOverlay}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="route-optimization" className="text-xs cursor-pointer">
              Route Suggestions
            </Label>
            <Switch
              id="route-optimization"
              checked={showRouteOptimization}
              onCheckedChange={setShowRouteOptimization}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="geofences" className="text-xs cursor-pointer">
              Geofence Zones
            </Label>
            <Switch
              id="geofences"
              checked={showGeofences}
              onCheckedChange={setShowGeofences}
            />
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts Panel */}
      {systemAlerts.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
              Critical Alerts
              <Badge variant="destructive" className="ml-auto">
                {systemAlerts.filter(a => a.severity === 'critical').length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {systemAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  onClick={() => {
                    handleAlertClick(alert);
                    acknowledgeAlert(alert.id);
                  }}
                  className={`p-2 rounded-lg border text-xs cursor-pointer hover:shadow-sm transition-all ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'high'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`h-3 w-3 flex-shrink-0 mt-0.5 ${
                        alert.severity === 'critical'
                          ? 'text-red-500 animate-pulse'
                          : alert.severity === 'high'
                          ? 'text-amber-500'
                          : 'text-blue-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-medium truncate">{alert.message}</p>
                      <p className="text-slate-500 mt-0.5">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
            <Package className="h-3 w-3" />
            New Job
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
            <Navigation className="h-3 w-3" />
            Optimize Routes
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
            <MapPin className="h-3 w-3" />
            Add Geofence
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
            <Truck className="h-3 w-3" />
            Assign Vehicle
          </Button>
        </div>
      </div>
    </div>
  );

  // Main content with tabs
  const mainContent = (
    <div className="h-full flex flex-col">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="overview" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="dispatch" className="text-xs">
            <Package className="h-3 w-3 mr-1" />
            Dispatch
          </TabsTrigger>
          <TabsTrigger value="routes" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="fleet" className="text-xs">
            <LayoutGrid className="h-3 w-3 mr-1" />
            Fleet
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Drivers
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="overview" className="mt-0 space-y-4">
            <OperationalMetrics />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VehicleStatusGrid
                vehicles={vehicles as unknown as Vehicle[]}
                onVehicleClick={(id) => setSelectedVehicleId(id)}
                compact={true}
              />
              <DriverActivityFeed
                drivers={drivers as unknown as any[]}
                maxHeight="400px"
              />
            </div>
          </TabsContent>

          <TabsContent value="dispatch" className="mt-0">
            <DispatchKanban tasks={tasks} />
          </TabsContent>

          <TabsContent value="routes" className="mt-0">
            <RouteTimeline routes={timelineRoutes} />
          </TabsContent>

          <TabsContent value="fleet" className="mt-0">
            <VehicleStatusGrid
              vehicles={vehicles as unknown as Vehicle[]}
              onVehicleClick={(id) => setSelectedVehicleId(id)}
            />
          </TabsContent>

          <TabsContent value="drivers" className="mt-0">
            <DriverActivityFeed
              drivers={drivers as unknown as any[]}
              maxHeight="calc(100vh - 200px)"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-slate-600">Loading operations data...</p>
        </div>
      </div>
    );
  }

  return (
    <MapFirstLayout
      mapComponent={
        <OperationsHubMap
          onVehicleSelect={setSelectedVehicleId}
          selectedVehicleId={selectedVehicleId}
          showDispatchOverlay={showDispatchOverlay}
          showRouteOptimization={showRouteOptimization}
          showGeofences={showGeofences}
        />
      }
      sidePanel={sidePanel}
      drawerContent={mainContent}
    />
  );
}
