/**
 * VirtualGarage - Enterprise Asset Visualization & Management
 *
 * Production-ready implementation with comprehensive vehicle view:
 * - 3D vehicle viewer with photorealistic rendering
 * - Vehicle stats and health HUD
 * - Damage visualization and summary
 * - Maintenance timeline and history
 * - Driver assignment info
 * - Upcoming maintenance alerts
 *
 * Created: 2025-11-24
 * Updated: 2025-01-03 - Enhanced with comprehensive info panels
 */

import React, { useState, Suspense, lazy, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useGarageFilters, GarageAsset } from './VirtualGarage/hooks/use-garage-filters';
import { AssetCategory } from '@/types/asset.types';
import {
  DamageSummaryPanel,
  generateDemoDamagePoints,
  DamagePoint
} from '@/components/garage/DamageOverlay';
import { VehicleHUD, type VehicleStats } from '@/components/garage/VehicleHUD';
import { TimelineDrawer, generateDemoEvents, type TimelineEvent } from '@/components/garage/TimelineDrawer';
import {
  Car,
  Clock,
  Warning,
  Wrench,
  User,
  CalendarCheck,
  ChartBar,
  Eye,
  CaretRight
} from '@phosphor-icons/react';

// Demo assets used only in development as a fallback - Updated with real fleet vehicles
const DEMO_ASSETS: GarageAsset[] = [
  // Modern Pickup Trucks
  {
    id: '1',
    asset_category: 'HEAVY_TRUCK',
    asset_name: '2024 Ford F-150',
    make: 'Ford',
    model: 'F-150',
    year: 2024,
    asset_tag: 'FLT-001',
    license_plate: 'F150-24A',
    color: '#1E3A8A',
    odometer: 8500,
    engine_hours: 420,
    damage_model_url: '/models/vehicles/trucks/ford_f_150.glb',
  },
  {
    id: '2',
    asset_category: 'HEAVY_TRUCK',
    asset_name: '2024 Chevrolet Silverado',
    make: 'Chevrolet',
    model: 'Silverado 1500',
    year: 2024,
    asset_tag: 'FLT-002',
    license_plate: 'SLV-24B',
    color: '#DC2626',
    odometer: 12400,
    engine_hours: 580,
    damage_model_url: '/models/vehicles/trucks/chevrolet_silverado.glb',
  },
  {
    id: '3',
    asset_category: 'HEAVY_TRUCK',
    asset_name: '2023 RAM 1500',
    make: 'RAM',
    model: '1500 Big Horn',
    year: 2023,
    asset_tag: 'FLT-003',
    license_plate: 'RAM-23C',
    color: '#1F2937',
    odometer: 22100,
    engine_hours: 890,
    damage_model_url: '/models/vehicles/trucks/ram_1500.glb',
  },
  {
    id: '4',
    asset_category: 'HEAVY_TRUCK',
    asset_name: '2024 Toyota Tacoma',
    make: 'Toyota',
    model: 'Tacoma TRD',
    year: 2024,
    asset_tag: 'FLT-004',
    license_plate: 'TAC-24D',
    color: '#059669',
    odometer: 5200,
    engine_hours: 210,
    damage_model_url: '/models/vehicles/trucks/toyota_tacoma.glb',
  },
  // Delivery Vans
  {
    id: '5',
    asset_category: 'PASSENGER_VEHICLE',
    asset_name: '2024 Mercedes Sprinter',
    make: 'Mercedes-Benz',
    model: 'Sprinter 2500',
    year: 2024,
    asset_tag: 'VAN-001',
    license_plate: 'SPR-24E',
    color: '#FAFAFA',
    odometer: 18700,
    damage_model_url: '/models/vehicles/vans/mercedes_benz_sprinter.glb',
  },
  {
    id: '6',
    asset_category: 'PASSENGER_VEHICLE',
    asset_name: '2023 Ford Transit',
    make: 'Ford',
    model: 'Transit 350',
    year: 2023,
    asset_tag: 'VAN-002',
    license_plate: 'TRN-23F',
    color: '#3B82F6',
    odometer: 31500,
    damage_model_url: '/models/vehicles/vans/ford_transit.glb',
  },
  // Utility/Service Trucks
  {
    id: '7',
    asset_category: 'HEAVY_EQUIPMENT',
    asset_name: 'Altech Service Truck',
    make: 'Altech',
    model: 'ST-200 Service',
    year: 2023,
    asset_tag: 'SVC-001',
    license_plate: 'ALT-23G',
    color: '#F59E0B',
    odometer: 42300,
    engine_hours: 1850,
    damage_model_url: '/models/vehicles/trucks/altech_st_200_service.glb',
  },
  {
    id: '8',
    asset_category: 'HEAVY_EQUIPMENT',
    asset_name: 'Altech Flatbed 250',
    make: 'Altech',
    model: 'FH-250 Flatbed',
    year: 2022,
    asset_tag: 'FLT-008',
    license_plate: 'ALT-22H',
    color: '#EF4444',
    odometer: 67800,
    engine_hours: 2940,
    damage_model_url: '/models/vehicles/trucks/altech_fh_250_flatbed.glb',
  },
  // Heavy Duty
  {
    id: '9',
    asset_category: 'HEAVY_TRUCK',
    asset_name: 'Freightliner Cascadia',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2024,
    asset_tag: 'SEM-001',
    license_plate: 'FRT-24I',
    color: '#0F172A',
    odometer: 125000,
    engine_hours: 4200,
    damage_model_url: '/models/vehicles/trucks/freightliner_cascadia.glb',
  },
  {
    id: '10',
    asset_category: 'HEAVY_EQUIPMENT',
    asset_name: 'Altech Dump Truck',
    make: 'Altech',
    model: 'HD-40 Dump',
    year: 2023,
    asset_tag: 'DMP-001',
    license_plate: 'ALT-23J',
    color: '#F97316',
    odometer: 54200,
    engine_hours: 2100,
    damage_model_url: '/models/vehicles/construction/altech_hd_40_dump_truck.glb',
  },
];

