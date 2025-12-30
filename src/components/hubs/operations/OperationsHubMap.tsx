import { Truck, Package, MapPin, Navigation, Circle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVehicles } from '@/hooks/use-api';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  vehicleNumber: string;
  latitude?: number;
  longitude?: number;
  status: "active" | "inactive" | "maintenance";
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
  const [zoom, setZoom] = useState(6);
  const [_mapCenter, _setMapCenter] = useState({ lat: 28.5383, lng: -81.3792 }); // Orlando, FL default

  // Filter vehicles with coordinates
  const vehiclesWithCoords = (vehicles as unknown as Vehicle[]).filter((v: Vehicle) =>
    v.latitude != null && v.longitude != null
  );

  // Separate vehicles by operational status
  const activeVehicles = vehiclesWithCoords.filter((v: Vehicle) => v.status === 'active');
  const enRouteVehicles = activeVehicles.slice(0, Math.floor(activeVehicles.length * 0.6));
  const idleVehicles = activeVehicles.slice(Math.floor(activeVehicles.length * 0.6));

  const getMarkerColor = (vehicleId: string, status: string) => {
    if (selectedVehicleId === vehicleId) return 'bg-blue-600 ring-4 ring-blue-300';

    switch (status) {
      case 'active': return 'bg-green-500 hover:bg-green-600';
      case 'maintenance': return 'bg-amber-500 hover:bg-amber-600';
      case 'inactive': return 'bg-gray-400 hover:bg-gray-500';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getOperationalIcon = (vehicle: Vehicle) => {
    if (enRouteVehicles.includes(vehicle)) {
      return <Navigation size={16} className="text-white" />;
    }
    return <Truck size={16} className="text-white" />;
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-100 to-blue-50" data-testid="operations-hub-map">
      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-sm mb-3 text-slate-800">Operations Overview</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Active Dispatch ({enRouteVehicles.length} en route)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>Maintenance ({(vehicles as unknown as Vehicle[]).filter((v: Vehicle) => v.status === 'maintenance').length})</span>
          </div>
          {showGeofences && (
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-purple-500" />
              <span>Geofence Zones (3 active)</span>
            </div>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setZoom(Math.min(zoom + 1, 18))}
          data-testid="map-zoom-in"
          className="shadow-lg"
        >
          +
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setZoom(Math.max(zoom - 1, 1))}
          data-testid="map-zoom-out"
          className="shadow-lg"
        >
          −
        </Button>
        <Button
          size="icon"
          variant="secondary"
          data-testid="map-locate"
          className="shadow-lg"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {/* Route Optimization Overlay */}
      {showRouteOptimization && (
        <div className="absolute bottom-4 left-4 z-20 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-slate-800">Route Optimization Suggestion</h4>
              <p className="text-xs text-slate-600 mt-1">
                Rerouting vehicles V-042 and V-087 could save 23 minutes and reduce fuel costs by $12.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="default" className="text-xs">Apply</Button>
                <Button size="sm" variant="outline" className="text-xs">Details</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Overlay */}
      {showDispatchOverlay && (
        <div className="absolute top-20 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            Active Dispatches
          </h4>
          <div className="space-y-1.5">
            {enRouteVehicles.slice(0, 3).map((vehicle: Vehicle, idx: number) => (
              <div key={vehicle.id} className="flex items-center justify-between text-xs bg-white rounded p-2">
                <span className="font-medium text-slate-800">{vehicle.vehicleNumber}</span>
                <Badge variant="outline" className="text-xs">
                  {idx === 0 ? 'Delivery' : idx === 1 ? 'Pickup' : 'Transfer'}
                </Badge>
              </div>
            ))}
            {enRouteVehicles.length > 3 && (
              <div className="text-xs text-slate-500 text-center pt-1">
                +{enRouteVehicles.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Geofence Zones */}
      {showGeofences && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Example geofence circles - in production these would be proper map overlays */}
          <svg className="w-full h-full">
            <circle
              cx="30%"
              cy="40%"
              r="80"
              fill="rgba(147, 51, 234, 0.1)"
              stroke="rgba(147, 51, 234, 0.5)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <circle
              cx="60%"
              cy="50%"
              r="100"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <circle
              cx="75%"
              cy="35%"
              r="60"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="rgba(16, 185, 129, 0.5)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>
        </div>
      )}

      {/* Map Canvas - Interactive vehicle visualization */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-full h-full max-w-6xl max-h-[800px]">
          <div className="text-center space-y-4 absolute top-10 left-1/2 transform -translate-x-1/2 z-0">
            <div className="text-6xl">🗺️</div>
            <div className="text-lg font-semibold text-slate-700">
              Live Operations Map
            </div>
            <div className="text-sm text-slate-500">
              {vehiclesWithCoords.length} vehicles • {enRouteVehicles.length} en route • {idleVehicles.length} idle
            </div>
          </div>

          {/* Vehicle markers grid layout for demo */}
          <div className="absolute inset-0 flex items-center justify-center mt-32">
            <div className="grid grid-cols-6 gap-4 max-w-4xl">
              {vehiclesWithCoords.slice(0, 24).map((vehicle: Vehicle) => {
                const isEnRoute = enRouteVehicles.includes(vehicle);
                return (
                  <div
                    key={vehicle.id}
                    onClick={() => onVehicleSelect?.(vehicle.id)}
                    className={`
                      cursor-pointer transition-all duration-200 transform hover:scale-125
                      ${getMarkerColor(vehicle.id, vehicle.status)}
                      p-3 rounded-full shadow-lg relative group
                      ${isEnRoute ? 'animate-pulse' : ''}
                    `}
                    data-testid={`map-marker-${vehicle.id}`}
                    title={`${vehicle.vehicleNumber} - ${isEnRoute ? 'En Route' : 'Idle'}`}
                  >
                    {getOperationalIcon(vehicle)}

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap pointer-events-none">
                      {vehicle.vehicleNumber}
                      <br />
                      {isEnRoute ? 'En Route' : 'Idle'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Load planning cargo overlay - shown on selected vehicle */}
          {selectedVehicleId && (
            <div className="absolute bottom-4 right-4 z-20 bg-white rounded-lg shadow-xl p-4 max-w-xs">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">Load Planning</h4>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Cargo Capacity:</span>
                      <span className="font-medium">1,200 lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Load:</span>
                      <span className="font-medium text-green-600">850 lbs (71%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-medium">350 lbs</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '71%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}