import { Battery, Leaf, TrendingUp, Zap, Car, Plug2, BarChart3, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import logger from '@/utils/logger';

interface EVVehicle {
  id: number;
  vehicle_id: string;
  make: string;
  model: string;
  year: number;
  battery_capacity_kwh: number;
  current_soc: number;
  range_miles: number;
  charging_status: 'charging' | 'idle' | 'full';
  location: string;
  last_charge_time: string;
  total_energy_consumed_kwh: number;
  total_miles_driven: number;
}

interface SustainabilityMetrics {
  totalCO2Saved: number;
  totalEnergyConsumed: number;
  avgEfficiency: number;
  treesEquivalent: number;
  gasolineSaved: number;
  costSavings: number;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Query function for EV vehicles
const fetchEVVehicles = async (): Promise<EVVehicle[]> => {
  try {
    const response = await fetch('/api/ev/vehicles', { headers: getAuthHeaders() });
    const data = await response.json();
    if (data.success) return data.data;
    return [];
  } catch (error) {
    logger.error('Failed to fetch EV vehicles:', error);
    return [];
  }
};

const EVHub = () => {
  const [sustainabilityMetrics, setSustainabilityMetrics] = useState<SustainabilityMetrics>({
    totalCO2Saved: 0,
    totalEnergyConsumed: 0,
    avgEfficiency: 0,
    treesEquivalent: 0,
    gasolineSaved: 0,
    costSavings: 0
  });

  // TanStack Query hook
  const { data: evVehicles = [], isLoading } = useQuery({
    queryKey: ['evVehicles'],
    queryFn: fetchEVVehicles,
    refetchInterval: 30000,
    staleTime: 20000,
    gcTime: 30000
  });

  // Calculate sustainability metrics
  useEffect(() => {
    if (evVehicles.length > 0) {
      const totalEnergy = evVehicles.reduce((sum, v) => sum + (v.total_energy_consumed_kwh ?? 0), 0);
      const totalMiles = evVehicles.reduce((sum, v) => sum + (v.total_miles_driven ?? 0), 0);

      // CO2 savings calculation: avg gas car emits 0.404 kg CO2/mile, EV grid avg is 0.49 kg CO2/kWh
      const gasCO2 = totalMiles * 0.404;
      const evCO2 = totalEnergy * 0.49;
      const co2Saved = gasCO2 - evCO2;

      // Financial savings: avg gas car gets 25 mpg, gas at $3.50/gal, electricity at $0.35/kWh
      const gasolineSaved = totalMiles / 25; // gallons
      const gasCost = gasolineSaved * 3.50;
      const evCost = totalEnergy * 0.35;
      const costSavings = gasCost - evCost;

      // Efficiency: miles per kWh
      const avgEfficiency = totalEnergy > 0 ? totalMiles / totalEnergy : 0;

      // Trees: one tree absorbs ~20 kg CO2 per year
      const treesEquivalent = co2Saved / 20;

      setSustainabilityMetrics({
        totalCO2Saved: Math.max(co2Saved, 0),
        totalEnergyConsumed: totalEnergy,
        avgEfficiency,
        treesEquivalent: Math.max(treesEquivalent, 0),
        gasolineSaved: Math.max(gasolineSaved, 0),
        costSavings: Math.max(costSavings, 0)
      });
    }
  }, [evVehicles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Car className="w-16 h-16 mx-auto text-green-600 animate-pulse" />
          <p className="mt-4 text-sm font-medium text-gray-700">Loading EV Hub...</p>
        </div>
      </div>
    );
  }

  const chargingCount = evVehicles.filter(v => v.charging_status === 'charging').length;
  const fullCount = evVehicles.filter(v => v.charging_status === 'full').length;
  const avgSOC = evVehicles.length > 0
    ? evVehicles.reduce((sum, v) => sum + v.current_soc, 0) / evVehicles.length
    : 0;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-7 h-7 text-green-600" />
              EV Fleet Hub
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">Electric vehicle fleet sustainability and performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {evVehicles.length} EV Vehicles
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Responsive, No Scroll */}
      <div className="h-[calc(100vh-80px)] p-4 overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fleet Overview Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="fleet-overview-column">
            {/* Total EVs */}
            <Card data-testid="total-evs-card" className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Total EV Fleet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" aria-label={`${evVehicles.length} electric vehicles in fleet`}>
                  {evVehicles.length}
                </div>
                <p className="text-xs opacity-90 mt-1">Active electric vehicles</p>
              </CardContent>
            </Card>

            {/* Average State of Charge */}
            <Card data-testid="avg-soc-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Battery className="w-4 h-4" />
                  Avg State of Charge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600" aria-label={`Average state of charge ${avgSOC.toFixed(0)} percent`}>
                  {avgSOC.toFixed(0)}%
                </div>
                <Progress value={avgSOC} className="mt-2 h-2" aria-label="Average battery level progress" />
                <p className="text-xs text-gray-600 mt-2">Fleet battery health</p>
              </CardContent>
            </Card>

            {/* Charging Status */}
            <Card data-testid="charging-status-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Charging Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-600" />
                    Charging Now
                  </span>
                  <span className="text-lg font-bold text-blue-600">{chargingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Battery className="w-3 h-3 text-green-600" />
                    Fully Charged
                  </span>
                  <span className="text-lg font-bold text-green-600">{fullCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Car className="w-3 h-3 text-gray-600" />
                    Idle
                  </span>
                  <span className="text-lg font-bold text-gray-600">
                    {evVehicles.length - chargingCount - fullCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Energy Efficiency */}
            <Card data-testid="energy-efficiency-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <BarChart3 className="w-4 h-4" />
                  Energy Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" aria-label={`${sustainabilityMetrics.avgEfficiency.toFixed(2)} miles per kilowatt hour`}>
                  {sustainabilityMetrics.avgEfficiency.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600 mt-1">mi/kWh fleet average</p>
              </CardContent>
            </Card>
          </div>

          {/* EV Vehicles List Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="ev-vehicles-column">
            <Card className="h-full" data-testid="vehicles-list-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Car className="w-5 h-5 text-green-600" />
                  EV Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">
                {evVehicles.length === 0 ? (
                  <div className="text-center py-8 text-gray-700">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No EV vehicles in fleet</p>
                  </div>
                ) : (
                  evVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="p-3 border rounded-lg bg-white hover:shadow-md transition-shadow"
                      data-testid="vehicle-item"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-xs text-gray-600 mt-0.5">{vehicle.location}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Battery</span>
                              <span className="font-semibold text-gray-900">
                                {vehicle.current_soc}%
                              </span>
                            </div>
                            <Progress
                              value={vehicle.current_soc}
                              className="h-1.5"
                              aria-label={`Battery level ${vehicle.current_soc} percent`}
                            />
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-gray-600">Range</span>
                              <span className="font-semibold text-gray-900">
                                {vehicle.range_miles} mi
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-3">
                          <Badge
                            variant={
                              vehicle.charging_status === 'charging'
                                ? 'default'
                                : vehicle.charging_status === 'full'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={
                              vehicle.charging_status === 'charging'
                                ? 'bg-blue-600 animate-pulse'
                                : vehicle.charging_status === 'full'
                                ? 'bg-green-600 text-white'
                                : ''
                            }
                          >
                            {vehicle.charging_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sustainability Impact Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="sustainability-impact-column">
            {/* Carbon Offset */}
            <Card data-testid="carbon-offset-total-card" className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Total CO₂ Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" aria-label={`${sustainabilityMetrics.totalCO2Saved.toFixed(0)} kilograms carbon dioxide saved`}>
                  {sustainabilityMetrics.totalCO2Saved.toFixed(0)} kg
                </div>
                <p className="text-xs opacity-90 mt-1">Compared to gasoline vehicles</p>
              </CardContent>
            </Card>

            {/* Trees Equivalent */}
            <Card data-testid="trees-equivalent-card" className="bg-gradient-to-br from-green-100 to-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Trees Planted Equivalent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Leaf className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-3xl font-bold text-green-800" aria-label={`${sustainabilityMetrics.treesEquivalent.toFixed(0)} trees planted equivalent`}>
                      {sustainabilityMetrics.treesEquivalent.toFixed(0)}
                    </div>
                    <p className="text-xs text-green-700 mt-1">trees/year</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gasoline Saved */}
            <Card data-testid="gasoline-saved-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Gasoline Saved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" aria-label={`${sustainabilityMetrics.gasolineSaved.toFixed(1)} gallons gasoline saved`}>
                  {sustainabilityMetrics.gasolineSaved.toFixed(1)} gal
                </div>
                <p className="text-xs text-gray-600 mt-1">Compared to gas fleet</p>
              </CardContent>
            </Card>

            {/* Cost Savings */}
            <Card data-testid="cost-savings-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" aria-label={`${sustainabilityMetrics.costSavings.toFixed(2)} dollars saved`}>
                  ${sustainabilityMetrics.costSavings.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600 mt-1">Fuel cost savings (fleet lifetime)</p>
              </CardContent>
            </Card>
          </div>

          {/* Energy Analytics Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="energy-analytics-column">
            {/* Total Energy Consumed */}
            <Card data-testid="total-energy-card" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Total Energy Consumed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" aria-label={`${sustainabilityMetrics.totalEnergyConsumed.toFixed(0)} kilowatt hours consumed`}>
                  {sustainabilityMetrics.totalEnergyConsumed.toFixed(0)} kWh
                </div>
                <p className="text-xs opacity-90 mt-1">Fleet lifetime energy use</p>
              </CardContent>
            </Card>

            {/* Fleet Performance */}
            <Card data-testid="fleet-performance-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Fleet Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Total Miles Driven</span>
                    <span className="text-sm font-bold text-gray-900">
                      {evVehicles.reduce((sum, v) => sum + v.total_miles_driven, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Avg Battery Capacity</span>
                    <span className="text-sm font-bold text-gray-900">
                      {evVehicles.length > 0
                        ? (evVehicles.reduce((sum, v) => sum + v.battery_capacity_kwh, 0) / evVehicles.length).toFixed(1)
                        : '0'} kWh
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Avg Range</span>
                    <span className="text-sm font-bold text-gray-900">
                      {evVehicles.length > 0
                        ? (evVehicles.reduce((sum, v) => sum + v.range_miles, 0) / evVehicles.length).toFixed(0)
                        : '0'} mi
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charging Infrastructure */}
            <Card data-testid="charging-infrastructure-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Plug2 className="w-4 h-4" />
                  Charging Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Vehicles Charging</span>
                  <span className="text-sm font-bold text-blue-600">{chargingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Ready to Charge</span>
                  <span className="text-sm font-bold text-gray-900">
                    {evVehicles.filter(v => v.current_soc < 80 && v.charging_status === 'idle').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Utilization Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {evVehicles.length > 0
                      ? Math.round((chargingCount / evVehicles.length) * 100)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Environmental Impact Summary */}
            <Card data-testid="environmental-impact-card" className="bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Impact Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Emissions Reduction</p>
                    <p className="text-sm font-semibold text-green-700">
                      {((sustainabilityMetrics.totalCO2Saved / Math.max(sustainabilityMetrics.totalCO2Saved + evVehicles.reduce((sum, v) => sum + v.total_energy_consumed_kwh, 0) * 0.49, 1)) * 100).toFixed(0)}% vs gas fleet
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Clean Energy Impact</p>
                    <p className="text-sm font-semibold text-blue-700">
                      {sustainabilityMetrics.totalEnergyConsumed.toFixed(0)} kWh total
                    </p>
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

export default EVHub;
