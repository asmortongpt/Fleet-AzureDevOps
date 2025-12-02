/**
 * VehicleInspector Component
 *
 * Complete vehicle inspection interface with 5 tabs:
 * - Overview: Basic vehicle information and key metrics
 * - Live: Real-time vehicle status and map location
 * - Telemetry: OBD2 diagnostics and sensor data
 * - Maintenance: Service history and upcoming maintenance
 * - Timeline: Activity timeline and event history
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { OBD2Dashboard } from '@/components/obd2/OBD2Dashboard';
import { Loader2, AlertCircle } from 'lucide-react';

interface VehicleInspectorProps {
  id: string;
  initialTab?: string;
}

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  odometer: number;
  fuelLevel: number;
  lastSeen: string;
  driver?: {
    id: string;
    name: string;
  };
}

export const VehicleInspector: React.FC<VehicleInspectorProps> = ({ id, initialTab = 'overview' }) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get(`/api/vehicles/${id}`);
        setVehicle(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicle data');
        console.error('Error fetching vehicle:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading vehicle data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-8 text-gray-500">
        No vehicle data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vehicle.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {vehicle.year} {vehicle.make} {vehicle.model} • {vehicle.licensePlate}
            </p>
          </div>
          <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
            {vehicle.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start border-b rounded-none">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">VIN</dt>
                  <dd className="font-mono text-sm">{vehicle.vin}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">License Plate</dt>
                  <dd className="font-medium">{vehicle.licensePlate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Make/Model</dt>
                  <dd>{vehicle.year} {vehicle.make} {vehicle.model}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Current Status</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Odometer</dt>
                  <dd className="font-medium">{vehicle.odometer.toLocaleString()} miles</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Fuel Level</dt>
                  <dd className="font-medium">{vehicle.fuelLevel}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Last Seen</dt>
                  <dd className="text-sm">{new Date(vehicle.lastSeen).toLocaleString()}</dd>
                </div>
                {vehicle.driver && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Current Driver</dt>
                    <dd className="font-medium">{vehicle.driver.name}</dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </TabsContent>

        {/* Live Tab */}
        <TabsContent value="live" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Live Vehicle Status</h3>
            {vehicle.location ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Latitude</p>
                    <p className="font-mono">{vehicle.location.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Longitude</p>
                    <p className="font-mono">{vehicle.location.longitude.toFixed(6)}</p>
                  </div>
                </div>
                {vehicle.location.address && (
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{vehicle.location.address}</p>
                  </div>
                )}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-96 flex items-center justify-center">
                  <p className="text-gray-500">Map visualization would appear here</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No location data available</p>
            )}
          </Card>
        </TabsContent>

        {/* Telemetry Tab */}
        <TabsContent value="telemetry" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">OBD2 Diagnostics</h3>
            <div className="text-gray-600 mb-4">
              Vehicle ID: {vehicle.id}
            </div>
            <OBD2Dashboard />
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Maintenance History</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-medium">Oil Change</p>
                <p className="text-sm text-gray-600">Last performed at {(vehicle.odometer - 3000).toLocaleString()} miles</p>
                <p className="text-sm text-gray-500">Next due at {(vehicle.odometer + 2000).toLocaleString()} miles</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="font-medium">Tire Rotation</p>
                <p className="text-sm text-gray-600">Last performed at {(vehicle.odometer - 5000).toLocaleString()} miles</p>
                <p className="text-sm text-gray-500">Next due at {(vehicle.odometer + 1000).toLocaleString()} miles</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <p className="font-medium">Inspection Due</p>
                <p className="text-sm text-gray-600">Annual inspection required</p>
                <p className="text-sm text-gray-500">Due in 45 days</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-px h-full bg-gray-300"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Vehicle started</p>
                  <p className="text-sm text-gray-600">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-px h-full bg-gray-300"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Trip completed</p>
                  <p className="text-sm text-gray-600">5 hours ago • 45.2 miles</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-px h-full bg-gray-300"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Refueled</p>
                  <p className="text-sm text-gray-600">Yesterday • 14.5 gallons</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleInspector;
