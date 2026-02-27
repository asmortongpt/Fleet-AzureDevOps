/**
 * Dispatcher Dashboard - Workflow-Optimized View
 * Role: dispatcher (Level 4)
 *
 * Primary Focus:
 * - Active trips on live map
 * - Dispatch channels & communication
 * - Emergency alerts & response
 * - Route assignment & coordination
 */

import {
  MapTrifold,
  Radio,
  Siren,
  Clock,
  CheckCircle,
  Users,
  Phone
} from '@phosphor-icons/react';
// motion removed - React 19 incompatible
import { AlertTriangle, Car, MessageCircle, Route, Zap } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';


import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigation } from '@/contexts/NavigationContext';
import { useRoutes } from '@/hooks/use-api';
import { useFleetData } from '@/hooks/use-fleet-data';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/format-helpers';

interface OperationStats {
  active_trips: number;
  en_route: number;
  delayed: number;
  completed_today: number;
}

interface DispatchChannel {
  id: string;
  name: string;
  listeners: number;
  status: 'active' | 'inactive';
  priority: 'high' | 'medium' | 'low';
}

interface ActiveTrip {
  id: number;
  vehicle_name: string;
  driver_name: string;
  route: string;
  status: 'active' | 'delayed' | 'en_route';
  eta: string;
}

