import { AlertCircle, Truck, Wrench, MapPin, Gauge, Fuel, Video, Users, HeartPulse, Calendar, Shield, Zap, Navigation, Search, ArrowUpDown, Activity, Clock, ChevronRight } from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';

import { GoogleMap, GoogleMapHandle } from '../GoogleMap';
import { MapFirstLayout } from '../layout/MapFirstLayout';
import { MapLegend } from '../map/MapLegend';
import { MapMarkerSettings } from '../map/MapMarkerSettings';
import { MapToolbar } from '../map/MapToolbar';
import { VehicleTypeFilter, VehicleFilters } from '../map/VehicleTypeFilter';
import { MobileQuickActions } from '../mobile/MobileQuickActions';
import { MobileVehicleCard } from '../mobile/MobileVehicleCard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';

import { MapLayerControl } from '@/components/map/MapLayerControl';
import { DriverControlPanel } from '@/components/panels/DriverControlPanel';
import { DriverDetailPanel } from '@/components/panels/DriverDetailPanel';
import { GeofenceControlPanel } from '@/components/panels/GeofenceControlPanel';
import { GeofenceIntelligencePanel } from '@/components/panels/GeofenceIntelligencePanel';
import { TrafficCameraControlPanel } from '@/components/panels/TrafficCameraControlPanel';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useDrivers } from '@/hooks/use-api';
import { useGeofenceBreachDetector } from '@/hooks/use-geofence-breach';
import { Geofence, Driver } from '@/lib/types';
import { useMapMarkerSettings } from '@/stores/useMapMarkerSettings';
import { formatEnum } from '@/utils/format-enum';
import { formatNumber, formatDate } from '@/utils/format-helpers';
import logger from '@/utils/logger';
import { formatVehicleName } from '@/utils/vehicle-display';


const LOADING_TIMEOUT = 5000; // 5 seconds timeout

interface LiveFleetDashboardProps {
  initialLayer?: string;
}

// ... existing imports

const geofenceFetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json()
  });

const normalizeGeofence = (row: any): Geofence => {
  const metadata = row?.metadata && typeof row.metadata === 'object'
    ? row.metadata
    : row?.metadata
      ? (() => {
          try {
            return JSON.parse(row.metadata);
          } catch {
            return {};
          }
        })()
      : {};

  const centerLat = row.centerLat ?? row.center_lat ?? row.center_latitude;
  const centerLng = row.centerLng ?? row.center_lng ?? row.center_longitude;
  const polygon = row.polygon ?? row.polygon_coordinates ?? metadata?.polygon;

  const triggers = metadata.triggers || {
    onEnter: row.notifyOnEntry ?? row.notify_on_entry ?? false,
    onExit: row.notifyOnExit ?? row.notify_on_exit ?? false,
    onDwell: metadata?.onDwell ?? false,
    dwellTimeMinutes: metadata?.dwellTimeMinutes
  };

  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description || '',
    type: row.type || row.geofence_type || 'circle',
    center: centerLat != null && centerLng != null
      ? { lat: Number(centerLat), lng: Number(centerLng) }
      : undefined,
    radius: row.radius != null ? Number(row.radius) : row.radius_meters != null ? Number(row.radius_meters) : undefined,
    coordinates: Array.isArray(polygon) ? polygon : polygon?.coordinates,
    color: row.color || '#10b981',
    active: row.isActive ?? row.is_active ?? true,
    triggers: {
      onEnter: !!triggers.onEnter,
      onExit: !!triggers.onExit,
      onDwell: !!triggers.onDwell,
      dwellTimeMinutes: triggers.dwellTimeMinutes
    },
    notifyUsers: metadata.notifyUsers || [],
    notifyRoles: metadata.notifyRoles || [],
    alertPriority: metadata.alertPriority || 'medium',
    createdBy: metadata.createdBy || 'system',
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    lastModified: row.updatedAt || row.updated_at || new Date().toISOString()
  };
};