// Demo driver data
const DEMO_DRIVERS = [
  { id: '1', name: 'John Smith', status: 'active', vehicleId: '1', phone: '555-0101' },
  { id: '2', name: 'Sarah Johnson', status: 'active', vehicleId: '2', phone: '555-0102' },
  { id: '3', name: 'Mike Chen', status: 'off-duty', vehicleId: '3', phone: '555-0103' },
  { id: '4', name: 'Emily Davis', status: 'active', vehicleId: '4', phone: '555-0104' },
];

// Demo upcoming maintenance
const DEMO_MAINTENANCE = [
  { id: '1', vehicleId: '1', type: 'Oil Change', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), dueMiles: 10000 },
  { id: '2', vehicleId: '2', type: 'Tire Rotation', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), dueMiles: 15000 },
  { id: '3', vehicleId: '3', type: 'Brake Inspection', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), dueMiles: 25000 },
];

// Lazy loaded 3D viewer component
const Asset3DViewer = lazy(() => import('@/components/garage/Asset3DViewer'));

// Fallback UI while 3D viewer is loading
const Viewer3DFallback: React.FC = () => (
  <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-slate-800">
    <div className="text-center text-white">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm">Loading 3D viewer...</p>
    </div>
  </div>
);

// Error boundary to catch errors from the 3D viewer
interface ViewerErrorBoundaryProps {
  children: React.ReactNode;
}

interface ViewerErrorBoundaryState {
  hasError: boolean;
}

