import { Truck, ZoomIn, ZoomOut, Locate, Navigation } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useVehicles } from '@/hooks/use-api';
import { generateDemoVehicles } from '@/lib/demo-data';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  vehicleNumber: string;
  latitude?: number;
  longitude?: number;
  location?: { lat: number; lng: number };
  status: "active" | "inactive" | "maintenance" | "service";
}

interface ProfessionalFleetMapProps {
  onVehicleSelect?: (vehicleId: string) => void;
  children?: React.ReactNode;
}

export function ProfessionalFleetMap({ onVehicleSelect, children }: ProfessionalFleetMapProps) {
  const { data, isLoading, error } = useVehicles();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [zoom, setZoom] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Load vehicles from API or fall back to demo data
  useEffect(() => {
    if (!isLoading) {
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        // API failed or returned empty - use demo data
        const demoVehicles = generateDemoVehicles(50) as Vehicle[];
        setVehicles(demoVehicles);
      } else if (Array.isArray(data)) {
        setVehicles(data as Vehicle[]);
      }
    }
  }, [data, isLoading, error]);

  // Also set demo data after timeout if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vehicles.length === 0) {
        const demoVehicles = generateDemoVehicles(50) as Vehicle[];
        setVehicles(demoVehicles);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [vehicles.length]);

  // Filter vehicles with coordinates
  const vehiclesWithCoords = vehicles.filter((v: Vehicle) => {
    const lat = v.latitude ?? v.location?.lat;
    const lng = v.longitude ?? v.location?.lng;
    return lat != null && lng != null;
  });

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'maintenance':
      case 'service': return 'bg-amber-500 shadow-amber-500/50';
      case 'inactive': return 'bg-slate-400 shadow-slate-400/50';
      default: return 'bg-blue-500 shadow-blue-500/50';
    }
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedId(vehicle.id);
    onVehicleSelect?.(vehicle.id);
  };

  // Normalize coordinates - map lat/lng to grid position
  const normalizePosition = (vehicle: Vehicle, index: number) => {
    const lat = vehicle.latitude ?? vehicle.location?.lat ?? 0;
    const lng = vehicle.longitude ?? vehicle.location?.lng ?? 0;
    // For demo, spread them across the map area
    const baseLeft = ((lng + 180) / 360) * 100;
    const baseTop = ((90 - lat) / 180) * 100;
    // Add some jitter based on index to prevent overlap
    const jitterLeft = ((index * 37) % 20) - 10;
    const jitterTop = ((index * 23) % 20) - 10;
    return {
      left: Math.max(5, Math.min(90, 30 + (baseLeft % 60) + jitterLeft)),
      top: Math.max(5, Math.min(90, 20 + (baseTop % 60) + jitterTop))
    };
  };

  return (
    <div className="w-full h-full relative overflow-hidden" data-testid="professional-fleet-map">
      {/* Map Background - Professional dark theme */}
      <div
        ref={mapRef}
        className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"
        style={{
          backgroundImage: `
            linear-gradient(rgba(71, 85, 105, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(71, 85, 105, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${zoom * 4}px ${zoom * 4}px`
        }}
      >
        {/* Map grid overlay - simulates tile boundaries */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Vehicle Markers - Positioned on map */}
        {vehiclesWithCoords.map((vehicle, index) => {
          const pos = normalizePosition(vehicle, index);
          const isSelected = selectedId === vehicle.id;
          return (
            <div
              key={vehicle.id}
              className={`absolute cursor-pointer transition-all duration-300 ${isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110 hover:z-15'}`}
              style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: 'translate(-50%, -50%)' }}
              onClick={() => handleVehicleClick(vehicle)}
              data-testid={`map-marker-${vehicle.id}`}
            >
              {/* Marker with pulse effect for active vehicles */}
              <div className="relative">
                {vehicle.status === 'active' && (
                  <div className={`absolute inset-0 rounded-full ${getMarkerColor(vehicle.status)} animate-ping opacity-40`} />
                )}
                <div className={`relative p-2 rounded-full shadow-lg ${getMarkerColor(vehicle.status)} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}>
                  <Navigation className="h-4 w-4 text-white" style={{ transform: `rotate(${(index * 45) % 360}deg)` }} />
                </div>
              </div>
              {/* Vehicle label on hover/select */}
              {isSelected && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white rounded shadow-lg text-xs font-medium text-slate-800 whitespace-nowrap">
                  {vehicle.vehicleNumber || `Vehicle ${vehicle.id.slice(0, 6)}`}
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/80 backdrop-blur-md rounded-lg p-3 border border-slate-700">
          <div className="text-xs font-semibold text-slate-300 mb-2">Fleet Status</div>
          <div className="flex flex-col gap-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Active ({vehiclesWithCoords.filter(v => v.status === 'active').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Maintenance ({vehiclesWithCoords.filter(v => v.status === 'maintenance' || v.status === 'service').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span>Inactive ({vehiclesWithCoords.filter(v => v.status === 'inactive').length})</span>
            </div>
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur-md rounded-lg px-4 py-2 border border-slate-700">
          <span className="text-sm font-semibold text-emerald-400">{vehiclesWithCoords.length}</span>
          <span className="text-sm text-slate-400 ml-1">vehicles tracked</span>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
          onClick={() => setZoom(Math.min(zoom + 2, 24))}
          data-testid="map-zoom-in"
        >
          <ZoomIn className="h-4 w-4 text-slate-300" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
          onClick={() => setZoom(Math.max(zoom - 2, 4))}
          data-testid="map-zoom-out"
        >
          <ZoomOut className="h-4 w-4 text-slate-300" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
          data-testid="map-locate"
        >
          <Locate className="h-4 w-4 text-slate-300" />
        </Button>
      </div>

      {/* Layer Overlays */}
      {children}
    </div>
  );
}
