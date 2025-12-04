import { useMemo } from 'react';

export interface FleetMetrics {
  total: number;
  active: number;
  inMaintenance: number;
  outOfService: number;
  utilizationRate: number;
}

export function useFleetMetrics<T extends { status: string }>(vehicles: T[]): FleetMetrics {
  return useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.status === 'active').length;
    const inMaintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const outOfService = vehicles.filter(v => v.status === 'out-of-service').length;
    const utilizationRate = total > 0 ? (active / total) * 100 : 0;

    return {
      total,
      active,
      inMaintenance,
      outOfService,
      utilizationRate
    };
  }, [vehicles]);
}
