import { Truck, Circle, AlertTriangle } from 'lucide-react';

import { UniversalMap } from '@/components/UniversalMap';
import { Badge } from '@/components/ui/badge';
import { useVehicles, useRoutes } from '@/hooks/use-api';
import { formatEnum } from '@/utils/format-enum';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  vehicleNumber: string;
  latitude?: number;
  longitude?: number;
  location?: { lat?: number; lng?: number };
  status: "active" | "inactive" | "maintenance";
}

interface Route {
  id: string;
  status?: string;
  assigned_vehicle_id?: string;
}

interface OperationsHubMapProps {
  onVehicleSelect?: (vehicleId: string) => void;
  selectedVehicleId?: string | null;
  showDispatchOverlay?: boolean;
  showRouteOptimization?: boolean;
  showGeofences?: boolean;
}

export function OperationsHubMap({
  onVehicleSelect,
  selectedVehicleId,
  showDispatchOverlay = true,
  showRouteOptimization = false,
  showGeofences = false
}: OperationsHubMapProps) {
  const { data: vehicles = [] } = useVehicles();
  const { data: routes = [] } = useRoutes();

  // Filter vehicles with coordinates
  const vehiclesWithCoords = (vehicles as unknown as Vehicle[]).filter((v: Vehicle) => {
    const lat = v.latitude ?? v.location?.lat;
    const lng = v.longitude ?? v.location?.lng;
    return lat != null && lng != null;
  });

  // Separate vehicles by operational status
  const activeVehicles = vehiclesWithCoords.filter((v: Vehicle) => v.status === 'active');
  const activeRouteVehicleIds = new Set(
    (routes as unknown as Route[])
      .filter((route) => route.status === 'in_progress' || route.status === 'active')
      .map((route) => route.assigned_vehicle_id)
      .filter(Boolean) as string[]
  );
  const enRouteVehicles = activeVehicles.filter((v) => activeRouteVehicleIds.has(v.id));

  return (
    <div className="w-full h-full relative bg-[#0a0a0a]" data-testid="operations-hub-map">
      <div className="absolute inset-0">
        <UniversalMap
          vehicles={vehiclesWithCoords as any}
          showVehicles
          showFacilities={false}
          showCameras={false}
          className="w-full h-full"
        />
      </div>
      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-20 bg-[#111111] rounded-lg p-2 max-w-xs border border-white/[0.04]">
        <h3 className="font-semibold text-sm mb-3 text-white">Operations Overview</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-white/60">Active Dispatch ({enRouteVehicles.length} en route)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-white/60">Maintenance ({(vehicles as unknown as Vehicle[]).filter((v: Vehicle) => v.status === 'maintenance').length})</span>
          </div>
          {showGeofences && (
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-amber-500" />
              <span className="text-white/60">Geofence Zones</span>
            </div>
          )}
        </div>
      </div>

      {/* Route Optimization Overlay */}
      {showRouteOptimization && (
        <div className="absolute bottom-4 left-4 z-20 bg-[#111111] rounded-lg p-2 max-w-sm border border-white/[0.04]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-white">Route Optimization</h4>
              <p className="text-xs text-white/60 mt-1">
                Optimization suggestions are available in the Route Optimization module.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Overlay */}
      {showDispatchOverlay && (
        <div className="absolute top-20 left-4 z-10 bg-[#111111] rounded-lg p-3 max-w-xs border border-white/[0.04]">
          <h4 className="font-semibold text-xs text-white/60 mb-2 flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-200" />
            Active Dispatches
          </h4>
          <div className="space-y-1.5">
            {enRouteVehicles.slice(0, 3).map((vehicle: Vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between text-xs bg-white/[0.03] rounded p-2 border border-white/[0.04]">
                <span className="font-medium text-white">
                  {vehicle.vehicleNumber || (vehicle as any).number || (vehicle as any).name || vehicle.id}
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatEnum(vehicle.status)}
                </Badge>
              </div>
            ))}
            {enRouteVehicles.length > 3 && (
              <div className="text-xs text-white/35 text-center pt-1">
                +{enRouteVehicles.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {showGeofences && (
        <div className="absolute bottom-4 right-4 z-20 bg-[#111111] rounded-lg p-2 max-w-xs border border-white/[0.04]">
          <div className="text-xs text-white/60">
            Geofence overlays are rendered by the map provider when available.
          </div>
        </div>
      )}
    </div>
  );
}
