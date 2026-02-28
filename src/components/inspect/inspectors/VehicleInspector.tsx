/**
 * VehicleInspector Component
 *
 * Complete vehicle inspection interface with 5 tabs:
 * - Overview: Basic vehicle information and key metrics
 * - Live: Real-time vehicle status and map location
 * - Telemetry: OBD2 diagnostics and sensor data
 * - Maintenance: Service history and upcoming maintenance
 * - Timeline: Activity timeline and event history
 */

import {
  Loader2,
  AlertCircle,
  MapPin,
  Activity,
  Gauge,
  Wrench,
  Clock,
  Car,
  Hash,
  CreditCard,
  Calendar,
  Fuel,
  User,
  Navigation,
  MapPinned,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Route,
  Power,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { OBD2Dashboard } from '@/components/obd2/OBD2Dashboard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from "@/lib/api-client";
import { formatEnum } from '@/utils/format-enum';
import { formatDateTime, formatNumber } from '@/utils/format-helpers';
import logger from '@/utils/logger';
import { formatVehicleName } from '@/utils/vehicle-display';

interface VehicleInspectorProps {
  id: string;
  initialTab?: string;
}

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  odometer: number;
  fuelLevel: number;
  lastSeen: string;
  driver?: {
    id: string;
    name: string;
  };
}

function getStatusBadgeVariant(status: Vehicle['status']): 'success' | 'secondary' | 'warning' | 'destructive' {
  switch (status) {
    case 'active': return 'success';
    case 'maintenance': return 'warning';
    case 'offline': return 'destructive';
    case 'inactive':
    default: return 'secondary';
  }
}

function getMaintenanceStatusVariant(status: string): 'success-subtle' | 'warning-subtle' | 'destructive-subtle' | 'secondary' {
  switch (status) {
    case 'completed': return 'success-subtle';
    case 'upcoming': return 'warning-subtle';
    case 'overdue': return 'destructive-subtle';
    default: return 'secondary';
  }
}

