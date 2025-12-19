import { useState, useEffect } from 'react';
import { MapFirstLayout } from '../layout/MapFirstLayout';
import { ProfessionalFleetMap } from '../map/ProfessionalFleetMap';
import { useVehicles } from '@/hooks/use-api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertCircle, Truck, Wrench, MapPin, Gauge, Fuel } from 'lucide-react';
import { MobileMapControls } from '../mobile/MobileMapControls';
import { MobileQuickActions } from '../mobile/MobileQuickActions';
import { MobileVehicleCard } from '../mobile/MobileVehicleCard';
import { generateDemoVehicles } from '@/lib/demo-data';
import logger from '@/utils/logger';
import { TrafficCameraLayer } from '@/components/layers/TrafficCameraLayer';
import { TrafficCameraControlPanel } from '@/components/panels/TrafficCameraControlPanel';
import { useSearchParams } from 'react-router-dom';

const LOADING_TIMEOUT = 5000; // 5 seconds timeout

interface LiveFleetDashboardProps {
  initialLayer?: string;
}

export function LiveFleetDashboard({ initialLayer }: LiveFleetDashboardProps = {}) {
  const { data: vehiclesData, isLoading: apiLoading, error: apiError } = useVehicles();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // -- Traffic Camera State --
  const [searchParams] = useSearchParams();
  const [showTrafficCameras, setShowTrafficCameras] = useState(false);
  const [trafficCameraFilters, setTrafficCameraFilters] = useState({
    search: "",
    status: "all" as "all" | "operational" | "offline",
    source: "all"
  });
  const [selectedCameraId, setSelectedCameraId] = useState<string>();

  // Deep linking for 'layer=cameras' or prop injection
  useEffect(() => {
    if (searchParams.get('layer') === 'cameras' || initialLayer === 'traffic-cameras') {
      setShowTrafficCameras(true);
    }
  }, [searchParams, initialLayer]);


  // Timeout fallback to demo data
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && vehicles.length === 0) {
        logger.warn('[LiveFleetDashboard] API timeout after 5s, falling back to demo data');
        const demoVehicles = generateDemoVehicles(50);
        setVehicles(demoVehicles);
        setIsLoading(false);
      }
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [isLoading, vehicles.length]);

  // Handle API data updates
  useEffect(() => {
    if (!apiLoading) {
      if (apiError) {
        logger.warn('[LiveFleetDashboard] API error, using demo data:', apiError);
        const demoVehicles = generateDemoVehicles(50);
        setVehicles(demoVehicles);
        setIsLoading(false);
      } else if (vehiclesData) {
        // Handle both direct array and nested data structure
        let vehicleArray: any[] = [];

        if (Array.isArray(vehiclesData)) {
          vehicleArray = vehiclesData;
        } else if (typeof vehiclesData === 'object' && 'data' in vehiclesData && Array.isArray((vehiclesData as any).data)) {
          vehicleArray = (vehiclesData as any).data;
        }

        if (vehicleArray.length > 0) {
          logger.info('[LiveFleetDashboard] API data loaded successfully:', vehicleArray.length, 'vehicles');
          setVehicles(vehicleArray);
          setIsLoading(false);
        }
      }
    }
  }, [apiLoading, apiError, vehiclesData]);

  const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId) || vehicles[0];

  // Quick stats - handle both 'active' and 'service' status
  const activeCount = vehicles.filter((v: any) => v.status === 'active').length;
  const maintenanceCount = vehicles.filter((v: any) =>
    v.status === 'maintenance' || v.status === 'service'
  ).length;
  const totalVehicles = vehicles.length;

  // Quick actions for mobile
  const quickActions = [
    {
      id: 'dispatch',
      label: 'Dispatch',
      icon: <Truck className="h-5 w-5" />,
      onClick: () => console.log('Dispatch clicked')
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: <Wrench className="h-5 w-5" />,
      onClick: () => console.log('Maintenance clicked')
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertCircle className="h-5 w-5" />,
      onClick: () => console.log('Alerts clicked'),
      badge: maintenanceCount
    },
    {
      id: 'fuel',
      label: 'Fuel',
      icon: <Fuel className="h-5 w-5" />,
      onClick: () => console.log('Fuel clicked')
    }
  ];

  // Side Panel Content
  const sidePanel = (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Fleet Overview</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Real-time vehicle monitoring</p>
      </div>

      {/* Quick Stats - Responsive Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card>
          <CardContent className="pt-3 pb-2 px-2 sm:pt-4 sm:pb-3 sm:px-3">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-[10px] sm:text-xs text-slate-500">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-2 sm:pt-4 sm:pb-3 sm:px-3">
            <div className="text-xl sm:text-2xl font-bold text-amber-600">{maintenanceCount}</div>
            <div className="text-[10px] sm:text-xs text-slate-500">Maintenance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-2 sm:pt-4 sm:pb-3 sm:px-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{totalVehicles}</div>
            <div className="text-[10px] sm:text-xs text-slate-500">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Vehicle Info */}
      {selectedVehicle && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{selectedVehicle.vehicleNumber || selectedVehicle.number || 'N/A'}</span>
              <Badge variant={selectedVehicle.status === 'active' ? 'default' : 'secondary'}>
                {selectedVehicle.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <Truck className="h-4 w-4 mr-2 text-slate-500" />
              <span className="font-medium">
                {selectedVehicle.name ||
                  `${selectedVehicle.make || ''} ${selectedVehicle.model || ''}`.trim() ||
                  'Unknown Vehicle'}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-slate-500" />
              <span>
                {selectedVehicle.location?.lat?.toFixed(4) || selectedVehicle.latitude?.toFixed(4) || '0.0000'},
                {' '}
                {selectedVehicle.location?.lng?.toFixed(4) || selectedVehicle.longitude?.toFixed(4) || '0.0000'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Mobile Optimized */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Quick Actions</h3>
        {/* Mobile: Horizontal scroll, Desktop: Grid */}
        <div className="md:hidden">
          <MobileQuickActions
            actions={quickActions}
            layout="horizontal-scroll"
          />
        </div>
        <div className="hidden md:grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="dispatch-action"
          >
            <Truck className="h-4 w-4 mr-1" />
            Dispatch
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="maintenance-action"
          >
            <Wrench className="h-4 w-4 mr-1" />
            Maintenance
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="alerts-action"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Alerts
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="fuel-action"
          >
            <Fuel className="h-4 w-4 mr-1" />
            Fuel
          </Button>
        </div>
      </div>

      {/* Vehicle List - Mobile uses MobileVehicleCard, Desktop uses custom */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Recent Activity</h3>
        {/* Mobile: List variant */}
        <div className="md:hidden space-y-0 max-h-64 overflow-y-auto border-t border-slate-200">
          {vehicles.slice(0, 10).map((vehicle: any) => (
            <MobileVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onClick={(v) => setSelectedVehicleId(v.id)}
              variant="list"
            />
          ))}
        </div>
        {/* Desktop: Original design */}
        <div className="hidden md:block space-y-2 max-h-64 overflow-y-auto">
          {vehicles.slice(0, 10).map((vehicle: any) => (
            <div
              key={vehicle.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedVehicleId === vehicle.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
                }`}
              onClick={() => setSelectedVehicleId(vehicle.id)}
              data-testid={`vehicle-list-item-${vehicle.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {vehicle.vehicleNumber || vehicle.number || 'N/A'}
                </span>
                <Badge
                  variant={vehicle.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {vehicle.status}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {vehicle.name ||
                  `${vehicle.make || ''} ${vehicle.model || ''}`.trim() ||
                  'Unknown Vehicle'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Drawer Content (for mobile detailed view)
  const drawerContent = selectedVehicle && (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">
        Vehicle Details: {selectedVehicle.vehicleNumber || selectedVehicle.number || 'N/A'}
      </h3>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-semibold">Vehicle:</div>
          <div>
            {selectedVehicle.name ||
              `${selectedVehicle.make || ''} ${selectedVehicle.model || ''}`.trim() ||
              'Unknown'}
          </div>
          <div className="font-semibold">Year:</div>
          <div>{selectedVehicle.year || 'N/A'}</div>
          <div className="font-semibold">Status:</div>
          <div>
            <Badge variant={selectedVehicle.status === 'active' ? 'default' : 'secondary'}>
              {selectedVehicle.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Gauge className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          <p className="mt-4 text-slate-600">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  // Map controls for mobile
  const mapControls = (
    <MobileMapControls
      onZoomIn={() => console.log('Zoom in')}
      onZoomOut={() => console.log('Zoom out')}
      onLocate={() => console.log('Locate me')}
      onToggleLayers={() => console.log('Toggle layers')}
    />
  );

  return (
    <div className="relative h-full w-full">
      <MapFirstLayout
        mapComponent={
          <ProfessionalFleetMap onVehicleSelect={setSelectedVehicleId}>
            <TrafficCameraLayer
              visible={showTrafficCameras}
              filters={trafficCameraFilters}
              onCameraSelect={(cam) => setSelectedCameraId(cam.id)}
              selectedCameraId={selectedCameraId}
            />
          </ProfessionalFleetMap>
        }
        sidePanel={sidePanel}
        drawerContent={drawerContent}
        mapControls={mapControls}
      />

      {/* Layer Controls - Overlay */}
      <TrafficCameraControlPanel
        isVisible={showTrafficCameras}
        filters={trafficCameraFilters}
        onFilterChange={(k, v) => setTrafficCameraFilters(prev => ({ ...prev, [k]: v }))}
        onClose={() => setShowTrafficCameras(false)}
      />

      {/* Floating Toggle (Temporary until integrated into MapControls) */}
      {!showTrafficCameras && (
        <Button
          className="fixed bottom-6 right-6 z-50 shadow-lg"
          onClick={() => setShowTrafficCameras(true)}
        >
          Show Traffic Cameras
        </Button>
      )}
    </div>
  );
}
