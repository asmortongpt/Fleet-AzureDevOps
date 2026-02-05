// Fleet Hub - Main Fleet Management Dashboard
// Displays: Vehicle grid with 50 vehicles, status indicators, drilldowns, Google Maps

import { Car, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { GoogleMap } from '@/components/GoogleMap';
import { VehicleGrid } from './VehicleGrid';
import type { Vehicle } from '@/lib/types';
import { secureFetch } from '@/hooks/use-api';

export const FleetHub: React.FC = () => {
  // Fetch vehicles from API for map markers
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
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
  const totalMileage = vehicles.reduce((sum: number, v: any) => sum + (Number(v?.odometer_reading ?? v?.mileage ?? 0) || 0), 0);
  const fuelEconValues = vehicles
    .map((v: any) => Number(v?.fuel_efficiency ?? v?.fuel?.efficiency))
    .filter((n: any) => Number.isFinite(n) && n > 0) as number[];
  const avgFuelEconomy = fuelEconValues.length ? (fuelEconValues.reduce((a, b) => a + b, 0) / fuelEconValues.length) : 0;

  return (
    <div className="space-y-2 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold flex items-center gap-3">
            <Car className="w-4 h-4 text-primary" />
            Fleet Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your fleet of 50+ vehicles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Vehicles</p>
              <p className="text-sm font-bold">{activeVehicles}</p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Maintenance</p>
              <p className="text-sm font-bold">{inMaintenance}</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Mileage</p>
              <p className="text-sm font-bold">{Math.round(totalMileage).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-800" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Fuel Economy</p>
              <p className="text-sm font-bold">{avgFuelEconomy ? `${avgFuelEconomy.toFixed(1)} MPG` : '0 MPG'}</p>
            </div>
            <Car className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Google Maps with Vehicle Locations */}
      <div className="bg-card border border-border rounded-lg p-2">
        <h2 className="text-base font-semibold mb-2">Fleet Location Map</h2>
        <div className="w-full h-[600px] rounded-lg overflow-hidden">
          <GoogleMap
            vehicles={vehicles}
            showVehicles={true}
            mapStyle="roadmap"
            center={[-84.2807, 30.4383]}
            zoom={12}
          />
        </div>
      </div>

      {/* Vehicle Grid */}
      <VehicleGrid />
    </div>
  );
};

export default FleetHub;
