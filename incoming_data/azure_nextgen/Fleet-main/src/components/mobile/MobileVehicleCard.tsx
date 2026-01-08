import {
  Truck,
  MapPin,
  Fuel,
  Gauge,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Zap,
  Power
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Vehicle } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MobileVehicleCardProps {
  vehicle: Vehicle;
  onClick?: (vehicle: Vehicle) => void;
  onQuickAction?: (action: string, vehicle: Vehicle) => void;
  variant?: 'compact' | 'detailed' | 'list';
  showQuickActions?: boolean;
  className?: string;
}

export function MobileVehicleCard({
  vehicle,
  onClick,
  onQuickAction,
  variant = 'compact',
  showQuickActions = false,
  className
}: MobileVehicleCardProps) {
  const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
    active: { color: 'bg-green-500', label: 'Active', icon: CheckCircle },
    maintenance: { color: 'bg-amber-500', label: 'Maintenance', icon: AlertTriangle }, // Mapped from legacy
    service: { color: 'bg-amber-500', label: 'Service', icon: Calendar },
    inactive: { color: 'bg-gray-500', label: 'Inactive', icon: Clock },
    idle: { color: 'bg-blue-400', label: 'Idle', icon: Clock },
    charging: { color: 'bg-green-400', label: 'Charging', icon: Zap },
    emergency: { color: 'bg-red-600', label: 'Emergency', icon: AlertTriangle },
    offline: { color: 'bg-gray-400', label: 'Offline', icon: Power },
    'out-of-service': { color: 'bg-red-500', label: 'Out of Service', icon: AlertTriangle }
  };

  const statusInfo = statusConfig[vehicle.status] || statusConfig.inactive;
  const StatusIcon = statusInfo.icon;

  if (variant === 'list') {
    return (
      <div
        onClick={() => onClick?.(vehicle)}
        className={cn(
          'flex items-center gap-3 p-3 border-b border-slate-200',
          'active:bg-slate-50 transition-colors touch-manipulation cursor-pointer',
          className
        )}
        data-testid={`vehicle-card-list-${vehicle.id}`}
      >
        {/* Status Indicator */}
        <div className={cn('w-1 h-14 rounded-full', statusInfo.color)} />

        {/* Vehicle Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">{vehicle.id}</span>
            {vehicle.alerts && vehicle.alerts.length > 0 && (
              <Badge variant="destructive" className="h-5 text-xs px-1.5">
                {vehicle.alerts.length}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {vehicle.make} {vehicle.model} {vehicle.year}
          </div>
          {vehicle.driver && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{vehicle.driver}</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col items-end gap-1">
          {vehicle.fuelLevel !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              <Fuel className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{vehicle.fuelLevel}%</span>
            </div>
          )}
          <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'} className="text-xs">
            {statusInfo.label}
          </Badge>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card
        onClick={() => onClick?.(vehicle)}
        className={cn(
          'overflow-hidden active:scale-[0.98] transition-transform touch-manipulation cursor-pointer',
          className
        )}
        data-testid={`vehicle-card-compact-${vehicle.id}`}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-slate-600 flex-shrink-0" />
                <h3 className="font-semibold text-sm truncate">{vehicle.id}</h3>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {vehicle.make} {vehicle.model}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {vehicle.alerts && vehicle.alerts.length > 0 && (
                <Badge variant="destructive" className="h-5 text-xs px-1.5">
                  {vehicle.alerts.length}
                </Badge>
              )}
              <StatusIcon className={cn('h-4 w-4', statusInfo.color.replace('bg-', 'text-'))} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {vehicle.fuelLevel !== undefined && (
              <div className="flex items-center gap-1.5">
                <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Fuel:</span>
                <span className="font-medium">{vehicle.fuelLevel}%</span>
              </div>
            )}
            {vehicle.odometer !== undefined && (
              <div className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Miles:</span>
                <span className="font-medium">{vehicle.odometer.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Badge
              variant={vehicle.status === 'active' ? 'default' : 'secondary'}
              className="w-full justify-center text-xs py-1"
            >
              {statusInfo.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card
      onClick={() => onClick?.(vehicle)}
      className={cn(
        'overflow-hidden active:scale-[0.98] transition-transform touch-manipulation cursor-pointer',
        className
      )}
      data-testid={`vehicle-card-detailed-${vehicle.id}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-5 w-5 text-slate-600 flex-shrink-0" />
              <h3 className="font-bold text-base truncate">{vehicle.id}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {vehicle.alerts && vehicle.alerts.length > 0 && (
              <Badge variant="destructive" className="h-6 text-xs px-2">
                {vehicle.alerts.length} Alert{vehicle.alerts.length > 1 ? 's' : ''}
              </Badge>
            )}
            <Badge
              variant={vehicle.status === 'active' ? 'default' : 'secondary'}
              className="h-6 text-xs px-2"
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="space-y-2.5 mb-4">
          {vehicle.driver && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Driver:</span>
              <span className="font-medium flex-1 truncate">{vehicle.driver}</span>
            </div>
          )}

          {(vehicle.location?.latitude !== undefined && vehicle.location?.longitude !== undefined) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium text-xs">
                {vehicle.location.latitude.toFixed(4)}, {vehicle.location.longitude.toFixed(4)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {vehicle.fuelLevel !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Fuel className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Fuel</div>
                  <div className="font-semibold">{vehicle.fuelLevel}%</div>
                </div>
              </div>
            )}

            {vehicle.odometer !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Gauge className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Odometer</div>
                  <div className="font-semibold">{vehicle.odometer.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>

          {vehicle.updatedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {vehicle.updatedAt}</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {showQuickActions && onQuickAction && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('locate', vehicle);
              }}
              className="h-9 text-xs"
            >
              <MapPin className="h-3.5 w-3.5 mr-1" />
              Locate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('dispatch', vehicle);
              }}
              className="h-9 text-xs"
            >
              <Truck className="h-3.5 w-3.5 mr-1" />
              Dispatch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('service', vehicle);
              }}
              className="h-9 text-xs"
            >
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Service
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton loader for vehicle cards
export function MobileVehicleCardSkeleton({ variant = 'compact' }: { variant?: 'compact' | 'detailed' | 'list' }) {
  if (variant === 'list') {
    return (
      <div className="flex items-center gap-3 p-3 border-b border-slate-200 animate-pulse">
        <div className="w-1 h-14 bg-slate-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-3 bg-slate-200 rounded w-32" />
        </div>
        <div className="w-12 h-6 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-3 bg-slate-200 rounded w-32" />
          </div>
          <div className="w-16 h-6 bg-slate-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-full" />
          <div className="h-3 bg-slate-200 rounded w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}