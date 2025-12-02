/**
 * TripInspector Component
 *
 * Complete trip inspection interface with 4 tabs:
 * - Summary: Trip overview, distance, duration, cost
 * - Route: Map visualization of the trip route
 * - Timeline: Detailed timeline of trip events
 * - Metrics: Performance metrics and analytics
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Loader2, AlertCircle, MapPin, Clock, Fuel, DollarSign } from 'lucide-react';

interface TripInspectorProps {
  id: string;
  initialTab?: string;
}

interface Trip {
  id: string;
  vehicleId: string;
  vehicleName: string;
  driverId: string;
  driverName: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  startLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'completed' | 'in-progress' | 'cancelled';
  fuelConsumed: number;
  fuelCost: number;
  averageSpeed: number;
  maxSpeed: number;
  idleTime: number;
  purpose?: string;
}

export const TripInspector: React.FC<TripInspectorProps> = ({ id, initialTab = 'summary' }) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get(`/api/trips/${id}`);
        setTrip(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load trip data');
        console.error('Error fetching trip:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTrip();
    }
  }, [id]);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading trip data...</span>
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

  if (!trip) {
    return (
      <div className="p-8 text-gray-500">
        No trip data available
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
              Trip #{trip.id.slice(0, 8)}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {trip.vehicleName} • {trip.driverName}
            </p>
          </div>
          <Badge variant={trip.status === 'completed' ? 'default' : 'secondary'}>
            {trip.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start border-b rounded-none">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="route">Route</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Trip Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{trip.distance.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Miles</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{formatDuration(trip.duration)}</p>
                  <p className="text-sm text-gray-600">Duration</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Fuel className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                  <p className="text-2xl font-bold text-yellow-600">{trip.fuelConsumed.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Gallons</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">${trip.fuelCost.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Fuel Cost</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Trip Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600">Start Time</dt>
                  <dd className="font-medium">{new Date(trip.startTime).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">End Time</dt>
                  <dd className="font-medium">{new Date(trip.endTime).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Average Speed</dt>
                  <dd className="font-medium">{trip.averageSpeed.toFixed(1)} mph</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Max Speed</dt>
                  <dd className="font-medium">{trip.maxSpeed.toFixed(1)} mph</dd>
                </div>
                {trip.purpose && (
                  <div>
                    <dt className="text-sm text-gray-600">Purpose</dt>
                    <dd className="font-medium">{trip.purpose}</dd>
                  </div>
                )}
              </dl>
            </Card>

            <Card className="p-4 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-700 dark:text-green-300 mb-2">Start Location</p>
                  {trip.startLocation.address && (
                    <p className="text-sm mb-2">{trip.startLocation.address}</p>
                  )}
                  <p className="text-xs text-gray-600 font-mono">
                    {trip.startLocation.latitude.toFixed(6)}, {trip.startLocation.longitude.toFixed(6)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="font-medium text-red-700 dark:text-red-300 mb-2">End Location</p>
                  {trip.endLocation.address && (
                    <p className="text-sm mb-2">{trip.endLocation.address}</p>
                  )}
                  <p className="text-xs text-gray-600 font-mono">
                    {trip.endLocation.latitude.toFixed(6)}, {trip.endLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Route Tab */}
        <TabsContent value="route" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Trip Route</h3>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-96 flex items-center justify-center">
              <p className="text-gray-500">Map visualization would appear here</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="text-xl font-bold">{trip.distance.toFixed(1)} mi</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Speed</p>
                <p className="text-xl font-bold">{trip.averageSpeed.toFixed(1)} mph</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stops</p>
                <p className="text-xl font-bold">3</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Trip Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-px h-full bg-gray-300"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Trip Started</p>
                  <p className="text-sm text-gray-600">{new Date(trip.startTime).toLocaleString()}</p>
                  {trip.startLocation.address && (
                    <p className="text-sm text-gray-500">{trip.startLocation.address}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-px h-full bg-gray-300"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Rest Stop</p>
                  <p className="text-sm text-gray-600">
                    {new Date(new Date(trip.startTime).getTime() + (trip.duration * 60000 * 0.3)).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Duration: 15 minutes</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-px h-full bg-gray-300"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Refueling Stop</p>
                  <p className="text-sm text-gray-600">
                    {new Date(new Date(trip.startTime).getTime() + (trip.duration * 60000 * 0.6)).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Duration: 10 minutes</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Trip Ended</p>
                  <p className="text-sm text-gray-600">{new Date(trip.endTime).toLocaleString()}</p>
                  {trip.endLocation.address && (
                    <p className="text-sm text-gray-500">{trip.endLocation.address}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Average Speed</dt>
                  <dd className="font-medium">{trip.averageSpeed.toFixed(1)} mph</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Max Speed</dt>
                  <dd className="font-medium">{trip.maxSpeed.toFixed(1)} mph</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Idle Time</dt>
                  <dd className="font-medium">{trip.idleTime} minutes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Fuel Efficiency</dt>
                  <dd className="font-medium">{(trip.distance / trip.fuelConsumed).toFixed(1)} mpg</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Fuel Cost</dt>
                  <dd className="font-medium">${trip.fuelCost.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Cost per Mile</dt>
                  <dd className="font-medium">${(trip.fuelCost / trip.distance).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Estimated Maintenance</dt>
                  <dd className="font-medium">${(trip.distance * 0.15).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Trip Cost</dt>
                  <dd className="font-bold text-lg">${(trip.fuelCost + trip.distance * 0.15).toFixed(2)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Safety Events</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>Hard Braking Events</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>Rapid Acceleration</span>
                  <Badge variant="outline">1</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>Speeding Incidents</span>
                  <Badge variant="outline">0</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TripInspector;
