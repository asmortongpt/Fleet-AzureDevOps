import { MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import useSWR from 'swr';

import { FleetMap } from '@/components/FleetMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface GpsRecord {
  id?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  vehicle_number?: string;
  vehicle_status?: string;
  motion_status?: string;
  latitude?: number | string;
  longitude?: number | string;
  speed?: number | string;
  address?: string;
  location?: string;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => data?.data ?? data);

export default function MapDiagnostic() {
  const { data, error, isLoading, mutate } = useSWR<GpsRecord[]>(
    '/api/gps?limit=200',
    fetcher,
    { refreshInterval: 15000, shouldRetryOnError: false }
  );

  const vehicles = useMemo(() => {
    const records = Array.isArray(data) ? data : [];
    return records
      .map((row, index) => {
        const latitude = row.latitude !== undefined ? Number(row.latitude) : undefined;
        const longitude = row.longitude !== undefined ? Number(row.longitude) : undefined;
        return {
          id: row.vehicle_id || row.id || row.vehicle_number || `gps-${index}`,
          name: row.vehicle_name || row.vehicle_number || 'Unknown Vehicle',
          vehicleNumber: row.vehicle_number,
          latitude,
          longitude,
          status: row.motion_status || row.vehicle_status || 'unknown',
          location: row.address || row.location || '',
        };
      })
      .filter((v) => typeof v.latitude === 'number' && typeof v.longitude === 'number');
  }, [data]);

  const statusCounts = useMemo(() => {
    return vehicles.reduce(
      (acc, v) => {
        const status = (v.status || 'unknown').toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [vehicles]);

  const total = vehicles.length;
  const moving = statusCounts.moving || 0;
  const idle = statusCounts.idle || 0;
  const stopped = statusCounts.stopped || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Map Diagnostics
          </h1>
          <p className="text-muted-foreground mt-1">
            Live GPS positions from the fleet tracking service
          </p>
        </div>
        <Button onClick={() => mutate()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Failed to Load GPS Data
            </CardTitle>
            <CardDescription>
              Ensure the API is running and you are authenticated.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tracked Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Moving</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{moving}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Idle</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{idle}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stopped</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{stopped}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Map</CardTitle>
          <CardDescription>Live GPS positions with status markers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : vehicles.length === 0 ? (
            <div className="text-sm text-muted-foreground">No GPS positions available.</div>
          ) : (
            <FleetMap vehicles={vehicles} height="600px" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Feed</CardTitle>
          <CardDescription>Latest telemetry positions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-sm text-muted-foreground">No vehicles reporting GPS data.</div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{vehicle.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.location || 'Location unavailable'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
                    </div>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {vehicle.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
