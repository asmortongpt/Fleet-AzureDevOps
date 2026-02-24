/**
 * ChargingHub - Professional Table-Based EV Charging Management
 *
 * Features:
 * - Professional data table with 12 columns
 * - Real-time charging session monitoring
 * - Station status and availability tracking
 * - Energy delivery and cost metrics
 * - CTA branded styling
 * - WCAG AAA accessibility
 * - Sorting, filtering, pagination
 */

import { ColumnDef } from '@tanstack/react-table';
import { Zap, Battery, MapPin, Plus, RefreshCw, Car, Clock, DollarSign, User, Truck } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';

import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, createStatusColumn, createMonospaceColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useFleetData } from '@/hooks/use-fleet-data';
import { formatCurrency, formatDateTime, formatTime } from '@/utils/format-helpers';
import logger from '@/utils/logger';

// =============================================================================
// TYPES
// =============================================================================

interface ChargingStation {
  id: number;
  station_id: string;
  name: string;
  location_name: string;
  status: string;
  is_online: boolean;
  power_type: string;
  max_power_kw: number;
  available_connectors: number;
  num_connectors: number;
  price_per_kwh_off_peak: number;
  price_per_kwh_on_peak: number;
}

interface ChargingSession {
  id: number;
  transaction_id: string;
  vehicle_name: string;
  driver_name: string;
  station_name: string;
  start_time: string;
  energy_delivered_kwh: number;
  start_soc_percent: number;
  end_soc_percent: number;
  target_soc_percent: number;
  duration_minutes: number;
  avg_power_kw: number;
  price_per_kwh?: number;
  cost?: number;
}

// =============================================================================
// API HELPERS
// =============================================================================

const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

const fetchChargingStations = async (): Promise<ChargingStation[]> => {
  try {
    const response = await fetch('/api/ev-management/chargers', { headers: getAuthHeaders(), credentials: 'include' });
    if (!response.ok) throw new Error('Request failed: ' + response.status);
    const data = await response.json();
    if (data.success) return data.data;
    return [];
  } catch (error) {
    logger.error('Failed to fetch charging stations:', error);
    return [];
  }
};

const fetchActiveSessions = async (): Promise<ChargingSession[]> => {
  try {
    const response = await fetch('/api/ev-management/sessions/active', { headers: getAuthHeaders(), credentials: 'include' });
    if (!response.ok) throw new Error('Request failed: ' + response.status);
    const data = await response.json();
    if (data.success) return data.data;
    return [];
  } catch (error) {
    logger.error('Failed to fetch active sessions:', error);
    return [];
  }
};

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================