class ViewerErrorBoundary extends React.Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  constructor(props: ViewerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ViewerErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('3D viewer error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-900 text-red-400">
          <div className="text-center">
            <Warning className="w-12 h-12 mx-auto mb-3" />
            <p>Failed to load 3D viewer</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Component that renders the comprehensive asset view
interface AssetDisplayProps {
  asset?: GarageAsset | null;
}

const AssetDisplay: React.FC<AssetDisplayProps> = ({ asset }) => {
  const [selectedDamageId, setSelectedDamageId] = useState<string | undefined>();
  const [currentCamera, setCurrentCamera] = useState<string>('hero');
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Generate demo data for the selected asset
  const damagePoints = useMemo(() => generateDemoDamagePoints(), []);
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!asset) return [];
    return generateDemoEvents(asset.id);
  }, [asset]);

  // Build vehicle stats for HUD
  const vehicleStats = useMemo<VehicleStats | null>(() => {
    if (!asset) return null;
    return {
      name: asset.asset_name || `${asset.year} ${asset.make} ${asset.model}`,
      make: asset.make,
      model: asset.model,
      year: asset.year,
      vin: asset.vin,
      licensePlate: asset.license_plate,
      mileage: asset.odometer,
      engineHours: asset.engine_hours,
      oilLife: 72,
      brakeLife: 65,
      tireHealth: 80,
      batteryHealth: 95,
      fuelLevel: 68,
      coolantTemp: 195,
    };
  }, [asset]);

  // Get assigned driver
  const assignedDriver = useMemo(() => {
    if (!asset) return null;
    return DEMO_DRIVERS.find(d => d.vehicleId === asset.id);
  }, [asset]);

  // Get upcoming maintenance for this vehicle
  const upcomingMaintenance = useMemo(() => {
    if (!asset) return [];
    return DEMO_MAINTENANCE.filter(m => m.vehicleId === asset.id);
  }, [asset]);

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400">
        <div className="text-center">
          <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a vehicle to view</p>
          <p className="text-sm mt-2">Choose from the vehicle list on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Top Bar with Vehicle Info and Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div
            className="w-4 h-4 rounded-full border-2 border-white/50"
            style={{ backgroundColor: asset.color || '#3B82F6' }}
          />
          <div>
            <h2 className="text-lg font-bold text-white">
              {asset.asset_name || `${asset.year} ${asset.make} ${asset.model}`}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {asset.license_plate && <Badge variant="secondary" className="text-xs">{asset.license_plate}</Badge>}
              {asset.asset_tag && <Badge variant="outline" className="text-xs">{asset.asset_tag}</Badge>}
              {asset.odometer && <span className="text-xs text-slate-400">{asset.odometer.toLocaleString()} mi</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTimelineOpen(!isTimelineOpen)}
            className={isTimelineOpen ? 'bg-blue-600 text-white' : ''}
          >
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Vehicle Stats */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/30 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 p-1 mx-2 mt-2">
              <TabsTrigger value="overview" className="text-xs">
                <ChartBar className="w-3 h-3 mr-1" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="damage" className="text-xs">
                <Warning className="w-3 h-3 mr-1" />
                Damage
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="text-xs">
                <Wrench className="w-3 h-3 mr-1" />
                Service
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-3 mt-0">
              {vehicleStats && <VehicleHUD stats={vehicleStats} />}

              {/* Assigned Driver */}
              {assignedDriver && (
                <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Assigned Driver
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {assignedDriver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-white font-medium">{assignedDriver.name}</p>
                      <p className="text-xs text-slate-400">{assignedDriver.phone}</p>
                    </div>
                    <Badge
                      variant={assignedDriver.status === 'active' ? 'default' : 'secondary'}
                      className="ml-auto text-xs"
                    >
                      {assignedDriver.status}
                    </Badge>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="damage" className="mt-0">
              <DamageSummaryPanel
                damagePoints={damagePoints}
                onSelectDamage={(point) => setSelectedDamageId(point.id)}
                selectedDamageId={selectedDamageId}
              />
            </TabsContent>

            <TabsContent value="maintenance" className="p-3 mt-0">
              {/* Upcoming Maintenance */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CalendarCheck className="w-3 h-3" />
                  Upcoming Service
                </h4>
                {upcomingMaintenance.length > 0 ? (
                  upcomingMaintenance.map(maint => (
                    <div
                      key={maint.id}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{maint.type}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.ceil((maint.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Due at {maint.dueMiles?.toLocaleString()} miles
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming maintenance</p>
                  </div>
                )}

                {/* Recent Service History */}
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2 mt-4">
                  <Clock className="w-3 h-3" />
                  Recent Service
                </h4>
                {timelineEvents
                  .filter(e => e.type === 'maintenance' || e.type === 'service')
                  .slice(0, 3)
                  .map(event => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:bg-slate-800/50"
                      onClick={() => setIsTimelineOpen(true)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{event.title}</span>
                        <CaretRight className="w-4 h-4 text-slate-500" />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {event.date.toLocaleDateString()} • ${event.cost?.toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - 3D Viewer */}
        <div className="flex-1 relative">
          <ViewerErrorBoundary>
            <Suspense fallback={<Viewer3DFallback />}>
              <Asset3DViewer
                assetCategory={asset.asset_category}
                make={asset.make}
                model={asset.model}
                year={asset.year}
                color={asset.color ?? '#3B82F6'}
                customModelUrl={asset.damage_model_url}
                damagePoints={damagePoints}
                selectedDamageId={selectedDamageId}
                onSelectDamage={(point) => setSelectedDamageId(point.id)}
                showDamage={true}
                currentCamera={currentCamera}
                onCameraChange={setCurrentCamera}
                showControls={true}
              />
            </Suspense>
          </ViewerErrorBoundary>

          {/* Camera hint overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/80 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>Drag to rotate • Scroll to zoom</span>
          </div>
        </div>

        {/* Right Panel - Damage Details (shown when damage selected) */}
        {selectedDamageId && (
          <div className="w-72 border-l border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Damage Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDamageId(undefined)}
              >
                ✕
              </Button>
            </div>
            {(() => {
              const damage = damagePoints.find(d => d.id === selectedDamageId);
              if (!damage) return null;
              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Zone</p>
                    <p className="text-white font-medium">{damage.zone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Severity</p>
                    <Badge
                      variant={damage.severity === 'critical' || damage.severity === 'severe' ? 'destructive' : 'secondary'}
                      className="capitalize mt-1"
                    >
                      {damage.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Description</p>
                    <p className="text-white text-sm">{damage.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Estimated Cost</p>
                    <p className="text-green-400 font-bold text-xl">${damage.estimatedCost.toLocaleString()}</p>
                  </div>
                  <Button className="w-full" variant="outline">
                    Create Work Order
                  </Button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Timeline Drawer */}
      <TimelineDrawer
        events={timelineEvents}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        onEventClick={(event) => console.log('Event clicked:', event)}
      />
    </div>
  );
};

// Fetch assets from API; fallback to demo data when API unavailable
async function fetchAssets(): Promise<GarageAsset[]> {
  try {
    const res = await fetch('/api/vehicles');
    if (!res.ok) throw new Error('Failed to fetch vehicles');

    // API returns { data: Vehicle[], total: number }
    const response = await res.json();
    const vehicles = response.data || response;

    // Transform vehicles to GarageAsset format
    const assets: GarageAsset[] = Array.isArray(vehicles) ? vehicles.map((v: any) => ({
      id: v.id?.toString() || '',
      make: v.make || '',
      model: v.model || '',
      year: v.year || new Date().getFullYear(),
      asset_name: v.number || `${v.year} ${v.make} ${v.model}`,
      asset_tag: v.number || v.asset_tag,
      license_plate: v.license_plate || v.licensePlate,
      asset_category: v.asset_category,
      vin: v.vin,
      color: v.color,
      odometer: v.odometer,
      engine_hours: v.engine_hours,
      damage_model_url: v.damage_model_url
    })) : [];

    return assets.length > 0 ? assets : DEMO_ASSETS;
  } catch (error) {
    // Always return demo data when API is unavailable
    if (import.meta.env.DEV) {
      console.warn('[VirtualGarage] API unavailable, using demo assets:', error);
    }
    return DEMO_ASSETS;
  }
}

// Main VirtualGarage component
export function VirtualGarage() {
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery<GarageAsset[]>({
    queryKey: ['garageAssets'],
    queryFn: fetchAssets,
  });

  const assets: GarageAsset[] = data ?? [];

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categoryCounts,
    filteredAssets,
  } = useGarageFilters(assets);

  const [selectedAsset, setSelectedAsset] = useState<GarageAsset | null>(null);

  // Build list of categories, including 'ALL' to represent no filter
  const categories: string[] = ['ALL', ...Object.keys(categoryCounts)];

  const handleSelectAsset = (asset: GarageAsset) => {
    setSelectedAsset(asset);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar with search, category select, asset list */}
      <div className="w-72 border-r border-slate-800 h-full flex flex-col bg-slate-900">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Virtual Garage
          </h2>
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading || !!error}
            className="bg-slate-800 border-slate-700"
          />
        </div>
        <div className="px-4 py-2">
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as AssetCategory | "ALL")}
            disabled={isLoading || !!error}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'ALL'
                    ? `All Vehicles (${assets.length})`
                    : `${cat.replace(/_/g, ' ')} (${categoryCounts[cat] ?? 0})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-1">
          {isLoading && (
            <div className="p-4 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading vehicles...</p>
            </div>
          )}
          {error && (
            <div className="p-4 text-center text-red-400">
              <Warning className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm mb-2">Failed to load vehicles</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}
          {!isLoading && !error && (
            <ul className="py-2">
              {filteredAssets.map((asset: GarageAsset) => (
                <li
                  key={asset.id}
                  className={`mx-2 mb-1 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAsset?.id === asset.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/50 hover:bg-slate-800 text-white'
                  }`}
                  onClick={() => handleSelectAsset(asset)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: asset.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {asset.asset_name || `${asset.year} ${asset.make} ${asset.model}`}
                      </p>
                      <p className={`text-xs ${selectedAsset?.id === asset.id ? 'text-white/70' : 'text-slate-400'}`}>
                        {asset.asset_tag || asset.license_plate || ''}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {filteredAssets.length === 0 && (
                <li className="p-4 text-center text-slate-500 text-sm">
                  No vehicles found
                </li>
              )}
            </ul>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <p className="text-xs text-slate-500 text-center">
            {filteredAssets.length} of {assets.length} vehicles
          </p>
        </div>
      </div>
      {/* Main viewer panel */}
      <div className="flex-1">
        <AssetDisplay asset={selectedAsset} />
      </div>
    </div>
  );
}
