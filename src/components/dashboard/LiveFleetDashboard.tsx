import { AlertCircle, Truck, Wrench, MapPin, Gauge, Fuel, Video, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { MapFirstLayout } from '../layout/MapFirstLayout';
import { ProfessionalFleetMap } from '../map/ProfessionalFleetMap';
import { MobileMapControls } from '../mobile/MobileMapControls';
import { MobileQuickActions } from '../mobile/MobileQuickActions';
import { MobileVehicleCard } from '../mobile/MobileVehicleCard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { DrilldownCard } from '@/components/drilldown/DrilldownCard';
import { GeofenceLayer } from '@/components/layers/GeofenceLayer';
import { TrafficCameraLayer } from '@/components/layers/TrafficCameraLayer';
import { MapLayerControl } from '@/components/map/MapLayerControl';
import { DriverControlPanel } from '@/components/panels/DriverControlPanel';
import { DriverDetailPanel } from '@/components/panels/DriverDetailPanel';
import { GeofenceControlPanel } from '@/components/panels/GeofenceControlPanel';
import { GeofenceIntelligencePanel } from '@/components/panels/GeofenceIntelligencePanel';
import { TrafficCameraControlPanel } from '@/components/panels/TrafficCameraControlPanel';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { useVehicles, useDrivers } from '@/hooks/use-api';
import { useGeofenceBreachDetector } from '@/hooks/use-geofence-breach';
import { generateDemoVehicles } from '@/lib/demo-data';
import { Geofence, Driver } from '@/lib/types';
import logger from '@/utils/logger';


const LOADING_TIMEOUT = 5000; // 5 seconds timeout

interface LiveFleetDashboardProps {
  initialLayer?: string;
}

// ... existing imports

export const LiveFleetDashboard = React.memo(function LiveFleetDashboard({ initialLayer }: LiveFleetDashboardProps = {}) {

  const { push } = useDrilldown();
  const { data: vehiclesData, isLoading: apiLoading, error: apiError } = useVehicles();
  const { data: driversData } = useDrivers();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // -- Data Sync --
  useEffect(() => {
    if (driversData) {
      // Extract array from API response structure {data: [], meta: {}}
      const driversArray = Array.isArray(driversData)
        ? driversData
        : ((driversData as any)?.data || []);
      setDrivers(driversArray as unknown as Driver[]);
    }
  }, [driversData]);

  // -- Traffic Camera State --
  const [searchParams] = useSearchParams();
  const [showTrafficCameras, setShowTrafficCameras] = useState(false);
  const [trafficCameraFilters, setTrafficCameraFilters] = useState({
    search: "",
    status: "all" as "all" | "operational" | "offline",
    source: "all"
  });
  const [selectedCameraId, setSelectedCameraId] = useState<string>();

  // -- Geofence State --
  const [showGeofences, setShowGeofences] = useState(false);
  const [selectedGeofenceForIntelligence, setSelectedGeofenceForIntelligence] = useState<Geofence | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([
    // Pre-seed with a demo geofence so users see something immediately
    {
      id: 'demo-1',
      tenantId: 'demo',
      name: 'Main HQ',
      description: 'Headquarters geofence',
      type: 'circle',
      active: true,
      color: '#3B82F6',
      center: { lat: 30.4383, lng: -84.2807 }, // Tallahassee
      radius: 1000,
      triggers: { onEnter: true, onExit: true, onDwell: false },
      notifyUsers: [],
      notifyRoles: [],
      alertPriority: 'medium',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  ]);

  // -- Driver State --
  const [showDrivers, setShowDrivers] = useState(false);
  const [selectedDriverForDetail, setSelectedDriverForDetail] = useState<Driver | null>(null);

  // Advanced: Breach Detection Hook
  const { activeBreaches, breachesByGeofence } = useGeofenceBreachDetector(vehicles, geofences);
  const activeBreachCount = activeBreaches.length;
  // Get IDs of geofences that have at least one active breach
  const breachedGeofenceIds = Object.keys(breachesByGeofence).filter(id => (breachesByGeofence[id]?.length || 0) > 0);

  // Deep linking for layers
  useEffect(() => {
    const layerParam = searchParams.get('layer');
    if (layerParam === 'cameras' || initialLayer === 'traffic-cameras') {
      setShowTrafficCameras(true);
    }
    if (layerParam === 'geofences' || initialLayer === 'geofences') {
      setShowGeofences(true);
    }
    if (layerParam === 'drivers' || initialLayer === 'drivers') {
      setShowDrivers(true);
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
      icon: <Truck className="h-5 w-5" aria-hidden="true" />,
      onClick: () => console.log('Dispatch clicked')
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: <Wrench className="h-5 w-5" aria-hidden="true" />,
      onClick: () => console.log('Maintenance clicked')
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
      onClick: () => console.log('Alerts clicked'),
      badge: maintenanceCount
    },
    {
      id: 'fuel',
      label: 'Fuel',
      icon: <Fuel className="h-5 w-5" aria-hidden="true" />,
      onClick: () => console.log('Fuel clicked')
    }
  ];

  // Side Panel Content
  const sidePanel = (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Fleet Overview</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time vehicle monitoring</p>
      </div>

      {/* Quick Stats - Responsive Grid with Drilldown */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <DrilldownCard
          title="Active"
          value={activeCount}
          drilldownType="active-vehicles"
          drilldownLabel={`Active Vehicles (${activeCount})`}
          drilldownData={{ status: 'active', vehicles }}
          icon={<Truck className="h-4 w-4" aria-hidden="true" />}
          color="success"
          variant="compact"
          className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200 dark:border-slate-800"
        />
        <DrilldownCard
          title="Maint."
          value={maintenanceCount}
          drilldownType="maintenance-vehicles"
          drilldownLabel={`Maintenance Vehicles (${maintenanceCount})`}
          drilldownData={{ status: 'maintenance', vehicles }}
          icon={<Wrench className="h-4 w-4" aria-hidden="true" />}
          color="warning"
          variant="compact"
          className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200 dark:border-slate-800"
        />
        <DrilldownCard
          title="Total"
          value={totalVehicles}
          drilldownType="all-vehicles"
          drilldownLabel={`All Vehicles (${totalVehicles})`}
          drilldownData={{ vehicles }}
          icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
          color="default"
          variant="compact"
          className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200 dark:border-slate-800"
        />
      </div>

      {/* Selected Vehicle Info */}
      {selectedVehicle && (
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="font-mono text-slate-900 dark:text-slate-100">{selectedVehicle.vehicleNumber || selectedVehicle.number || 'N/A'}</span>
              <Badge
                className={selectedVehicle.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-500'}
              >
                {selectedVehicle.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            <div className="flex items-center text-sm">
              <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 mr-3" aria-hidden="true">
                <Truck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {selectedVehicle.name ||
                  `${selectedVehicle.make || ''} ${selectedVehicle.model || ''}`.trim() ||
                  'Unknown Vehicle'}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 mr-3" aria-hidden="true">
                <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <span className="font-mono text-slate-600 dark:text-slate-300">
                {Number(selectedVehicle.location?.lat ?? selectedVehicle.latitude ?? 0).toFixed(4)},
                {' '}
                {Number(selectedVehicle.location?.lng ?? selectedVehicle.longitude ?? 0).toFixed(4)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Mobile Optimized */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Actions</h3>
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
            aria-label="Dispatch vehicle"
          >
            <Truck className="h-4 w-4 mr-1" aria-hidden="true" />
            Dispatch
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="maintenance-action"
            aria-label="Schedule maintenance"
          >
            <Wrench className="h-4 w-4 mr-1" aria-hidden="true" />
            Maintenance
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="alerts-action"
            aria-label={`View alerts (${maintenanceCount} active)`}
          >
            <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
            Alerts
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="fuel-action"
            aria-label="Fuel management"
          >
            <Fuel className="h-4 w-4 mr-1" aria-hidden="true" />
            Fuel
          </Button>
        </div>
      </div>

      {/* Vehicle List - Mobile uses MobileVehicleCard, Desktop uses custom */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recent Activity</h3>
        {/* Mobile: List variant with drill-down */}
        <div className="md:hidden space-y-0 max-h-64 overflow-y-auto border-t border-slate-200 dark:border-slate-700">
          {vehicles.slice(0, 10).map((vehicle: any) => (
            <MobileVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onClick={(v) => {
                setSelectedVehicleId(v.id);
                push({
                  id: `vehicle-${v.id}`,
                  type: 'vehicle',
                  label: (v as any).vehicleNumber || v.number || v.name || `Vehicle ${v.id}`,
                  data: { vehicleId: v.id, ...v }
                });
              }}
              variant="list"
            />
          ))}
        </div>
        {/* Desktop: Original design with drill-down */}
        <div className="hidden md:block space-y-2 max-h-64 overflow-y-auto">
          {vehicles.slice(0, 10).map((vehicle: any) => (
            <div
              key={vehicle.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedVehicleId === vehicle.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-card'
                }`}
              onClick={() => {
                setSelectedVehicleId(vehicle.id);
                push({
                  id: `vehicle-${vehicle.id}`,
                  type: 'vehicle',
                  label: vehicle.vehicleNumber || vehicle.number || vehicle.name || `Vehicle ${vehicle.id}`,
                  data: { vehicleId: vehicle.id, ...vehicle }
                });
              }}
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
      <div className="flex items-center justify-center h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <Gauge className="h-12 w-12 animate-spin mx-auto text-blue-500" aria-hidden="true" />
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

  // Handler for vehicle selection with drill-down
  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      push({
        id: `vehicle-${vehicleId}`,
        type: 'vehicle',
        label: vehicle.vehicleNumber || vehicle.number || vehicle.name || `Vehicle ${vehicleId}`,
        data: { vehicleId, ...vehicle }
      });
    }
  };

  return (
    <div className="relative h-full w-full">
      <MapFirstLayout
        mapComponent={
          <ProfessionalFleetMap onVehicleSelect={handleVehicleSelect}>
            <TrafficCameraLayer
              visible={showTrafficCameras}
              filters={trafficCameraFilters}
              onCameraSelect={(cam) => setSelectedCameraId(cam.id)}
              selectedCameraId={selectedCameraId}
            />
            <GeofenceLayer
              visible={showGeofences}
              geofences={geofences}
              onGeofenceSelect={setSelectedGeofenceForIntelligence}
              breachedGeofenceIds={breachedGeofenceIds}
            />
          </ProfessionalFleetMap>
        }
        sidePanel={sidePanel}
        drawerContent={drawerContent}
        mapControls={mapControls}
      />

      {/* Layer Controls - Overlay */}
      < TrafficCameraControlPanel
        isVisible={showTrafficCameras}
        filters={trafficCameraFilters}
        onFilterChange={(k, v) => setTrafficCameraFilters(prev => ({ ...prev, [k]: v }))}
        onClose={() => setShowTrafficCameras(false)}
      />

      < GeofenceControlPanel
        isVisible={showGeofences}
        geofences={geofences}
        onGeofencesChange={setGeofences}
        onClose={() => setShowGeofences(false)}
      />

      <GeofenceIntelligencePanel
        geofence={selectedGeofenceForIntelligence}
        onClose={() => setSelectedGeofenceForIntelligence(null)}
        vehicles={vehicles}
        breachedVehicleIds={selectedGeofenceForIntelligence ? (breachesByGeofence[selectedGeofenceForIntelligence.id] || []) : []}
      />

      {/* Driver Management Panels */}
      <DriverControlPanel
        isVisible={showDrivers}
        drivers={drivers}
        onDriverSelect={setSelectedDriverForDetail}
        onClose={() => setShowDrivers(false)}
        onDriversChange={setDrivers}
      />

      <DriverDetailPanel
        driver={selectedDriverForDetail}
        vehicles={vehicles}
        onClose={() => setSelectedDriverForDetail(null)}
      />

      {/* Unified Layer Control */}
      <MapLayerControl
        layers={[
          {
            id: 'traffic-cameras',
            label: 'Traffic Cameras',
            icon: <Video className="w-4 h-4" aria-hidden="true" />,
            active: showTrafficCameras,
            count: 12, // Demo count
            onToggle: setShowTrafficCameras
          },
          {
            id: 'geofences',
            label: 'Geofences',
            icon: <MapPin className="w-4 h-4" aria-hidden="true" />,
            active: showGeofences,
            // Show active breach count if any (critical info), otherwise total active count
            count: activeBreachCount > 0 ? activeBreachCount : geofences.filter(g => g.active).length,
            onToggle: setShowGeofences
          },
          {
            id: 'drivers',
            label: 'Drivers',
            icon: <Users className="w-4 h-4" aria-hidden="true" />,
            active: showDrivers,
            count: drivers.length,
            onToggle: setShowDrivers
          }
        ]}
      />
    </div >
  );
});