const stationColumns: ColumnDef<ChargingStation>[] = [
  createMonospaceColumn('station_id', 'Station ID'),
  {
    accessorKey: 'name',
    header: 'Station Name',
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'location_name',
    header: 'Location',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3 w-3 text-blue-400" />
        {row.getValue('location_name')}
      </div>
    ),
  },
  createStatusColumn('status', 'Status'),
  {
    accessorKey: 'power_type',
    header: 'Power Type',
    cell: ({ row }) => (
      <span className="text-sm text-amber-500">{row.getValue('power_type')}</span>
    ),
  },
  {
    accessorKey: 'max_power_kw',
    header: 'Max Power',
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.getValue('max_power_kw')} kW</span>
    ),
  },
  {
    accessorKey: 'available_connectors',
    header: 'Available',
    cell: ({ row }) => {
      const available = row.getValue('available_connectors') as number;
      const total = row.original.num_connectors;
      const percentage = (available / total) * 100;

      return (
        <div className="flex items-center gap-2">
          <span className={`font-bold ${percentage > 50 ? 'text-emerald-400' : percentage > 0 ? 'text-amber-500' : 'text-red-500'}`}>
            {available}/{total}
          </span>
          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${percentage > 50 ? 'bg-emerald-500' : percentage > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'price_per_kwh_off_peak',
    header: 'Off-Peak Price',
    cell: ({ row }) => (
      <span className="text-sm text-emerald-400">${(row.getValue('price_per_kwh_off_peak') as number).toFixed(3)}/kWh</span>
    ),
  },
  {
    accessorKey: 'price_per_kwh_on_peak',
    header: 'On-Peak Price',
    cell: ({ row }) => (
      <span className="text-sm text-amber-500">${(row.getValue('price_per_kwh_on_peak') as number).toFixed(3)}/kWh</span>
    ),
  },
  {
    accessorKey: 'is_online',
    header: 'Online',
    cell: ({ row }) => {
      const isOnline = row.getValue('is_online') as boolean;
      return (
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
          <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      );
    },
  },
];

const buildSessionColumns = (onViewDetails: (session: ChargingSession) => void): ColumnDef<ChargingSession>[] => [
  createMonospaceColumn('transaction_id', 'Transaction ID'),
  {
    accessorKey: 'vehicle_name',
    header: 'Vehicle',
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.getValue('vehicle_name')}</div>
    ),
  },
  {
    accessorKey: 'driver_name',
    header: 'Driver',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue('driver_name')}</div>
    ),
  },
  {
    accessorKey: 'station_name',
    header: 'Station',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue('station_name')}</div>
    ),
  },
  {
    accessorKey: 'start_time',
    header: 'Start Time',
    cell: ({ row }) => {
      const date = new Date(row.getValue('start_time'));
      return (
        <div className="text-xs text-muted-foreground">
          {formatDateTime(date)}
        </div>
      );
    },
  },
  {
    accessorKey: 'energy_delivered_kwh',
    header: 'Energy Delivered',
    cell: ({ row }) => (
      <span className="font-medium text-blue-400">
        {(row.getValue('energy_delivered_kwh') as number).toFixed(1)} kWh
      </span>
    ),
  },
  {
    accessorKey: 'start_soc_percent',
    header: 'Start SOC',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue('start_soc_percent')}%</span>
    ),
  },
  {
    accessorKey: 'target_soc_percent',
    header: 'Target SOC',
    cell: ({ row }) => (
      <span className="text-sm text-emerald-400">{row.getValue('target_soc_percent')}%</span>
    ),
  },
  {
    accessorKey: 'duration_minutes',
    header: 'Duration',
    cell: ({ row }) => {
      const minutes = row.getValue('duration_minutes') as number;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return (
        <span className="text-sm text-muted-foreground">
          {hours > 0 ? `${hours}h ` : ''}{mins}m
        </span>
      );
    },
  },
  {
    accessorKey: 'avg_power_kw',
    header: 'Avg Power',
    cell: ({ row }) => (
      <span className="text-sm text-amber-500">
        {(row.getValue('avg_power_kw') as number).toFixed(1)} kW
      </span>
    ),
  },
  {
    id: 'session_cost',
    header: 'Cost',
    cell: ({ row }) => {
      const session = row.original;
      const cost = session.cost ?? (session.price_per_kwh
        ? session.energy_delivered_kwh * session.price_per_kwh
        : null);
      return (
        <span className="font-medium text-emerald-400">
          {formatCurrency(cost)}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onViewDetails(row.original)}
      >
        Details
      </Button>
    ),
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ChargingHub() {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedSession, setSelectedSession] = useState<ChargingSession | null>(null);
  const { vehicles, error: fleetDataError } = useFleetData();

  const handleViewSessionDetails = useCallback((session: ChargingSession) => {
    setSelectedSession(session);
  }, []);

  const sessionColumns = useMemo(
    () => buildSessionColumns(handleViewSessionDetails),
    [handleViewSessionDetails]
  );

  // Fleet EV status computed from vehicle data
  const evStatus = useMemo(() => {
    const electric = vehicles.filter((v: any) => v.fuelType === 'electric').length;
    const hybrid = vehicles.filter((v: any) => v.fuelType === 'hybrid').length;
    return { electric, hybrid, total: electric + hybrid, fleetTotal: vehicles.length };
  }, [vehicles]);

  // Efficiency metrics
  const efficiencyMetrics = useMemo(() => {
    if (sessions.length === 0) return { avgKwhPerSession: 0, avgDuration: 0, avgPower: 0 };
    const avgKwhPerSession = sessions.reduce((sum, s) => sum + s.energy_delivered_kwh, 0) / sessions.length;
    const avgDuration = sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / sessions.length;
    const avgPower = sessions.reduce((sum, s) => sum + s.avg_power_kw, 0) / sessions.length;
    return { avgKwhPerSession, avgDuration, avgPower };
  }, [sessions]);

  // Fetch data
  const loadData = async () => {
    setLoading(true);
    try {
      const [stationsData, sessionsData] = await Promise.all([
        fetchChargingStations(),
        fetchActiveSessions(),
      ]);
      setStations(stationsData);
      setSessions(sessionsData);
      setLastRefresh(new Date());
    } catch (error) {
      logger.error('Failed to load charging data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Summary metrics
  const metrics = useMemo(() => {
    const onlineStations = stations.filter(s => s.is_online).length;
    const totalAvailable = stations.reduce((sum, s) => sum + s.available_connectors, 0);
    const totalConnectors = stations.reduce((sum, s) => sum + s.num_connectors, 0);
    const totalEnergy = sessions.reduce((sum, s) => sum + s.energy_delivered_kwh, 0);
    const avgCost = stations.length > 0
      ? stations.reduce((sum, s) => sum + s.price_per_kwh_off_peak, 0) / stations.length
      : 0.35;
    const totalCost = totalEnergy * avgCost;

    return {
      onlineStations,
      totalStations: stations.length,
      availableConnectors: totalAvailable,
      totalConnectors,
      activeSessions: sessions.length,
      totalEnergy: totalEnergy.toFixed(1),
      totalCost,
    };
  }, [stations, sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Zap className="w-16 h-16 mx-auto text-blue-400 animate-pulse" />
          <p className="mt-4 text-sm font-medium text-foreground">Loading Charging Hub...</p>
        </div>
      </div>
    );
  }

  if (fleetDataError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground">{fleetDataError instanceof Error ? fleetDataError.message : 'An unexpected error occurred'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-400" />
            Charging Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time EV charging infrastructure management • Last updated: {formatTime(lastRefresh)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            disabled
            title="Station provisioning requires OCPP configuration. Contact your infrastructure team to register a new charger."
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Station
          </Button>
        </div>
      </div>

      {/* Fleet EV Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Car className="h-3 w-3 text-blue-400" />
              Fleet EV Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{evStatus.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {evStatus.electric} Electric / {evStatus.hybrid} Hybrid of {evStatus.fleetTotal} vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Avg kWh/Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{efficiencyMetrics.avgKwhPerSession.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Energy per charge</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Math.floor(efficiencyMetrics.avgDuration / 60) > 0 ? `${Math.floor(efficiencyMetrics.avgDuration / 60)}h ` : ''}{Math.round(efficiencyMetrics.avgDuration % 60)}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Avg Power</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{efficiencyMetrics.avgPower.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground mt-1">Per session</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Total Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalStations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{metrics.onlineStations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {metrics.availableConnectors}/{metrics.totalConnectors}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{metrics.activeSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Energy Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalEnergy} kWh</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(metrics.totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.totalStations > 0 ? Math.round((metrics.activeSessions / metrics.totalStations) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charging Stations Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          Charging Stations ({stations.length})
        </h2>
        <DataTable
          columns={stationColumns}
          data={stations}
          searchPlaceholder="Search stations..."
          defaultPageSize={25}
          enableRowSelection={false}
        />
      </div>

      {/* Active Sessions Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Battery className="w-5 h-5 text-blue-400" />
          Active Charging Sessions ({sessions.length})
        </h2>
        <DataTable
          columns={sessionColumns}
          data={sessions}
          searchPlaceholder="Search sessions..."
          defaultPageSize={25}
          enableRowSelection={false}
        />
      </div>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => { if (!open) setSelectedSession(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              Charging Session Details
            </DialogTitle>
            <DialogDescription>
              Transaction {selectedSession?.transaction_id}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (() => {
            const s = selectedSession;
            const cost = s.cost ?? (s.price_per_kwh ? s.energy_delivered_kwh * s.price_per_kwh : null);
            const hours = Math.floor(s.duration_minutes / 60);
            const mins = s.duration_minutes % 60;
            const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            return (
              <div className="space-y-4 py-2">
                {/* Vehicle & Driver */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Vehicle</p>
                      <p className="text-sm font-medium text-foreground">{s.vehicle_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Driver</p>
                      <p className="text-sm font-medium text-foreground">{s.driver_name}</p>
                    </div>
                  </div>
                </div>

                {/* Station & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Station</p>
                      <p className="text-sm font-medium text-foreground">{s.station_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="text-sm font-medium text-foreground">{formatDateTime(new Date(s.start_time))}</p>
                    </div>
                  </div>
                </div>

                {/* Energy metrics */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Energy</p>
                      <p className="text-lg font-bold text-blue-400">{s.energy_delivered_kwh.toFixed(1)} kWh</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-lg font-bold text-foreground">{durationLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Power</p>
                      <p className="text-lg font-bold text-amber-500">{s.avg_power_kw.toFixed(1)} kW</p>
                    </div>
                  </div>

                  {/* SOC Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>SOC: {s.start_soc_percent}%</span>
                      <span>Target: {s.target_soc_percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, ((s.end_soc_percent || s.start_soc_percent) / s.target_soc_percent) * 100)}%` }}
                      />
                    </div>
                    {s.end_soc_percent > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Current: {s.end_soc_percent}%</p>
                    )}
                  </div>
                </div>

                {/* Cost */}
                {cost != null && (
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                    <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Cost</p>
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(cost)}</p>
                    </div>
                    {s.price_per_kwh && (
                      <p className="ml-auto text-xs text-muted-foreground">@ ${s.price_per_kwh.toFixed(3)}/kWh</p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  );
}
