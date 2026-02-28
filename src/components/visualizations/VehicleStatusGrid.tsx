import {
  Truck,
  Battery,
  Fuel,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Clock,
  Wrench
} from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRealtimeOperations } from '@/hooks/use-realtime-operations';
import type { Vehicle } from '@/types/Vehicle';
import { formatTime } from '@/utils/format-helpers';
import { formatVehicleShortName } from '@/utils/vehicle-display';

/**
 * Vehicle Status Grid
 *
 * Real-time fleet status overview with color-coded health indicators
 * - Live position updates
 * - Health metrics (battery, fuel, odometer)
 * - Status badges with animations
 * - Alert indicators
 */

interface VehicleStatusGridProps {
  vehicles: Vehicle[];
  onVehicleClick?: (vehicleId: string) => void;
  compact?: boolean;
}

export function VehicleStatusGrid({ vehicles, onVehicleClick, compact = false }: VehicleStatusGridProps) {
  const { vehiclePositions, getVehiclePosition } = useRealtimeOperations();

  // Enhance vehicles with real-time data
  const enhancedVehicles = useMemo(() => {
    return vehicles.map(vehicle => {
      const position = getVehiclePosition(vehicle.id);
      return {
        ...vehicle,
        position,
        isMoving: position?.status === 'moving',
        speed: position?.speed || 0,
        heading: position?.heading || 0
      };
    });
  }, [vehicles, vehiclePositions, getVehiclePosition]);

  // Get health status
  const getHealthStatus = (vehicle: typeof enhancedVehicles[0]) => {
    const issues: string[] = [];

    if (vehicle.fuelLevel !== undefined && vehicle.fuelLevel < 20) {
      issues.push('Low fuel');
    }
    if (vehicle.batteryLevel !== undefined && vehicle.batteryLevel < 20) {
      issues.push('Low battery');
    }
    if (vehicle.odometer && vehicle.nextMaintenanceMiles) {
      const milesUntilMaintenance = vehicle.nextMaintenanceMiles - vehicle.odometer;
      if (milesUntilMaintenance < 500) {
        issues.push('Maintenance due');
      }
    }

    if (issues.length > 0) return { status: 'warning' as const, issues };
    // "service" status is the maintenance state in the Vehicle type
    if (vehicle.status === 'service') return { status: 'maintenance' as const, issues: ['In maintenance'] };
    if (vehicle.status === 'offline') return { status: 'offline' as const, issues: ['Offline'] };
    return { status: 'healthy' as const, issues: [] };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-500 bg-green-50';
      case 'warning':
        return 'border-amber-500 bg-amber-50';
      case 'maintenance':
        return 'border-emerald-500 bg-emerald-500/5';
      case 'offline':
        return 'border-white/[0.08] bg-[var(--surface-glass)]';
      default:
        return 'border-white/[0.12] bg-white';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string, isMoving: boolean) => {
    if (isMoving) return <Navigation className="h-4 w-4 text-green-600 animate-pulse" />;
    if (status === 'healthy') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-600 animate-pulse" />;
    if (status === 'maintenance') return <Wrench className="h-4 w-4 text-emerald-600" />;
    return <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />;
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {enhancedVehicles.map((vehicle) => {
          const health = getHealthStatus(vehicle);
          return (
            <div
              key={vehicle.id}
              onClick={() => onVehicleClick?.(vehicle.id)}
              className={`p-2 rounded-lg border-l-4 cursor-pointer transition-all  ${getStatusColor(health.status)}`}
            >
              <div className="flex items-center gap-1 mb-1">
                {getStatusIcon(health.status, vehicle.isMoving)}
                <span className="text-xs font-semibold truncate">{vehicle.number || vehicle.vehicleNumber}</span>
              </div>
              {health.issues.length > 0 && (
                <p className="text-xs text-white/50 truncate">{health.issues[0]}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {enhancedVehicles.map((vehicle) => {
        const health = getHealthStatus(vehicle);

        return (
          <Card
            key={vehicle.id}
            onClick={() => onVehicleClick?.(vehicle.id)}
            className={`cursor-pointer transition-all hover: border-l-4 ${getStatusColor(health.status)}`}
          >
            <CardContent className="pt-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-white/70" />
                  <div>
                    <h3 className="font-semibold text-sm">{vehicle.number || vehicle.vehicleNumber}</h3>
                    <p className="text-xs text-white/50">
                      {formatVehicleShortName(vehicle)}
                    </p>
                  </div>
                </div>
                {getStatusIcon(health.status, vehicle.isMoving)}
              </div>

              {/* Status badge */}
              <div className="mb-3">
                <Badge
                  variant={health.status === 'healthy' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {vehicle.isMoving ? 'Moving' : vehicle.status}
                  {vehicle.isMoving && ` - ${vehicle.speed} mph`}
                </Badge>
              </div>

              {/* Health metrics */}
              <div className="space-y-2">
                {vehicle.fuelLevel !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Fuel className="h-3 w-3" />
                        <span>Fuel</span>
                      </div>
                      <span className="text-xs font-medium">{vehicle.fuelLevel}%</span>
                    </div>
                    <Progress
                      value={vehicle.fuelLevel}
                      className={`h-1.5 ${vehicle.fuelLevel < 20 ? 'bg-red-200' : ''}`}
                      indicatorClassName={vehicle.fuelLevel < 20 ? 'bg-red-500' : 'bg-green-500'}
                    />
                  </div>
                )}

                {vehicle.batteryLevel !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Battery className="h-3 w-3" />
                        <span>Battery</span>
                      </div>
                      <span className="text-xs font-medium">{vehicle.batteryLevel}%</span>
                    </div>
                    <Progress
                      value={vehicle.batteryLevel}
                      className={`h-1.5 ${vehicle.batteryLevel < 20 ? 'bg-red-200' : ''}`}
                      indicatorClassName={vehicle.batteryLevel < 20 ? 'bg-red-500' : 'bg-emerald-500/50'}
                    />
                  </div>
                )}

                {vehicle.odometer && vehicle.nextMaintenanceMiles && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Gauge className="h-3 w-3" />
                        <span>Next Maintenance</span>
                      </div>
                      <span className="text-xs font-medium">
                        {vehicle.nextMaintenanceMiles - vehicle.odometer} mi
                      </span>
                    </div>
                    <Progress
                      value={((vehicle.nextMaintenanceMiles - vehicle.odometer) / vehicle.nextMaintenanceMiles) * 100}
                      className="h-1.5"
                      indicatorClassName="bg-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Health issues */}
              {health.issues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                  {health.issues.map((issue) => (
                    <div key={issue} className="flex items-center gap-1 text-xs text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Real-time update indicator */}
              {vehicle.position && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                  <span>Last update</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span>
                      {formatTime(vehicle.position.timestamp)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {enhancedVehicles.length === 0 && (
        <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">
          <Truck className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>No vehicles found</p>
        </div>
      )}
    </div>
  );
}
