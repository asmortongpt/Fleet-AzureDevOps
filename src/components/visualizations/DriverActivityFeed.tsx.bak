import {
  User,
  Navigation,
  Coffee,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Phone
} from 'lucide-react';
import { useMemo } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeOperations } from '@/hooks/use-realtime-operations';

/**
 * Driver Activity Feed
 *
 * Real-time feed of driver activities and status changes
 * - Live status updates
 * - Activity timeline
 * - Contact actions
 * - Visual status indicators
 */

interface Driver {
  id: string;
  name: string;
  employeeNumber: string;
  phone?: string;
  currentVehicleId?: string;
  currentTaskId?: string;
}

interface DriverActivityFeedProps {
  drivers: Driver[];
  onDriverClick?: (driverId: string) => void;
  onCallDriver?: (driverId: string, phone: string) => void;
  maxHeight?: string;
}

export function DriverActivityFeed({
  drivers,
  onDriverClick,
  onCallDriver,
  maxHeight = '600px'
}: DriverActivityFeedProps) {
  const { driverStatuses, getDriverStatus } = useRealtimeOperations();

  // Enhance drivers with real-time status
  const enhancedDrivers = useMemo(() => {
    return drivers
      .map(driver => {
        const status = getDriverStatus(driver.id);
        return {
          ...driver,
          status: status?.status || 'offline',
          currentVehicleId: status?.currentVehicleId || driver.currentVehicleId,
          currentTaskId: status?.currentTaskId || driver.currentTaskId,
          lastUpdate: status?.lastUpdate ? new Date(status.lastUpdate) : null
        };
      })
      .sort((a, b) => {
        // Sort by: 1) status priority, 2) last update time
        const statusPriority = { driving: 0, available: 1, 'on-break': 2, offline: 3 };
        const priorityDiff = statusPriority[a.status as keyof typeof statusPriority] -
                            statusPriority[b.status as keyof typeof statusPriority];

        if (priorityDiff !== 0) return priorityDiff;

        if (a.lastUpdate && b.lastUpdate) {
          return b.lastUpdate.getTime() - a.lastUpdate.getTime();
        }
        return 0;
      });
  }, [drivers, driverStatuses, getDriverStatus]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'driving':
        return 'bg-green-500';
      case 'available':
        return 'bg-blue-500';
      case 'on-break':
        return 'bg-amber-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-slate-400';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'driving':
        return <Navigation className="h-4 w-4" />;
      case 'available':
        return <CheckCircle className="h-4 w-4" />;
      case 'on-break':
        return <Coffee className="h-4 w-4" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-break':
        return 'On Break';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get driver initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Driver Activity
          <Badge variant="outline" className="ml-auto">
            {enhancedDrivers.filter(d => d.status === 'driving' || d.status === 'available').length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-2">
            {enhancedDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => onDriverClick?.(driver.id)}
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar with status indicator */}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                        {getInitials(driver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusColor(driver.status)} ${
                        driver.status === 'driving' ? 'animate-pulse' : ''
                      }`}
                    />
                  </div>

                  {/* Driver info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900">{driver.name}</h4>
                        <p className="text-xs text-slate-500">#{driver.employeeNumber}</p>
                      </div>
                      <Badge
                        variant={driver.status === 'driving' ? 'default' : 'secondary'}
                        className="text-xs flex items-center gap-1"
                      >
                        {getStatusIcon(driver.status)}
                        {getStatusLabel(driver.status)}
                      </Badge>
                    </div>

                    {/* Current assignment */}
                    {driver.currentVehicleId && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                        <MapPin className="h-3 w-3" />
                        <span>Vehicle: {driver.currentVehicleId}</span>
                      </div>
                    )}
                    {driver.currentTaskId && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                        <Navigation className="h-3 w-3" />
                        <span>Task: {driver.currentTaskId}</span>
                      </div>
                    )}

                    {/* Last update */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {driver.lastUpdate ? (
                          <span>
                            Updated{' '}
                            {driver.lastUpdate.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        ) : (
                          <span>No recent activity</span>
                        )}
                      </div>

                      {/* Quick actions */}
                      {driver.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCallDriver?.(driver.id, driver.phone!);
                          }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          Call
                        </button>
                      )}
                    </div>

                    {/* Real-time indicator */}
                    {getDriverStatus(driver.id) && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span>Live</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {enhancedDrivers.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <User className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No drivers available</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
