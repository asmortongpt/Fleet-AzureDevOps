import { useState, useMemo } from 'react';
import { MapFirstLayout } from '@/components/layout/MapFirstLayout';
import { OperationsHubMap } from './OperationsHubMap';
import { useVehicles, useDrivers, useWorkOrders } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Zap
} from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  vehicleNumber: string;
  latitude?: number;
  longitude?: number;
  status: "active" | "inactive" | "maintenance";
}

interface WorkOrder {
  id: string;
  status: string;
  priority?: string;
  type?: string;
}

export function OperationsHub() {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const { data: workOrders = [] } = useWorkOrders();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showDispatchOverlay, setShowDispatchOverlay] = useState(true);
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  const [showGeofences, setShowGeofences] = useState(false);

  // Calculate operational metrics
  const metrics = useMemo(() => {
    const activeVehicles = vehicles.filter((v: Vehicle) => v.status === 'active');
    const enRouteCount = Math.floor(activeVehicles.length * 0.6);
    const completedToday = Math.floor(workOrders.length * 0.3);

    return {
      activeJobs: enRouteCount,
      pendingDispatch: Math.floor(workOrders.length * 0.1),
      enRoute: enRouteCount,
      completed: completedToday,
      totalVehicles: vehicles.length,
      activeVehicles: activeVehicles.length,
      availableDrivers: Math.floor(drivers.length * 0.4)
    };
  }, [vehicles, drivers, workOrders]);

  // Critical alerts
  const alerts = useMemo(() => {
    return [
      {
        id: '1',
        type: 'warning',
        message: 'Vehicle V-042 delayed 15 minutes - traffic incident on I-4',
        timestamp: new Date(Date.now() - 5 * 60000).toLocaleTimeString()
      },
      {
        id: '2',
        type: 'info',
        message: 'Route optimization available for 3 vehicles - potential savings: $45',
        timestamp: new Date(Date.now() - 12 * 60000).toLocaleTimeString()
      },
      {
        id: '3',
        type: 'critical',
        message: 'Geofence breach: Vehicle V-088 entered restricted zone',
        timestamp: new Date(Date.now() - 23 * 60000).toLocaleTimeString()
      }
    ];
  }, []);

  const selectedVehicle = vehicles.find((v: Vehicle) => v.id === selectedVehicleId);

  // Side Panel Content - Operations Control
  const sidePanel = (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Operations Hub</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time fleet operations control center</p>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{metrics.activeJobs}</div>
                <div className="text-xs text-slate-600 mt-1">Active Jobs</div>
              </div>
              <Package className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{metrics.pendingDispatch}</div>
                <div className="text-xs text-slate-600 mt-1">Pending Dispatch</div>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{metrics.enRoute}</div>
                <div className="text-xs text-slate-600 mt-1">En Route</div>
              </div>
              <Navigation className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{metrics.completed}</div>
                <div className="text-xs text-slate-600 mt-1">Completed Today</div>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
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
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs ${
                  alert.type === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : alert.type === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      alert.type === 'critical'
                        ? 'text-red-500'
                        : alert.type === 'warning'
                        ? 'text-amber-500'
                        : 'text-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-slate-800 font-medium">{alert.message}</p>
                    <p className="text-slate-500 mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fleet Status Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Fleet Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Active Vehicles
            </span>
            <span className="font-semibold text-slate-900">
              {metrics.activeVehicles} / {metrics.totalVehicles}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Available Drivers
            </span>
            <span className="font-semibold text-slate-900">{metrics.availableDrivers}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Efficiency Score
            </span>
            <span className="font-semibold text-green-600">92%</span>
          </div>
        </CardContent>
      </Card>

      {/* Selected Vehicle Details */}
      {selectedVehicle && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                {selectedVehicle.vehicleNumber}
              </span>
              <Badge variant={selectedVehicle.status === 'active' ? 'default' : 'secondary'}>
                {selectedVehicle.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Make/Model:</span>
              <span className="font-medium">
                {selectedVehicle.make} {selectedVehicle.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Location:</span>
              <span className="font-medium">
                {selectedVehicle.latitude?.toFixed(4)}, {selectedVehicle.longitude?.toFixed(4)}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1 text-xs">
                View Details
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs">
                Dispatch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Package className="h-4 w-4" />
            New Job
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Navigation className="h-4 w-4" />
            Optimize Routes
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <MapPin className="h-4 w-4" />
            Add Geofence
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Truck className="h-4 w-4" />
            Assign Vehicle
          </Button>
        </div>
      </div>
    </div>
  );

  // Drawer Content for mobile
  const drawerContent = selectedVehicle && (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Operations Details: {selectedVehicle.vehicleNumber}</h3>
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Make/Model:</span>
              <span className="font-medium">
                {selectedVehicle.make} {selectedVehicle.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Status:</span>
              <Badge variant={selectedVehicle.status === 'active' ? 'default' : 'secondary'}>
                {selectedVehicle.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Load</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Capacity:</span>
              <span className="font-medium">1,200 lbs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Current:</span>
              <span className="font-medium text-green-600">850 lbs (71%)</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-green-500" style={{ width: '71%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 animate-spin mx-auto text-blue-500" />
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
      drawerContent={drawerContent}
    />
  );
}
