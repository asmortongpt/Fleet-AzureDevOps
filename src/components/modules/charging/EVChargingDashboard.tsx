import {
  BoltIcon,
  CalendarIcon,
  Battery0Icon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import logger from '@/utils/logger';

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
  const [_selectedStation, setSelectedStation] = useState<number | null>(null);
  const [_selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [_showReservationDialog, setShowReservationDialog] = useState(false);
  const [reservationStationId, setReservationStationId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // TanStack Query hooks for data fetching
  const {
    data: stations = [],
    isLoading: stationsLoading,
    error: _stationsError,
    refetch: refetchStations
  } = useQuery({
    queryKey: ['evChargingStations'],
    queryFn: fetchChargingStations,
    refetchInterval: 30000,
    staleTime: 20000,
    gcTime: 30000
  });

  const {
    data: activeSessions = [],
    isLoading: sessionsLoading,
    error: _sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['evActiveSessions'],
    queryFn: fetchActiveSessions,
    refetchInterval: 30000,
    staleTime: 20000,
    gcTime: 30000
  });

  const {
    data: utilization = [],
    isLoading: utilizationLoading,
    error: _utilizationError,
    refetch: refetchUtilization
  } = useQuery({
    queryKey: ['evStationUtilization'],
    queryFn: fetchStationUtilization,
    refetchInterval: 30000,
    staleTime: 20000,
    gcTime: 30000
  });

  // Mutation for remote start
  const remoteStartMutation = useMutation({
    mutationFn: async ({ stationId, connectorId }: { stationId: string; connectorId: number }) => {
      if (!_selectedVehicleId) {
        throw new Error('Please select a vehicle before starting charging');
      }

      const response = await fetch(`/api/ev/chargers/${stationId}/remote-start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          connectorId,
          vehicleId: _selectedVehicleId,
          idTag: `VEHICLE_${_selectedVehicleId}`
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to start charging');
      return data;
    },
    onSuccess: () => {
      alert('Charging started successfully');
      queryClient.invalidateQueries({ queryKey: ['evActiveSessions'] });
      queryClient.invalidateQueries({ queryKey: ['evChargingStations'] });
    },
    onError: (error) => {
      logger.error('Error starting charge:', error);
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
      queryClient.invalidateQueries({ queryKey: ['evActiveSessions'] });
      queryClient.invalidateQueries({ queryKey: ['evChargingStations'] });
    },
    onError: (error) => {
      logger.error('Error stopping charge:', error);
    }
  });

  const getStatusColor = (status: string): string => {
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

  const getStatusIcon = (status: string): JSX.Element => {
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

  const _calculateChargingCost = (kwh: number, isOffPeak: boolean, station: ChargingStation): number => {
    const rate = isOffPeak ? station.price_per_kwh_off_peak : station.price_per_kwh_on_peak;
    return kwh * rate;
  };

  const createReservation = (stationId: number): void => {
    setReservationStationId(stationId);
    setShowReservationDialog(true);
  };

  const _handleReservationSubmit = async (reservationData: {
    vehicleId: number;
    startTime: string;
    endTime: string;
  }): Promise<void> => {
    try {
      const response = await fetch('/api/ev/reservations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          stationId: reservationStationId,
          ...reservationData
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Reservation created successfully');
        setShowReservationDialog(false);
        setReservationStationId(null);
        refetchStations();
      } else {
        throw new Error(data.message || 'Failed to create reservation');
      }
    } catch (error: unknown) {
      logger.error('Error creating reservation:', error);
      alert(`Failed to create reservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoteStart = (stationId: string, connectorId: number): void => {
    remoteStartMutation.mutate({ stationId, connectorId });
  };

  const handleRemoteStop = (transactionId: string): void => {
    remoteStopMutation.mutate(transactionId);
  };

  const handleRefresh = (): void => {
    refetchStations();
    refetchSessions();
    refetchUtilization();
  };

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
  const totalEnergyDelivered = activeSessions.reduce((sum, s) => sum + (s.energy_delivered_kwh ?? 0), 0);
  const onlineStations = stations.filter(s => s.is_online).length;

  return (
    <div className="p-6 space-y-6">
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
            <Battery0Icon className="w-5 h-5 text-yellow-500" />
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
                ? Math.round(utilization.reduce((sum, u) => sum + (u.utilization_percent ?? 0), 0) / utilization.length)
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Station usage
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EVChargingDashboard;