export function DispatcherDashboard() {
  const { navigateTo } = useNavigation();
  const fleetData = useFleetData();
  const vehicles = fleetData.vehicles || [];
  const drivers = fleetData.drivers || [];
  const { data: routesData } = useRoutes();

  const [dispatchChannels, setDispatchChannels] = useState<DispatchChannel[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/dispatch/channels', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data ?? json;
        if (!Array.isArray(data) || cancelled) return;
        setDispatchChannels(
          data.map((channel: any) => ({
            id: String(channel.id ?? channel.channel_id ?? channel.name ?? 'channel'),
            name: channel.name ?? channel.displayName ?? 'Channel',
            listeners: Number(channel.listeners ?? channel.listenerCount ?? 0),
            status: channel.status === 'inactive' ? 'inactive' : 'active',
            priority: channel.priority ?? 'medium',
          }))
        );
      } catch {
        // keep empty on error
      }
    };
    fetchChannels();
    return () => {
      cancelled = true;
    };
  }, []);

  const routes = useMemo(() => {
    return Array.isArray(routesData)
      ? routesData
      : Array.isArray((routesData as any)?.data)
        ? (routesData as any).data
        : [];
  }, [routesData]);

  const operationStats = useMemo<OperationStats>(() => {
    const activeStatuses = new Set(['active', 'in_progress', 'en_route', 'delayed']);
    const activeRoutes = routes.filter((route: any) => activeStatuses.has(String(route.status || '').toLowerCase()));
    const enRoute = activeRoutes.filter((route: any) => String(route.status || '').toLowerCase() === 'en_route').length;
    const delayed = activeRoutes.filter((route: any) => String(route.status || '').toLowerCase() === 'delayed').length;
    const completedToday = routes.filter((route: any) => {
      const completedAt = new Date(route.completed_at || route.completedAt || route.updated_at || route.updatedAt || 0);
      if (Number.isNaN(completedAt.getTime())) return false;
      const today = new Date();
      return completedAt.toDateString() === today.toDateString() && String(route.status || '').toLowerCase() === 'completed';
    }).length;

    return {
      active_trips: activeRoutes.length,
      en_route: enRoute,
      delayed,
      completed_today: completedToday
    };
  }, [routes]);

  const activeTrips = useMemo<ActiveTrip[]>(() => {
    const driverById = new Map<string, any>(drivers.map((d: any) => [String(d.id ?? d.driver_id), d]));
    const vehicleById = new Map<string, any>(vehicles.map((v: any) => [String(v.id ?? v.vehicle_id), v]));
    return routes
      .filter((route: any) => ['active', 'in_progress', 'en_route', 'delayed'].includes(String(route.status || '').toLowerCase()))
      .slice(0, 6)
      .map((route: any) => {
        const vehicle = vehicleById.get(String(route.vehicleId ?? route.vehicle_id ?? route.assigned_vehicle_id));
        const driver = driverById.get(String(route.driverId ?? route.driver_id ?? route.assigned_driver_id));
        const eta = route.eta || route.estimatedArrival || route.estimated_arrival;
        return {
          id: Number(route.id ?? route.route_id ?? 0),
          vehicle_name: vehicle?.name || vehicle?.displayName || vehicle?.vehicleNumber || 'Vehicle',
          driver_name: driver?.name || driver?.fullName || 'Driver',
          route: route.name || route.routeName || route.route_name || 'Route',
          status: (String(route.status || 'active').toLowerCase() as ActiveTrip['status']) || 'active',
          eta: eta ? formatTime(eta) : '—'
        };
      });
  }, [routes, vehicles, drivers]);

  // Quick actions - Navigate to specific pages
  const handleOpenRadio = () => {
    navigateTo('communication');
  };

  const handleCreateEmergencyAlert = () => {
    navigateTo('safety-compliance-hub');
  };

  const handleCreateRoute = () => {
    navigateTo('operations');
  };

  const handleJoinChannel = (_channelId: string) => {
    navigateTo('communication');
  };

  const handleContactDriver = (_driverName: string) => {
    navigateTo('communication');
  };

  const handleViewOnMap = () => {
    navigateTo('live-fleet-dashboard');
  };

  const handleFilterTrips = (_filter: string) => {
    navigateTo('operations');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-950/30 border-green-500/30';
      case 'delayed':
        return 'text-red-400 bg-red-950/30 border-red-500/30';
      case 'en_route':
        return 'text-emerald-400 bg-white/[0.04] border-white/[0.04]';
      default:
        return 'text-white/40 bg-[#111111] border-white/[0.04]';
    }
  };

  return (
    <div className="min-h-screen bg-[#111] p-2">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-white mb-1">Dispatch Console</h1>
          <p className="text-sm text-white/40">Real-Time Operations & Coordination</p>
        </div>
        <Button size="sm"
          onClick={handleCreateEmergencyAlert}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Siren className="w-3 h-3 mr-2" />
          EMERGENCY
        </Button>
      </div>

      {/* Active Operations Summary */}
      <Card className="bg-[#111111] border-emerald-500/30 p-2 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Active Operations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Active Trips */}
          <div
            className="bg-emerald-950/30 rounded-md p-2 border border-emerald-500/30 hover:border-emerald-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-black text-white">{operationStats.active_trips}</span>
            </div>
            <p className="text-emerald-300 font-semibold">Active Trips</p>
          </div>

          {/* En Route */}
          <div
            className="bg-white/[0.04] rounded-md p-2 border border-white/[0.04] hover:border-white/[0.12] transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <MapTrifold className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-black text-white">{operationStats.en_route}</span>
            </div>
            <p className="text-emerald-300 font-semibold">En Route</p>
          </div>

          {/* Delayed */}
          <div
            className="bg-red-950/30 rounded-md p-2 border border-red-500/30 hover:border-red-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-black text-white">{operationStats.delayed}</span>
            </div>
            <p className="text-red-300 font-semibold">Delayed</p>
          </div>

          {/* Completed Today */}
          <div
            className="bg-green-950/30 rounded-md p-2 border border-green-500/30 hover:border-green-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-black text-white">{operationStats.completed_today}</span>
            </div>
            <p className="text-green-300 font-semibold">Completed Today</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-3 flex flex-wrap gap-3">
        <Button size="sm"
          onClick={handleOpenRadio}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Radio className="w-4 h-4 mr-2" />
          Open Radio
        </Button>
        <Button size="sm"
          onClick={handleCreateEmergencyAlert}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Siren className="w-4 h-4 mr-2" />
          Emergency Alert
        </Button>
        <Button size="sm"
          onClick={handleCreateRoute}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Route className="w-4 h-4 mr-2" />
          New Route
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Live Fleet Map */}
        <Card className="lg:col-span-2 bg-[#111111] border-white/[0.04] p-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapTrifold className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Live Fleet Map</h2>
            </div>
            <div className="flex gap-2">
              <Button size="sm"
                variant="outline"
                className="border-white/[0.12] text-sm text-white/60"
                onClick={() => handleFilterTrips('all')}
              >
                All
              </Button>
              <Button size="sm"
                variant="outline"
                className="border-emerald-600 text-emerald-400"
                onClick={() => handleFilterTrips('en_route')}
              >
                En Route
              </Button>
              <Button size="sm"
                variant="outline"
                className="border-red-600 text-red-400"
                onClick={() => handleFilterTrips('delayed')}
              >
                Delayed
              </Button>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-white/[0.03] rounded-md border border-white/[0.04] aspect-video flex items-center justify-center mb-3">
            <div className="text-center">
              <MapTrifold className="w-16 h-16 text-white/40 mx-auto mb-3" />
              <p className="text-white/40 mb-2">Interactive Fleet Map</p>
              <p className="text-sm text-white/40">Google Maps with vehicle markers & routes</p>
            </div>
          </div>

          <Button size="sm"
            onClick={handleViewOnMap}
            variant="outline"
            className="w-full border-emerald-400 text-emerald-400 hover:bg-emerald-400/10"
          >
            View Full-Screen Map
          </Button>
        </Card>

        {/* Active Trips List */}
        <Card className="bg-[#111111] border-white/[0.04] p-2">
          <div className="flex items-center gap-2 mb-3">
            <Route className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Active Trips</h2>
          </div>

          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className={cn(
                  "rounded-lg p-3 border transition-all",
                  getStatusColor(trip.status)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-white">#{trip.id}</p>
                    <p className="text-sm text-white/60">{trip.vehicle_name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{trip.eta}</span>
                  </div>
                </div>

                <p className="text-sm text-white/60 mb-2">{trip.route}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Users className="w-3 h-3" />
                    <span>{trip.driver_name}</span>
                  </div>
                  <Button size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs hover:bg-white/[0.06]"
                    onClick={() => handleContactDriver(trip.driver_name)}
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Dispatch Channels */}
      <Card className="bg-[#111111] border-white/[0.04] p-2 mt-3">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Active Dispatch Channels</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dispatchChannels.map((channel) => (
            <div
              key={channel.id}
              className={cn(
                "rounded-md p-2 border transition-all",
                channel.status === 'active'
                  ? channel.priority === 'high'
                    ? "bg-red-950/30 border-red-500/30"
                    : "bg-green-950/30 border-green-500/30"
                  : "bg-white/[0.03] border-white/[0.04]"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    channel.status === 'active' ? "bg-green-500 animate-pulse" : "bg-white/40"
                  )} />
                  <span className="text-white font-bold">{channel.name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Users className="w-3 h-3" />
                  <span>{channel.listeners}</span>
                </div>
              </div>

              <Button size="sm"
                onClick={() => handleJoinChannel(channel.id)}
                className={cn(
                  "w-full",
                  channel.status === 'active'
                    ? channel.priority === 'high'
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-white/[0.1] hover:bg-white/[0.1] text-sm text-white/60"
                )}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {channel.status === 'active' ? 'Join' : 'Activate'}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
