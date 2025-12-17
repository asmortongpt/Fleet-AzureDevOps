import { useState, useEffect, useRef } from 'react';
import { Truck, ZoomIn, ZoomOut, Locate } from 'lucide-react';
import { useVehicles } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  vehicleNumber: string;
  latitude?: number;
  longitude?: number;
  status: "active" | "inactive" | "maintenance";
}

interface ProfessionalFleetMapProps {
  onVehicleSelect?: (vehicleId: string) => void;
}

export function ProfessionalFleetMap({ onVehicleSelect }: ProfessionalFleetMapProps) {
  const { data: vehicles = [] } = useVehicles();
  const [zoom, setZoom] = useState(6);
  const mapRef = useRef<HTMLDivElement>(null);

  // Filter vehicles with coordinates
  const vehiclesWithCoords = vehicles.filter((v: Vehicle) =>
    v.latitude != null && v.longitude != null
  );

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-amber-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="w-full h-full relative bg-slate-100" data-testid="professional-fleet-map">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setZoom(Math.min(zoom + 1, 18))}
          data-testid="map-zoom-in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setZoom(Math.max(zoom - 1, 1))}
          data-testid="map-zoom-out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          data-testid="map-locate"
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Canvas - Placeholder for real map implementation */}
      <div
        ref={mapRef}
        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100"
      >
        <div className="text-center space-y-4">
          <div className="text-6xl">🗺️</div>
          <div className="text-lg font-semibold text-slate-700">
            Interactive Fleet Map
          </div>
          <div className="text-sm text-slate-500">
            {vehiclesWithCoords.length} vehicles with GPS coordinates
          </div>

          {/* Vehicle markers (simplified visualization) */}
          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto mt-6">
            {vehiclesWithCoords.slice(0, 10).map((vehicle: Vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => onVehicleSelect?.(vehicle.id)}
                className={`cursor-pointer transition-transform hover:scale-110 ${getMarkerColor(vehicle.status)} p-3 rounded-lg shadow-md`}
                data-testid={`map-marker-${vehicle.id}`}
              >
                <Truck size={20} className="text-white" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