export const LiveFleetDashboard = React.memo(function LiveFleetDashboard({ initialLayer }: LiveFleetDashboardProps = {}) {

  // Fetch from real /api/vehicles endpoint (max limit is 200)
  const { data: vehiclesData, isLoading: apiLoading, error: apiError } = useSWR(
    '/api/vehicles?limit=200',
    (url) => fetch(url, { credentials: 'include' }).then(r => {
      if (!r.ok) throw new Error(`Request failed: ${r.status}`)
      return r.json()
    }),
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );
  // Also fetch dashboard stats for accurate counts (DB-aggregated)
  const { data: dashboardStats } = useSWR(
    '/api/dashboard/stats',
    (url) => fetch(url, { credentials: 'include' }).then(r => {
      if (!r.ok) throw new Error(`Request failed: ${r.status}`)
      return r.json()
    }),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const { data: driversData } = useDrivers();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const mapRef = useRef<GoogleMapHandle>(null);
  const { markerStyle, markerSize, showLabels } = useMapMarkerSettings();
  const { navigateTo } = useNavigation();
  const { push: openDrilldown } = useDrilldown();

  // -- Data Sync --
  useEffect(() => {
    if (driversData) {
      // Extract array from API response structure {data: [], meta: {}}
      const driversArray = Array.isArray(driversData)
        ? driversData
        : ((driversData as any)?.data || []);
      const normalized = driversArray.map((row: any) => {
        const metadata = row?.metadata && typeof row.metadata === 'object'
          ? row.metadata
          : row?.metadata
            ? (() => {
                try {
                  return JSON.parse(row.metadata);
                } catch {
                  return {};
                }
              })()
            : {};
        const status =
          row.status === 'inactive'
            ? 'off-duty'
            : row.status === 'on_leave'
              ? 'on-leave'
              : row.status === 'suspended'
                ? 'suspended'
                : 'active';
        return {
          id: row.id,
          tenantId: row.tenant_id,
          employeeId: row.employee_number || '',
          name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          department: metadata.department || '',
          licenseType: row.cdl ? 'CDL' : 'Standard',
          licenseExpiry: row.license_expiry_date,
          safetyScore: row.performance_score ? Number(row.performance_score) : 100,
          certifications: metadata.certifications || [],
          status
        } as Driver;
      });
      setDrivers(normalized);
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
  const { data: trafficCamerasResponse } = useSWR(showTrafficCameras ? '/api/traffic-cameras' : null, geofenceFetcher);
  const trafficCameraRows = Array.isArray(trafficCamerasResponse)
    ? trafficCamerasResponse
    : (trafficCamerasResponse?.data || []);
  const trafficCameraCount = trafficCameraRows.length;

  // -- Geofence State --
  const [showGeofences, setShowGeofences] = useState(false);
  const [selectedGeofenceForIntelligence, setSelectedGeofenceForIntelligence] = useState<Geofence | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const { data: geofencesResponse } = useSWR(showGeofences ? '/api/geofences' : null, geofenceFetcher);

  useEffect(() => {
    if (!geofencesResponse) return;
    const raw = Array.isArray(geofencesResponse)
      ? geofencesResponse
      : geofencesResponse?.data;
    const rows = Array.isArray(raw) ? raw : [];
    setGeofences(rows.map(normalizeGeofence));
  }, [geofencesResponse]);

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


  // Timeout fallback - removed to comply with "no mock data" policy
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && vehicles.length === 0) {
        logger.warn('[LiveFleetDashboard] API timeout - checked for data');
        setIsLoading(false);
      }
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [isLoading, vehicles.length]);

  // Handle API data updates
  useEffect(() => {
    if (!apiLoading) {
      if (apiError) {
        logger.error('[LiveFleetDashboard] API error:', apiError);
        setIsLoading(false);
      } else if (vehiclesData) {
        // Handle both direct array and nested data structure
        // Real API returns: {success, data: {data: [...], total: 300}, meta: {...}}
        let vehicleArray: any[] = [];

        if (Array.isArray(vehiclesData)) {
          vehicleArray = vehiclesData;
        } else if (typeof vehiclesData === 'object') {
          // Check for nested structure: data.data (from real /api/vehicles)
          if ((vehiclesData as any).data?.data && Array.isArray((vehiclesData as any).data.data)) {
            vehicleArray = (vehiclesData as any).data.data;
          }
          // Check for flat structure: data (from other APIs)
          else if (Array.isArray((vehiclesData as any).data)) {
            vehicleArray = (vehiclesData as any).data;
          }
        }

        if (vehicleArray.length > 0) {
          logger.info(`[LiveFleetDashboard] API data loaded successfully: ${vehicleArray.length} vehicles`);
          setVehicles(vehicleArray);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    }
  }, [apiLoading, apiError, vehiclesData]);

  const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId) || vehicles[0];

  // Map style defaults to roadmap; Google's native map type control handles switching

  // -- Vehicle type filter state --
  const [vehicleFilters, setVehicleFilters] = useState<VehicleFilters>({
    visibleTypes: new Set<string>(),
    visibleStatuses: new Set<string>(),
    search: '',
  });

  // Compute which vehicle IDs should be visible on the map based on filters
  const visibleVehicleIds = useMemo(() => {
    const hasTypeFilter = vehicleFilters.visibleTypes.size > 0;
    const hasStatusFilter = vehicleFilters.visibleStatuses.size > 0;
    const hasSearch = vehicleFilters.search.trim().length > 0;

    // No filters → show all (return null to indicate "no filtering")
    if (!hasTypeFilter && !hasStatusFilter && !hasSearch) return null;

    const ids = new Set<string>();
    const q = vehicleFilters.search.toLowerCase();
    for (const v of vehicles) {
      const type = v.type || v.vehicle_type || 'unknown';
      if (hasTypeFilter && !vehicleFilters.visibleTypes.has(type)) continue;
      if (hasStatusFilter && !vehicleFilters.visibleStatuses.has(v.status || 'unknown')) continue;
      if (hasSearch) {
        const name = (v.name || '').toLowerCase();
        const num = (v.vehicleNumber || v.number || '').toLowerCase();
        const make = (v.make || '').toLowerCase();
        const model = (v.model || '').toLowerCase();
        if (!name.includes(q) && !num.includes(q) && !make.includes(q) && !model.includes(q)) continue;
      }
      ids.add(v.id);
    }
    return ids;
  }, [vehicles, vehicleFilters]);

  // Quick stats - prefer DB-aggregated dashboard stats, fallback to vehicle array filtering
  const dbStats = dashboardStats?.data;
  const activeCount = dbStats?.active_vehicles ?? vehicles.filter((v: any) => v.status === 'active').length;
  const maintenanceCount = dbStats?.maintenance_vehicles ?? vehicles.filter((v: any) =>
    v.status === 'maintenance' || v.status === 'service'
  ).length;
  const totalVehicles = dbStats?.total_vehicles ?? vehicles.length;

  // Quick actions for mobile
  const quickActions = [
    {
      id: 'dispatch',
      label: 'Dispatch',
      icon: <Truck className="h-5 w-5" />,
      onClick: () => navigateTo('fleet')
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: <Wrench className="h-5 w-5" />,
      onClick: () => navigateTo('maintenance')
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertCircle className="h-5 w-5" />,
      onClick: () => navigateTo('safety'),
      badge: maintenanceCount
    },
    {
      id: 'fuel',
      label: 'Fuel',
      icon: <Fuel className="h-5 w-5" />,
      onClick: () => navigateTo('operations')
    }
  ];

  // -- Side panel state --
  const [sideSearch, setSideSearch] = useState('');
  const [sideSort, setSideSort] = useState<'status' | 'name' | 'fuel' | 'health'>('status');

  // -- Computed fleet metrics --
  const fleetMetrics = useMemo(() => {
    if (vehicles.length === 0) return null;
    const statuses: Record<string, number> = {};
    let totalFuel = 0, fuelCount = 0;
    let totalHealth = 0, healthCount = 0;
    let inMotion = 0;
    for (const v of vehicles) {
      const s = v.status || 'unknown';
      statuses[s] = (statuses[s] || 0) + 1;
      const fl = v.fuelLevel ?? v.fuel_level;
      if (fl != null) { totalFuel += Number(fl); fuelCount++; }
      const hs = v.health_score;
      if (typeof hs === 'number') { totalHealth += hs; healthCount++; }
      if (v.speed && Number(v.speed) > 0) inMotion++;
    }
    return {
      statuses,
      avgFuel: fuelCount > 0 ? Math.round(totalFuel / fuelCount) : null,
      avgHealth: healthCount > 0 ? Math.round(totalHealth / healthCount) : null,
      inMotion,
      utilization: vehicles.length > 0 ? Math.round(((statuses['active'] || 0) / vehicles.length) * 100) : 0,
    };
  }, [vehicles]);

  // -- Sorted/filtered vehicle list for side panel --
  const sortedVehicles = useMemo(() => {
    let list = [...vehicles];
    const q = sideSearch.toLowerCase().trim();
    if (q) {
      list = list.filter((v: any) => {
        const name = (v.name || '').toLowerCase();
        const num = (v.vehicleNumber || v.number || '').toLowerCase();
        const make = (v.make || '').toLowerCase();
        const model = (v.model || '').toLowerCase();
        const vin = (v.vin || '').toLowerCase();
        return name.includes(q) || num.includes(q) || make.includes(q) || model.includes(q) || vin.includes(q);
      });
    }
    list.sort((a: any, b: any) => {
      if (sideSort === 'status') {
        const order: Record<string, number> = { emergency: 0, service: 1, en_route: 2, dispatched: 3, on_site: 4, assigned: 5, active: 6, charging: 7, idle: 8, maintenance: 9, completed: 10, offline: 11, retired: 12 };
        return (order[a.status] ?? 6) - (order[b.status] ?? 6);
      }
      if (sideSort === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sideSort === 'fuel') return (Number(b.fuelLevel ?? b.fuel_level ?? 0)) - (Number(a.fuelLevel ?? a.fuel_level ?? 0));
      if (sideSort === 'health') return (Number(b.health_score ?? 0)) - (Number(a.health_score ?? 0));
      return 0;
    });
    return list;
  }, [vehicles, sideSearch, sideSort]);

  // Side Panel Content
  const sidePanel = (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-white/95">Fleet Dashboard</h1>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Real-time vehicle monitoring</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
          <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Fleet Status Distribution Bar */}
      {fleetMetrics && vehicles.length > 0 && (() => {
        const statusConfig = [
          { key: 'active', label: 'Active', color: '#10b981' },
          { key: 'idle', label: 'Idle', color: '#6b7280' },
          { key: 'charging', label: 'Charging', color: '#10b981' },
          { key: 'service', label: 'Service', color: '#f59e0b' },
          { key: 'emergency', label: 'Emergency', color: '#ef4444' },
          { key: 'offline', label: 'Offline', color: '#374151' },
          { key: 'assigned', label: 'Assigned', color: '#a3a3a3' },
          { key: 'dispatched', label: 'Dispatched', color: '#fb923c' },
          { key: 'en_route', label: 'En Route', color: '#14b8a6' },
          { key: 'on_site', label: 'On Site', color: '#facc15' },
          { key: 'completed', label: 'Completed', color: '#34d399' },
          { key: 'maintenance', label: 'Maintenance', color: '#f59e0b' },
          { key: 'retired', label: 'Retired', color: '#6b7280' },
        ];
        const total = vehicles.length;
        return (
          <div className="rounded-lg bg-[var(--surface-3)] px-2.5 py-2 border border-white/[0.06]">
            {/* Stacked bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
              {statusConfig.map(({ key, color }) => {
                const count = fleetMetrics.statuses[key] || 0;
                if (count === 0) return null;
                return (
                  <div
                    key={key}
                    style={{ width: `${(count / total) * 100}%`, backgroundColor: color }}
                    className="transition-all duration-500"
                  />
                );
              })}
            </div>
            {/* Labels */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {statusConfig.map(({ key, label, color }) => {
                const count = fleetMetrics.statuses[key] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const next = new Set(vehicleFilters.visibleStatuses);
                      if (next.has(key)) next.delete(key); else { next.clear(); next.add(key); }
                      setVehicleFilters(prev => ({ ...prev, visibleStatuses: next }));
                    }}
                    className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span>{label}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Fleet Pulse — Key Metrics Row */}
      {fleetMetrics && (
        <div className="grid grid-cols-4 gap-1.5">
          <div
            className="rounded-md bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center cursor-pointer hover:border-emerald-500/30 transition-colors"
            onClick={() => openDrilldown({ type: 'fleet-overview', label: 'Fleet Overview' })}
          >
            <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{totalVehicles}</div>
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide">Fleet</div>
          </div>
          <div
            className="rounded-md bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center cursor-pointer hover:border-emerald-500/30 transition-colors"
            onClick={() => openDrilldown({ type: 'active-vehicles', label: 'Active Vehicles' })}
          >
            <div className="text-sm font-bold text-emerald-400 tabular-nums">{fleetMetrics.utilization}%</div>
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide">Util.</div>
          </div>
          <div className="rounded-md bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
            <div className={`text-sm font-bold tabular-nums ${
              (fleetMetrics.avgHealth ?? 0) >= 80 ? 'text-emerald-400' :
              (fleetMetrics.avgHealth ?? 0) >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>{fleetMetrics.avgHealth ?? '—'}</div>
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide">Health</div>
          </div>
          <div className="rounded-md bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
            <div className={`text-sm font-bold tabular-nums ${
              (fleetMetrics.avgFuel ?? 0) >= 50 ? 'text-emerald-400' :
              (fleetMetrics.avgFuel ?? 0) >= 25 ? 'text-amber-400' : 'text-red-400'
            }`}>{fleetMetrics.avgFuel != null ? `${fleetMetrics.avgFuel}%` : '—'}</div>
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide">Fuel</div>
          </div>
        </div>
      )}

      {/* Vehicle Type Breakdown Pills */}
      {vehicles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(
            vehicles.reduce((acc: Record<string, number>, v: any) => {
              const t = v.type || v.vehicle_type || 'unknown';
              acc[t] = (acc[t] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          )
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 8)
            .map(([type, count]) => (
              <button
                key={type}
                onClick={() => {
                  const next = new Set(vehicleFilters.visibleTypes);
                  if (next.has(type)) next.delete(type); else next.add(type);
                  setVehicleFilters(prev => ({ ...prev, visibleTypes: next }));
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors border ${
                  vehicleFilters.visibleTypes.size === 0 || vehicleFilters.visibleTypes.has(type)
                    ? 'bg-white/[0.05] text-[var(--text-primary)] border-[var(--border-default)]'
                    : 'bg-transparent text-[var(--text-muted)] border-[var(--border-subtle)]'
                }`}
              >
                <span>{formatEnum(type)}</span>
                <span className="text-emerald-400/70">{count as number}</span>
              </button>
            ))}
        </div>
      )}

      {/* Selected Vehicle Detail Panel */}
      {selectedVehicle && (() => {
        const vFuel = selectedVehicle.fuelLevel ?? selectedVehicle.fuel_level;
        const vMileage = selectedVehicle.mileage ?? selectedVehicle.odometer;
        const vHealth = selectedVehicle.health_score;
        const vSpeed = selectedVehicle.speed;
        const vType = selectedVehicle.type || selectedVehicle.vehicle_type || '';
        const vFuelType = selectedVehicle.fuelType || selectedVehicle.fuel_type || '';
        const vDriver = selectedVehicle.driver || selectedVehicle.assignedDriver || selectedVehicle.assigned_driver;
        const vDept = selectedVehicle.department;
        const vLocation = selectedVehicle.location?.address || selectedVehicle.location_address || selectedVehicle.locationAddress || (
          selectedVehicle.location?.lat
            ? `${Number(selectedVehicle.location.lat).toFixed(4)}, ${Number(selectedVehicle.location.lng).toFixed(4)}`
            : null
        );
        const fuelPct = vFuel != null ? Math.round(vFuel) : null;
        const healthPct = typeof vHealth === 'number' ? Math.round(vHealth) : null;
        const vVin = selectedVehicle.vin;
        const vPlate = selectedVehicle.licensePlate || selectedVehicle.license_plate;
        const vNextService = selectedVehicle.nextServiceDate || selectedVehicle.next_service_date;
        const vLastService = selectedVehicle.lastServiceDate || selectedVehicle.last_service_date;
        const vInsExpiry = selectedVehicle.insuranceExpiryDate || selectedVehicle.insurance_expiry_date;
        const vRegExpiry = selectedVehicle.registration_expiry;
        const vEngineHours = selectedVehicle.engineHours || selectedVehicle.engine_hours;

        return (
          <Card className="bg-white/[0.03] border-[var(--border-subtle)]">
            {/* Header */}
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    selectedVehicle.status === 'active' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                    selectedVehicle.status === 'idle' ? 'bg-white/30' :
                    selectedVehicle.status === 'charging' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]' :
                    selectedVehicle.status === 'service' ? 'bg-amber-400' :
                    selectedVehicle.status === 'emergency' ? 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
                    selectedVehicle.status === 'assigned' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' :
                    selectedVehicle.status === 'dispatched' ? 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.5)]' :
                    selectedVehicle.status === 'en_route' ? 'bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.5)]' :
                    selectedVehicle.status === 'on_site' ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]' :
                    selectedVehicle.status === 'completed' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' :
                    selectedVehicle.status === 'maintenance' ? 'bg-amber-400' :
                    'bg-white/30'
                  }`} />
                  <span className="font-semibold text-sm text-white/95 truncate">
                    {selectedVehicle.name || formatVehicleName(selectedVehicle)}
                  </span>
                </div>
                <Badge className={`text-[10px] px-2 py-0 shrink-0 ${
                  selectedVehicle.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  selectedVehicle.status === 'service' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  selectedVehicle.status === 'emergency' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  selectedVehicle.status === 'charging' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  selectedVehicle.status === 'assigned' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  selectedVehicle.status === 'dispatched' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                  selectedVehicle.status === 'en_route' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' :
                  selectedVehicle.status === 'on_site' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  selectedVehicle.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  selectedVehicle.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-white/[0.06] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                }`}>
                  {formatEnum(selectedVehicle.status)}
                </Badge>
              </div>
              {/* Subtitle: fleet # · type · year · fuel type */}
              <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--text-tertiary)]">
                {(selectedVehicle.vehicleNumber || selectedVehicle.number) && (
                  <span className="font-mono">{selectedVehicle.vehicleNumber || selectedVehicle.number}</span>
                )}
                {(selectedVehicle.vehicleNumber || selectedVehicle.number) && vType && <span>·</span>}
                {vType && <span>{formatEnum(vType)}</span>}
                {selectedVehicle.year && <><span>·</span><span>{selectedVehicle.year}</span></>}
                {vFuelType && (
                  <>
                    <span>·</span>
                    <span className={`flex items-center gap-0.5 ${vFuelType === 'electric' ? 'text-emerald-400' : vFuelType === 'hybrid' ? 'text-amber-400' : ''}`}>
                      {(vFuelType === 'electric' || vFuelType === 'hybrid') && <Zap className="h-2.5 w-2.5" />}
                      <span>{formatEnum(vFuelType)}</span>
                    </span>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-2 pt-0 pb-3 px-3">
              {/* Health + Fuel gauges side by side */}
              {(healthPct !== null || fuelPct !== null) && (
                <div className="grid grid-cols-2 gap-1.5">
                  {healthPct !== null && (
                    <div className="rounded-md bg-[var(--surface-3)] px-2 py-1.5">
                      <div className="flex items-center gap-1 text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-1">
                        <HeartPulse className="h-2.5 w-2.5" />Health
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-sm font-bold ${
                          healthPct >= 80 ? 'text-emerald-400' : healthPct >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}>{healthPct}</span>
                        <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${
                          healthPct >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                          healthPct >= 50 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>{healthPct >= 80 ? 'Good' : healthPct >= 50 ? 'Fair' : 'Poor'}</span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${healthPct >= 80 ? 'bg-emerald-400' : healthPct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(healthPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {fuelPct !== null && (
                    <div className="rounded-md bg-[var(--surface-3)] px-2 py-1.5">
                      <div className="flex items-center gap-1 text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-1">
                        <Fuel className="h-2.5 w-2.5" />{vFuelType === 'electric' ? 'Charge' : 'Fuel'}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-sm font-bold ${
                          fuelPct >= 50 ? 'text-emerald-400' : fuelPct >= 25 ? 'text-amber-400' : 'text-red-400'
                        }`}>{fuelPct}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${fuelPct >= 50 ? 'bg-emerald-400' : fuelPct >= 25 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(fuelPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detail Grid: 2 cols — key operational data */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Users className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                  <span className={`text-[11px] truncate ${vDriver ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] italic'}`}>
                    {vDriver || 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Shield className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                  <span className={`text-[11px] truncate ${vDept ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] italic'}`}>
                    {vDept || 'No dept'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Gauge className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                  <span className={`text-[11px] ${vMileage != null ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {vMileage != null ? `${formatNumber(vMileage)} mi` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Navigation className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                  <span className={`text-[11px] ${typeof vSpeed === 'number' ? (vSpeed > 0 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]') : 'text-[var(--text-muted)]'}`}>
                    {typeof vSpeed === 'number' ? `${Math.round(vSpeed)} mph` : '—'}
                  </span>
                </div>
              </div>

              {/* Vehicle identifiers */}
              {(vVin || vPlate) && (
                <div className="flex items-center gap-3 text-[10px] border-t border-white/[0.06] pt-1.5">
                  {vPlate && (
                    <span className="font-mono text-[var(--text-secondary)] bg-white/[0.04] px-1.5 py-0.5 rounded">{vPlate}</span>
                  )}
                  {vVin && (
                    <span className="text-[var(--text-muted)] truncate font-mono">VIN: {vVin.slice(-8)}</span>
                  )}
                  {vEngineHours != null && (
                    <span className="text-[var(--text-muted)]">{formatNumber(vEngineHours)}h</span>
                  )}
                </div>
              )}

              {/* Service & Compliance dates */}
              {(vNextService || vLastService || vInsExpiry || vRegExpiry) && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/[0.06] pt-1.5">
                  {vNextService && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                      <span className={`text-[10px] truncate ${
                        new Date(vNextService) < new Date() ? 'text-red-400 font-medium' : 'text-[var(--text-secondary)]'
                      }`}>
                        Svc: {formatDate(vNextService)}
                      </span>
                    </div>
                  )}
                  {vLastService && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                      <span className="text-[10px] text-[var(--text-tertiary)] truncate">
                        Last: {formatDate(vLastService)}
                      </span>
                    </div>
                  )}
                  {vInsExpiry && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Shield className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                      <span className={`text-[10px] truncate ${
                        new Date(vInsExpiry) < new Date() ? 'text-red-400' :
                        new Date(vInsExpiry) < new Date(Date.now() + 30 * 86400000) ? 'text-amber-400' : 'text-[var(--text-secondary)]'
                      }`}>
                        Ins: {formatDate(vInsExpiry)}
                      </span>
                    </div>
                  )}
                  {vRegExpiry && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                      <span className={`text-[10px] truncate ${
                        new Date(vRegExpiry) < new Date() ? 'text-red-400' : 'text-[var(--text-secondary)]'
                      }`}>
                        Reg: {formatDate(vRegExpiry)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              {vLocation && (
                <div className="flex items-start gap-1.5 pt-1 border-t border-white/[0.06]">
                  <MapPin className="h-3 w-3 text-[var(--text-muted)] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-[var(--text-secondary)] leading-snug">{vLocation}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-1.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] border-[var(--border-subtle)] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                  onClick={() => openDrilldown({
                    type: 'vehicle',
                    label: selectedVehicle.vehicleNumber || selectedVehicle.number || 'Vehicle',
                    data: { vehicleId: selectedVehicle.id }
                  })}
                >
                  <ChevronRight className="h-3 w-3 mr-0.5" />
                  Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] border-[var(--border-subtle)] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                  onClick={() => navigateTo('fleet')}
                >
                  Dispatch
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] border-[var(--border-subtle)] hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400"
                  onClick={() => navigateTo('maintenance')}
                >
                  Maint.
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Quick Actions — Compact row */}
      <div className="hidden md:flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] border-white/[0.06]" data-testid="dispatch-action" onClick={() => navigateTo('fleet')}>
          <Truck className="h-3 w-3 mr-1" />Dispatch
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] border-white/[0.06]" data-testid="maintenance-action" onClick={() => navigateTo('maintenance')}>
          <Wrench className="h-3 w-3 mr-1" />Maint.
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] border-white/[0.06]" data-testid="alerts-action" onClick={() => navigateTo('safety')}>
          <AlertCircle className="h-3 w-3 mr-1" />Alerts
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] border-white/[0.06]" data-testid="fuel-action" onClick={() => navigateTo('operations')}>
          <Fuel className="h-3 w-3 mr-1" />Fuel
        </Button>
      </div>
      {/* Mobile Quick Actions */}
      <div className="md:hidden">
        <MobileQuickActions actions={quickActions} layout="horizontal-scroll" />
      </div>

      {/* Vehicle List with Search + Sort */}
      <div>
        {/* Search + Sort Bar */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={sideSearch}
              onChange={(e) => setSideSearch(e.target.value)}
              className="w-full h-7 pl-7 pr-2 text-[11px] bg-white/[0.03] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
            />
          </div>
          <button
            onClick={() => setSideSort(prev =>
              prev === 'status' ? 'name' : prev === 'name' ? 'fuel' : prev === 'fuel' ? 'health' : 'status'
            )}
            className="flex items-center gap-1 h-7 px-2 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-white/[0.03] border border-[var(--border-subtle)] rounded-md transition-colors"
            title={`Sort by ${sideSort}`}
          >
            <ArrowUpDown className="h-3 w-3" />
            <span className="capitalize">{sideSort}</span>
          </button>
        </div>

        {/* Count */}
        <div className="text-[10px] text-[var(--text-muted)] mb-1">
          {sortedVehicles.length === vehicles.length
            ? `${vehicles.length} vehicles`
            : `${sortedVehicles.length} of ${vehicles.length} vehicles`}
        </div>

        {/* Mobile: List variant */}
        <div className="md:hidden space-y-0 max-h-64 overflow-y-auto border-t border-[var(--border-subtle)]">
          {sortedVehicles.slice(0, 10).map((vehicle: any) => (
            <MobileVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onClick={(v) => {
                setSelectedVehicleId(v.id);
                openDrilldown({
                  type: 'vehicle',
                  label: vehicle.vehicleNumber || vehicle.number || 'Vehicle',
                  data: { vehicleId: v.id }
                });
              }}
              variant="list"
            />
          ))}
        </div>
        {/* Desktop: Enhanced vehicle list */}
        <div className="hidden md:block space-y-0.5 max-h-[calc(100vh-520px)] min-h-[120px] overflow-y-auto" tabIndex={0} role="region" aria-label="Fleet vehicle list">
          {sortedVehicles.slice(0, 50).map((vehicle: any) => {
            const isSelected = selectedVehicleId === vehicle.id;
            const vFuelPct = vehicle.fuelLevel ?? vehicle.fuel_level;
            const vHealthPct = vehicle.health_score;
            return (
              <div
                key={vehicle.id}
                className={`px-2 py-1.5 rounded-md border cursor-pointer transition-all ${isSelected
                  ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                  : 'border-transparent hover:border-[var(--border-subtle)] hover:bg-white/[0.02]'
                }`}
                onClick={() => {
                  setSelectedVehicleId(vehicle.id);
                }}
                onDoubleClick={() => {
                  openDrilldown({
                    type: 'vehicle',
                    label: vehicle.vehicleNumber || vehicle.number || 'Vehicle',
                    data: { vehicleId: vehicle.id }
                  });
                }}
                data-testid={`vehicle-list-item-${vehicle.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      vehicle.status === 'active' ? 'bg-emerald-400' :
                      vehicle.status === 'service' ? 'bg-amber-400' :
                      vehicle.status === 'emergency' ? 'bg-red-400' :
                      vehicle.status === 'charging' ? 'bg-emerald-400' :
                      vehicle.status === 'assigned' ? 'bg-emerald-400' :
                      vehicle.status === 'dispatched' ? 'bg-orange-400' :
                      vehicle.status === 'en_route' ? 'bg-teal-400' :
                      vehicle.status === 'on_site' ? 'bg-yellow-400' :
                      vehicle.status === 'completed' ? 'bg-emerald-400' :
                      vehicle.status === 'maintenance' ? 'bg-amber-400' :
                      'bg-white/30'
                    }`} />
                    <span className="font-medium text-[11px] text-[var(--text-primary)] truncate">
                      {vehicle.vehicleNumber || vehicle.number || '—'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] truncate">
                      {vehicle.name || formatVehicleName(vehicle)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Health mini-indicator */}
                    {typeof vHealthPct === 'number' && (
                      <span className={`text-[9px] font-semibold ${
                        vHealthPct >= 80 ? 'text-emerald-400/50' : vHealthPct >= 50 ? 'text-amber-400/50' : 'text-red-400/50'
                      }`}>{Math.round(vHealthPct)}</span>
                    )}
                    {/* Fuel mini-bar */}
                    {vFuelPct != null && (
                      <div className="flex items-center gap-0.5">
                        <div className="w-6 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              vFuelPct >= 50 ? 'bg-emerald-400/50' : vFuelPct >= 25 ? 'bg-amber-400/50' : 'bg-red-400/50'
                            }`}
                            style={{ width: `${Math.min(Math.round(vFuelPct), 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {sortedVehicles.length === 0 && sideSearch && (
            <div className="text-center py-4 text-[11px] text-[var(--text-muted)]">
              No vehicles match "{sideSearch}"
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Drawer Content (for mobile detailed view)
  const drawerContent = selectedVehicle && (
    <div className="space-y-2">
      <h3 className="text-sm font-bold">
        Vehicle Details: {selectedVehicle.vehicleNumber || selectedVehicle.number || '—'}
      </h3>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-semibold">Vehicle:</div>
          <div>
            {selectedVehicle.name || formatVehicleName(selectedVehicle)}
          </div>
          <div className="font-semibold">Year:</div>
          <div>{selectedVehicle.year || '—'}</div>
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
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <Gauge className="h-9 w-12 animate-spin mx-auto text-emerald-400" />
          <p className="mt-2 text-[var(--text-tertiary)]">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  // Native Google Maps controls handle zoom/pan - no custom overlay needed

  return (
    <div className="relative h-full w-full">
      <MapFirstLayout
        mapComponent={
          <>
            <GoogleMap
              ref={mapRef}
              vehicles={vehicles}
              showVehicles={true}
              mapStyle="roadmap"
              selectedVehicleId={selectedVehicleId}
              visibleVehicleIds={visibleVehicleIds}
              markerStyle={markerStyle}
              markerSize={markerSize}
              showMarkerLabels={showLabels}
              onVehicleAction={(action, vehicleId) => {
                if (action === 'select') setSelectedVehicleId(vehicleId);
                if (action === 'viewDetails') {
                  setSelectedVehicleId(vehicleId);
                  openDrilldown({
                    type: 'vehicle',
                    label: vehicles.find((v: any) => v.id === vehicleId)?.vehicleNumber || vehicles.find((v: any) => v.id === vehicleId)?.number || 'Vehicle',
                    data: { vehicleId }
                  });
                }
                if (action === 'dispatch') {
                  setSelectedVehicleId(vehicleId);
                  navigateTo('fleet');
                }
                if (action === 'maintenance') {
                  setSelectedVehicleId(vehicleId);
                  navigateTo('maintenance');
                }
              }}
            />
            {/* Map toolbar overlay */}
            <MapToolbar
              onFitAll={() => mapRef.current?.fitAll()}
              onCenterSelected={() => selectedVehicleId && mapRef.current?.centerOnVehicle(selectedVehicleId)}
              hasSelectedVehicle={!!selectedVehicleId}
            />
            {/* Marker settings overlay */}
            <MapMarkerSettings />
            {/* Map legend overlay */}
            <MapLegend />
            {/* Vehicle type filter overlay */}
            <VehicleTypeFilter
              vehicles={vehicles}
              filters={vehicleFilters}
              onFiltersChange={setVehicleFilters}
            />
          </>
        }
        sidePanel={sidePanel}
        drawerContent={drawerContent}
        mapControls={null}
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
            icon: <Video className="w-4 h-4" />,
            active: showTrafficCameras,
            count: trafficCameraCount,
            onToggle: setShowTrafficCameras
          },
          {
            id: 'geofences',
            label: 'Geofences',
            icon: <MapPin className="w-4 h-4" />,
            active: showGeofences,
            // Show active breach count if any (critical info), otherwise total active count
            count: activeBreachCount > 0 ? activeBreachCount : geofences.filter(g => g.active).length,
            onToggle: setShowGeofences
          },
          {
            id: 'drivers',
            label: 'Drivers',
            icon: <Users className="w-4 h-4" />,
            active: showDrivers,
            count: drivers.length,
            onToggle: setShowDrivers
          }
        ]}
      />
    </div >
  );
});
