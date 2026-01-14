import { useState } from 'react';
import { FleetMap } from '@/components/FleetMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, RefreshCw } from 'lucide-react';

/**
 * Demo page showing FleetMap component with sample data
 * This demonstrates the Google Maps integration with real vehicle locations
 */
export function FleetMapDemo() {
  // Sample vehicle data - Tallahassee area coordinates
  const [vehicles] = useState([
    {
      id: '1',
      name: 'Truck-001',
      vehicleNumber: 'FL-1234',
      latitude: 30.4383,
      longitude: -84.2807,
      status: 'active',
      location: 'Downtown Tallahassee',
    },
    {
      id: '2',
      name: 'Van-045',
      vehicleNumber: 'FL-5678',
      latitude: 30.4519,
      longitude: -84.2727,
      status: 'in_use',
      location: 'FSU Campus',
    },
    {
      id: '3',
      name: 'Sedan-123',
      vehicleNumber: 'FL-9012',
      latitude: 30.4238,
      longitude: -84.2932,
      status: 'maintenance',
      location: 'Service Center',
    },
    {
      id: '4',
      name: 'SUV-789',
      vehicleNumber: 'FL-3456',
      latitude: 30.4612,
      longitude: -84.2521,
      status: 'available',
      location: 'North Side',
    },
    {
      id: '5',
      name: 'Truck-002',
      vehicleNumber: 'FL-7890',
      latitude: 30.4165,
      longitude: -84.3088,
      status: 'out_of_service',
      location: 'West Tallahassee',
    },
  ]);

  const vehiclesByStatus = vehicles.reduce(
    (acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Fleet Map Demo
          </h1>
          <p className="text-slate-700 mt-2">
            Real-time vehicle tracking with Google Maps integration
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload Map
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{vehiclesByStatus.active || 0}</div>
              <Badge className="bg-green-100 text-green-800">Available</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{vehiclesByStatus.in_use || 0}</div>
              <Badge className="bg-blue-100 text-blue-800">Deployed</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{vehiclesByStatus.maintenance || 0}</div>
              <Badge className="bg-yellow-100 text-yellow-800">Service</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Out of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{vehiclesByStatus.out_of_service || 0}</div>
              <Badge className="bg-red-100 text-red-800">Offline</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Map */}
      <FleetMap vehicles={vehicles} height="600px" />

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
          <CardDescription>All tracked vehicles in the fleet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-800" />
                  </div>
                  <div>
                    <div className="font-semibold">{vehicle.name}</div>
                    <div className="text-sm text-slate-700">{vehicle.vehicleNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-700">{vehicle.location}</div>
                  <div className="text-xs text-gray-500">
                    {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                  </div>
                </div>
                <Badge
                  className={
                    vehicle.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : vehicle.status === 'in_use'
                        ? 'bg-blue-100 text-blue-800'
                        : vehicle.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                  }
                >
                  {vehicle.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Google Maps Integration Status</CardTitle>
          <CardDescription className="text-blue-700">
            Live connection to Google Maps API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">API Key:</span>
              <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✓ Configured' : '✗ Not configured'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Map Type:</span>
              <span>Roadmap with custom styling</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Libraries:</span>
              <span>places, geometry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Features:</span>
              <span>Markers, Info Windows, Auto-Zoom to Bounds</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
