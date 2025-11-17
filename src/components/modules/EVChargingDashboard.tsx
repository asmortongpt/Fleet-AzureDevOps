/**
 * EV Charging Dashboard
 *
 * Comprehensive dashboard for managing EV charging operations with:
 * - Real-time charging station status
 * - Active charging sessions monitoring
 * - Smart charging schedule management
 * - Charger reservation system
 * - Battery health tracking
 * - Cost optimization analytics
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BoltIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  BatteryIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

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
}

interface Reservation {
  id: number;
  station_name: string;
  vehicle_name: string;
  driver_name: string;
  reservation_start: string;
  reservation_end: string;
  status: string;
}

interface StationUtilization {
  name: string;
  sessions_today: number;
  total_energy_kwh: number;
  utilization_percent: number;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Query function for charging stations
const fetchChargingStations = async (): Promise<ChargingStation[]> => {
  const response = await fetch('/api/ev/chargers', { headers: getAuthHeaders() });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error('Failed to fetch charging stations');
};

// Query function for active sessions
const fetchActiveSessions = async (): Promise<ChargingSession[]> => {
  const response = await fetch('/api/ev/sessions/active', { headers: getAuthHeaders() });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error('Failed to fetch active sessions');
};

// Query function for station utilization
const fetchStationUtilization = async (): Promise<StationUtilization[]> => {
  const response = await fetch('/api/ev/station-utilization', { headers: getAuthHeaders() });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error('Failed to fetch station utilization');
};

const EVChargingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // TanStack Query hooks for data fetching
  const {
    data: stations = [],
    isLoading: stationsLoading,
    error: stationsError,
    refetch: refetchStations
  } = useQuery({
    queryKey: ['evChargingStations'],
    queryFn: fetchChargingStations,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000 // Data is considered fresh for 20 seconds
  });

  const {
    data: activeSessions = [],
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['evActiveSessions'],
    queryFn: fetchActiveSessions,
    refetchInterval: 30000,
    staleTime: 20000
  });

  const {
    data: utilization = [],
    isLoading: utilizationLoading,
    error: utilizationError,
    refetch: refetchUtilization
  } = useQuery({
    queryKey: ['evStationUtilization'],
    queryFn: fetchStationUtilization,
    refetchInterval: 30000,
    staleTime: 20000
  });

  // Mutation for remote start
  const remoteStartMutation = useMutation({
    mutationFn: async ({ stationId, connectorId }: { stationId: string; connectorId: number }) => {
      const response = await fetch(`/api/ev/chargers/${stationId}/remote-start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          connectorId,
          vehicleId: 1, // TODO: Get from selection
          idTag: 'VEHICLE_1'
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to start charging');
      return data;
    },
    onSuccess: () => {
      alert('Charging started successfully');
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['evActiveSessions'] });
      queryClient.invalidateQueries({ queryKey: ['evChargingStations'] });
    },
    onError: (error) => {
      console.error('Error starting charge:', error);
    }
  });

  // Mutation for remote stop
  const remoteStopMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`/api/ev/sessions/${transactionId}/stop`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to stop charging');
      return data;
    },
    onSuccess: () => {
      alert('Charging stopped successfully');
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['evActiveSessions'] });
      queryClient.invalidateQueries({ queryKey: ['evChargingStations'] });
    },
    onError: (error) => {
      console.error('Error stopping charge:', error);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500';
      case 'Charging':
        return 'bg-blue-500 animate-pulse';
      case 'Reserved':
        return 'bg-yellow-500';
      case 'Faulted':
        return 'bg-red-500';
      case 'Unavailable':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Charging':
        return <BoltIcon className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'Faulted':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatEnergy = (kwh: number): string => {
    return `${kwh.toFixed(2)} kWh`;
  };

  const calculateChargingCost = (kwh: number, isOffPeak: boolean, station: ChargingStation): number => {
    const rate = isOffPeak ? station.price_per_kwh_off_peak : station.price_per_kwh_on_peak;
    return kwh * rate;
  };

  const createReservation = (stationId: number) => {
    // TODO: Open reservation dialog
    console.log('Create reservation for station:', stationId);
  };

  const handleRemoteStart = (stationId: string, connectorId: number) => {
    remoteStartMutation.mutate({ stationId, connectorId });
  };

  const handleRemoteStop = (transactionId: string) => {
    remoteStopMutation.mutate(transactionId);
  };

  const handleRefresh = () => {
    // Refetch all queries
    refetchStations();
    refetchSessions();
    refetchUtilization();
  };

  // Check if any query is loading
  const isLoading = stationsLoading || sessionsLoading || utilizationLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <BoltIcon className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
          <p className="mt-4 text-lg text-gray-600">Loading charging dashboard...</p>
        </div>
      </div>
    );
  }

  const availableStations = stations.filter(s => s.available_connectors > 0).length;
  const totalSessions = activeSessions.length;
  const totalEnergyDelivered = activeSessions.reduce((sum, s) => sum + s.energy_delivered_kwh, 0);
  const onlineStations = stations.filter(s => s.is_online).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">EV Charging Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage charging stations and monitor active sessions</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Online Stations</CardTitle>
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{onlineStations}/{stations.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {availableStations} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
            <BoltIcon className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently charging
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Energy Delivered</CardTitle>
            <BatteryIcon className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatEnergy(totalEnergyDelivered)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Today's total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Utilization</CardTitle>
            <ChartBarIcon className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {utilization.length > 0
                ? Math.round(utilization.reduce((sum, u) => sum + u.utilization_percent, 0) / utilization.length)
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Station usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Charging Stations */}
            <Card>
              <CardHeader>
                <CardTitle>Charging Stations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stations.slice(0, 5).map((station) => (
                    <div key={station.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(station.status)}
                        <div>
                          <p className="font-medium">{station.name}</p>
                          <p className="text-sm text-gray-500">{station.location_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={station.is_online ? 'default' : 'secondary'}>
                          {station.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {station.available_connectors}/{station.num_connectors} available
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Charging Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {activeSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BoltIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No active charging sessions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{session.vehicle_name}</p>
                            <p className="text-sm text-gray-500">{session.station_name}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoteStop(session.transaction_id)}
                            disabled={remoteStopMutation.isPending}
                          >
                            Stop
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Energy</p>
                            <p className="font-medium">{formatEnergy(session.energy_delivered_kwh)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-medium">{formatDuration(session.duration_minutes)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">SoC</p>
                            <p className="font-medium">
                              {session.start_soc_percent}% → {session.end_soc_percent || '...'}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stations Tab */}
        <TabsContent value="stations">
          <Card>
            <CardHeader>
              <CardTitle>All Charging Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stations.map((station) => (
                  <div key={station.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{station.name}</h3>
                        <p className="text-sm text-gray-500">{station.location_name}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(station.status)}`} />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Power Type:</span>
                        <span className="font-medium">{station.power_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Power:</span>
                        <span className="font-medium">{station.max_power_kw} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium">
                          {station.available_connectors}/{station.num_connectors}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rate (off-peak):</span>
                        <span className="font-medium">${station.price_per_kwh_off_peak}/kWh</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => createReservation(station.id)}
                      >
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Reserve
                      </Button>
                      {station.available_connectors > 0 && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRemoteStart(station.station_id, 1)}
                          disabled={remoteStartMutation.isPending}
                        >
                          <BoltIcon className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Charging Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BoltIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No active charging sessions</p>
                  <p className="text-sm mt-2">Start a charging session to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{session.vehicle_name}</h3>
                          <p className="text-sm text-gray-500">
                            {session.driver_name} • {session.station_name}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoteStop(session.transaction_id)}
                          disabled={remoteStopMutation.isPending}
                        >
                          Stop Charging
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Energy Delivered</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatEnergy(session.energy_delivered_kwh)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="text-xl font-bold">
                            {formatDuration(session.duration_minutes)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Avg Power</p>
                          <p className="text-xl font-bold text-yellow-600">
                            {session.avg_power_kw?.toFixed(1)} kW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">State of Charge</p>
                          <p className="text-xl font-bold text-green-600">
                            {session.start_soc_percent}% → {session.end_soc_percent || '...'}%
                          </p>
                        </div>
                      </div>

                      {session.target_soc_percent && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress to {session.target_soc_percent}%</span>
                            <span>{session.end_soc_percent || session.start_soc_percent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${((session.end_soc_percent || session.start_soc_percent) / session.target_soc_percent) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization">
          <Card>
            <CardHeader>
              <CardTitle>Station Utilization (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {utilization.map((stat, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{stat.name}</h3>
                      <span className="text-2xl font-bold text-blue-600">
                        {stat.utilization_percent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(stat.utilization_percent, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Sessions Today</p>
                        <p className="font-semibold">{stat.sessions_today}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Energy</p>
                        <p className="font-semibold">{formatEnergy(stat.total_energy_kwh)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EVChargingDashboard;
