// Fleet Hub - Main Fleet Management Dashboard
// Displays: Vehicle grid with 50 vehicles, status indicators, drilldowns, Google Maps

import { Car, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { UniversalMap } from '@/components/UniversalMap';
import { VehicleGrid } from './VehicleGrid';
import type { Vehicle } from '@/lib/types';
import { secureFetch } from '@/hooks/use-api';

export const FleetHub: React.FC = () => {
  // Fetch vehicles from API for map markers
  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response = await secureFetch('/api/vehicles?limit=200');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const json = await response.json();
      const payload = json?.data?.data ?? json?.data ?? json;
      return Array.isArray(payload) ? payload : [];
    },
  });

  const activeVehicles = vehicles.filter((v: any) => (v?.status || '').toLowerCase() === 'active').length;
  const inMaintenance = vehicles.filter((v: any) => String(v?.status || '').toLowerCase().includes('maint')).length;
  const totalMileage = vehicles.reduce((sum: number, v: any) => sum + (Number(v?.odometer ?? v?.odometer_reading ?? v?.mileage ?? 0) || 0), 0);
  const fuelEconValues = vehicles
    .map((v: any) => Number(v?.avg_mpg ?? v?.avgMpg ?? v?.fuel_efficiency ?? v?.fuel?.efficiency))
    .filter((n: any) => Number.isFinite(n) && n > 0) as number[];
  const avgFuelEconomy = fuelEconValues.length ? (fuelEconValues.reduce((a, b) => a + b, 0) / fuelEconValues.length) : 0;

  return (
    <div className="cta-hub cta-fleet-hub space-y-2 p-3">
      {/* Header */}
      <div className="flex items-center justify-between cta-hero">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-3">
            <Car className="w-4 h-4 cta-accent" />
            Fleet Operations Center
          </h1>
          <p className="cta-subtitle mt-2">
            {isLoading ? 'Loading fleet data…' : `Monitor and manage your fleet of ${vehicles.length} vehicles`}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="cta-stat">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm cta-subtitle">Active Vehicles</p>
              <p className="text-lg font-semibold">{activeVehicles}</p>
            </div>
            <CheckCircle className="w-4 h-4 cta-success" />
          </div>
        </div>

        <div className="cta-stat">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm cta-subtitle">In Maintenance</p>
              <p className="text-lg font-semibold">{inMaintenance}</p>
            </div>
            <AlertTriangle className="w-4 h-4 cta-accent-2" />
          </div>
        </div>

        <div className="cta-stat">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm cta-subtitle">Total Mileage</p>
              <p className="text-lg font-semibold">{Math.round(totalMileage).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-4 h-4 cta-accent" />
          </div>
        </div>

        <div className="cta-stat">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm cta-subtitle">Avg Fuel Economy</p>
              <p className="text-lg font-semibold">{avgFuelEconomy ? `${avgFuelEconomy.toFixed(1)} MPG` : '0 MPG'}</p>
            </div>
            <Car className="w-4 h-4 cta-accent" />
          </div>
        </div>
      </div>

      {/* Google Maps with Vehicle Locations */}
      <div className="cta-card">
        <h2 className="text-base font-semibold mb-2">Fleet Location Map</h2>
        <div className="cta-map-shell w-full h-[600px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Loading map…
            </div>
          ) : vehicles.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No vehicle locations available.
            </div>
          ) : (
            <UniversalMap
              vehicles={vehicles as any}
              showVehicles={true}
              className="h-full w-full"
            />
          )}
        </div>
      </div>

      {/* Vehicle Grid */}
      <VehicleGrid />
    </div>
  );
};

export default FleetHub;
