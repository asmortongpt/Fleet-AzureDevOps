import { Zap, Battery, Leaf, TrendingUp, MapPin, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface EnergyMetrics {
  totalEnergyDelivered: number;
  totalCost: number;
  avgCostPerKwh: number;
  carbonOffset: number;
  peakDemand: number;
  offPeakUsage: number;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Query functions
const fetchChargingStations = async (): Promise<ChargingStation[]> => {
  try {
    const response = await fetch('/api/ev/chargers', { headers: getAuthHeaders() });
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
    const response = await fetch('/api/ev/sessions/active', { headers: getAuthHeaders() });
    const data = await response.json();
    if (data.success) return data.data;
    return [];
  } catch (error) {
    logger.error('Failed to fetch active sessions:', error);
    return [];
  }
};

const ChargingHub = () => {
  const [energyMetrics, setEnergyMetrics] = useState<EnergyMetrics>({
    totalEnergyDelivered: 0,
    totalCost: 0,
    avgCostPerKwh: 0,
    carbonOffset: 0,
    peakDemand: 0,
    offPeakUsage: 0
  });

  // TanStack Query hooks
  const { data: stations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ['evChargingStations'],
    queryFn: fetchChargingStations,
    refetchInterval: 30000,
    staleTime: 20000,
    gcTime: 30000
  });

  const { data: activeSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['evActiveSessions'],
    queryFn: fetchActiveSessions,
    refetchInterval: 30000,
    staleTime: 20000,
    gcTime: 30000
  });

  // Calculate energy metrics
  useEffect(() => {
    if (activeSessions.length > 0) {
      const totalEnergy = activeSessions.reduce((sum, s) => sum + (s.energy_delivered_kwh ?? 0), 0);
      const avgCost = stations.length > 0
        ? stations.reduce((sum, s) => sum + s.price_per_kwh_off_peak, 0) / stations.length
        : 0.35;
      const totalCost = totalEnergy * avgCost;
      const carbonOffset = totalEnergy * 0.49; // kg CO2 per kWh average
      const peakDemand = Math.max(...activeSessions.map(s => s.avg_power_kw ?? 0), 0);
      const offPeakUsage = totalEnergy * 0.65; // Assume 65% off-peak usage

      setEnergyMetrics({
        totalEnergyDelivered: totalEnergy,
        totalCost,
        avgCostPerKwh: avgCost,
        carbonOffset,
        peakDemand,
        offPeakUsage
      });
    }
  }, [activeSessions, stations]);

  const isLoading = stationsLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <Zap className="w-16 h-16 mx-auto text-blue-600 animate-pulse" />
          <p className="mt-4 text-sm font-medium text-gray-700">Loading Charging Hub...</p>
        </div>
      </div>
    );
  }

  const onlineStations = stations.filter(s => s.is_online).length;
  const availableStations = stations.filter(s => s.available_connectors > 0).length;
  const activeCount = activeSessions.length;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-7 h-7 text-blue-600" />
              Charging Hub
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">Real-time EV charging infrastructure management</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-testid="energy-refresh-button"
            aria-label="Refresh charging data"
          >
            <Clock className="w-4 h-4 mr-2" />
            Auto-refresh: 30s
          </Button>
        </div>
      </div>

      {/* Main Content Grid - Responsive, No Scroll */}
      <div className="h-[calc(100vh-80px)] p-4 overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Energy Metrics Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="energy-metrics-column">
            {/* Total Energy Delivered */}
            <Card data-testid="energy-total-card" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  Total Energy Delivered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" aria-label={`${energyMetrics.totalEnergyDelivered.toFixed(1)} kilowatt hours delivered`}>
                  {energyMetrics.totalEnergyDelivered.toFixed(1)} kWh
                </div>
                <p className="text-xs opacity-90 mt-1">Today's charging sessions</p>
              </CardContent>
            </Card>

            {/* Carbon Offset */}
            <Card data-testid="carbon-offset-card" className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Carbon Offset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" aria-label={`${energyMetrics.carbonOffset.toFixed(1)} kilograms CO2 offset`}>
                  {energyMetrics.carbonOffset.toFixed(1)} kg CO₂
                </div>
                <p className="text-xs opacity-90 mt-1">Environmental impact saved</p>
              </CardContent>
            </Card>

            {/* Cost Metrics */}
            <Card data-testid="cost-metrics-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <DollarSign className="w-4 h-4" />
                  Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-900" aria-label={`Total cost ${energyMetrics.totalCost.toFixed(2)} dollars`}>
                      ${energyMetrics.totalCost.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Cost/kWh</p>
                    <p className="text-lg font-semibold text-gray-800">
                      ${energyMetrics.avgCostPerKwh.toFixed(3)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Peak Demand */}
            <Card data-testid="peak-demand-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <TrendingUp className="w-4 h-4" />
                  Peak Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" aria-label={`Peak demand ${energyMetrics.peakDemand.toFixed(1)} kilowatts`}>
                  {energyMetrics.peakDemand.toFixed(1)} kW
                </div>
                <p className="text-xs text-gray-600 mt-1">Current maximum power draw</p>
              </CardContent>
            </Card>
          </div>

          {/* Charging Stations Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="charging-stations-column">
            <Card className="h-full" data-testid="stations-overview-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Charging Stations
                  </span>
                  <Badge variant="secondary" className="text-sm">
                    {onlineStations}/{stations.length} Online
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">
                {stations.length === 0 ? (
                  <div className="text-center py-8 text-gray-700">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No charging stations configured</p>
                  </div>
                ) : (
                  stations.slice(0, 10).map((station) => (
                    <div
                      key={station.id}
                      className="p-3 border rounded-lg bg-white hover:shadow-md transition-shadow"
                      data-testid="station-item"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-gray-900">{station.name}</h3>
                          <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {station.location_name}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={station.is_online ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {station.status}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {station.max_power_kw}kW {station.power_type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Available</p>
                          <p className="text-lg font-bold text-green-600">
                            {station.available_connectors}/{station.num_connectors}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="active-sessions-column">
            <Card className="h-full" data-testid="sessions-overview-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Active Sessions
                  </span>
                  <Badge variant="default" className="text-sm bg-blue-600">
                    {activeCount} Charging
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">
                {activeSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-700">
                    <Battery className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active charging sessions</p>
                  </div>
                ) : (
                  activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-green-50 hover:shadow-md transition-shadow"
                      data-testid="session-item"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-gray-900">{session.vehicle_name}</h3>
                          <p className="text-xs text-gray-600 mt-0.5">{session.driver_name}</p>
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {session.station_name}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-700 font-medium">
                              {session.energy_delivered_kwh.toFixed(1)} kWh
                            </span>
                            <span className="text-xs text-gray-700">•</span>
                            <span className="text-xs text-gray-700">
                              {session.duration_minutes}m
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Battery className="w-4 h-4 animate-pulse" />
                            <span className="text-lg font-bold">
                              {session.start_soc_percent}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            → {session.target_soc_percent}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sustainability Insights Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="sustainability-column">
            <Card data-testid="sustainability-summary-card" className="bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Leaf className="w-4 h-4 text-green-600" />
                  Sustainability Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Off-Peak Usage</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-green-600">
                      {energyMetrics.offPeakUsage.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-700 mb-0.5">kWh (65%)</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: '65%' }}
                      role="progressbar"
                      aria-valuenow={65}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Off-peak usage percentage"
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-600 mb-2">Environmental Benefits</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700">Trees Planted Equivalent</span>
                      <span className="text-sm font-semibold text-green-700">
                        {Math.round(energyMetrics.carbonOffset / 20)} trees
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700">Miles Offset (Gas)</span>
                      <span className="text-sm font-semibold text-green-700">
                        {Math.round(energyMetrics.carbonOffset * 2.4)} mi
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="energy-efficiency-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Energy Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Avg Charging Speed</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {activeSessions.length > 0
                        ? (activeSessions.reduce((sum, s) => sum + s.avg_power_kw, 0) / activeSessions.length).toFixed(1)
                        : '0.0'} kW
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Stations Utilized</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round((activeCount / Math.max(stations.length, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Availability Rate</span>
                    <span className="text-sm font-semibold text-green-600">
                      {Math.round((availableStations / Math.max(stations.length, 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargingHub;
