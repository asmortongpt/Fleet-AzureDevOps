// Fleet Hub - Vehicle Cards with Drilldown
// Displays: 50 vehicles in responsive grid
// Drilldown: Click card → full vehicle details modal

import { useQuery } from '@tanstack/react-query';
import { Car, MapPin, Wrench } from 'lucide-react';
import React, { useState } from 'react';

import { Dialog } from '@/components/shared/Dialog';

interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  mileage: number;
  location?: { lat: number; lng: number };
}

export const VehicleGrid: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Fetch vehicles from API
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('https://fleet.capitaltechalliance.com/api/v1/vehicles');
      const json = await res.json();
      return json.vehicles || [];
    }
  });

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>;
  }

  const statusColors = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    maintenance: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    inactive: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vehicles.map((vehicle: Vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => setSelectedVehicle(vehicle)}
            className="group cursor-pointer bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-lg transition-all duration-200"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedVehicle(vehicle)}
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[vehicle.status]}`}>
                {vehicle.status}
              </span>
              <Car className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            {/* Vehicle Info */}
            <h3 className="font-semibold text-lg mb-1">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {vehicle.year} • VIN: {vehicle.vin?.slice(-6)}
            </p>

            {/* Stats */}
            <div className="space-y-2 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{vehicle.mileage?.toLocaleString() || 0} mi</span>
              </div>
            </div>

            {/* Hover indicator */}
            <div className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Click for details →
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <Dialog
          open={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          title={`${selectedVehicle.make} ${selectedVehicle.model}`}
          variant="drawer"
          size="xl"
        >
          <div className="space-y-6">
            {/* Vehicle Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">VIN</label>
                <p className="text-lg font-mono">{selectedVehicle.vin}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Year</label>
                <p className="text-lg">{selectedVehicle.year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-lg capitalize">{selectedVehicle.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mileage</label>
                <p className="text-lg">{selectedVehicle.mileage?.toLocaleString()} mi</p>
              </div>
            </div>

            {/* Maintenance History */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Recent Maintenance
              </h3>
              <div className="border border-border rounded-lg p-4 text-muted-foreground">
                No maintenance records found
              </div>
            </div>

            {/* GPS Location Map */}
            {selectedVehicle.location && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Current Location
                </h3>
                <div className="border border-border rounded-lg h-64 bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Map: {selectedVehicle.location.lat.toFixed(4)}, {selectedVehicle.location.lng.toFixed(4)}</p>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
};
