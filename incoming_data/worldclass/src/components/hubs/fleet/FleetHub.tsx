// Fleet Hub - Main Fleet Management Dashboard
// Displays: Vehicle grid with 50 vehicles, status indicators, drilldowns

import { Car, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';

import { VehicleGrid } from './VehicleGrid';

export const FleetHub: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Car className="w-8 h-8 text-primary" />
            Fleet Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your fleet of 50+ vehicles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Vehicles</p>
              <p className="text-2xl font-bold">42</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Maintenance</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Mileage</p>
              <p className="text-2xl font-bold">2.4M</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Fuel Economy</p>
              <p className="text-2xl font-bold">26.3 MPG</p>
            </div>
            <Car className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Vehicle Grid */}
      <VehicleGrid />
    </div>
  );
};

export default FleetHub;
