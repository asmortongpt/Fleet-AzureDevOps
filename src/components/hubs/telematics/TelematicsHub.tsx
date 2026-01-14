// Telematics Hub - Real-time Fleet Tracking Dashboard

import { MapPin, Activity, Zap, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { geotabService } from '../services/GeotabService';
import { samsaraService } from '../services/SamsaraService';

export const TelematicsHub: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<'geotab' | 'samsara' | 'obd'>('geotab');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTelematicsData();

    // Refresh every 30 seconds
    const interval = setInterval(loadTelematicsData, 30000);
    return () => clearInterval(interval);
  }, [selectedSource]);

  const loadTelematicsData = async () => {
    try {
      setLoading(true);

      if (selectedSource === 'geotab') {
        const devices = await geotabService.getDevices();
        const vehiclesWithLocations = await Promise.all(
          devices.map(async (device) => {
            const location = await geotabService.getDeviceLocation(device.id);
            return {
              id: device.id,
              name: device.name,
              vin: device.vehicleIdentificationNumber,
              location,
              source: 'geotab',
            };
          })
        );
        setVehicles(vehiclesWithLocations);
      } else if (selectedSource === 'samsara') {
        const locations = await samsaraService.getVehicleLocations();
        setVehicles(locations.map(loc => ({
          id: loc.id,
          location: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            speed: loc.speed,
          },
          source: 'samsara',
        })));
      }
    } catch (error) {
      console.error('Failed to load telematics data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            Telematics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time GPS tracking and vehicle diagnostics
          </p>
        </div>

        {/* Source Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSource('geotab')}
            className={`px-4 py-2 rounded-lg ${
              selectedSource === 'geotab'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary'
            }`}
          >
            Geotab
          </button>
          <button
            onClick={() => setSelectedSource('samsara')}
            className={`px-4 py-2 rounded-lg ${
              selectedSource === 'samsara'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary'
            }`}
          >
            Samsara
          </button>
          <button
            onClick={() => setSelectedSource('obd')}
            className={`px-4 py-2 rounded-lg ${
              selectedSource === 'obd'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary'
            }`}
          >
            OBD-II
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vehicles Tracked</p>
              <p className="text-2xl font-bold">{vehicles.length}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Speed</p>
              <p className="text-2xl font-bold">
                {vehicles.length > 0
                  ? Math.round(
                      vehicles.reduce((sum, v) => sum + (v.location?.speed || 0), 0) /
                        vehicles.length
                    )
                  : 0}{' '}
                km/h
              </p>
            </div>
            <Zap className="w-8 h-8 text-blue-800" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Data Source</p>
              <p className="text-2xl font-bold capitalize">{selectedSource}</p>
            </div>
            <MapPin className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Live Vehicle Locations</h2>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading telematics data...
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{vehicle.name || vehicle.id}</p>
                    {vehicle.location && (
                      <p className="text-sm text-muted-foreground">
                        {vehicle.location.latitude.toFixed(6)},{' '}
                        {vehicle.location.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                {vehicle.location && (
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Speed</p>
                      <p className="font-medium">{Math.round(vehicle.location.speed)} km/h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium capitalize">{vehicle.source}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TelematicsHub;
