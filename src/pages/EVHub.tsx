import { Battery, Leaf, TrendingUp, Zap, Car, Plug2, BarChart3, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Section } from '@/components/ui/section';
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
      <div className="flex items-center justify-center h-screen cta-hub">
        <div className="text-center">
          <Car className="w-16 h-16 mx-auto text-green-600 animate-pulse" />
          <p className="mt-4 text-sm font-medium text-foreground">Loading EV Hub...</p>
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
    <div className="h-screen overflow-hidden cta-hub">
      {/* Header */}
      <div className="px-4 py-3 bg-card/90 border-b border-border/50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Car className="w-7 h-7 text-green-600" />
              EV Fleet Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Electric vehicle fleet sustainability and performance</p>
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
            <Section
              title="Total EV Fleet"
              icon={<Car className="w-4 h-4" />}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none"
              contentClassName="text-white"
            >
              <div className="text-3xl font-bold" aria-label={`${evVehicles.length} electric vehicles in fleet`}>
                {evVehicles.length}
              </div>
              <p className="text-xs opacity-90 mt-1">Active electric vehicles</p>
            </Section>

            {/* Average State of Charge */}
            <Section
              title="Avg State of Charge"
              icon={<Battery className="w-4 h-4" />}
              contentClassName="space-y-2"
            >
              <div className="text-3xl font-bold text-[#41B2E3]" aria-label={`Average state of charge ${avgSOC.toFixed(0)} percent`}>
                {avgSOC.toFixed(0)}%
              </div>
              <Progress value={avgSOC} className="h-2" aria-label="Average battery level progress" />
              <p className="text-xs text-muted-foreground">Fleet battery health</p>
            </Section>

            {/* Charging Status */}
            <Section
              title="Charging Status"
              contentClassName="space-y-2"
            >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#41B2E3]" />
                    Charging Now
                  </span>
                  <span className="text-lg font-bold text-[#41B2E3]">{chargingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Battery className="w-3 h-3 text-green-600" />
                    Fully Charged
                  </span>
                  <span className="text-lg font-bold text-green-600">{fullCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Car className="w-3 h-3 text-muted-foreground" />
                    Idle
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {evVehicles.length - chargingCount - fullCount}
                  </span>
                </div>
            </Section>

            {/* Energy Efficiency */}
            <Section
              title="Energy Efficiency"
              icon={<BarChart3 className="w-4 h-4" />}
            >
              <div className="text-2xl font-bold text-[#41B2E3]" aria-label={`${sustainabilityMetrics.avgEfficiency.toFixed(2)} miles per kilowatt hour`}>
                {sustainabilityMetrics.avgEfficiency.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">mi/kWh fleet average</p>
            </Section>
          </div>

          {/* EV Vehicles List Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="ev-vehicles-column">
            <Section
              title="EV Vehicles"
              icon={<Car className="w-5 h-5 text-green-600" />}
              className="h-full"
              contentClassName="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto"
            >
                {evVehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No EV vehicles in fleet</p>
                  </div>
                ) : (
                  evVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="p-3 border rounded-lg bg-card/80 border-border/50 hover:shadow-md transition-shadow"
                      data-testid="vehicle-item"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-foreground">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{vehicle.location}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Battery</span>
                              <span className="font-semibold text-foreground">
                                {vehicle.current_soc}%
                              </span>
                            </div>
                            <Progress
                              value={vehicle.current_soc}
                              className="h-1.5"
                              aria-label={`Battery level ${vehicle.current_soc} percent`}
                            />
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-muted-foreground">Range</span>
                              <span className="font-semibold text-foreground">
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
                                ? 'bg-[#41B2E3] animate-pulse'
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
            </Section>
          </div>

          {/* Sustainability Impact Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="sustainability-impact-column">
            {/* Carbon Offset */}
            <Section
              title="Total CO₂ Saved"
              icon={<Leaf className="w-4 h-4" />}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none"
              contentClassName="text-white"
            >
              <div className="text-3xl font-bold" aria-label={`${sustainabilityMetrics.totalCO2Saved.toFixed(0)} kilograms carbon dioxide saved`}>
                {sustainabilityMetrics.totalCO2Saved.toFixed(0)} kg
              </div>
              <p className="text-xs opacity-90 mt-1">Compared to gasoline vehicles</p>
            </Section>

            {/* Trees Equivalent */}
            <Section
              title="Trees Planted Equivalent"
              className="bg-green-600 text-white border-none"
              contentClassName="text-white"
            >
              <div className="flex items-center gap-2">
                <Leaf className="w-8 h-8 text-white" />
                <div>
                  <div className="text-3xl font-bold text-white" aria-label={`${sustainabilityMetrics.treesEquivalent.toFixed(0)} trees planted equivalent`}>
                    {sustainabilityMetrics.treesEquivalent.toFixed(0)}
                  </div>
                  <p className="text-xs text-white opacity-90 mt-1">trees/year</p>
                </div>
              </div>
            </Section>

            {/* Gasoline Saved */}
            <Section title="Gasoline Saved">
              <div className="text-2xl font-bold text-[#DD3903]" aria-label={`${sustainabilityMetrics.gasolineSaved.toFixed(1)} gallons gasoline saved`}>
                {sustainabilityMetrics.gasolineSaved.toFixed(1)} gal
              </div>
              <p className="text-xs text-muted-foreground mt-1">Compared to gas fleet</p>
            </Section>

            {/* Cost Savings */}
            <Section title="Cost Savings">
              <div className="text-2xl font-bold text-green-600" aria-label={`${sustainabilityMetrics.costSavings.toFixed(2)} dollars saved`}>
                ${sustainabilityMetrics.costSavings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Fuel cost savings (fleet lifetime)</p>
            </Section>
          </div>

          {/* Energy Analytics Column */}
          <div className="space-y-4 overflow-y-auto" data-testid="energy-analytics-column">
            {/* Total Energy Consumed */}
            <Section
              title="Total Energy Consumed"
              icon={<Zap className="w-4 h-4" />}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none"
              contentClassName="text-white"
            >
              <div className="text-3xl font-bold" aria-label={`${sustainabilityMetrics.totalEnergyConsumed.toFixed(0)} kilowatt hours consumed`}>
                {sustainabilityMetrics.totalEnergyConsumed.toFixed(0)} kWh
              </div>
              <p className="text-xs opacity-90 mt-1">Fleet lifetime energy use</p>
            </Section>

            {/* Fleet Performance */}
            <Section
              title="Fleet Performance"
              contentClassName="space-y-3"
            >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Total Miles Driven</span>
                    <span className="text-sm font-bold text-foreground">
                      {evVehicles.reduce((sum, v) => sum + v.total_miles_driven, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Avg Battery Capacity</span>
                    <span className="text-sm font-bold text-foreground">
                      {evVehicles.length > 0
                        ? (evVehicles.reduce((sum, v) => sum + v.battery_capacity_kwh, 0) / evVehicles.length).toFixed(1)
                        : '0'} kWh
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Avg Range</span>
                    <span className="text-sm font-bold text-foreground">
                      {evVehicles.length > 0
                        ? (evVehicles.reduce((sum, v) => sum + v.range_miles, 0) / evVehicles.length).toFixed(0)
                        : '0'} mi
                    </span>
                  </div>
                </div>
            </Section>

            {/* Charging Infrastructure */}
            <Section
              title="Charging Infrastructure"
              icon={<Plug2 className="w-4 h-4" />}
              contentClassName="space-y-2"
            >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Vehicles Charging</span>
                  <span className="text-sm font-bold text-[#41B2E3]">{chargingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ready to Charge</span>
                  <span className="text-sm font-bold text-foreground">
                    {evVehicles.filter(v => v.current_soc < 80 && v.charging_status === 'idle').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Utilization Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {evVehicles.length > 0
                      ? Math.round((chargingCount / evVehicles.length) * 100)
                      : 0}%
                  </span>
                </div>
            </Section>

            {/* Environmental Impact Summary */}
            <Section
              title="Impact Summary"
              icon={<TrendingUp className="w-4 h-4 text-green-600" />}
              className="bg-card/90 border-2 border-green-600"
              contentClassName="space-y-2"
            >
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Emissions Reduction</p>
                    <p className="text-sm font-semibold text-green-600">
                      {((sustainabilityMetrics.totalCO2Saved / Math.max(sustainabilityMetrics.totalCO2Saved + evVehicles.reduce((sum, v) => sum + v.total_energy_consumed_kwh, 0) * 0.49, 1)) * 100).toFixed(0)}% vs gas fleet
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Zap className="w-4 h-4 text-[#41B2E3]" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Clean Energy Impact</p>
                    <p className="text-sm font-semibold text-[#41B2E3]">
                      {sustainabilityMetrics.totalEnergyConsumed.toFixed(0)} kWh total
                    </p>
                  </div>
                </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVHub;
