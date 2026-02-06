import { useMemo } from 'react';

import { UniversalMap } from '@/components/UniversalMap';
import { useVehicles } from '@/hooks/use-api';
import { Vehicle } from '@/types';

interface ProfessionalFleetMapProps {
  onVehicleSelect?: (vehicleId: string) => void;
  children?: React.ReactNode;
}

export function ProfessionalFleetMap({ onVehicleSelect, children }: ProfessionalFleetMapProps) {
  const { data, isLoading, error } = useVehicles();

  const vehicles = useMemo<Vehicle[]>(() => {
    if (Array.isArray(data)) return data as Vehicle[];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
      return (data as any).data as Vehicle[];
    }
    return [];
  }, [data]);

  return (
    <div className="w-full h-full relative" data-testid="professional-fleet-map">
      <UniversalMap
        vehicles={vehicles}
        showVehicles={true}
        className="h-full"
        onVehicleSelect={onVehicleSelect}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-sm text-muted-foreground">Loading vehicles…</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
          <div className="text-sm text-destructive">Failed to load vehicles.</div>
        </div>
      )}

      {children}
    </div>
  );
}
