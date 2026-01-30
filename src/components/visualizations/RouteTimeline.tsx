import { Clock, Navigation, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeOperations } from '@/hooks/use-realtime-operations';

/**
 * Route Timeline - Gantt-style visualization
 *
 * Shows scheduled vs actual routes with real-time progress
 * - Color-coded status bars
 * - Progress indicators
 * - Delay warnings
 * - ETA updates
 */

interface RouteTimelineProps {
  routes: Array<{
    id: string;
    routeNumber: string;
    name: string;
    assignedVehicleId?: string;
    assignedDriverId?: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: 'pending' | 'active' | 'completed' | 'delayed';
  }>;
  startTime?: Date;
  endTime?: Date;
}

export function RouteTimeline({ routes, startTime, endTime }: RouteTimelineProps) {
  const { routeProgress, getRouteProgress } = useRealtimeOperations();

  // Calculate timeline bounds
  const bounds = useMemo(() => {
    if (startTime && endTime) {
      return { start: startTime, end: endTime };
    }

    const now = new Date();
    const start = new Date(now);
    start.setHours(6, 0, 0, 0); // 6 AM
    const end = new Date(now);
    end.setHours(20, 0, 0, 0); // 8 PM

    return { start, end };
  }, [startTime, endTime]);

  const totalMinutes = (bounds.end.getTime() - bounds.start.getTime()) / (1000 * 60);

  // Calculate position and width for a route
  const getRouteBarStyle = (route: typeof routes[0]) => {
    const scheduledStart = new Date(route.scheduledStart);
    const scheduledEnd = new Date(route.scheduledEnd);

    const startOffset = (scheduledStart.getTime() - bounds.start.getTime()) / (1000 * 60);
    const duration = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60);

    const left = (startOffset / totalMinutes) * 100;
    const width = (duration / totalMinutes) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` };
  };

  // Get progress for a route
  const getProgress = (routeId: string) => {
    return getRouteProgress(routeId);
  };

  // Get status color
  const getStatusColor = (route: typeof routes[0]) => {
    const progress = getProgress(route.id);

    if (route.status === 'completed') return 'bg-green-500';
    if (route.status === 'delayed' || (progress && progress.delayMinutes > 5)) return 'bg-red-500';
    if (route.status === 'active') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    const markers: Array<{ time: string; position: number }> = [];
    const current = new Date(bounds.start);

    while (current <= bounds.end) {
      const minutes = (current.getTime() - bounds.start.getTime()) / (1000 * 60);
      const position = (minutes / totalMinutes) * 100;
      markers.push({
        time: current.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        position
      });
      current.setHours(current.getHours() + 2);
    }

    return markers;
  }, [bounds, totalMinutes]);

  // Current time marker
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    if (now < bounds.start || now > bounds.end) return null;
    const minutes = (now.getTime() - bounds.start.getTime()) / (1000 * 60);
    return (minutes / totalMinutes) * 100;
  }, [bounds, totalMinutes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Route Timeline
          <Badge variant="outline" className="ml-auto">
            {routes.length} routes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Time axis */}
        <div className="relative mb-4 h-8 border-b border-slate-200">
          {hourMarkers.map((marker, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-slate-200"
              style={{ left: `${marker.position}%` }}
            >
              <span className="absolute -left-4 top-0 text-xs text-slate-500">
                {marker.time}
              </span>
            </div>
          ))}

          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
              style={{ left: `${currentTimePosition}%` }}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Route bars */}
        <div className="space-y-3">
          {routes.map((route) => {
            const progress = getProgress(route.id);
            const style = getRouteBarStyle(route);
            const statusColor = getStatusColor(route);

            return (
              <div key={route.id} className="relative">
                {/* Route label */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium min-w-[100px]">
                    {route.routeNumber}
                  </span>
                  <span className="text-xs text-slate-600 truncate flex-1">
                    {route.name}
                  </span>
                  {progress && (
                    <Badge
                      variant={progress.delayMinutes > 5 ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {progress.delayMinutes > 0 ? `+${progress.delayMinutes}m` : 'On time'}
                    </Badge>
                  )}
                </div>

                {/* Timeline bar */}
                <div className="relative h-8 bg-slate-100 rounded overflow-hidden">
                  {/* Scheduled bar */}
                  <div
                    className={`absolute top-0 h-full ${statusColor} opacity-30 transition-all`}
                    style={style}
                  />

                  {/* Progress bar */}
                  {progress && route.status === 'active' && (
                    <div
                      className={`absolute top-0 h-full ${statusColor} transition-all`}
                      style={{
                        ...style,
                        width: `${parseFloat(style.width) * (progress.progress / 100)}%`
                      }}
                    />
                  )}

                  {/* Status indicator */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 px-2"
                    style={{ left: style.left }}
                  >
                    {route.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                    {route.status === 'active' && (
                      <Navigation className="h-4 w-4 text-white animate-pulse" />
                    )}
                    {route.status === 'delayed' && (
                      <AlertCircle className="h-4 w-4 text-white animate-pulse" />
                    )}
                    {route.status === 'pending' && (
                      <Clock className="h-4 w-4 text-slate-500" />
                    )}

                    {progress && (
                      <span className="text-xs font-medium text-white">
                        {progress.progress}%
                      </span>
                    )}
                  </div>

                  {/* ETA marker (for active routes) */}
                  {progress && route.status === 'active' && (
                    <div
                      className="absolute top-0 h-full w-0.5 bg-white"
                      style={{
                        left: `${parseFloat(style.left) + parseFloat(style.width)}%`
                      }}
                      title={`ETA: ${new Date(progress.eta).toLocaleTimeString()}`}
                    >
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                {/* Progress details */}
                {progress && (
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-600">
                    <span>
                      Stops: {progress.completedStops}/{progress.totalStops}
                    </span>
                    <span>
                      ETA: {new Date(progress.eta).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {routes.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No routes scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