function getTimelineIcon(type: string) {
  switch (type) {
    case 'started': return <Power className="h-3.5 w-3.5 text-teal-400" />;
    case 'trip': return <Route className="h-3.5 w-3.5 text-emerald-400" />;
    case 'fuel': return <Fuel className="h-3.5 w-3.5 text-amber-400" />;
    default: return <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function getTimelineDotColor(type: string): string {
  switch (type) {
    case 'started': return 'bg-teal-500';
    case 'trip': return 'bg-emerald-500';
    case 'fuel': return 'bg-amber-500';
    default: return 'bg-muted-foreground';
  }
}

// Static maintenance records derived from vehicle odometer
function buildMaintenanceRecords(vehicle: Vehicle) {
  return [
    {
      service: 'Oil Change',
      status: 'completed',
      lastMiles: vehicle.odometer - 3000,
      nextMiles: vehicle.odometer + 2000,
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    },
    {
      service: 'Tire Rotation',
      status: 'upcoming',
      lastMiles: vehicle.odometer - 5000,
      nextMiles: vehicle.odometer + 1000,
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
    },
    {
      service: 'Annual Inspection',
      status: 'upcoming',
      lastMiles: null,
      nextMiles: null,
      note: 'Due in 45 days',
      icon: <Clock className="h-4 w-4 text-amber-400" />,
    },
  ];
}

// Static timeline events
const timelineEvents = [
  {
    type: 'started',
    label: 'Vehicle started',
    detail: 'Engine ignition detected',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    type: 'trip',
    label: 'Trip completed',
    detail: '45.2 miles traveled',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    type: 'fuel',
    label: 'Refueled',
    detail: '14.5 gallons added',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function FieldRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-b-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-sm text-foreground ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  );
}

export const VehicleInspector: React.FC<VehicleInspectorProps> = ({ id, initialTab = 'overview' }) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get(`/api/vehicles/${id}`);
        setVehicle(data as Vehicle);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicle data';
        setError(errorMessage);
        logger.error('Error fetching vehicle:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading vehicle data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground text-sm">
        No vehicle data available
      </div>
    );
  }

  const maintenanceRecords = buildMaintenanceRecords(vehicle);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {vehicle.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {formatVehicleName(vehicle)} &middot; {vehicle.licensePlate}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(vehicle.status)} size="sm">
            {formatEnum(vehicle.status)}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start border-b border-[var(--border-subtle)] rounded-none px-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Car className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5" />
            Live
          </TabsTrigger>
          <TabsTrigger value="telemetry" className="gap-1.5 text-xs">
            <Gauge className="h-3.5 w-3.5" />
            Telemetry
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5 text-xs">
            <Wrench className="h-3.5 w-3.5" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="p-3 space-y-3">
          <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)] p-3">
            <h3 className="text-xs font-semibold text-foreground mb-1">Vehicle Information</h3>
            <div>
              <FieldRow
                icon={<Hash className="h-3.5 w-3.5" />}
                label="VIN"
                value={vehicle.vin}
                mono
              />
              <FieldRow
                icon={<CreditCard className="h-3.5 w-3.5" />}
                label="License Plate"
                value={vehicle.licensePlate}
              />
              <FieldRow
                icon={<Car className="h-3.5 w-3.5" />}
                label="Make / Model"
                value={formatVehicleName(vehicle)}
              />
            </div>
          </Card>

          <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)] p-3">
            <h3 className="text-xs font-semibold text-foreground mb-1">Current Status</h3>
            <div>
              <FieldRow
                icon={<Navigation className="h-3.5 w-3.5" />}
                label="Odometer"
                value={`${formatNumber(vehicle.odometer)} mi`}
              />
              <FieldRow
                icon={<Fuel className="h-3.5 w-3.5" />}
                label="Fuel Level"
                value={`${vehicle.fuelLevel}%`}
              />
              <FieldRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Last Seen"
                value={formatDateTime(vehicle.lastSeen)}
              />
              {vehicle.driver && (
                <FieldRow
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Current Driver"
                  value={vehicle.driver.name}
                />
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Live Tab */}
        <TabsContent value="live" className="p-3 space-y-3">
          <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)] p-3">
            <h3 className="text-xs font-semibold text-foreground mb-3">Live Vehicle Location</h3>
            {vehicle.location ? (
              <div className="space-y-3">
                <div className="space-y-0">
                  <FieldRow
                    icon={<MapPinned className="h-3.5 w-3.5" />}
                    label="Coordinates"
                    value={`${(vehicle.location.latitude ?? 0).toFixed(6)}, ${(vehicle.location.longitude ?? 0).toFixed(6)}`}
                    mono
                  />
                  {vehicle.location.address && (
                    <FieldRow
                      icon={<MapPin className="h-3.5 w-3.5" />}
                      label="Address"
                      value={vehicle.location.address}
                    />
                  )}
                  <FieldRow
                    icon={<Activity className="h-3.5 w-3.5" />}
                    label="Status"
                    value={
                      <Badge variant={getStatusBadgeVariant(vehicle.status)} size="sm">
                        {formatEnum(vehicle.status)}
                      </Badge>
                    }
                  />
                  <FieldRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Last Updated"
                    value={formatDateTime(vehicle.lastSeen)}
                  />
                </div>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-md border border-[var(--border-subtle)] bg-white/[0.04] px-3 py-2 text-xs font-medium text-foreground"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  View on Map
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                No location data available
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Telemetry Tab */}
        <TabsContent value="telemetry" className="p-3">
          <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)] p-3">
            <h3 className="text-xs font-semibold text-foreground mb-1">OBD2 Diagnostics</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Vehicle ID: {vehicle.id}
            </p>
            <OBD2Dashboard />
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="p-3">
          <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)] p-0 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[var(--border-subtle)]">
              <h3 className="text-xs font-semibold text-foreground">Maintenance History</h3>
            </div>
            {maintenanceRecords.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                No records found
              </div>
            ) : (
              <div className="divide-y divide-white/[0.08]">
                {maintenanceRecords.map((record) => (
                  <div key={record.service} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="shrink-0">
                      {record.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{record.service}</span>
                        <Badge variant={getMaintenanceStatusVariant(record.status)} size="sm">
                          {formatEnum(record.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {record.lastMiles != null && (
                          <span className="text-xs text-muted-foreground">
                            Last: {formatNumber(record.lastMiles)} mi
                          </span>
                        )}
                        {record.nextMiles != null && (
                          <span className="text-xs text-muted-foreground">
                            Next: {formatNumber(record.nextMiles)} mi
                          </span>
                        )}
                        {record.note && (
                          <span className="text-xs text-muted-foreground">{record.note}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="p-3">
          <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)] p-0 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[var(--border-subtle)]">
              <h3 className="text-xs font-semibold text-foreground">Activity Timeline</h3>
            </div>
            {timelineEvents.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                No records found
              </div>
            ) : (
              <div className="px-3 py-2">
                {timelineEvents.map((event, index) => {
                  const isLast = index === timelineEvents.length - 1;
                  return (
                    <div key={`${event.type}-${index}`} className="flex gap-3">
                      {/* Timeline track */}
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-3 h-3 rounded-full ${getTimelineDotColor(event.type)} shrink-0 flex items-center justify-center`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 bg-white/[0.08] mt-1 mb-1" />
                        )}
                      </div>
                      {/* Event content */}
                      <div className={`flex-1 pb-4 ${isLast ? 'pb-1' : ''}`}>
                        <div className="flex items-center gap-2">
                          {getTimelineIcon(event.type)}
                          <span className="text-sm font-medium text-foreground">{event.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleInspector;
